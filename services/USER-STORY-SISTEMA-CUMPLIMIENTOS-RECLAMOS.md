# Sistema de Cumplimientos de Reclamos

## Detalles clave
**Prioridad:** Highest

---

## Descripción

Como usuario de la plataforma (cliente o proveedor), quiero gestionar los cumplimientos derivados de resoluciones de reclamos, para asegurar que las partes involucradas cumplan con las decisiones del moderador, se apliquen consecuencias progresivas por incumplimiento, y se cierren los reclamos de manera justa y transparente.

---

## Criterios de Aceptación

### 1. CREACIÓN AUTOMÁTICA DE CUMPLIMIENTOS

**1.1. Al Resolver un Reclamo**

Cuando un moderador resuelve un reclamo (endpoint `POST /api/claims/{claimId}/resolve`), el sistema crea automáticamente uno o más cumplimientos según los datos proporcionados en el payload:

```json
{
  "status": "resolved",
  "resolution": "El moderador determina que...",
  "resolutionType": "client_favor" | "provider_favor" | "partial_agreement",
  "compliances": [
    {
      "responsibleUserId": 123,
      "complianceType": "delivery" | "payment" | "redelivery" | "refund",
      "moderatorInstructions": "Instrucciones claras del moderador",
      "daysToComply": 3
    }
  ]
}
```

**1.2. Información de Cada Cumplimiento**

Cada cumplimiento incluye:
- **Tipo de cumplimiento**: `delivery`, `payment`, `redelivery`, `refund`
- **Usuario responsable**: ID del usuario que debe cumplir
- **Plazo límite (deadline)**: Calculado automáticamente desde `now + daysToComply`
- **Instrucciones del moderador**: Texto claro explicando qué debe hacer
- **Estado inicial**: `PENDING`
- **Nivel de advertencia inicial**: `0`

**1.3. Notificación Inicial**

El sistema envía automáticamente un email al usuario responsable con:
- Detalles del reclamo
- Tipo de compromiso asignado
- Instrucciones del moderador
- Fecha límite para cumplir
- Enlace directo al reclamo

---

### 2. SISTEMA DE CONSECUENCIAS PROGRESIVAS POR VENCIMIENTO

**2.1. Niveles de Vencimiento**

El sistema aplica **3 niveles de consecuencias** cuando los plazos se vencen:

| Nivel | Días Vencido | Estado | Warning Level | Consecuencia |
|-------|--------------|--------|---------------|--------------|
| **0** | 0 días | `PENDING` | 0 | Cumplimiento activo dentro del plazo |
| **1** | 1-2 días | `OVERDUE` | 1 | Primera advertencia + extensión de 3 días |
| **2** | 3-4 días | `WARNING` | 2 | Suspensión temporal (15 días) + extensión de 2 días |
| **3** | 5+ días | `ESCALATED` | 3 | Baneo permanente + cancelación |

**2.2. Nivel 1 - Primera Advertencia (OVERDUE)**

**Condición**: Deadline original vencido

**Acciones automáticas**:
- Estado cambia a `OVERDUE`
- `warningLevel` = 1
- Se crea `extendedDeadline` = ahora + 3 días
- Email al usuario responsable:
  - Asunto: "Primer aviso: Compromiso vencido"
  - Contenido: Recordatorio del compromiso, fecha original vencida, nuevo plazo de 3 días
  - Tono: Informativo
- Email a la otra parte del reclamo:
  - Notificación de que el usuario no cumplió en plazo original
  - Estado del compromiso

**2.3. Nivel 2 - Advertencia Crítica + Suspensión (WARNING)**

**Condición**: `extendedDeadline` vencido (primer plazo + 3 días)

**Acciones automáticas**:
- Estado cambia a `WARNING`
- `warningLevel` = 2
- Se crea `finalDeadline` = ahora + 2 días
- **Suspensión temporal del usuario**:
  - `accountStatus` = `suspended`
  - Duración: 15 días
  - `suspensionReason`: "Incumplimiento de compromiso de reclamo - Segunda advertencia"
  - Usuario puede ver perfil pero con restricciones (ver sección 4)
