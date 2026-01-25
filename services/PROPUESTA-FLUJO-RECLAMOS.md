# 📋 Propuesta: Flujo Post-Resolución de Reclamos

## 🎯 Situación Actual

Cuando un moderador resuelve un reclamo:

- **Cliente favor**: El servicio se cancela (`cancelled_by_claim`) - No hay pago
- **Proveedor favor**: El servicio se completa (`completed_by_claim`) - Proveedor recibe pago completo
- **Acuerdo parcial**: El servicio se completa con acuerdo (`completed_with_agreement`)

**Problema**: Después de resolver, solo cambia el estado. No hay seguimiento ni verificación de que las partes cumplan con la resolución.

---

## 💡 Propuestas de Mejora

### **Opción 1: Sistema de Cumplimiento de Resolución (RECOMENDADA)**

#### Flujo Propuesto:

1. **Moderador resuelve el reclamo** → Nuevo estado: `PENDING_COMPLIANCE` (Pendiente de cumplimiento)

2. **Se crea automáticamente una "Tarea de Cumplimiento" (`claim_compliance`)** con:
   - Tipo de acción requerida (según resolución)
   - Usuario responsable
   - Plazo para cumplir (configurable, ej: 3-7 días)
   - Estado: `pending`

3. **Tipos de cumplimiento según resolución:**

   **A favor del Cliente (`client_favor`):**
   - **Reembolso automático**: Si el pago ya se hizo → Conexia procesa reembolso
   - **No requiere acción**: Si no hubo pago → Cierra automáticamente

   **A favor del Proveedor (`provider_favor`):**
   - **Proveedor debe subir**:
     - Comprobante de entrega final
     - Screenshots/evidencia de trabajo
   - **Cliente confirma** que recibió lo prometido

   **Acuerdo Parcial (`partial_agreement`):**
   - **Según lo acordado** (puede ser combinación):
     - Proveedor: Entrega corregida/adicional
     - Cliente: Pago parcial
     - Ambos: Suben evidencias

4. **Usuario sube evidencias** → Estado: `IN_REVIEW_COMPLIANCE`

5. **Moderador verifica cumplimiento**:
   - ✅ **Aprueba** → Estado: `COMPLIANCE_APPROVED` → Cierra el reclamo como `RESOLVED_AND_COMPLIED`
   - ❌ **Rechaza** → Estado: `COMPLIANCE_REJECTED` → Vuelve a `PENDING_COMPLIANCE` (con observaciones)

6. **Si pasa el plazo sin cumplir**:
   - Sistema marca automáticamente como `COMPLIANCE_OVERDUE`
   - **Opciones**:
     - **Suspensión temporal** (3-7 días) con notificación
     - Si no cumple tras suspensión → **Ban permanente**
     - Moderador puede extender plazo manualmente si hay justificación

#### Ventajas:

✅ Seguimiento completo del cumplimiento
✅ Evidencias documentadas
✅ Sistema de consecuencias automático
✅ Moderador tiene control final
✅ Historial completo para futuros reclamos

#### Desventajas:

⚠️ Más complejo de implementar
⚠️ Requiere tabla adicional + lógica de plazos

---

### **Opción 2: Sistema Simplificado de Evidencias**

#### Flujo Propuesto:

1. **Moderador resuelve** → Reclamo pasa a `RESOLVED_PENDING_EVIDENCE`

2. **Se envía notificación automática** al usuario responsable:
   - "Debes subir evidencia en 5 días"
   - Link directo para subir archivos

3. **Usuario sube evidencias** en el mismo reclamo:
   - Nuevos campos: `compliance_attachments[]`, `compliance_notes`
   - Notifica al moderador automáticamente

4. **Moderador revisa y cierra definitivamente** o reabre el reclamo

5. **Si no sube en 5 días**:
   - Suspensión automática de 3 días
   - Email de advertencia: "Últimas 24h para cumplir"
   - Si no cumple → Ban

#### Ventajas:

✅ Más simple de implementar
✅ Reutiliza la tabla `claims`
✅ Menos cambios en la BD

#### Desventajas:

⚠️ Menos flexible para casos complejos
⚠️ No permite seguimiento granular de cada tipo de cumplimiento

---

### **Opción 3: Flujo Mixto con Reembolsos Automáticos**

Similar a Opción 1, pero con **automatización de reembolsos**:

1. **A favor del cliente** → Sistema verifica si hay pago:
   - **Si hay pago APPROVED** → Inicia reembolso automático (marca Payment como `REFUNDED`)
   - **Si hay pago PENDING** → Cancela la orden de MercadoPago
   - **Si no hay pago** → Cierra directamente

2. **Reembolso procesado** → Notificación al cliente
   - No requiere acción del usuario
   - Moderador solo confirma (auditoría)

3. **Para otros casos** → Flujo similar a Opción 1

#### Ventajas:

✅ Reembolsos rápidos y automáticos
✅ Menos fricción para el cliente
✅ Reduce carga de moderadores

#### Desventajas:

⚠️ Requiere integración con API de MercadoPago para reembolsos
⚠️ Complejidad en manejo de errores de reembolso

---

## 🎯 Recomendación Final: **Opción 1 + Reembolsos Automáticos**

