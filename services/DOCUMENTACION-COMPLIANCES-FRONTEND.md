# 📘 Documentación Completa - Sistema de Compliances para Frontend

## 📋 Índice

1. [Resumen General](#resumen-general)
2. [Endpoints Disponibles](#endpoints-disponibles)
3. [Estructuras de Datos](#estructuras-de-datos)
4. [Flujos de Usuario](#flujos-de-usuario)
5. [Ejemplos de Implementación](#ejemplos-de-implementación)
6. [Manejo de Errores](#manejo-de-errores)

---

## 🎯 Resumen General

El sistema de **Compliances** (compromisos) permite que cuando se resuelva un reclamo, el moderador pueda asignar tareas/compromisos a las partes involucradas. Estas tareas tienen plazos, requieren evidencia, y deben ser revisadas y aprobadas.

### Conceptos Clave

- **Compliance**: Un compromiso asignado a un usuario (cliente o proveedor)
- **responsibleUserId**: El usuario que debe cumplir con el compliance
- **Tipos de Compliance**: work_completion, work_revision, payment_required, apology_required, etc.
- **Estados**: pending → submitted → approved/rejected
- **Deadline**: Fecha límite para cumplir el compliance

---

## 🔌 Endpoints Disponibles

### 1. Obtener Claims con Compliances

#### `GET /api/claims/my-claims`

Obtiene los reclamos del usuario autenticado. **Ahora incluye el campo `compliance`** con el primer compliance activo.

**Parámetros de Query:**

```typescript
{
  page?: number;           // Default: 1
  limit?: number;          // Default: 12
  role?: 'claimant' | 'respondent' | 'all';  // Default: 'all'
  sortBy?: 'createdAt' | 'updatedAt';        // Default: 'createdAt'
  sortOrder?: 'asc' | 'desc';                // Default: 'desc'
}
```

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "claims": [
      {
        "id": "uuid",
        "hiringId": 44,
        "claimType": "not_delivered",
        "status": "resolved",
        "userRole": "claimant",
        "otherUser": {
          "id": 99,
          "name": "Jimena Pérez",
          "profilePicture": "image.jpg"
        },
        "relatedService": {
          "id": 31,
          "title": "Automatización de tareas con Python",
          "hiringId": 44
        },
        "createdAt": "2025-11-18T15:28:06.179Z",
        "updatedAt": "2026-01-24T14:14:37.920Z",

        // ✅ NUEVO CAMPO
        "compliance": {
          "id": "compliance-uuid",
          "type": "work_completion",
          "status": "pending",
          "deadline": "2026-02-10T00:00:00.000Z",
          "daysRemaining": 17
        },

        "availableActions": [
          "view_detail",
          "create_review",
          "upload_compliance" // ✅ NUEVO: Si es el responsable
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "itemsPerPage": 12,
      "totalItems": 14,
      "totalPages": 2
    }
  }
}
```

---

#### `GET /api/claims`

Obtiene todos los reclamos (vista de administrador/moderador). **Ahora incluye el campo `compliance`**.

**Parámetros de Query:**

```typescript
{
  page?: number;
  limit?: number;
  status?: string;
  claimType?: string;
  moderatorId?: number;
}
```

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "claims": [
      {
        "claim": {
          "id": "uuid",
          "hiringId": 44,
          "claimType": "not_delivered",
          "status": "resolved",
          "resolution": "Jimena vas a tener que entregar el trabajo...",
          "resolutionType": "client_favor"
        },
        "claimant": {
          "profile": {
            "id": 87,
            "name": "Alex Elber Arturo",
            "lastName": "Paredes"
          }
        },
        "otherUser": {
          "profile": {
            "id": 99,
            "name": "Jimena",
            "lastName": "Pérez"
          }
        },

        // ✅ NUEVO CAMPO
        "compliance": {
          "id": "compliance-uuid",
          "status": "pending",
          "deadline": "2026-02-10T00:00:00.000Z",
          "responsibleUserId": "99"
        },

        "availableActions": [
          "view_detail",
          "review_compliance"  // ✅ NUEVO: Si está submitted y eres moderador
        ]
      }
    ],
    "pagination": { ... }
  }
}
```

---

#### `GET /api/claims/:id/detail`

Obtiene el detalle completo de un claim. **Ahora incluye el array `compliances`**.

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "claim": {
      "id": "uuid",
      "claimType": "not_delivered",
      "status": "resolved",
      "description": "No se entregó el trabajo...",
      "resolution": "Jimena vas a tener que entregar el trabajo..."
    },
    "claimant": { ... },
    "otherUser": { ... },
    "hiring": { ... },

    // ✅ NUEVO ARRAY
    "compliances": [
      {
        "id": "compliance-uuid-1",
        "responsibleUserId": "99",
        "complianceType": "work_completion",
        "status": "pending",
        "deadline": "2026-02-10T00:00:00.000Z",
        "moderatorInstructions": "Debes completar el trabajo pendiente en 15 días",
        "originalDeadlineDays": 15,
        "evidenceUrls": null,
        "userNotes": null,
        "submittedAt": null,
        "reviewedBy": null,
        "reviewedAt": null,
        "moderatorNotes": null,
        "rejectionReason": null,
        "rejectionCount": 0,
        "createdAt": "2026-01-24T17:14:37.919Z"
      }
    ]
  }
}
```

---

### 2. Endpoints de Compliances

#### `GET /api/compliances`

Obtiene la lista de compliances con filtros.

**Parámetros de Query:**

```typescript
{
  claimId?: string;        // Filtrar por claim específico
  userId?: string;         // Filtrar por usuario responsable
  status?: string;         // Filtrar por estado (pending, submitted, approved, rejected)
  onlyOverdue?: boolean;   // Solo compliances vencidos
  page?: number;
  limit?: number;
}
```

**Respuesta Exitosa (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "claimId": "claim-uuid",
      "responsibleUserId": "99",
      "complianceType": "work_completion",
      "status": "pending",
      "deadline": "2026-02-10T00:00:00.000Z",
      "moderatorInstructions": "Debes completar el trabajo pendiente",
      "evidenceUrls": null,
      "userNotes": null,
      "submittedAt": null,
      "reviewedBy": null,
      "reviewedAt": null,
      "isOverdue": false,
      "createdAt": "2026-01-24T17:14:37.919Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

#### `GET /api/compliances/:id`

Obtiene el detalle de un compliance específico.

**Respuesta Exitosa (200):**

```json
{
  "id": "uuid",
  "claimId": "claim-uuid",
  "responsibleUserId": "99",
  "complianceType": "work_completion",
  "status": "pending",
  "deadline": "2026-02-10T00:00:00.000Z",
  "moderatorInstructions": "Debes completar el trabajo pendiente en 15 días",
  "originalDeadlineDays": 15,
  "evidenceUrls": null,
  "userNotes": null,
  "submittedAt": null,
  "peerReviewedBy": null,
  "peerApproved": null,
  "reviewedBy": null,
  "reviewedAt": null,
  "moderatorNotes": null,
  "rejectionReason": null,
  "rejectionCount": 0,
  "isOverdue": false,
  "createdAt": "2026-01-24T17:14:37.919Z",
  "updatedAt": "2026-01-24T17:14:37.919Z"
}
```

---

#### `POST /api/compliances/:id/submit`

El usuario responsable envía evidencia de cumplimiento.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (FormData):**

```typescript
{
  userNotes?: string;           // Notas del usuario (opcional)
  files?: File[];               // Archivos de evidencia (max 10, 10MB cada uno)
}
```

**Tipos de archivos permitidos:**

- image/jpeg, image/png, image/jpg
- application/pdf
- application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

**Ejemplo con Fetch API:**

```javascript
const formData = new FormData();
formData.append(
  'userNotes',
  'Aquí está el trabajo completado según lo solicitado',
);
formData.append('files', file1);
formData.append('files', file2);

const response = await fetch(`/api/compliances/${complianceId}/submit`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

**Respuesta Exitosa (200):**

```json
{
  "id": "uuid",
  "status": "submitted",
  "evidenceUrls": [
    "/uploads/compliances/1737749232123-123456789.pdf",
    "/uploads/compliances/1737749232125-987654321.png"
  ],
  "userNotes": "Aquí está el trabajo completado según lo solicitado",
  "submittedAt": "2026-01-24T20:13:52.000Z"
}
```

**Errores Posibles:**

- `404`: Compliance no encontrado
- `403`: No tienes permiso (no eres el responsable)
- `400`: Ya fue aprobado/rechazado
- `400`: Requiere archivos adjuntos

---

#### `POST /api/compliances/:id/review`

El moderador revisa y aprueba/rechaza el compliance.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```typescript
{
  decision: 'approve' | 'reject' | 'adjust';  // REQUERIDO
  moderatorNotes?: string;                     // Comentarios del moderador
  rejectionReason?: string;                    // Requerido si decision = 'reject'
  adjustmentInstructions?: string;             // Requerido si decision = 'adjust'
}
```

**Ejemplo de Request:**

```javascript
// Aprobar
await fetch(`/api/compliances/${complianceId}/review`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    decision: 'approve',
    moderatorNotes: 'Excelente trabajo, cumple con lo solicitado',
  }),
});

// Rechazar
await fetch(`/api/compliances/${complianceId}/review`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    decision: 'reject',
    rejectionReason: 'No cumple con los requisitos mínimos solicitados',
    moderatorNotes: 'Debes enviar evidencia de mejor calidad',
  }),
});
```

**Respuesta Exitosa (200):**

```json
{
  "id": "uuid",
  "status": "approved", // o "rejected" o "requires_adjustment"
  "reviewedBy": "moderator-id",
  "reviewedAt": "2026-01-24T20:30:00.000Z",
  "moderatorNotes": "Excelente trabajo",
  "rejectionReason": null,
  "rejectionCount": 0
}
```

**Errores Posibles:**

- `404`: Compliance no encontrado
- `403`: No tienes permisos de moderador
- `400`: El compliance no está en un estado revisable

---

### 3. Endpoint de Peer Review (Opcional)

#### `POST /api/compliances/:id/peer-review`

La contraparte (el otro usuario del claim) puede revisar el compliance antes que el moderador.

**Body:**

```typescript
{
  approved: boolean;    // true = aprueba, false = objeta
  objection?: string;   // Requerido si approved = false
}
```

---

## 📊 Estructuras de Datos

### ComplianceType (Tipos de Compliance)

```typescript
enum ComplianceType {
  FULL_REFUND = 'full_refund', // Reembolso Total
  PARTIAL_REFUND = 'partial_refund', // Reembolso Parcial
  FULL_REDELIVERY = 'full_redelivery', // Reentrega Completa
  CORRECTED_DELIVERY = 'corrected_delivery', // Entrega Corregida
  ADDITIONAL_DELIVERY = 'additional_delivery', // Entrega Adicional
  PAYMENT_REQUIRED = 'payment_required', // Pago Requerido
  PARTIAL_PAYMENT = 'partial_payment', // Pago Parcial
  EVIDENCE_UPLOAD = 'evidence_upload', // Subida de Evidencia
  CONFIRMATION_ONLY = 'confirmation_only', // Solo Confirmación
  AUTO_REFUND = 'auto_refund', // Reembolso Automático
  NO_ACTION_REQUIRED = 'no_action_required', // Sin Acción Requerida
  WORK_COMPLETION = 'work_completion', // Completar Trabajo
  WORK_REVISION = 'work_revision', // Revisión de Trabajo
  APOLOGY_REQUIRED = 'apology_required', // Disculpa Requerida
  SERVICE_DISCOUNT = 'service_discount', // Descuento en Servicio
  PENALTY_FEE = 'penalty_fee', // Tarifa de Penalización
  ACCOUNT_RESTRICTION = 'account_restriction', // Restricción de Cuenta
  OTHER = 'other', // Otro
}
```

### ComplianceStatus (Estados)

```typescript
enum ComplianceStatus {
  PENDING = 'pending', // Pendiente de envío
  SUBMITTED = 'submitted', // Enviado, esperando revisión
  PEER_APPROVED = 'peer_approved', // Aprobado por contraparte
  PEER_OBJECTED = 'peer_objected', // Objetado por contraparte
  IN_REVIEW = 'in_review', // En revisión por moderador
  REQUIRES_ADJUSTMENT = 'requires_adjustment', // Requiere ajustes
  APPROVED = 'approved', // Aprobado por moderador
  REJECTED = 'rejected', // Rechazado
  OVERDUE = 'overdue', // Vencido
  WARNING = 'warning', // Advertencia (cerca de vencerse)
  ESCALATED = 'escalated', // Escalado por incumplimiento
}
```

### Compliance Object

```typescript
interface Compliance {
  id: string;
  claimId: string;
  responsibleUserId: string;
  complianceType: ComplianceType;
  status: ComplianceStatus;
  deadline: Date;
  extendedDeadline?: Date | null;
  finalDeadline?: Date | null;
  originalDeadlineDays: number;
  moderatorInstructions: string;
  evidenceUrls?: string[] | null;
  userNotes?: string | null;
  submittedAt?: Date | null;

  // Peer review
  peerReviewedBy?: string | null;
  peerApproved?: boolean | null;
  peerObjection?: string | null;
  peerReviewedAt?: Date | null;

  // Moderator review
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  moderatorNotes?: string | null;
  rejectionReason?: string | null;
  rejectionCount: number;

  // Metadata
  warningLevel: number;
  appealed: boolean;
  dependsOn?: string | null;
  orderNumber: number;
  requirement: 'sequential' | 'parallel';
  amount?: number | null;
  currency?: string | null;
  paymentLink?: string | null;
  autoApproved: boolean;
  requiresFiles: boolean;

  // Computed
  isOverdue: boolean;

  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔄 Flujos de Usuario

### Flujo 1: Usuario Recibe Compliance

1. **Claim es resuelto** → El moderador asigna compliances
2. **Usuario recibe email** con los compromisos asignados
3. **Usuario ve sus claims** → En `GET /api/claims/my-claims` ve el campo `compliance` con:
   - `status: "pending"`
   - `deadline: "2026-02-10"`
   - `daysRemaining: 17`
4. **Usuario ve acciones disponibles** → `availableActions` incluye `"upload_compliance"`

### Flujo 2: Usuario Sube Evidencia

1. **Usuario hace clic en "Subir Evidencia"**
2. **Frontend muestra modal** con:
   - Instrucciones del moderador
   - Campo de texto para notas
   - Zona de drag & drop para archivos
3. **Usuario completa el formulario** y hace submit
4. **Frontend envía `POST /api/compliances/:id/submit`** con `FormData`
5. **Backend guarda archivos** y actualiza estado a `submitted`
6. **Usuario recibe confirmación** → Compliance pasa a `status: "submitted"`
7. **Moderador recibe email** notificándole que hay evidencia para revisar

### Flujo 3: Moderador Revisa Compliance

1. **Moderador ve lista de claims** → `GET /api/claims`
2. **Ve campo `compliance`** con `status: "submitted"`
3. **Ve acciones disponibles** → `availableActions` incluye `"review_compliance"`
4. **Moderador hace clic en "Revisar Compliance"**
5. **Frontend muestra modal** con:
   - Evidencia enviada (archivos + notas del usuario)
   - Opciones: Aprobar / Rechazar / Solicitar Ajustes
   - Campo para comentarios del moderador
6. **Moderador toma decisión** y hace submit
7. **Frontend envía `POST /api/compliances/:id/review`**
8. **Usuario recibe email** con el resultado (aprobado/rechazado)

---

## 💻 Ejemplos de Implementación

### Ejemplo 1: Mostrar Badge de Compliance en Tabla

```jsx
import React from 'react';

const ComplianceStatusBadge = ({ compliance }) => {
  if (!compliance) return null;

  const statusConfig = {
    pending: {
      color: 'bg-yellow-100 text-yellow-800',
      icon: '⏳',
      text: 'Pendiente',
    },
    submitted: {
      color: 'bg-blue-100 text-blue-800',
      icon: '📤',
      text: 'Enviado',
    },
    approved: {
      color: 'bg-green-100 text-green-800',
      icon: '✅',
      text: 'Aprobado',
    },
    rejected: {
      color: 'bg-red-100 text-red-800',
      icon: '❌',
      text: 'Rechazado',
    },
    overdue: {
      color: 'bg-red-100 text-red-800',
      icon: '⚠️',
      text: 'Vencido',
    },
  };

  const config = statusConfig[compliance.status] || statusConfig.pending;

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.icon} {config.text}
    </span>
  );
};

// Uso en tabla
<td>
  <ComplianceStatusBadge compliance={claim.compliance} />
</td>;
```

### Ejemplo 2: Modal para Subir Evidencia

```jsx
import React, { useState } from 'react';

const UploadComplianceEvidenceModal = ({ compliance, onClose, onSuccess }) => {
  const [userNotes, setUserNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('userNotes', userNotes);
    files.forEach((file) => formData.append('files', file));

    try {
      const response = await fetch(`/api/compliances/${compliance.id}/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      onSuccess(result);
      onClose();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>📤 Enviar Evidencia de Cumplimiento</h2>

        <div className="instructions-box">
          <h3>Instrucciones del moderador:</h3>
          <p>{compliance.moderatorInstructions}</p>
          <p>
            <strong>Plazo:</strong>{' '}
            {new Date(compliance.deadline).toLocaleDateString()}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Notas (opcional)</label>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Explica cómo cumpliste con el compromiso..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Archivos de evidencia</label>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              onChange={(e) => setFiles(Array.from(e.target.files))}
            />
            <small>Max 10 archivos, 10MB cada uno</small>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Evidencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

### Ejemplo 3: Modal para Moderador (Revisar Compliance)

```jsx
import React, { useState } from 'react';

const ReviewComplianceModal = ({ compliance, onClose, onSuccess }) => {
  const [decision, setDecision] = useState('approve');
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/compliances/${compliance.id}/review`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision,
          moderatorNotes,
          rejectionReason: decision === 'reject' ? rejectionReason : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      onSuccess(result);
      onClose();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>🔍 Revisar Compliance</h2>

        <div className="evidence-section">
          <h3>Evidencia del usuario:</h3>
          {compliance.evidenceUrls && compliance.evidenceUrls.length > 0 ? (
            <ul>
              {compliance.evidenceUrls.map((url, index) => (
                <li key={index}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    📎 Archivo {index + 1}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay archivos adjuntos</p>
          )}

          {compliance.userNotes && (
            <div>
              <h4>Notas del usuario:</h4>
              <p>{compliance.userNotes}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Decisión</label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              <option value="approve">✅ Aprobar</option>
              <option value="reject">❌ Rechazar</option>
              <option value="adjust">🔄 Solicitar Ajustes</option>
            </select>
          </div>

          {decision === 'reject' && (
            <div className="form-group">
              <label>Motivo del rechazo *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explica por qué se rechaza..."
                required
                rows={3}
              />
            </div>
          )}

          <div className="form-group">
            <label>Comentarios (opcional)</label>
            <textarea
              value={moderatorNotes}
              onChange={(e) => setModeratorNotes(e.target.value)}
              placeholder="Comentarios adicionales..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Procesando...' : 'Confirmar Decisión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

### Ejemplo 4: Componente de Card de Compliance (en Detalle del Claim)

```jsx
const ComplianceCard = ({ compliance }) => {
  const complianceTypeLabels = {
    work_completion: 'Completar Trabajo',
    work_revision: 'Revisión de Trabajo',
    payment_required: 'Pago Requerido',
    apology_required: 'Disculpa Requerida',
    full_refund: 'Reembolso Total',
    // ... otros tipos
  };

  const deadline = new Date(compliance.deadline);
  const daysRemaining = Math.ceil(
    (deadline - new Date()) / (1000 * 60 * 60 * 24),
  );
  const isOverdue = daysRemaining < 0;

  return (
    <div className="compliance-card">
      <div className="compliance-header">
        <h4>
          {complianceTypeLabels[compliance.complianceType] ||
            compliance.complianceType}
        </h4>
        <ComplianceStatusBadge compliance={compliance} />
      </div>

      <div className="compliance-body">
        <p>
          <strong>Instrucciones:</strong>
        </p>
        <p>{compliance.moderatorInstructions}</p>

        <div className="compliance-deadline">
          <span className={isOverdue ? 'text-red-600' : ''}>
            ⏰ Vence: {deadline.toLocaleDateString()}
            {isOverdue ? ' (VENCIDO)' : ` (${daysRemaining} días restantes)`}
          </span>
        </div>

        {compliance.evidenceUrls && compliance.evidenceUrls.length > 0 && (
          <div className="compliance-evidence">
            <p>
              <strong>Evidencia enviada:</strong>
            </p>
            <ul>
              {compliance.evidenceUrls.map((url, index) => (
                <li key={index}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    📎 Ver archivo {index + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {compliance.userNotes && (
          <div className="compliance-notes">
            <p>
              <strong>Notas del usuario:</strong>
            </p>
            <p>{compliance.userNotes}</p>
          </div>
        )}

        {compliance.moderatorNotes && (
          <div className="moderator-notes">
            <p>
              <strong>Comentarios del moderador:</strong>
            </p>
            <p>{compliance.moderatorNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## ⚠️ Manejo de Errores

### Errores Comunes

```typescript
// 404 - Not Found
{
  "statusCode": 404,
  "message": "Compliance con ID xxx no encontrado"
}

// 403 - Forbidden
{
  "statusCode": 403,
  "message": "No tienes permiso para enviar este cumplimiento"
}

// 400 - Bad Request
{
  "statusCode": 400,
  "message": "Este cumplimiento ya fue aprobado"
}

// 400 - Validation Error
{
  "statusCode": 400,
  "message": [
    "userNotes must be shorter than or equal to 1000 characters",
    "decision must be one of: approve, reject, adjust"
  ]
}
```

### Manejo en Frontend

```javascript
try {
  const response = await fetch(`/api/compliances/${id}/submit`, {
    method: 'POST',
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    // Manejar errores
    if (response.status === 403) {
      alert('No tienes permisos para realizar esta acción');
    } else if (response.status === 404) {
      alert('Compliance no encontrado');
    } else if (response.status === 400) {
      // Errores de validación
      const errors = Array.isArray(data.message)
        ? data.message.join('\n')
        : data.message;
      alert(`Error: ${errors}`);
    } else {
      alert('Error inesperado, intenta nuevamente');
    }
    return;
  }

  // Success
  alert('¡Evidencia enviada correctamente!');
  onSuccess(data);
} catch (error) {
  alert('Error de conexión');
  console.error(error);
}
```

---

## 📧 Emails Enviados

### 1. Compliance Creado

**Enviado a:** Usuario responsable  
**Cuándo:** Al resolver el claim con compliances  
**Contenido:**

- Resolución del claim
- Lista de compromisos asignados
- Plazos y deadlines
- Link para ver compliances

### 2. Compliance Enviado

**Enviado a:** Moderador asignado  
**Cuándo:** El usuario sube evidencia  
**Contenido:**

- Notificación de evidencia nueva
- Link para revisar
- Tipo de compliance

### 3. Compliance Aprobado

**Enviado a:** Usuario responsable  
**Cuándo:** Moderador aprueba  
**Contenido:**

- Confirmación de aprobación
- Comentarios del moderador
- Link al compliance

### 4. Compliance Rechazado

**Enviado a:** Usuario responsable  
**Cuándo:** Moderador rechaza  
**Contenido:**

- Motivo del rechazo
- Instrucciones para reenviar
- Contador de rechazos
- Link para subir nueva evidencia

---

## 🎨 Diseño UI/UX Recomendado

### Colores por Estado

```css
/* Estados de compliance */
.compliance-pending {
  background: #fef3c7;
  color: #92400e;
}
.compliance-submitted {
  background: #dbeafe;
  color: #1e40af;
}
.compliance-approved {
  background: #d1fae5;
  color: #065f46;
}
.compliance-rejected {
  background: #fee2e2;
  color: #991b1b;
}
.compliance-overdue {
  background: #fee2e2;
  color: #991b1b;
  font-weight: bold;
}
```

### Iconos Recomendados

- ⏳ Pending
- 📤 Submitted
- ✅ Approved
- ❌ Rejected
- ⚠️ Overdue
- 🔄 Requires Adjustment
- 📋 Work Completion
- 💰 Payment Required
- 📝 Apology Required

---

## ✅ Checklist de Implementación Frontend

- [ ] Agregar columna "Compromiso" en tabla de claims (`AdminClaimsTable`, `MyClaimsPage`)
- [ ] Mostrar badge de estado de compliance
- [ ] Crear componente `ComplianceStatusBadge`
- [ ] Crear componente `ComplianceCard` para detalle
- [ ] Implementar modal `UploadComplianceEvidenceModal`
- [ ] Implementar modal `ReviewComplianceModal` (solo moderadores)
- [ ] Agregar acción "Subir Evidencia" en claims del usuario
- [ ] Agregar acción "Revisar Compliance" en panel de moderador
- [ ] Mostrar días restantes para cumplir el compliance
- [ ] Destacar compliances vencidos (overdue)
- [ ] Mostrar sección de compliances en detalle del claim
- [ ] Implementar manejo de errores para cada endpoint
- [ ] Agregar validaciones de archivos (tipo, tamaño)
- [ ] Mostrar feedback visual al subir archivos
- [ ] Agregar confirmación antes de aprobar/rechazar
- [ ] Implementar paginación en lista de compliances
- [ ] Agregar filtros por estado de compliance

---

## 🔗 Links Útiles

- Ver `FRONTEND-COMPLIANCES-PLAN.md` para el diseño detallado de componentes
- Ver `FALTANTES-COMPLIANCES.md` para el estado de implementación del backend
- Ver documentación de tipos de compliance en código

---

**Última actualización:** 24 de enero de 2026  
**Versión:** 1.0