- Email al usuario responsable:
  - Asunto: "Advertencia crítica: Cuenta suspendida temporalmente"
  - Contenido: 
    - Cuenta suspendida por 15 días
    - Historial de plazos (original, primera extensión)
    - Último plazo de 2 días
    - Consecuencias del siguiente vencimiento (baneo)
  - Tono: Crítico
- Email a la otra parte:
  - Notificación de suspensión temporal del usuario
  - Detalles del compromiso incumplido
- **NO se envía email al moderador** en este nivel

**2.4. Nivel 3 - Baneo Permanente (ESCALATED)**

**Condición**: `finalDeadline` vencido (primer plazo + 3 días + 2 días = 5 días total)

**Acciones automáticas**:
- Estado cambia a `ESCALATED`
- `warningLevel` = 3
- **Baneo permanente del usuario**:
  - `accountStatus` = `banned`
  - `banReason`: "Incumplimiento grave de compromiso - Plazo vencido por 5 días"
  - Bloqueo total de acceso a la plataforma
  - Invalidación de todas las sesiones activas
- **Gestión de contrataciones**:
  - Todas las contrataciones activas → `terminated_by_moderation`
  - Notificaciones a todas las partes afectadas
- **Gestión de servicios y proyectos**:
  - Servicios publicados → ocultos del buscador
  - Proyectos como owner → estado `suspended_by_moderation`
  - Postulaciones pendientes → `cancelled_by_moderation`
- Email al usuario baneado:
  - Asunto: "Cuenta suspendida permanentemente"
  - Contenido:
    - Notificación de baneo permanente
    - Detalles del compromiso incumplido
    - Historial completo de plazos (deadline, extendedDeadline, finalDeadline)
    - Consecuencias (no puede acceder, no puede crear nueva cuenta)
    - Opciones de apelación (30 días)
  - Formato: Profesional, inline styles, sin emoticones
- Email a la otra parte del reclamo:
  - Asunto: "Cuenta de [Usuario] suspendida permanentemente"
  - Contenido:
    - Notificación de baneo del usuario
    - Detalles del compromiso que debía cumplir
    - Instrucciones del moderador
    - Información sobre próximos pasos
- Email al moderador asignado:
  - Asunto: "Usuario baneado por incumplimiento grave"
  - Contenido:
    - Detalles del compliance escalado
    - Usuario baneado
    - Acciones automáticas aplicadas

**2.5. Verificación Automática de Vencimientos**

- **Cron Job**: Se ejecuta cada 6 horas (00:00, 06:00, 12:00, 18:00)
- **Proceso**:
  1. Busca compliances en estados: `PENDING`, `OVERDUE`, `WARNING`
  2. Verifica el deadline correcto según estado:
     - `PENDING` → verifica `deadline`
     - `OVERDUE` → verifica `extendedDeadline`
     - `WARNING` → verifica `finalDeadline`
  3. Calcula días vencidos desde el deadline correspondiente
  4. Aplica consecuencias según nivel
  5. Registra logs detallados de cada acción

---

### 3. ESTADOS DEL CUMPLIMIENTO

**3.1. Estados Principales**

El sistema maneja **7 estados** para cumplimientos:

| Estado | Código | Descripción | Warning Level |
|--------|--------|-------------|---------------|
| **Pendiente** | `PENDING` | Esperando acción del usuario responsable | 0 |
| **Requiere Ajuste** | `REQUIRES_ADJUSTMENT` | Moderador requiere correcciones | 0 |
| **Vencido Nivel 1** | `OVERDUE` | Primera advertencia, plazo extendido | 1 |
| **Advertencia Crítica** | `WARNING` | Segunda advertencia, usuario suspendido | 2 |
| **Escalado** | `ESCALATED` | Baneo permanente aplicado | 3 |
| **Completado** | `COMPLETED` | Cumplimiento exitoso | 0 |
| **Cancelado** | `CANCELLED` | Reclamo cancelado antes de cumplir | 0 |