Combinar lo mejor de ambos mundos:

### Estructura de Datos:

```typescript
// Nueva tabla: claim_compliances
{
  id: UUID
  claimId: UUID
  responsibleUserId: number
  responsibleRole: 'client' | 'provider'
  complianceType: 'refund' | 'evidence_upload' | 'redelivery' | 'partial_payment'
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'overdue'
  dueDate: Date
  attachments: string[] // URLs
  notes: string
  reviewedBy: number | null
  reviewedAt: Date | null
  reviewNotes: string | null
  createdAt: Date
  updatedAt: Date
}
```

### Campos nuevos en `claims`:

```typescript
{
  complianceStatus: 'not_required' | 'pending' | 'completed' | 'failed';
  complianceDueDate: Date | null;
}
```

### Campos nuevos en `payments`:

```typescript
{
  refundRequestedAt: Date | null;
  refundProcessedAt: Date | null;
  refundFailureReason: string | null;
}
```

---

## 📊 Flujo Visual Propuesto

```
RECLAMO CREADO
     ↓
MODERADOR RESUELVE
     ↓
¿Tipo de resolución?
     ↓
┌────────────┬──────────────┬────────────────┐
│ Cliente    │ Proveedor    │ Acuerdo Parcial│
│ Favor      │ Favor        │                │
└────┬───────┴──────┬───────┴────────┬───────┘
     │              │                │
     ↓              ↓                ↓
¿Hay pago?    Proveedor sube      Según acuerdo
     │        evidencias              │
     ├─Sí→ Reembolso automático      │
     │         ↓                      ↓
     └─No→ Cierra  Moderador verifica
                    ↓
              ✅ Aprueba / ❌ Rechaza
                    ↓
          Cierra o Reabre reclamo
                    ↓
          ⏰ Si pasa plazo → Suspensión → Ban
```

---

## 🛠️ Implementación por Fases

### **Fase 1: Base (1-2 días)**

- ✅ Crear tabla `claim_compliances`
- ✅ Migración para nuevos campos
- ✅ Crear DTOs y entidades
- ✅ Endpoints CRUD básico

### **Fase 2: Lógica de Negocio (2-3 días)**

- ✅ Crear compliance automáticamente al resolver
- ✅ Sistema de plazos y notificaciones
- ✅ Upload de evidencias
- ✅ Revisión por moderador

### **Fase 3: Reembolsos (2 días)**

- ✅ Integración con MercadoPago Refunds API
- ✅ Procesamiento automático
- ✅ Manejo de errores y reintentos

### **Fase 4: Suspensiones/Bans (1 día)**

- ✅ Cron job para verificar plazos vencidos
- ✅ Integración con microservicio Users
- ✅ Sistema de advertencias escalonadas

### **Fase 5: Dashboard Moderador (1 día)**

- ✅ Vista de compliances pendientes
- ✅ Filtros y búsqueda
- ✅ Botón de extensión de plazo

**Total estimado: 7-9 días de desarrollo**

---

## ⚠️ Consideraciones de Seguridad y Negocio

1. **Reembolsos**:
   - Solo procesar si el pago está `APPROVED`
   - Guardar logs de todos los intentos
   - Alertar a admins si falla reembolso

2. **Suspensiones**:
   - Avisar 24h antes del ban
   - Permitir apelación
   - Registro en tabla de auditoría

3. **Evidencias**:
   - Límite de tamaño (5MB por archivo)
   - Validar tipos de archivo (PDF, PNG, JPG)
   - Escanear con antivirus (opcional)

4. **Plazos configurables**:
   - Por tipo de resolución
   - Extensiones manuales por moderador
   - Considerar feriados/fines de semana

---

## 🔄 Alternativa Ultra-Simplificada (Si hay poco tiempo)

Si necesitas algo **rápido** (1-2 días):

1. Agregar solo estos campos a `claims`:

   ```typescript
   complianceAttachments: string[]
   complianceNotes: string
   complianceUploadedAt: Date
   complianceReviewedAt: Date
   ```

2. Email automático al resolver: "Sube evidencia aquí"

3. Cron diario: Verificar claims sin evidencia tras 5 días → Suspender

4. Moderador revisa evidencias en dashboard existente

**Ventajas**: Rápido, funcional
**Desventajas**: Menos robusto, difícil de escalar

---

## ❓ Preguntas para Definir

1. ¿Conexia maneja los pagos o solo es intermediario?
2. ¿Ya tienen integración con MercadoPago Refunds API?
3. ¿Quién debe pagar comisiones en reembolsos?
4. ¿Cuánto tiempo máximo para cumplir con resolución?
5. ¿Qué pasa si el usuario ya fue baneado por otro motivo?
6. ¿Moderadores deben poder revocar bans de no-cumplimiento?

---

## 📝 Conclusión

**Recomiendo la Opción 1 + Reembolsos Automáticos** porque:

✅ Escalable y mantenible
✅ Cubre todos los casos de uso
✅ Experiencia clara para usuarios
✅ Control completo para moderadores
✅ Trazabilidad y auditoría completa
✅ Se integra bien con la arquitectura existente de Conexia

¿Qué te parece? ¿Quieres que implemente esta solución?
