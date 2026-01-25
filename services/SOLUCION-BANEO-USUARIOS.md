# 🔥 PROBLEMA ENCONTRADO: Baneo de Usuarios

## ❌ El Problema

**Tu compañero banea un usuario pero solo cambian los servicios, NO las contrataciones.**

---

## 🎯 Causa Raíz Identificada

### El estado `terminated_by_moderation` NO está en el seed

**Archivo:** `services/src/seed/seed.service.ts`

**Estados que SÍ están:**
- ✅ PENDING
- ✅ QUOTED
- ✅ ACCEPTED
- ✅ REJECTED
- ✅ CANCELLED
- ✅ IN_PROGRESS
- ✅ COMPLETED
- ✅ NEGOTIATING
- ✅ APPROVED
- ✅ PAYMENT_PENDING
- ✅ PAYMENT_REJECTED
- ✅ EXPIRED

**Estados que FALTAN:**
- ❌ **TERMINATED_BY_MODERATION** ← Este necesita la lógica de baneo
- ❌ DELIVERED
- ❌ REVISION_REQUESTED
- ❌ IN_CLAIM
- ❌ REQUOTING
- ❌ CANCELLED_BY_CLAIM
- ❌ COMPLETED_BY_CLAIM
- ❌ COMPLETED_WITH_AGREEMENT
- ❌ FINISHED_BY_MODERATION

---

## 🔍 Por Qué Falla

### Código en `moderation-listener.service.ts`:

```typescript
private async terminateActiveHirings(userId: number): Promise<number> {
  // Busca el estado en la base de datos
  const terminatedStatus = await this.serviceHiringStatusRepository.findOne({
    where: { code: ServiceHiringStatusCode.TERMINATED_BY_MODERATION },
  });

  if (!terminatedStatus) {
    // 🔥 SI NO EXISTE, SALE SILENCIOSAMENTE
    this.logger.error('Estado "terminated_by_moderation" no encontrado en la base de datos');
    return 0;  // ⚠️ No actualiza las contrataciones
  }
  
  // ... resto del código que nunca se ejecuta
}
```

**¿Por qué los servicios SÍ cambian?**
Porque `hideUserServices()` actualiza el campo `status` a un string directo:
```typescript
status: 'finished_by_moderation',  // ✅ No necesita buscar en BD
```

**¿Por qué las contrataciones NO cambian?**
Porque `terminateActiveHirings()` necesita el **ID** del estado:
```typescript
statusId: terminatedStatus.id,  // ❌ terminatedStatus es null
```

---

## 🧪 Cómo Verificar

**En tu máquina (donde funciona):**
```bash
docker exec -it conexia_back-services-db-1 psql -U postgres -d services -c "SELECT * FROM service_hiring_statuses WHERE code = 'terminated_by_moderation';"
```

**Resultado esperado en TU entorno:**
```
 id |            code              |         name
----+------------------------------+----------------------
 XX | terminated_by_moderation     | Terminado por Moderación
```

**En la máquina de tu compañero:**
```
(0 rows)  ← ❌ No existe
```

---

## ✅ Soluciones

### Opción 1: Actualizar el Seed (Recomendado)

**Editar:** `services/src/seed/seed.service.ts`

**Agregar estos estados faltantes:**

```typescript
private async seedServiceHiringStatuses() {
  const statuses = [
    // ... estados existentes ...
    
    // ✅ AGREGAR ESTOS:
    {
      name: 'Entregado',
      code: ServiceHiringStatusCode.DELIVERED,
      description: 'Servicio o entregable entregado, esperando revisión del cliente',
    },
    {
      name: 'Revisión Solicitada',
      code: ServiceHiringStatusCode.REVISION_REQUESTED,
      description: 'Cliente solicitó cambios en una o más entregas del servicio',
    },
    {
      name: 'En Reclamo',
      code: ServiceHiringStatusCode.IN_CLAIM,
      description: 'Servicio tiene un reclamo activo. Todas las acciones están suspendidas hasta que se resuelva',
    },
    {
      name: 'Re-cotizando',
      code: ServiceHiringStatusCode.REQUOTING,
      description: 'El cliente ha solicitado una actualización de la cotización vencida',
    },
    {
      name: 'Cancelado por reclamo',
      code: ServiceHiringStatusCode.CANCELLED_BY_CLAIM,
      description: 'Contratación cancelada por reclamo resuelto a favor del cliente',
    },
    {
      name: 'Finalizado por reclamo',
      code: ServiceHiringStatusCode.COMPLETED_BY_CLAIM,
      description: 'Contratación finalizada por reclamo resuelto a favor del proveedor',
    },
    {
      name: 'Finalizado con acuerdo',
      code: ServiceHiringStatusCode.COMPLETED_WITH_AGREEMENT,
      description: 'Contratación finalizada con acuerdo parcial tras reclamo',
    },
    {
      name: 'Terminado por Moderación',  // ← 🔥 ESTE ES EL CRÍTICO
      code: ServiceHiringStatusCode.TERMINATED_BY_MODERATION,
      description: 'Servicio terminado porque el proveedor o cliente fue baneado permanentemente',
    },
    {
      name: 'Finalizado por Moderación',
      code: ServiceHiringStatusCode.FINISHED_BY_MODERATION,
      description: 'Servicio finalizado por decisión de moderación',
    },
  ];

  // ... resto del código
}
```