**3.2. Transiciones de Estados**

```
PENDING → OVERDUE (día 1-2 vencido)
  ↓
OVERDUE → WARNING (día 3-4 vencido)
  ↓
WARNING → ESCALATED (día 5+ vencido)

PENDING/OVERDUE/WARNING → COMPLETED (usuario cumple)

PENDING/OVERDUE/WARNING → REQUIRES_ADJUSTMENT (moderador solicita ajuste)

Cualquier estado → CANCELLED (reclamo cancelado)
```

**3.3. Campos Calculados del Compliance**

Cada cumplimiento expone propiedades calculadas en tiempo real:

```typescript
{
  id: "uuid",
  claimId: "uuid",
  responsibleUserId: "123",
  complianceType: "delivery",
  moderatorInstructions: "Texto",
  status: "PENDING",
  warningLevel: 0,
  
  // Fechas
  deadline: "2026-01-25T00:00:00Z",
  extendedDeadline: "2026-01-28T00:00:00Z" | null,
  finalDeadline: "2026-01-30T00:00:00Z" | null,
  
  // Campos calculados (expuestos en API)
  isOverdue: true,              // ¿Está vencido?
  daysOverdue: 2,               // Días desde vencimiento
  currentDeadline: "2026-01-28", // Deadline actual según estado
  daysUntilDeadline: -2,        // Días hasta vencimiento (negativo si vencido)
  urgencyLevel: "critical"      // normal | warning | urgent | critical
}
```

**3.4. Niveles de Urgencia (UI)**

Para mostrar badges visuales en el frontend:

| Urgency Level | Condición | Color | Icono |
|---------------|-----------|-------|-------|
| `normal` | Más de 72 horas | Verde | ✓ |
| `warning` | 24-72 horas | Amarillo | ⚠ |
| `urgent` | Menos de 24 horas | Naranja | ⚠️ |
| `critical` | Vencido (overdue/warning) | Rojo | 🚨 |

---

### 4. RESTRICCIONES DURANTE SUSPENSIÓN TEMPORAL

Cuando un usuario es suspendido por nivel 2 (WARNING):

**4.1. Usuario NO puede**:
- Crear nuevos servicios
- Publicar nuevos proyectos
- Postularse a proyectos
- Recibir nuevas cotizaciones
- Solicitar cotizaciones
- Crear publicaciones en comunidad

**4.2. Usuario SÍ puede**:
- Ver su perfil (con banner "Cuenta Suspendida Temporalmente")
- Completar servicios contratados en curso
- Ver y gestionar proyectos existentes
- Comunicarse con clientes/colaboradores actuales
- **Cumplir con el compromiso del reclamo** ✅

**4.3. Banner en Perfil**:
- Color: Amarillo/ámbar
- Mensaje: "Cuenta Suspendida Temporalmente"
- Submensaje: "Por incumplimiento de compromiso de reclamo"
- Fecha de expiración: "La suspensión expira el [FECHA]"

---

### 5. TIPOS DE CUMPLIMIENTO SOPORTADOS

**5.1. Tipos Implementados**

| Tipo | Código | Descripción | Usuario Responsable |
|------|--------|-------------|---------------------|
| **Entrega** | `delivery` | Subir entrega faltante | Proveedor |
| **Re-entrega** | `redelivery` | Corregir entrega defectuosa | Proveedor |
| **Pago** | `payment` | Realizar pago pendiente | Cliente |
| **Reembolso** | `refund` | Procesar reembolso | Plataforma/Admin |

**5.2. Configuración por Tipo**

