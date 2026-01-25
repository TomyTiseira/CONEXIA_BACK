# 🔍 Análisis del Problema: Baneo de Usuarios

## 📋 Resumen del Problema

**Síntoma reportado:** 
- Al usuario A le funciona correctamente: servicios Y contrataciones cambian de estado
- Al usuario B (compañero) NO le funcionan: solo los servicios cambian de estado, pero las contrataciones NO

**Comportamiento esperado:**
Cuando se banea un usuario, debe pasar lo siguiente:

1. ✅ Servicios del usuario → `finished_by_moderation`
2. ✅ Contrataciones como proveedor → `terminated_by_moderation`
3. ✅ Contrataciones como cliente → `terminated_by_moderation`
4. ✅ Proyectos del usuario → terminados por moderación
5. ✅ Postulaciones → terminadas por moderación

---

## 🏗️ Arquitectura del Sistema de Baneo

### 1. Microservicio USERS (Origen del Evento)

**Archivo:** `users/src/moderation/services/ban-management.service.ts`

**Flujo:**
```typescript
async banUser(userId, moderatorId, reason, analysisId) {
  // 1. Actualizar usuario a baneado
  await this.userRepository.update(userId, {
    accountStatus: AccountStatus.BANNED,
    bannedAt: new Date(),
    bannedBy: moderatorId,
    banReason: reason,
  });

  // 2. Registrar en auditoría
  await this.moderationActionRepository.save({ ... });

  // 3. 🔥 EMITIR EVENTO A NATS
  await this.notifyBan(userId, reason);

  // 4. Soft-delete de contenido
  await this.softDeleteUserContent(userId);

  // 5. Enviar email
  await this.emailService.sendAccountBannedEmail(...);
}

private async notifyBan(userId: number, reason?: string): Promise<void> {
  await firstValueFrom(
    this.natsClient.emit('user.banned', {  // 🔥 EVENTO EMITIDO
      userId,
      moderationStatus: 'banned',
      reason: reason || 'Violación de términos y condiciones',
    }),
  );
  this.logger.log(`Evento user.banned emitido para usuario ${userId}`);
}
```

**Puntos críticos:**
- ✅ El evento `user.banned` es **emitido** (no enviado como message pattern)
- ✅ Usa `emit()` (fire-and-forget, no espera respuesta)
- ⚠️ **NO hay confirmación de que el evento fue recibido**

---

### 2. Microservicio SERVICES (Receptor del Evento)

**Archivo:** `services/src/common/controllers/moderation.controller.ts`

**Receptor:**
```typescript
@Controller()
export class ModerationController {
  @EventPattern('user.banned')  // 🔥 ESCUCHA EL EVENTO
  async handleUserBanned(@Payload() data: { userId: number; bannedAt: Date; reason: string }): Promise<void> {
    this.logger.log(`Evento recibido: usuario ${data.userId} baneado`);
    await this.moderationListenerService.handleUserBanned(data.userId);
  }
}
```

**Procesamiento:**
```typescript
// services/src/common/services/moderation-listener.service.ts

async handleUserBanned(userId: number): Promise<void> {
  this.logger.log(`Procesando baneo de usuario ${userId}`);

  try {
    // 1. Ocultar servicios del usuario
    const hiddenServices = await this.hideUserServices(userId, 'banned');
    
    // 2. 🔥 Terminar contrataciones como PROVEEDOR
    const terminatedAsProvider = await this.terminateActiveHirings(userId);
    
    // 3. 🔥 Terminar contrataciones como CLIENTE
    const terminatedAsClient = await this.terminateActiveHiringsAsClient(userId);

    this.logger.log(`Baneo completado para usuario ${userId}`);
  } catch (error) {
    this.logger.error(`Error procesando baneo de usuario ${userId}:`, error);
    throw error;
  }
}
```

---

## 🔍 Posibles Causas del Problema

### Causa 1: ⚠️ Evento no llega al microservicio `services`

**Síntomas:**
- Los servicios SÍ cambian de estado → `hideUserServices()` se ejecuta
- Las contrataciones NO cambian → `terminateActiveHirings()` NO se ejecuta

**¿Por qué los servicios cambian pero las contrataciones no?**

🚨 **DESCUBRIMIENTO IMPORTANTE:**

Mirando el flujo completo, veo que `hideUserServices()` actualiza los servicios DIRECTAMENTE en la base de datos:

