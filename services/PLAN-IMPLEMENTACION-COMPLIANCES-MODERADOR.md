# 📋 Plan de Implementación: Sistema de Compliances Definidos por Moderador

## 📖 Índice

1. [Visión General](#visión-general)
2. [Flujo Completo Paso a Paso](#flujo-completo-paso-a-paso)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Cambios Requeridos](#cambios-requeridos)
5. [Implementación Detallada](#implementación-detallada)
6. [Testing y Validación](#testing-y-validación)
7. [Cronograma](#cronograma)

---

## 🎯 Visión General

### Objetivo

Permitir que moderadores/administradores definan explícitamente qué debe cumplir cada parte al resolver un reclamo, proporcionando control total sobre:

- **Quién** debe cumplir (cliente o proveedor o ambos)
- **Qué** debe hacer (tipo de cumplimiento)
- **Cómo** debe hacerlo (instrucciones detalladas)
- **Cuándo** debe completarlo (plazo en días)

### Beneficios

✅ **Flexibilidad**: Cada caso es único, el moderador decide según contexto  
✅ **Claridad**: Instrucciones personalizadas, no genéricas  
✅ **Control**: Sistema de consecuencias automáticas por incumplimiento  
✅ **Trazabilidad**: Historial completo de cumplimientos y estados

---

## 📝 Flujo Completo Paso a Paso

### **FASE 1: Moderador Resuelve el Reclamo**

#### Paso 1.1: Revisión del Reclamo

```
GET /api/claims/:id/detail
```

- Moderador ve toda la información del reclamo
- Evidencias originales del claimant
- Evidencias de subsanación (si hubo observaciones)
- Observaciones del respondente (si existen)
- Historial completo de acciones

**Output esperado**:

```json
{
  "claim": {
    "id": "abc-123",
    "claimType": "not_delivered",
    "status": "in_review",
    "description": "No me entregaron el trabajo acordado",
    "evidenceUrls": [...],
    "clarificationEvidenceUrls": [...],
    "observations": "Necesito más evidencia",
    "clarificationResponse": "Aquí está la evidencia adicional"
  },
  "claimant": { "id": 87, "name": "Alex", ... },
  "otherUser": { "id": 99, "name": "Jimena", ... }
}
```

#### Paso 1.2: Decisión del Moderador

El moderador analiza y decide:

1. **¿Es válido el reclamo?**
   - ❌ **NO** → `status: 'rejected'` → Sin compliances
   - ✅ **SÍ** → `status: 'resolved'` → Continúa al paso 1.3

2. **¿A favor de quién?**
   - 🔵 `client_favor`: Cliente tiene razón → Proveedor debe cumplir
   - 🟢 `provider_favor`: Proveedor tiene razón → Cliente debe cumplir
   - 🟡 `partial_agreement`: Ambos tienen parte de razón → Ambos cumplen

#### Paso 1.3: Definición de Compliances

Según la decisión, el moderador define cumplimientos:

**Ejemplo A: A favor del cliente (proveedor incumplió)**

```javascript
{
  status: 'resolved',
  resolution: 'El proveedor no entregó el trabajo completo. Se ordena reembolso total.',
  resolutionType: 'client_favor',
  compliances: [
    {
      responsibleUserId: 99, // ID del proveedor
      complianceType: 'full_refund',
      instructions: 'Debes devolver el 100% del pago ($500 USD) al cliente mediante MercadoPago. Sube el comprobante de la transacción con el ID de operación visible.',
      deadlineDays: 7
    }
  ]
}
```

**Ejemplo B: A favor del proveedor (cliente no pagó)**

```javascript
{
  status: 'resolved',
  resolution: 'El cliente debe completar el pago pendiente según lo acordado.',
  resolutionType: 'provider_favor',
  compliances: [
    {
      responsibleUserId: 87, // ID del cliente
      complianceType: 'payment_required',
      instructions: 'Debes pagar los $300 USD restantes al proveedor vía MercadoPago. Sube captura de pantalla del comprobante.',
      deadlineDays: 5
    }
  ]
}
```

**Ejemplo C: Acuerdo parcial (ambos cumplen)**

```javascript
{
  status: 'resolved',
  resolution: 'El proveedor entregó 2 de 3 videos. Cliente pagará proporcionalmente.',
  resolutionType: 'partial_agreement',
  partialAgreementDetails: 'Cliente paga 66%, proveedor devuelve 33%',
  compliances: [
    {
      responsibleUserId: 99, // Proveedor
      complianceType: 'partial_refund',
      instructions: 'Debes devolver $166 USD (33% del total) al cliente. Sube comprobante de MercadoPago.',
      deadlineDays: 7,
      order: 0 // Primero
    },
    {
      responsibleUserId: 87, // Cliente
      complianceType: 'confirmation_only',
      instructions: 'Confirma que recibiste el reembolso parcial y acepta la resolución.',
      deadlineDays: 10,
      order: 1 // Después del anterior
    }
  ]
}
```

#### Paso 1.4: Envío de Resolución

```
PATCH /api/claims/:id/resolve
Body: { status, resolution, resolutionType, compliances }
```

**Backend procesa**:

1. ✅ Valida que el reclamo existe y está en `in_review` o `requires_staff_response`
2. ✅ Valida que si hay compliances, el status es `resolved` (no `rejected`)
3. ✅ Valida que los `responsibleUserId` son parte del reclamo
4. ✅ Actualiza el reclamo a `resolved` o `rejected`
5. ✅ Actualiza el estado del hiring según `resolutionType`
6. ✅ Crea los compliances en estado `pending`
7. ✅ Calcula deadlines (fecha actual + deadlineDays)
8. ✅ Envía emails a ambas partes

**Response**:

```json
{
  "success": true,
  "data": {
    "claim": {
      "id": "abc-123",
      "status": "resolved",
      "resolution": "...",
      "resolvedBy": 80,
      "resolvedAt": "2026-01-23T22:00:00Z"
    },
    "compliances": [
      {
        "id": "comp-456",
        "claimId": "abc-123",
        "responsibleUserId": "99",
        "complianceType": "full_refund",
        "status": "pending",
        "deadline": "2026-01-30T22:00:00Z",
        "moderatorInstructions": "Debes devolver...",
        "originalDeadlineDays": 7,
        "createdAt": "2026-01-23T22:00:00Z"
      }
    ]
  }
}
```

---

### **FASE 2: Usuario Cumple con el Compliance**

#### Paso 2.1: Usuario Notificado

El usuario responsable recibe:

1. 📧 **Email** con la resolución del reclamo
2. 📧 **Email** con el compliance asignado y sus instrucciones
3. 🔔 **Notificación** en la plataforma (opcional)

#### Paso 2.2: Usuario Ve sus Compliances Pendientes

```
GET /api/compliances?userId=99&status=pending
```

**Response**:

```json
{
  "data": [
    {
      "id": "comp-456",
      "claimId": "abc-123",
      "complianceType": "full_refund",
      "status": "pending",
      "deadline": "2026-01-30T22:00:00Z",
      "daysRemaining": 7,
      "moderatorInstructions": "Debes devolver el 100% del pago...",
      "claim": {
        "hiringId": 44,
        "service": { "title": "Automatización con Python" }
      }
    }
  ],
  "pagination": { ... }
}
```

#### Paso 2.3: Usuario Sube Evidencia del Cumplimiento

```
POST /api/compliances/:id/submit
Content-Type: multipart/form-data
```

**Form data**:

- `userResponse`: Texto explicativo (ej: "Realicé el reembolso completo")
- `evidence`: Archivos (comprobantes, capturas, etc.) - Máximo 5 archivos

**Backend procesa**:

1. ✅ Valida que el usuario es el responsable del compliance
2. ✅ Valida que el compliance está en `pending` (no finalizado)
3. ✅ Guarda los archivos en `/uploads/compliances/`
4. ✅ Actualiza el compliance:
   - `status` → `submitted`
   - `userNotes` → texto del usuario
   - `evidenceUrls` → URLs de los archivos subidos
   - `submittedAt` → fecha actual
5. ✅ Notifica a la otra parte (peer review opcional)
6. ✅ Notifica al moderador para revisión

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "comp-456",
    "status": "submitted",
    "submittedAt": "2026-01-25T10:00:00Z",
    "userNotes": "Realicé el reembolso completo",
    "evidenceUrls": ["/uploads/compliances/1737654000000-123456.png"]
  }
}
```

---

### **FASE 3: Moderador Revisa el Cumplimiento**

#### Paso 3.1: Moderador Ve Compliances Pendientes de Revisión

```
GET /api/compliances?status=submitted
```

Lista todos los compliances que usuarios han enviado evidencia y esperan revisión.

#### Paso 3.2: Moderador Revisa Evidencia

```
GET /api/compliances/:id
```

Ve:

- Instrucciones originales
- Evidencia subida por el usuario
- Notas del usuario
- Fecha de envío

#### Paso 3.3: Moderador Toma Decisión

```
POST /api/compliances/:id/review
Body: {
  reviewedBy: 80,
  approved: true/false,
  comment: "..."
}
```

**Si APRUEBA**:

- `status` → `approved`
- Se cierra el compliance ✅
- Si hay siguiente en cadena (order 1, 2...), se activa
- Usuario recibe email de confirmación
- Se resetean warnings (si los había)

**Si RECHAZA**:

- `status` → `pending` (vuelve a pendiente)
- `rejectionCount` incrementa
- `deadline` se reduce un 20%
- Usuario recibe email explicando qué falta
- `rejectionReason` se guarda para historial

---

### **FASE 4: Sistema de Consecuencias Automáticas**

#### Cron Job: Verificación Diaria (02:00 AM)

```typescript
@Cron(CronExpression.EVERY_6_HOURS)
async checkOverdueCompliances()
```

**Busca compliances vencidos** (`deadline < now` y status = `pending`/`submitted`):

##### Nivel 1: OVERDUE (Primera vez vencido)

- `status` → `overdue`
- `warningLevel` → 1
- `extendedDeadline` → deadline actual + 50%
- 📧 Email al usuario: "Advertencia 1/3: Tienes 3 días más"
- 📧 Email al moderador: "Usuario X incumplió deadline"

##### Nivel 2: WARNING (Segunda vez vencido)

- `status` → `warning`
- `warningLevel` → 2
- `finalDeadline` → extendedDeadline + 25%
- 🚫 **Suspende cuenta del usuario** (no puede hacer nuevas contrataciones)
- 📧 Email al usuario: "Advertencia 2/3: Cuenta suspendida temporalmente"
- 📧 Email al moderador: "Usuario X en advertencia 2"

##### Nivel 3: ESCALATED (Tercera vez vencido)

- `status` → `escalated`
- `warningLevel` → 3
- 🔴 **Ban permanente del usuario**
- 📧 Email al usuario: "Cuenta baneada por incumplimiento"
- 📧 Email al admin: "Usuario X baneado automáticamente"
- 🎯 Admin puede revisar caso y decidir si levantar ban

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    MODERADOR RESUELVE                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ ResolveClaimDto  │
                    │  + compliances[] │
                    └──────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   ResolveClaimUseCase        │
              │   1. Valida claim            │
              │   2. Valida responsables     │
              │   3. Resuelve claim          │
              │   4. Crea compliances        │
              │   5. Envía notificaciones    │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   CreateComplianceUseCase    │
              │   - Calcula deadline         │
              │   - Guarda en DB             │
              │   - Estado: pending          │
              └───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 USUARIO SUBE EVIDENCIA                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   SubmitComplianceUseCase    │
              │   1. Valida permisos         │
              │   2. Guarda archivos         │
              │   3. Status: submitted       │
              │   4. Notifica moderador      │
              └───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              MODERADOR REVISA COMPLIANCE                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ ModeratorReviewComplianceUC  │
              │  ¿Aprobado?                  │
              │    ✅ → approved              │
              │    ❌ → pending (rechazado)   │
              └───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           CRON: VERIFICACIÓN AUTOMÁTICA (6h)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ CheckOverdueCompliancesUC    │
              │  1. Busca vencidos           │
              │  2. Aplica consecuencias     │
              │  3. Notifica usuarios        │
              └───────────────────────────────┘
```

---

## 🔧 Cambios Requeridos

### ✅ Cambio 1: DTOs

**Archivos**:

- `api-gateway/src/service-hirings/dto/resolve-claim.dto.ts`
- `services/src/service-hirings/dto/resolve-claim.dto.ts`

**Acción**: Agregar sub-DTO `CreateComplianceItemDto` y array `compliances` a `ResolveClaimDto`

---

### ✅ Cambio 2: ResolveClaimUseCase

**Archivo**: `services/src/service-hirings/services/use-cases/resolve-claim.use-case.ts`

**Acciones**:

1. Descomentar import `CreateComplianceUseCase`
2. Inyectar en constructor
3. Agregar método `validateComplianceResponsibles()`
4. Modificar `execute()` para crear compliances
5. Modificar respuesta para incluir compliances creados
6. Actualizar `sendResolutionNotifications()` para incluir info de compliances

---

### ✅ Cambio 3: Gateway Controller

**Archivo**: `api-gateway/src/service-hirings/claims.controller.ts`

**Acción**: Actualizar endpoint `/claims/:id/resolve` para recibir nuevo DTO

---

### ✅ Cambio 4: Module Configuration

**Archivo**: `services/src/service-hirings/service-hirings.module.ts`

**Acción**: Verificar que `CreateComplianceUseCase` esté en providers (ya debe estar)

---

### ✅ Cambio 5: Emails

**Archivo**: `services/src/common/services/email.service.ts`

**Acciones**:

1. Agregar método `sendComplianceCreatedEmail()`
2. Agregar método `sendComplianceSubmittedEmail()`
3. Agregar método `sendComplianceApprovedEmail()`
4. Agregar método `sendComplianceRejectedEmail()`
5. Agregar método `sendComplianceOverdueWarningEmail()`

---

## 📋 Implementación Detallada

### Prioridad Alta (Crítico)

1. ✅ **DTOs**: Agregar soporte para compliances en resolución
2. ✅ **ResolveClaimUseCase**: Lógica de creación de compliances
3. ✅ **Validaciones**: Verificar que responsables son parte del claim
4. ✅ **Response**: Devolver compliances creados

### Prioridad Media (Importante)

5. ⚠️ **Emails**: Notificaciones de compliance creado
6. ⚠️ **Emails**: Notificaciones de compliance cumplido
7. ⚠️ **Module**: Verificar providers registrados

### Prioridad Baja (Opcional)

8. 📝 **Frontend Guide**: Documentar cómo frontend debe enviar compliances
9. 📝 **Postman Collection**: Ejemplos de requests
10. 🧪 **Tests**: Unit tests para validaciones

---

## 🧪 Testing y Validación

### Test Case 1: Resolución con Compliance Simple

```
POST /api/claims/:id/resolve
{
  "status": "resolved",
  "resolution": "Cliente tiene razón",
  "resolutionType": "client_favor",
  "compliances": [{
    "responsibleUserId": 99,
    "complianceType": "full_refund",
    "instructions": "Devolver $500 USD",
    "deadlineDays": 7
  }]
}

Expect:
- Claim status → resolved
- Compliance creado con status pending
- Deadline = now + 7 días
- Emails enviados a ambas partes
```

### Test Case 2: Resolución con Múltiples Compliances

```
POST /api/claims/:id/resolve
{
  "status": "resolved",
  "resolutionType": "partial_agreement",
  "compliances": [
    { responsibleUserId: 99, order: 0, ... },
    { responsibleUserId: 87, order: 1, ... }
  ]
}

Expect:
- 2 compliances creados
- Ambos en estado pending
- order respetado para secuencialidad
```

### Test Case 3: Validación de Responsable Inválido

```
POST /api/claims/:id/resolve
{
  "compliances": [{
    "responsibleUserId": 999, // No es parte del claim
    ...
  }]
}

Expect:
- Error 400: "Usuario 999 no es parte del reclamo"
```

### Test Case 4: Rechazo sin Compliances

```
POST /api/claims/:id/resolve
{
  "status": "rejected",
  "resolution": "Reclamo infundado",
  "compliances": []
}

Expect:
- Claim status → rejected
- No compliances creados
- Hiring vuelve a estado anterior
```

---

## 📅 Cronograma

### Sprint 1 (Día 1-2)

- ✅ Actualizar DTOs
- ✅ Modificar ResolveClaimUseCase
- ✅ Agregar validaciones
- ✅ Modificar gateway controller
- ✅ Testing básico

### Sprint 2 (Día 3-4)

- 📧 Implementar emails de compliance
- 🧪 Testing completo
- 📝 Documentación para frontend

### Sprint 3 (Día 5)

- 🚀 Deploy a staging
- ✅ Validación con casos reales
- 📝 Guía de uso para moderadores

---

## ✅ Checklist de Implementación

### Backend

- [ ] DTO `CreateComplianceItemDto` creado
- [ ] `ResolveClaimDto` actualizado con array `compliances`
- [ ] `ResolveClaimUseCase.validateComplianceResponsibles()` implementado
- [ ] `ResolveClaimUseCase.execute()` crea compliances
- [ ] Response incluye compliances creados
- [ ] Gateway controller actualizado
- [ ] Module providers verificados
- [ ] Emails de compliance implementados

### Testing

- [ ] Test: Resolución con 1 compliance
- [ ] Test: Resolución con múltiples compliances
- [ ] Test: Validación de responsable inválido
- [ ] Test: Rechazo sin compliances
- [ ] Test: Usuario sube evidencia
- [ ] Test: Moderador aprueba compliance
- [ ] Test: Sistema de consecuencias (overdue)

### Documentación

- [ ] Frontend guide actualizada
- [ ] Postman collection con ejemplos
- [ ] README actualizado

---

## 🎯 Resultados Esperados

### Para Moderadores

✅ Control total sobre compliances  
✅ Instrucciones personalizadas por caso  
✅ Flexibilidad en plazos y tipos  
✅ Visibilidad de cumplimientos pendientes

### Para Usuarios

✅ Claridad sobre qué deben hacer  
✅ Proceso simple de subida de evidencia  
✅ Feedback inmediato de moderadores  
✅ Sistema justo de consecuencias progresivas

### Para el Sistema

✅ Automatización de consecuencias  
✅ Trazabilidad completa  
✅ Reducción de carga manual  
✅ Mejora en tiempos de resolución

---

## 📞 Soporte y Dudas

Para cualquier duda sobre la implementación, revisar:

- `SISTEMA-COMPLIANCE-IMPLEMENTACION-COMPLETA.md`
- `FRONTEND-GUIA-COMPLIANCES.md`
- `FLUJO-COMPLETO-RECLAMOS-CUMPLIMIENTO.md`