El moderador puede configurar:
- **Días para cumplir**: 1-30 días (por defecto: 3 días)
- **Instrucciones específicas**: Texto libre explicando qué se debe hacer
- **Usuario responsable**: Quién debe cumplir (cliente o proveedor)

---

### 6. NOTIFICACIONES POR EMAIL

**6.1. Emails Implementados**

| Evento | Destinatario | Subject | Contenido |
|--------|--------------|---------|-----------|
| **Cumplimiento asignado** | Responsable | "Nuevo compromiso asignado" | Detalles del reclamo, tipo de compromiso, plazo |
| **Recordatorio < 24h** | Responsable | "Recordatorio: Compromiso vence en menos de 24 horas" | Countdown, instrucciones, consecuencias |
| **Nivel 1 (OVERDUE)** | Responsable + Otra parte | "Primer aviso: Compromiso vencido" | Advertencia, nuevo plazo +3 días |
| **Nivel 2 (WARNING)** | Responsable + Otra parte | "Advertencia crítica: Cuenta suspendida" | Suspensión 15 días, último plazo +2 días, consecuencias |
| **Nivel 3 (ESCALATED)** | Usuario baneado + Otra parte + Moderador | "Cuenta suspendida permanentemente" | Baneo, historial de plazos, apelación |
| **Cumplimiento completado** | Ambas partes + Moderador | "Compromiso cumplido exitosamente" | Confirmación, próximos pasos |

**6.2. Formato de Emails**

Todos los emails siguen el estilo profesional de Conexia:
- **Inline styles** (no `<style>` tags en `<head>`)
- Container: `background-color: #f5f6f6`
- Card: `background-color: white; border-radius: 8px; box-shadow`
- Headers con colores según severidad:
  - Info: `#48a6a7` (turquesa)
  - Warning: `#ff9800` (naranja)
  - Critical: `#d32f2f` (rojo)
  - Escalated: `#b71c1c` (rojo oscuro)
- Fechas en español: `toLocaleString('es', {weekday, day, month, year, hour, minute})`
- **Sin emoticones**, **sin CamelCase**
- Footer: "El equipo de Conexia"

---

### 7. API REST PARA FRONTEND

**7.1. Endpoints Públicos**

```typescript
// Listar cumplimientos del usuario autenticado
GET /api/compliances/my-compliances
Query params:
  - status?: 'pending' | 'overdue' | 'warning' | 'escalated' | 'completed'
  - page?: number
  - limit?: number
Auth: Usuario autenticado
Response: {
  compliances: ClaimCompliance[],
  total: number,
  page: number,
  limit: number
}

// Obtener detalle de un cumplimiento
GET /api/compliances/{complianceId}
Auth: Usuario autenticado + debe ser parte del reclamo
Response: ClaimCompliance con claim y hiring

// Ver cumplimientos de un reclamo específico
GET /api/claims/{claimId}/compliances
Auth: Usuario autenticado + debe ser parte del reclamo
Response: ClaimCompliance[]
```

**7.2. Endpoints de Moderador**

```typescript
// Dashboard de moderador: cumplimientos pendientes de revisión
GET /api/compliances/moderator/pending
Auth: Moderador o Admin
Response: ClaimCompliance[] ordenados por urgencia

// Ver todos los cumplimientos de un usuario
GET /api/compliances/user/{userId}
Auth: Moderador o Admin
Response: ClaimCompliance[]
```

**7.3. Validación de Autorización**

Todos los endpoints validan:
- Usuario autenticado
- Usuario es parte del reclamo (responsable, otra parte o moderador)
- Moderadores/Admins tienen acceso total

---

### 8. JOBS Y CRON PARA VERIFICACIÓN AUTOMÁTICA

**8.1. Job Automático (Producción)**

**Configuración**:
- **Frecuencia**: Cada 6 horas
- **Horarios**: 00:00, 06:00, 12:00, 18:00 (hora del servidor)
- **Implementación**: NestJS `@Cron` decorator