**Luego reiniciar el contenedor:**
```bash
docker compose restart services
```

El seed se ejecuta automáticamente en `OnModuleInit`.

---

### Opción 2: Insertar Manualmente en BD (Solución Rápida)

**Para tu compañero:**

```bash
# Conectar a la base de datos
docker exec -it conexia_back-services-db-1 psql -U postgres -d services
```

```sql
-- Insertar el estado faltante
INSERT INTO service_hiring_statuses (code, name, description, created_at, updated_at)
VALUES 
  ('terminated_by_moderation', 'Terminado por Moderación', 'Servicio terminado porque el proveedor o cliente fue baneado permanentemente', NOW(), NOW()),
  ('delivered', 'Entregado', 'Servicio o entregable entregado, esperando revisión del cliente', NOW(), NOW()),
  ('revision_requested', 'Revisión Solicitada', 'Cliente solicitó cambios en una o más entregas del servicio', NOW(), NOW()),
  ('in_claim', 'En Reclamo', 'Servicio tiene un reclamo activo', NOW(), NOW()),
  ('requoting', 'Re-cotizando', 'El cliente ha solicitado una actualización de la cotización vencida', NOW(), NOW()),
  ('cancelled_by_claim', 'Cancelado por reclamo', 'Contratación cancelada por reclamo resuelto a favor del cliente', NOW(), NOW()),
  ('completed_by_claim', 'Finalizado por reclamo', 'Contratación finalizada por reclamo resuelto a favor del proveedor', NOW(), NOW()),
  ('completed_with_agreement', 'Finalizado con acuerdo', 'Contratación finalizada con acuerdo parcial tras reclamo', NOW(), NOW()),
  ('finished_by_moderation', 'Finalizado por Moderación', 'Servicio finalizado por decisión de moderación', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Verificar
SELECT id, code, name FROM service_hiring_statuses ORDER BY id;
```

**Ahora el baneo funcionará correctamente.**

---

### Opción 3: Rebuild Completo (Más Seguro)

```bash
# Detener todo
docker compose down

# Borrar volúmenes de BD (CUIDADO: borra datos)
docker volume rm conexia_back_services-db-data

# Rebuild sin cache
docker compose build --no-cache services

# Levantar todo
docker compose up -d

# Verificar logs
docker logs -f conexia_back-services-1
```

Esto ejecutará el seed completo desde cero.

---

## 🎯 Por Qué te Funciona a TI

**Hipótesis 1:** Tu base de datos tiene datos antiguos
- En algún momento ejecutaste el script `seed-service-hiring-statuses.ts` manualmente
- Ese script SÍ tiene todos los estados (incluyendo `terminated_by_moderation`)
- Tu BD tiene el estado, pero el seed actual en `seed.service.ts` no lo crea

**Hipótesis 2:** Tienes una migración SQL que tu compañero no tiene
- Existe un archivo `.sql` en `postgres-init/` que crea el estado
- Tu compañero no tiene ese archivo o su BD no ejecutó las migraciones

**Verificar:**
```bash
ls -la services/postgres-init/
```

---

## 📊 Comparación: Seed Script vs Seed Service

### Script standalone (`seed-service-hiring-statuses.ts`):
✅ Tiene 17 estados incluyendo:
- `DELIVERED`
- `REVISION_REQUESTED`
- `IN_CLAIM`
- `REQUOTING`
- `CANCELLED_BY_CLAIM`
- `COMPLETED_BY_CLAIM`
- `COMPLETED_WITH_AGREEMENT`

### Seed automático (`seed.service.ts`):
❌ Tiene solo 12 estados, le faltan:
- `DELIVERED`
- `REVISION_REQUESTED`
- `IN_CLAIM`
- `REQUOTING`
- `CANCELLED_BY_CLAIM`
- `COMPLETED_BY_CLAIM`
- `COMPLETED_WITH_AGREEMENT`
- **`TERMINATED_BY_MODERATION`** ← CRÍTICO
- `FINISHED_BY_MODERATION`

---

## ✅ Acción Recomendada

1. **Inmediato:** Tu compañero ejecuta el INSERT manual en BD
2. **Permanente:** Actualizar `seed.service.ts` con todos los estados
3. **Verificación:** Hacer git pull y rebuild para sincronizar

---

## 📝 Comando Rápido para Tu Compañero

```bash
# Un solo comando que lo arregla todo
docker exec -it conexia_back-services-db-1 psql -U postgres -d services -c "INSERT INTO service_hiring_statuses (code, name, description, created_at, updated_at) VALUES ('terminated_by_moderation', 'Terminado por Moderación', 'Servicio terminado porque el proveedor o cliente fue baneado permanentemente', NOW(), NOW()) ON CONFLICT (code) DO NOTHING;"
```

**Después de esto, el baneo de usuarios funcionará correctamente.**