```typescript
private async hideUserServices(userId: number, moderationStatus: 'banned'): Promise<number> {
  const result = await this.serviceRepository.update(
    { userId, deletedAt: IsNull() },
    {
      status: 'finished_by_moderation',  // ✅ Esto SÍ funciona
      hiddenByModeration: true,
      moderationReason: 'Usuario baneado por violaciones graves',
      moderationUpdatedAt: new Date(),
      ownerModerationStatus: moderationStatus,
    },
  );
  return result.affected || 0;
}
```

**Mientras que las contrataciones requieren una query más compleja:**

```typescript
private async terminateActiveHirings(userId: number): Promise<number> {
  // 1. Buscar el status "terminated_by_moderation"
  const terminatedStatus = await this.serviceHiringStatusRepository.findOne({
    where: { code: ServiceHiringStatusCode.TERMINATED_BY_MODERATION },
  });

  if (!terminatedStatus) {  // 🔥 PUNTO DE FALLA POTENCIAL
    this.logger.error('Estado "terminated_by_moderation" no encontrado en la base de datos');
    return 0;  // ⚠️ Sale silenciosamente
  }

  // 2. Buscar servicios del proveedor
  const providerServices = await this.serviceRepository.find({
    where: { userId },
    select: ['id', 'title'],
  });

  if (providerServices.length === 0) {  // 🔥 PUNTO DE FALLA POTENCIAL
    return 0;
  }

  // 3. Actualizar contrataciones...
  // ...
}
```

---

### 🔥 CAUSA MÁS PROBABLE: Estado `terminated_by_moderation` no existe en BD

**Verificación necesaria:**

1. **En la base de datos de tu compañero:**
   ```sql
   SELECT * FROM service_hiring_statuses WHERE code = 'terminated_by_moderation';
   ```

2. **Si el resultado está VACÍO:**
   - El estado no fue creado por las migraciones
   - El seed no se ejecutó correctamente
   - El script de inicialización falló

**Evidencia:**
```typescript
if (!terminatedStatus) {
  this.logger.error('Estado "terminated_by_moderation" no encontrado en la base de datos');
  return 0;  // ⚠️ SALE SIN ACTUALIZAR CONTRATACIONES
}
```

---

### Causa 2: ⚠️ Usuario no tiene servicios publicados

**Si el usuario baneado no tiene servicios:**

```typescript
const providerServices = await this.serviceRepository.find({
  where: { userId },
  select: ['id', 'title'],
});

if (providerServices.length === 0) {
  return 0;  // ⚠️ No actualiza nada como PROVEEDOR
}
```

**Pero esto NO explica el problema de las contrataciones como CLIENTE:**
- `terminateActiveHiringsAsClient()` NO depende de tener servicios
- Busca directamente por `hiring.user_id = userId`

---

### Causa 3: ⚠️ Registro de módulos incorrecto

**Verificar en `app.module.ts`:**

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceHiringStatus,  // ✅ DEBE estar registrado
      Service,              // ✅ DEBE estar registrado
      ServiceHiring,        // ✅ DEBE estar registrado
    ]),
    // ...
  ],
  controllers: [ModerationController],  // ✅ DEBE estar registrado
  providers: [
    ModerationListenerService,  // ✅ DEBE estar registrado
    // ...
  ],
})
export class AppModule {}
```

**Si falta alguno:**
- Las inyecciones fallarán
- El servicio no arrancará correctamente

---

### Causa 4: ⚠️ Conexión NATS caída o desincronizada

**Síntomas:**
- NATS server no está corriendo
- Microservicio `services` no está conectado a NATS
- Evento emitido pero no recibido

**Verificación:**
```bash
# Ver logs de NATS
docker logs conexia_back-nats-server-1

# Ver si servicios está conectado
docker logs conexia_back-services-1 | grep "NATS"