```typescript
@Cron('0 */6 * * *') // Cada 6 horas
async handleCheckOverdueCompliances() {
  await this.checkOverdueCompliancesUseCase.execute();
}
```

**Proceso del Job**:
1. Busca compliances en estados: `PENDING`, `OVERDUE`, `WARNING`
2. Para cada compliance:
   - Determina deadline correcto según estado
   - Calcula días vencidos
   - Aplica consecuencias si corresponde
   - Envía emails automáticos
   - Registra logs

**8.2. Ejecución Manual para Testing**

**Endpoint Manual**:
```
POST http://localhost:8080/api/compliances/check-overdue
Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN
Body: (vacío)
Auth: Solo Admin
```

**Respuesta**:
```json
{
  "message": "Verificación de cumplimientos vencidos ejecutada",
  "timestamp": "2026-01-31T23:00:00Z"
}
```

**Logs Esperados**:
```
[CheckOverdueCompliancesUseCase] Verificando cumplimientos vencidos...
[CheckOverdueCompliancesUseCase] Compliances encontrados: 5
[ComplianceConsequenceService] Aplicando consecuencia a compliance {id} - Días vencido: 1, warningLevel: 0
[ComplianceConsequenceService] Compliance {id} cumple condiciones para ADVERTENCIA NIVEL 1
[ComplianceConsequenceService] Usuario {id} advertido - Primera advertencia
[NodemailerService] Email enviado exitosamente a {email}
[CheckOverdueCompliancesUseCase] Verificación completada
```

**8.3. Endpoints de Testing Adicionales**

Para pruebas y desarrollo:

```typescript
// Forzar nivel de advertencia específico (solo development)
POST /api/compliances/{complianceId}/force-warning-level
Body: {
  warningLevel: 1 | 2 | 3
}
Auth: Admin
Nota: Solo disponible en NODE_ENV=development

// Ver estado detallado de un compliance
GET /api/compliances/{complianceId}/debug
Auth: Admin
Response: {
  compliance: ClaimCompliance,
  calculatedFields: {
    isOverdue: boolean,
    daysOverdue: number,
    currentDeadline: Date,
    daysUntilDeadline: number,
    urgencyLevel: string
  },
  nextAction: string
}
```

---

### 9. VISUALIZACIÓN EN FRONTEND

**9.1. Dashboard de Usuario**

**Sección "Mis Cumplimientos Pendientes"**:
- Card por cada cumplimiento
- Badge de urgencia (normal/warning/urgent/critical)
- Countdown timer en tiempo real
- Botón "Ver Detalles" → Modal o página dedicada
- Filtros por estado

**9.2. Badge en Navbar**

- Contador de cumplimientos pendientes (PENDING + OVERDUE + WARNING)
- Color según máxima urgencia:
  - Verde: Normal
  - Amarillo: Warning
  - Naranja: Urgent
  - Rojo: Critical
- Click → Redirecciona a dashboard de cumplimientos

**9.3. Detalle de Cumplimiento**

Modal o página que muestra:
- Información del reclamo relacionado
- Tipo de cumplimiento
- Instrucciones del moderador
- Timeline de plazos:
  - Deadline original: [fecha] - estado
  - Extended deadline: [fecha] - estado (si aplica)
  - Final deadline: [fecha] - estado (si aplica)
- Estado actual del cumplimiento
- Días restantes / días vencido
- Nivel de advertencia actual
- Consecuencias del siguiente vencimiento
- Botones de acción según estado

**9.4. Actualización en Tiempo Real**

- **Polling**: Cada 30 segundos cuando hay cumplimientos pendientes
- **Notificación Push** (opcional): Cuando cambia estado o se acerca deadline
- **Email**: Notificaciones críticas siempre por email

**9.5. Dashboard de Moderador**

**Vista especial para moderadores**:
- Tabla de cumplimientos ordenados por urgencia
- Filtros:
  - Por estado (PENDING, OVERDUE, WARNING, ESCALATED)
  - Por tipo de cumplimiento
  - Por reclamo
  - Por usuario responsable
