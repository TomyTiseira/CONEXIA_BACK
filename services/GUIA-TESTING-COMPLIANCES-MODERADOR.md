# 🧪 Guía de Testing: Sistema de Compliances Moderador

## 📋 Índice

1. [Preparación](#preparación)
2. [Escenarios de Prueba](#escenarios-de-prueba)
3. [Ejemplos de Requests](#ejemplos-de-requests)
4. [Validaciones Esperadas](#validaciones-esperadas)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Preparación

### 1. Verificar que los servicios estén corriendo

```bash
docker compose ps
```

Debés ver:

- ✅ `api-gateway` - running
- ✅ `services` - running
- ✅ `services-db` - running

### 2. Verificar logs de services

```bash
docker compose logs -f services
```

Buscá el mensaje:

```
[NestApplication] Nest application successfully started
```

### 3. Obtener un token de moderador/admin

Necesitás autenticarte como moderador o admin para resolver claims:

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "moderator@conexia.com",
  "password": "tu_password"
}
```

Guardá el `accessToken` para usarlo en los siguientes requests.

---

## 🎯 Escenarios de Prueba

### Escenario 1: Resolución a favor del cliente con 1 compliance

**Contexto**: El proveedor no entregó el trabajo completo. Se resuelve a favor del cliente ordenando reembolso total.

**Request**:

```http
PATCH http://localhost:3000/api/claims/abc-123/resolve
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "resolved",
  "resolutionType": "client_favor",
  "resolution": "El proveedor no entregó el trabajo completo según lo acordado. Se ordena reembolso total del monto pagado.",
  "compliances": [
    {
      "responsibleUserId": 99,
      "complianceType": "full_refund",
      "instructions": "Debes devolver el 100% del pago ($500 USD) al cliente mediante MercadoPago. Sube el comprobante de la transacción con el ID de operación visible y la fecha de transferencia.",
      "deadlineDays": 7
    }
  ]
}
```

**Respuesta esperada**:

```json
{
  "success": true,
  "data": {
    "claim": {
      "id": "abc-123",
      "status": "resolved",
      "resolution": "El proveedor no entregó el trabajo completo...",
      "resolutionType": "client_favor",
      "resolvedBy": 80,
      "resolvedAt": "2026-01-23T22:00:00Z",
      "closedAt": "2026-01-23T22:00:00Z",
      "finalOutcome": "client_favor"
    },
    "compliances": [
      {
        "id": "comp-456",
        "claimId": "abc-123",
        "responsibleUserId": "99",
        "complianceType": "full_refund",
        "status": "pending",
        "moderatorInstructions": "Debes devolver el 100%...",
        "deadline": "2026-01-30T22:00:00Z",
        "originalDeadlineDays": 7,
        "orderNumber": 0,
        "requiresFiles": true,
        "rejectionCount": 0,
        "warningLevel": 0,
        "createdAt": "2026-01-23T22:00:00Z"
      }
    ]
  }
}
```

**Validaciones**:

- ✅ Claim status = `resolved`
- ✅ 1 compliance creado
- ✅ Compliance status = `pending`
- ✅ Compliance responsibleUserId = 99 (proveedor)
- ✅ Deadline = hoy + 7 días
- ✅ Emails enviados (2: resolución claim + compliance asignado)

---

### Escenario 2: Resolución con acuerdo parcial (2 compliances secuenciales)

**Contexto**: El proveedor entregó 2 de 3 videos acordados. Se decide pago proporcional: cliente paga 66%, proveedor devuelve 33%.

**Request**:

```http
PATCH http://localhost:3000/api/claims/xyz-789/resolve
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "resolved",
  "resolutionType": "partial_agreement",
  "resolution": "El proveedor entregó 2 de los 3 videos pactados. Se resuelve con pago proporcional: cliente paga 66% del total, proveedor devuelve 33%.",
  "partialAgreementDetails": "Cliente paga $330 USD (66%), proveedor devuelve $170 USD (34%)",
  "compliances": [
    {
      "responsibleUserId": 99,
      "complianceType": "partial_refund",
      "instructions": "Debes devolver $170 USD (34% del total) al cliente mediante MercadoPago. Sube el comprobante con ID de operación y fecha.",
      "deadlineDays": 7,
      "order": 0
    },
    {
      "responsibleUserId": 87,
      "complianceType": "confirmation_only",
      "instructions": "Confirma que recibiste el reembolso parcial y que aceptas la resolución. Sube captura de pantalla del mensaje recibido en MercadoPago.",
      "deadlineDays": 10,
      "order": 1
    }
  ]
}
```

**Respuesta esperada**:

```json
{
  "success": true,
  "data": {
    "claim": {
      "id": "xyz-789",
      "status": "resolved",
      "resolutionType": "partial_agreement",
      "partialAgreementDetails": "Cliente paga $330 USD (66%), proveedor devuelve $170 USD (34%)",
      "resolvedAt": "2026-01-23T22:00:00Z"
    },
    "compliances": [
      {
        "id": "comp-101",
        "responsibleUserId": "99",
        "complianceType": "partial_refund",
        "orderNumber": 0,
        "deadline": "2026-01-30T22:00:00Z"
      },
      {
        "id": "comp-102",
        "responsibleUserId": "87",
        "complianceType": "confirmation_only",
        "orderNumber": 1,
        "deadline": "2026-02-02T22:00:00Z"
      }
    ]
  }
}
```

**Validaciones**:

- ✅ Claim status = `resolved`
- ✅ 2 compliances creados
- ✅ Compliance 1: proveedor (userId 99), order 0, deadline hoy+7
- ✅ Compliance 2: cliente (userId 87), order 1, deadline hoy+10
- ✅ Ambos con status `pending`
- ✅ 4 Emails enviados (2 resolución + 2 compliances)

---

### Escenario 3: Rechazo de claim (sin compliances)

**Contexto**: El reclamo es infundado. No se asignan compliances.

**Request**:

```http
PATCH http://localhost:3000/api/claims/def-456/resolve
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "rejected",
  "resolutionType": "provider_favor",
  "resolution": "Después de revisar las evidencias, se determina que el reclamo no tiene fundamento. El proveedor cumplió con lo acordado y las entregas fueron realizadas en tiempo y forma."
}
```

**Respuesta esperada**:

```json
{
  "success": true,
  "data": {
    "claim": {
      "id": "def-456",
      "status": "rejected",
      "resolution": "Después de revisar las evidencias...",
      "resolvedAt": "2026-01-23T22:00:00Z"
    },
    "compliances": []
  }
}
```

**Validaciones**:

- ✅ Claim status = `rejected`
- ✅ Array compliances vacío
- ✅ Hiring vuelve a estado anterior
- ✅ 2 Emails enviados (resolución a ambas partes)

---

### Escenario 4: Resolución a favor del proveedor (cliente debe pagar)

**Contexto**: Cliente no completó el pago acordado.

**Request**:

```http
PATCH http://localhost:3000/api/claims/ghi-789/resolve
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "resolved",
  "resolutionType": "provider_favor",
  "resolution": "El cliente debe completar el pago pendiente según lo acordado. El proveedor cumplió con todas las entregas en tiempo y forma.",
  "compliances": [
    {
      "responsibleUserId": 87,
      "complianceType": "payment_required",
      "instructions": "Debes pagar los $300 USD restantes al proveedor mediante MercadoPago. Sube captura de pantalla del comprobante con ID de operación.",
      "deadlineDays": 5
    }
  ]
}
```

**Validaciones**:

- ✅ Compliance asignado al cliente (userId 87)
- ✅ Type = `payment_required`
- ✅ Deadline = hoy + 5 días

---

### Escenario 5: Resolución con múltiples compliances (máximo 5)

**Request**:

```http
PATCH http://localhost:3000/api/claims/jkl-012/resolve
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "resolved",
  "resolutionType": "partial_agreement",
  "resolution": "Resolución compleja con múltiples pasos",
  "compliances": [
    {
      "responsibleUserId": 99,
      "complianceType": "work_revision",
      "instructions": "Corregir diseños según feedback",
      "deadlineDays": 3,
      "order": 0
    },
    {
      "responsibleUserId": 87,
      "complianceType": "confirmation_only",
      "instructions": "Aprobar revisiones",
      "deadlineDays": 5,
      "order": 1
    },
    {
      "responsibleUserId": 99,
      "complianceType": "work_completion",
      "instructions": "Entregar versión final",
      "deadlineDays": 7,
      "order": 2
    },
    {
      "responsibleUserId": 87,
      "complianceType": "payment_required",
      "instructions": "Pagar monto restante",
      "deadlineDays": 10,
      "order": 3
    },
    {
      "responsibleUserId": 99,
      "complianceType": "confirmation_only",
      "instructions": "Confirmar recepción de pago",
      "deadlineDays": 12,
      "order": 4
    }
  ]
}
```

**Validaciones**:

- ✅ 5 compliances creados (límite máximo)
- ✅ Todos con order secuencial (0, 1, 2, 3, 4)
- ✅ Deadlines progresivos

---

## ❌ Validaciones Esperadas (Errores)

### Error 1: Intento de asignar compliance a usuario no involucrado

**Request**:

```json
{
  "status": "resolved",
  "resolutionType": "client_favor",
  "resolution": "Test",
  "compliances": [
    {
      "responsibleUserId": 999, // Usuario no es parte del claim
      "complianceType": "full_refund",
      "instructions": "Test",
      "deadlineDays": 7
    }
  ]
}
```

**Respuesta esperada**:

```json
{
  "success": false,
  "message": "El usuario 999 no es parte del reclamo. Solo pueden ser asignados el cliente (87) o el proveedor (99)"
}
```

---

### Error 2: Intento de asignar compliances a claim rechazado

**Request**:

```json
{
  "status": "rejected",
  "resolutionType": "provider_favor",
  "resolution": "Reclamo infundado",
  "compliances": [
    {
      "responsibleUserId": 99,
      "complianceType": "full_refund",
      "instructions": "No debería permitirse",
      "deadlineDays": 7
    }
  ]
}
```

**Respuesta esperada**:

```json
{
  "success": false,
  "message": "No se pueden asignar compliances a un reclamo rechazado"
}
```

---

### Error 3: Exceder límite de 5 compliances

**Request**:

```json
{
  "status": "resolved",
  "resolutionType": "partial_agreement",
  "resolution": "Test",
  "compliances": [
    // 6 compliances aquí
  ]
}
```

**Respuesta esperada**:

```json
{
  "success": false,
  "message": "No se pueden asignar más de 5 compliances por resolución"
}
```

---

### Error 4: Instrucciones muy cortas (menos de 20 caracteres)

**Request**:

```json
{
  "compliances": [
    {
      "responsibleUserId": 99,
      "complianceType": "full_refund",
      "instructions": "Corto", // < 20 caracteres
      "deadlineDays": 7
    }
  ]
}
```

**Respuesta esperada**:

```json
{
  "success": false,
  "message": "Las instrucciones deben tener al menos 20 caracteres"
}
```

---

### Error 5: Deadline fuera de rango

**Request con deadline = 0**:

```json
{
  "compliances": [
    {
      "deadlineDays": 0 // Debe ser >= 1
    }
  ]
}
```

**Request con deadline = 100**:

```json
{
  "compliances": [
    {
      "deadlineDays": 100 // Debe ser <= 90
    }
  ]
}
```

**Respuesta esperada**:

```json
{
  "success": false,
  "message": "El plazo debe ser al menos 1 día" // o "El plazo no puede exceder 90 días"
}
```

---

## 📧 Verificar Emails Enviados

Después de resolver un claim con compliances, se deberían enviar los siguientes emails:

### Email 1: Resolución del claim (al cliente)

```
Para: cliente@email.com
Asunto: Tu reclamo ha sido resuelto - Conexia