# Verificar healthcheck
docker ps --filter "name=nats"
```

---

### Causa 5: ⚠️ Error silencioso en try-catch

**Código actual:**
```typescript
try {
  const hiddenServices = await this.hideUserServices(userId, 'banned');
  this.logger.log(`${hiddenServices} servicios marcados como owner baneado`);

  const terminatedAsProvider = await this.terminateActiveHirings(userId);
  this.logger.log(`${terminatedAsProvider} contrataciones terminadas donde usuario es proveedor`);

  const terminatedAsClient = await this.terminateActiveHiringsAsClient(userId);
  this.logger.log(`${terminatedAsClient} contrataciones terminadas donde usuario es cliente`);

} catch (error) {
  this.logger.error(`Error procesando baneo de usuario ${userId}:`, error);
  throw error;  // ⚠️ Esto puede no verse si el evento es async
}
```

**Problema potencial:**
- Si `terminateActiveHirings()` lanza un error
- El error se loggea pero el proceso continúa
- Las contrataciones NO se actualizan

---

## 🧪 Plan de Diagnóstico

### Paso 1: Verificar logs del microservicio `services`

**Ejecutar:**
```bash
# Ver si el evento está llegando
docker logs conexia_back-services-1 --tail 200 | grep "Evento recibido: usuario"

# Ver si hay errores
docker logs conexia_back-services-1 --tail 200 | grep "ERROR"

# Ver conteo de terminaciones
docker logs conexia_back-services-1 --tail 200 | grep "contrataciones terminadas"
```

**Esperado:**
```
[ModerationController] Evento recibido: usuario 99 baneado
[ModerationListenerService] Procesando baneo de usuario 99
[ModerationListenerService] 3 servicios marcados como owner baneado (userId=99)
[ModerationListenerService] 5 contrataciones terminadas donde usuario es proveedor
[ModerationListenerService] 2 contrataciones terminadas donde usuario es cliente
[ModerationListenerService] Baneo completado para usuario 99
```

**Si NO aparece "Evento recibido":**
- El evento no está llegando → Problema de NATS

**Si aparece "Evento recibido" pero NO aparece "contrataciones terminadas":**
- El método está fallando silenciosamente

---

### Paso 2: Verificar base de datos

**Conectar a la base de datos del compañero:**
```bash
# Conectar
docker exec -it conexia_back-services-db-1 psql -U postgres -d services

# Verificar estados
SELECT id, code, name FROM service_hiring_statuses;

# Buscar el estado específico
SELECT * FROM service_hiring_statuses WHERE code = 'terminated_by_moderation';
```

**Esperado:**
```
id | code                        | name
---+-----------------------------+---------------------
XX | terminated_by_moderation    | Terminado por Moderación
```

**Si NO existe:**
```sql
-- Insertar manualmente
INSERT INTO service_hiring_statuses (code, name, description, created_at, updated_at)
VALUES (
  'terminated_by_moderation',
  'Terminado por Moderación',
  'El servicio fue terminado porque el proveedor o cliente fue baneado',
  NOW(),
  NOW()
);
```

---

### Paso 3: Verificar servicios del usuario baneado

**Query:**
```sql
-- Ver servicios del usuario
SELECT id, title, user_id, status, owner_moderation_status
FROM services
WHERE user_id = 99;  -- Reemplazar con el ID real

-- Ver contrataciones del usuario como proveedor
SELECT h.id, h.service_id, s.user_id as provider_id, h.user_id as client_id, st.code
FROM service_hirings h
JOIN services s ON s.id = h.service_id
JOIN service_hiring_statuses st ON st.id = h.status_id
WHERE s.user_id = 99;