- Acciones rápidas:
  - Ver detalle del reclamo
  - Ver perfil del usuario
  - Marcar como completado manualmente (excepcional)
  - Ver historial de advertencias

---

### 10. MÉTRICAS Y REPORTES

**10.1. Métricas del Sistema**

El sistema debe trackear:
- Total de cumplimientos creados
- Cumplimientos completados a tiempo
- Cumplimientos completados con retraso
- Cumplimientos que llegaron a nivel 1 (OVERDUE)
- Cumplimientos que llegaron a nivel 2 (WARNING)
- Cumplimientos que llegaron a nivel 3 (ESCALATED)
- Tasa de cumplimiento por tipo
- Tiempo promedio de cumplimiento
- Usuarios baneados por incumplimiento

**10.2. Endpoints de Métricas**

```typescript
// Métricas generales (Admin)
GET /api/compliances/metrics
Auth: Admin
Response: {
  total: number,
  completedOnTime: number,
  completedLate: number,
  overdue: number,
  warning: number,
  escalated: number,
  complianceRate: number,
  averageCompletionTime: number,
  byType: {
    delivery: { total, completed, failed },
    payment: { total, completed, failed },
    // ...
  }
}

// Métricas de un usuario específico
GET /api/compliances/user/{userId}/metrics
Auth: Moderador o el propio usuario
Response: {
  totalAssigned: number,
  completed: number,
  failed: number,
  currentWarningLevel: number,
  complianceRate: number
}
```

---

### 11. CASOS ESPECIALES Y EDGE CASES

**11.1. Múltiples Cumplimientos en un Reclamo**

- Todos los cumplimientos se procesan **en paralelo**
- Cada uno tiene su propio deadline y sistema de advertencias
- Si **cualquiera** llega a nivel 3 (ESCALATED) → baneo del usuario
- El reclamo se cierra cuando **TODOS** los cumplimientos estén completados o escalados

**11.2. Usuario Cumple Durante Suspensión**

- Si usuario cumple mientras está suspendido (nivel 2):
  - Cumplimiento se marca como `COMPLETED`
  - La **suspensión NO se levanta automáticamente**
  - Suspensión expira según `suspensionExpiresAt` (15 días desde aplicación)
  - Reactivación automática a las 2:00 AM cuando expira

**11.3. Reclamo Cancelado con Cumplimientos Pendientes**

- Si moderador o usuario cancela el reclamo:
  - Todos los cumplimientos asociados → estado `CANCELLED`
  - Se detiene el job de verificación para esos cumplimientos
  - No se aplican más consecuencias
  - Emails de notificación enviados

**11.4. Usuario Apela Baneo**

- Email de baneo incluye información de apelación
- Plazo: 30 días desde baneo
- Contacto: soporte@conexia.com
- Moderador puede revisar y revertir baneo manualmente si procede

---

## Precondiciones

1. Usuario debe estar registrado y autenticado
2. Debe existir un reclamo resuelto con compliances asignados
3. Microservicio de `users` debe estar activo (para baneo/suspensión)
4. Microservicio de `services` debe estar activo
5. Servicio de emails (SMTP) configurado correctamente

---

## Comandos de Testing y Operación

### **Ejecutar Job Manual de Verificación**

```bash
# Método 1: Endpoint HTTP
curl -X POST http://localhost:8080/api/compliances/check-overdue \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Método 2: Desde Postman/Insomnia
POST http://localhost:8080/api/compliances/check-overdue
Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN
```

### **Ver Logs del Job**

```bash
# Ver logs del contenedor de services
docker logs conexia_back-services-1 --tail 100 -f

# Buscar logs específicos del job
docker logs conexia_back-services-1 2>&1 | grep "CheckOverdueCompliances"

# Ver logs de consecuencias aplicadas
docker logs conexia_back-services-1 2>&1 | grep "ComplianceConsequence"
```