Hola [ClienteName],

Tu reclamo sobre "[ServiceTitle]" ha sido resuelto.

Estado: Resuelto
Tipo de resolución: A favor del cliente

Resolución:
[Texto de la resolución del moderador]

Si se te asignaron compromisos a cumplir, recibirás un email adicional con los detalles.

Saludos,
Equipo de Conexia
```

### Email 2: Resolución del claim (al proveedor)

```
Para: proveedor@email.com
Asunto: Resolución de reclamo - Conexia

[Mismo formato que el anterior]
```

### Email 3: Compliance asignado (al responsable)

```
Para: responsable@email.com
Asunto: Se te ha asignado un compromiso - Conexia

Hola [ResponsableName],

Como parte de la resolución del reclamo "[ServiceTitle]", se te ha asignado el siguiente compromiso a cumplir:

Tipo: Reembolso total
Plazo: 7 días (vence el 30/01/2026)

Instrucciones:
[Instrucciones del moderador]

Para cumplir con este compromiso:
1. Ingresa a tu panel de Compliances
2. Sube la evidencia del cumplimiento
3. Espera la aprobación del moderador

IMPORTANTE: El incumplimiento de este plazo puede resultar en consecuencias en tu cuenta.

Saludos,
Equipo de Conexia
```

---

## 🔍 Verificar Estado en Base de Datos

### Verificar claim resuelto

```sql
SELECT
  id,
  status,
  resolution_type,
  resolved_by,
  resolved_at,
  closed_at,
  final_outcome