-- Ver contrataciones del usuario como cliente
SELECT h.id, h.service_id, h.user_id as client_id, st.code
FROM service_hirings h
JOIN service_hiring_statuses st ON st.id = h.status_id
WHERE h.user_id = 99;
```

---

### Paso 4: Reproducir el baneo con logs detallados

**Opción A: Agregar logs temporales**

Editar `services/src/common/services/moderation-listener.service.ts`:

```typescript
private async terminateActiveHirings(userId: number): Promise<number> {
  this.logger.log(`🔍 [DEBUG] Iniciando terminateActiveHirings para userId=${userId}`);
  
  const terminatedStatus = await this.serviceHiringStatusRepository.findOne({
    where: { code: ServiceHiringStatusCode.TERMINATED_BY_MODERATION },
  });

  if (!terminatedStatus) {
    this.logger.error('🔥 [ERROR] Estado "terminated_by_moderation" NO ENCONTRADO');
    return 0;
  }

  this.logger.log(`✅ [DEBUG] Estado encontrado: id=${terminatedStatus.id}`);

  const providerServices = await this.serviceRepository.find({
    where: { userId },
    select: ['id', 'title'],
  });

  this.logger.log(`🔍 [DEBUG] Servicios encontrados: ${providerServices.length}`);

  if (providerServices.length === 0) {
    this.logger.warn(`⚠️ [WARN] Usuario ${userId} no tiene servicios`);
    return 0;
  }

  // ... resto del código
}
```

**Reiniciar y volver a banear:**
```bash
docker compose restart services
```

---

## ✅ Soluciones según la causa

### Si falta el estado `terminated_by_moderation`

**Verificar migration/seed:**
```typescript
// Buscar en postgres-init/
// O en SeedService
```

**Insertar manualmente:**
```sql
INSERT INTO service_hiring_statuses (code, name, description, created_at, updated_at)
VALUES (
  'terminated_by_moderation',
  'Terminado por Moderación',
  'El servicio fue terminado porque el proveedor o cliente fue baneado',
  NOW(),
  NOW()
);
```

---

### Si NATS no está conectado

**Verificar configuración:**
```typescript
// services/src/config/envs.ts
natsServers: process.env.NATS_SERVERS?.split(',') || ['nats://localhost:4222']
```

**Verificar docker-compose:**
```yaml
services:
  services:
    environment:
      - NATS_SERVERS=nats://nats-server:4222
```

**Reiniciar NATS:**
```bash
docker compose restart nats-server
docker compose restart services
```

---

### Si el módulo no está registrado

**Verificar `app.module.ts`:**
```typescript
TypeOrmModule.forFeature([
  ServiceHiringStatus,  // ✅ Debe estar
  Service,              // ✅ Debe estar
  ServiceHiring,        // ✅ Debe estar
]),
```

---

## 🎯 Diferencias entre entornos

**¿Por qué funciona en TU entorno pero no en el de tu compañero?**

### Posibilidad 1: Base de datos diferente
- Tu BD tiene el estado `terminated_by_moderation`
- La BD de tu compañero NO lo tiene
- **Solución:** Sincronizar migraciones/seeds

### Posibilidad 2: Código diferente
- Tu código tiene un commit que tu compañero no tiene
- **Solución:** `git pull`, verificar ramas

### Posibilidad 3: Docker cache diferente
- Tu imagen Docker tiene dependencias correctas
- La imagen de tu compañero está desactualizada
- **Solución:** 
  ```bash
  docker compose down
  docker compose build --no-cache services
  docker compose up -d
  ```

### Posibilidad 4: Variables de entorno diferentes
- Tu `.env` tiene configuración correcta de NATS
- El `.env` de tu compañero tiene errores
- **Solución:** Comparar archivos `.env`

---

## 📊 Checklist de Verificación

Para tu compañero:

- [ ] ¿El contenedor `services` está corriendo?
  ```bash
  docker ps | grep services
  ```

- [ ] ¿El contenedor está conectado a NATS?
  ```bash
  docker logs conexia_back-services-1 | grep "NATS"
  ```

- [ ] ¿El evento `user.banned` está llegando?
  ```bash
  docker logs conexia_back-services-1 | grep "Evento recibido"
  ```

- [ ] ¿Existe el estado `terminated_by_moderation` en BD?
  ```sql
  SELECT * FROM service_hiring_statuses WHERE code = 'terminated_by_moderation';
  ```

- [ ] ¿El usuario tiene servicios publicados?
  ```sql
  SELECT COUNT(*) FROM services WHERE user_id = X;
  ```

- [ ] ¿Hay errores en los logs?
  ```bash
  docker logs conexia_back-services-1 --tail 200 | grep "ERROR\|error"
  ```

---

## 🚀 Recomendación Final

**Agregar validación más robusta:**

```typescript
private async terminateActiveHirings(userId: number): Promise<number> {
  // Validar que el estado existe
  const terminatedStatus = await this.serviceHiringStatusRepository.findOne({
    where: { code: ServiceHiringStatusCode.TERMINATED_BY_MODERATION },
  });

  if (!terminatedStatus) {
    this.logger.error(`🔥 CRITICAL: Estado "terminated_by_moderation" no existe en BD`);
    // 🔥 LANZAR ERROR en lugar de retornar 0
    throw new Error('Estado terminated_by_moderation no encontrado. Verificar seeds/migrations.');
  }

  // ... resto del código
}
```

Esto hará que el error sea más visible y no falle silenciosamente.