### **Verificar Estado de Cumplimientos en DB**

```sql
-- Ver cumplimientos vencidos
SELECT 
  id, 
  "complianceType",
  status,
  "warningLevel",
  deadline,
  "extendedDeadline",
  "finalDeadline",
  "responsibleUserId"
FROM claim_compliances
WHERE status IN ('PENDING', 'OVERDUE', 'WARNING')
ORDER BY deadline ASC;

-- Ver cumplimientos por nivel de advertencia
SELECT 
  "warningLevel",
  COUNT(*) as total,
  status
FROM claim_compliances
GROUP BY "warningLevel", status
ORDER BY "warningLevel";

-- Ver usuarios con advertencias
SELECT DISTINCT 
  "responsibleUserId",
  "warningLevel",
  status
FROM claim_compliances
WHERE "warningLevel" > 0
ORDER BY "warningLevel" DESC;
```

### **Forzar Vencimiento para Testing (Development Only)**

```bash
# Actualizar deadline para que esté vencido
curl -X PATCH http://localhost:8080/api/compliances/{complianceId}/update-deadline \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deadline": "2026-01-20T00:00:00Z"
  }'

# Luego ejecutar job manual
curl -X POST http://localhost:8080/api/compliances/check-overdue \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### **Revisar Emails Enviados (Ethereal)**

```
1. Abrir navegador en: https://ethereal.email/messages
2. Login con credenciales de .env:
   - User: carlee40@ethereal.email
   - Pass: fDpmQVcatJ2wfr5NJ8
3. Ver emails enviados en orden cronológico
```

### **Reiniciar Servicio Después de Cambios**

```bash
# Reiniciar solo el servicio de services
docker-compose restart services

# Ver logs del arranque
docker-compose logs -f services

# Esperar mensaje "Nest application successfully started"
```

---

## Notas Técnicas

### **Arquitectura**

- **Microservicio**: `services`
- **Base de datos**: PostgreSQL (puerto 5435)
- **ORM**: TypeORM
- **Framework**: NestJS
- **Cron**: NestJS Schedule (`@nestjs/schedule`)
- **Emails**: Nodemailer + Ethereal (dev) / SMTP real (prod)

### **Archivos Clave**

```
services/src/service-hirings/
├── entities/
│   └── claim-compliance.entity.ts          # Entidad con campos calculados
├── enums/
│   └── compliance.enum.ts                  # Estados y tipos
├── services/
│   ├── compliance-consequence.service.ts   # Lógica de consecuencias
│   └── use-cases/
│       ├── create-compliance.use-case.ts   # Creación al resolver reclamo
│       └── compliance/
│           └── check-overdue-compliances.use-case.ts  # Job cron
└── controllers/
    └── compliances.controller.ts           # Endpoints REST
```

### **Consideraciones de Producción**

1. **Zona Horaria**: Configurar servidor con zona horaria UTC o local según país
2. **Emails**: Cambiar de Ethereal a SMTP real (Gmail, SendGrid, etc.)
3. **Rate Limiting**: Limitar endpoint manual a 1 ejecución por minuto
4. **Logging**: Integrar con servicio de logging centralizado (ELK, Datadog)
5. **Alertas**: Configurar alertas cuando hay muchos baneo en corto tiempo
6. **Backup**: Hacer backup de DB antes de aplicar consecuencias masivas

---

## Referencias

- [Análisis Profundo: Pending Compliance](./ANALISIS-PROFUNDO-PENDING-COMPLIANCE.md)
- [Análisis: Estados Post-Resolución](./ANALISIS-ESTADOS-HIRING-POST-RESOLUCION.md)
- [Sistema de Plazos](./SISTEMA-PLAZOS-COMPLIANCES.md)
- [Flujo Completo Reclamos](./FLUJO-COMPLETO-RECLAMOS-CUMPLIMIENTO.md)