FROM claims
WHERE id = 'abc-123';
```

Esperado:

```
status         | resolved
resolution_type| client_favor
resolved_by    | 80
resolved_at    | 2026-01-23 22:00:00
closed_at      | 2026-01-23 22:00:00
final_outcome  | client_favor
```

### Verificar compliances creados

```sql
SELECT
  id,
  claim_id,
  responsible_user_id,
  compliance_type,
  status,
  deadline,
  original_deadline_days,
  order_number
FROM claim_compliances
WHERE claim_id = 'abc-123'
ORDER BY order_number;
```

Esperado:

```
id             | comp-456
claim_id       | abc-123
responsible_user_id | 99
compliance_type| full_refund
status         | pending
deadline       | 2026-01-30 22:00:00
original_deadline_days | 7
order_number   | 0
```

---

## 🚀 Próximos Tests a Implementar

Una vez validado que la resolución con compliances funciona, probar:

1. **Usuario sube evidencia**

   ```http
   POST /api/compliances/comp-456/submit
   ```

2. **Moderador revisa y aprueba**

   ```http
   POST /api/compliances/comp-456/review
   ```

3. **Sistema de consecuencias (cron)**
   - Esperar a que venza el deadline
   - Verificar que status cambia a `overdue`
   - Verificar que se envía email de advertencia

---

## 🐛 Troubleshooting

### Error: "CreateComplianceUseCase is not defined"

**Solución**: Verificar que el use case esté en providers del módulo:

```typescript
// service-hirings.module.ts
providers: [
  // ...
  CreateComplianceUseCase,
];
```

### Error: "complianceType is not valid"

**Solución**: Verificar que el tipo exista en el enum:

```typescript
export enum ComplianceType {
  FULL_REFUND = 'full_refund',
  PARTIAL_REFUND = 'partial_refund',
  PAYMENT_REQUIRED = 'payment_required',
  WORK_COMPLETION = 'work_completion',
  WORK_REVISION = 'work_revision',
  APOLOGY_REQUIRED = 'apology_required',
  SERVICE_DISCOUNT = 'service_discount',
  PENALTY_FEE = 'penalty_fee',
  ACCOUNT_RESTRICTION = 'account_restriction',
  CONFIRMATION_ONLY = 'confirmation_only',
  OTHER = 'other',
}
```

### Compliances no se crean pero no hay error

**Debugging**:

1. Ver logs del contenedor services:
   ```bash
   docker compose logs -f services
   ```
2. Buscar línea:
   ```
   [CreateComplianceUseCase] Compliance creado: comp-XXX para usuario YYY
   ```
3. Si no aparece, verificar que el loop se ejecute correctamente

### Emails no se envían

**Nota**: El método `sendComplianceCreatedEmail` está declarado como abstract en `EmailService`.
Necesitás implementarlo en tu servicio concreto de emails (ej: `SendGridEmailService` o el que uses).

---

## ✅ Checklist de Testing Completo

- [ ] Escenario 1: Resolución con 1 compliance
- [ ] Escenario 2: Resolución con 2 compliances secuenciales
- [ ] Escenario 3: Rechazo sin compliances
- [ ] Escenario 4: Compliance para cliente (payment_required)
- [ ] Escenario 5: Límite máximo de 5 compliances
- [ ] Error: Usuario inválido (no es parte del claim)
- [ ] Error: Compliances en claim rechazado
- [ ] Error: Exceder 5 compliances
- [ ] Error: Instrucciones muy cortas
- [ ] Error: Deadline fuera de rango (< 1 o > 90)
- [ ] Verificar registros en DB (claims y compliances)
- [ ] Verificar emails enviados (si implementado)
- [ ] Verificar logs del servidor

---

## 📝 Notas Finales

- Los IDs de ejemplo (`abc-123`, `99`, `87`) deben reemplazarse por IDs reales de tu DB
- Los tokens de autenticación expiran, refrescar si es necesario
- Para producción, implementar el método `sendComplianceCreatedEmail` en tu servicio de emails
- Los plazos se calculan desde el momento de creación (no desde medianoche)

¡Buena suerte con las pruebas! 🚀
