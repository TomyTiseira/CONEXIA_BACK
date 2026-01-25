# 📱 Plan de Implementación Frontend: Visualización y Gestión de Compliances

## 📋 Índice

1. [Visión General](#visión-general)
2. [Datos del Backend](#datos-del-backend)
3. [Modificaciones en Tablas](#modificaciones-en-tablas)
4. [Modal de Detalle Mejorado](#modal-de-detalle-mejorado)
5. [Componentes Nuevos](#componentes-nuevos)
6. [Endpoints a Consumir](#endpoints-a-consumir)
7. [Flujos de Usuario](#flujos-de-usuario)
8. [Diseño y UX](#diseño-y-ux)

---

## 🎯 Visión General

### Objetivos

- ✅ **Tablas**: Mostrar indicador visual cuando claim tiene compliances
- ✅ **Detalle**: Sección dedicada para listar compliances del claim
- ✅ **Acciones**: Permitir subir evidencia de cumplimiento
- ✅ **Estados**: Badge visual del estado de cada compliance
- ✅ **Timeline**: Mostrar progreso del compliance

---

## 📦 Datos del Backend

### 1. Lista de Reclamos (Admin)

**Endpoint**: `GET /api/claims`

**Campo nuevo a usar**: `compliance`

```json
{
  "claim": {
    "id": "abc-123",
    "status": "resolved"
  },
  "compliance": {
    "id": "comp-456",
    "status": "pending",
    "complianceType": "full_refund",
    "deadline": "2026-01-30T22:00:00Z"
  }
}
```

**Nota**: Si `compliance` es `null`, el claim no tiene compliances asignados.

---

### 2. Mis Reclamos (Usuario)

**Endpoint**: `GET /api/claims/my-claims`

**Campo nuevo a usar**: `compliance`

```json
{
  "id": "abc-123",
  "status": "resolved",
  "compliance": {
    "id": "comp-456",
    "status": "pending",
    "responsibleUserId": "99",
    "complianceType": "full_refund"
  }
}
```

---

### 3. Detalle del Reclamo

**Endpoint**: `GET /api/claims/:id/detail`

**Campo nuevo a usar**: `compliances` (array)

```json
{
  "claim": {
    "id": "abc-123",
    "status": "resolved"
  },
  "compliances": [
    {
      "id": "comp-456",
      "claimId": "abc-123",
      "responsibleUserId": "99",
      "complianceType": "full_refund",
      "status": "pending",
      "moderatorInstructions": "Debes devolver el 100% del pago ($500 USD)...",
      "deadline": "2026-01-30T22:00:00Z",
      "originalDeadlineDays": 7,
      "orderNumber": 0,
      "evidenceUrls": [],
      "userNotes": null,
      "submittedAt": null,
      "createdAt": "2026-01-23T22:00:00Z"
    }
  ]
}
```

---

## 📊 Modificaciones en Tablas

### 1. AdminClaimsTable

**Cambio en columna "Estado"**:

Actualmente solo muestra el badge del claim status. Necesitamos agregar:

- Badge del claim status (resolved, rejected, etc.)
- **Nuevo**: Badge de compliance si existe

```jsx
// Antes
<td className="px-6 py-4 whitespace-nowrap">
  <ClaimStatusBadge status={claim.status} />
</td>

// Después
<td className="px-6 py-4 whitespace-nowrap">
  <div className="flex flex-col gap-1">
    <ClaimStatusBadge status={claim.status} />
    {claimData.compliance && (
      <ComplianceStatusBadge
        status={claimData.compliance.status}
        complianceType={claimData.compliance.complianceType}
      />
    )}
  </div>
</td>
```

**O bien, agregar columna nueva "Compromiso"**:

```jsx
<thead>
  <tr>
    <th>ID</th>
    <th>Tipo</th>
    <th>Reclamante</th>
    <th>Reclamado</th>
    <th>Asignado</th>
    <th>Estado</th>
    <th>Compromiso</th> {/* NUEVO */}
    <th>Acciones</th>
  </tr>
</thead>

<tbody>
  <td className="px-6 py-4 whitespace-nowrap">
    {claimData.compliance ? (
      <ComplianceStatusBadge
        status={claimData.compliance.status}
        complianceType={claimData.compliance.complianceType}
      />
    ) : (
      <span className="text-xs text-gray-400 italic">Sin compromisos</span>
    )}
  </td>
</tbody>
```

---

### 2. MyClaimsPage (Tabla Usuario)

**Mismo enfoque**: Agregar columna o badge adicional

```jsx
<thead>
  <tr>
    <th>ID</th>
    <th>Tipo</th>
    <th>Mi Rol</th>
    <th>Contra</th>
    <th>Estado</th>
    <th>Compromiso</th> {/* NUEVO */}
    <th>Fecha</th>
    <th>Acciones</th>
  </tr>
</thead>

<tbody>
  <td className="px-6 py-4 whitespace-nowrap">
    {claim.compliance ? (
      <div className="flex items-center gap-2">
        <ComplianceStatusBadge status={claim.compliance.status} />
        {claim.compliance.responsibleUserId === user.id && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
            Asignado a ti
          </span>
        )}
      </div>
    ) : (
      <span className="text-xs text-gray-400 italic">N/A</span>
    )}
  </td>
</tbody>
```

---

## 🔍 Modal de Detalle Mejorado

### ClaimDetailModal - Nueva Sección

Después de mostrar la resolución del claim, agregar sección de compliances:

```jsx
{
  /* Sección de Resolución (existente) */
}
{
  claim.resolution && (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h4 className="font-semibold text-blue-900 mb-2">
        Resolución del Moderador
      </h4>
      <p className="text-sm text-blue-800">{claim.resolution}</p>
    </div>
  );
}

{
  /* NUEVA SECCIÓN: Compromisos */
}
{
  compliances && compliances.length > 0 && (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-gray-900">
          Compromisos Asignados ({compliances.length})
        </h4>
        <span className="text-xs text-gray-500">
          {compliances.filter((c) => c.status === 'pending').length} pendientes
        </span>
      </div>

      <div className="space-y-4">
        {compliances.map((compliance, index) => (
          <ComplianceCard
            key={compliance.id}
            compliance={compliance}
            claimData={claimData}
            onUploadEvidence={() => handleOpenUploadModal(compliance)}
            canUpload={canUserUploadEvidence(compliance)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 🧩 Componentes Nuevos

### 1. ComplianceStatusBadge

**Archivo**: `components/claims/ComplianceStatusBadge.jsx`

```jsx
const COMPLIANCE_STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '⏳',
  },
  submitted: {
    label: 'Enviado',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '📤',
  },
  approved: {
    label: 'Aprobado',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: '✅',
  },
  overdue: {
    label: 'Vencido',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: '⚠️',
  },
  warning: {
    label: 'Advertencia',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '⚠️',
  },
  escalated: {
    label: 'Escalado',
    className: 'bg-red-100 text-red-900 border-red-300',
    icon: '🚨',
  },
};

export const ComplianceStatusBadge = ({ status, complianceType }) => {
  const config =
    COMPLIANCE_STATUS_CONFIG[status] || COMPLIANCE_STATUS_CONFIG.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.className}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};
```

---

### 2. ComplianceCard

**Archivo**: `components/claims/ComplianceCard.jsx`

```jsx
import {
  FaUpload,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { ComplianceStatusBadge } from './ComplianceStatusBadge';

export const ComplianceCard = ({
  compliance,
  claimData,
  onUploadEvidence,
  canUpload,
}) => {
  const isResponsible =
    compliance.responsibleUserId === String(claimData.currentUserId);
  const daysRemaining = calculateDaysRemaining(compliance.deadline);
  const isUrgent = daysRemaining <= 2 && compliance.status === 'pending';

  return (
    <div
      className={`border rounded-lg p-4 ${isUrgent ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="font-semibold text-gray-900">
              {getComplianceTypeLabel(compliance.complianceType)}
            </h5>
            <ComplianceStatusBadge status={compliance.status} />
          </div>
          <p className="text-xs text-gray-500">
            ID: {compliance.id.substring(0, 8)}...
          </p>
        </div>

        {isResponsible && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
            Asignado a ti
          </span>
        )}
      </div>

      {/* Deadline */}
      <div
        className={`flex items-center gap-2 mb-3 ${isUrgent ? 'text-red-700' : 'text-gray-600'}`}
      >
        <FaClock size={14} />
        <span className="text-sm font-medium">
          Plazo: {formatDate(compliance.deadline)}
        </span>
        {daysRemaining >= 0 && (
          <span
            className={`text-xs ${isUrgent ? 'text-red-600' : 'text-gray-500'}`}
          >
            ({daysRemaining} {daysRemaining === 1 ? 'día' : 'días'} restantes)
          </span>
        )}
        {daysRemaining < 0 && (
          <span className="text-xs text-red-600 font-semibold">
            (¡Vencido hace {Math.abs(daysRemaining)} días!)
          </span>
        )}
      </div>

      {/* Instrucciones */}
      <div className="bg-gray-50 p-3 rounded-md mb-3">
        <p className="text-xs font-semibold text-gray-700 mb-1">
          Instrucciones del Moderador:
        </p>
        <p className="text-sm text-gray-800">
          {compliance.moderatorInstructions}
        </p>
      </div>

      {/* Evidencia Subida (si existe) */}
      {compliance.evidenceUrls && compliance.evidenceUrls.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Evidencia enviada:
          </p>
          <div className="flex flex-wrap gap-2">
            {compliance.evidenceUrls.map((url, idx) => (
              <a
                key={idx}
                href={`${config.IMAGE_URL}${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Archivo {idx + 1}
              </a>
            ))}
          </div>
          {compliance.userNotes && (
            <p className="text-sm text-gray-600 mt-2 italic">
              "{compliance.userNotes}"
            </p>
          )}
        </div>
      )}

      {/* Botón de Acción */}
      {canUpload && compliance.status === 'pending' && isResponsible && (
        <button
          onClick={onUploadEvidence}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-conexia-green text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FaUpload size={16} />
          <span className="font-medium">Subir Evidencia de Cumplimiento</span>
        </button>
      )}

      {compliance.status === 'submitted' && (
        <div className="flex items-center gap-2 text-blue-600 text-sm">
          <FaCheckCircle />
          <span>Evidencia enviada, esperando revisión del moderador</span>
        </div>
      )}

      {compliance.status === 'approved' && (
        <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
          <FaCheckCircle />
          <span>✅ Compromiso cumplido y aprobado</span>
        </div>
      )}

      {(compliance.status === 'overdue' || compliance.status === 'warning') && (
        <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
          <FaExclamationTriangle />
          <span>⚠️ Compromiso vencido - Contacta al moderador</span>
        </div>
      )}
    </div>
  );
};

// Helper functions
const getComplianceTypeLabel = (type) => {
  const labels = {
    full_refund: 'Reembolso Total',
    partial_refund: 'Reembolso Parcial',
    payment_required: 'Pago Requerido',
    work_completion: 'Completar Trabajo',
    work_revision: 'Revisión de Trabajo',
    apology_required: 'Disculpa Requerida',
    service_discount: 'Descuento en Servicio',
    penalty_fee: 'Tarifa de Penalización',
    account_restriction: 'Restricción de Cuenta',
    confirmation_only: 'Solo Confirmación',
    other: 'Otro',
  };
  return labels[type] || type;
};

const calculateDaysRemaining = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
```

---

### 3. UploadComplianceEvidenceModal

**Archivo**: `components/claims/UploadComplianceEvidenceModal.jsx`

```jsx
import { useState } from 'react';
import { FaTimes, FaUpload, FaTrash } from 'react-icons/fa';
import { uploadComplianceEvidence } from '@/services/api/claims';

export const UploadComplianceEvidenceModal = ({
  compliance,
  claimData,
  onClose,
  onSuccess,
}) => {
  const [files, setFiles] = useState([]);
  const [userResponse, setUserResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (files.length + selectedFiles.length > MAX_FILES) {
      setError(`Máximo ${MAX_FILES} archivos permitidos`);
      return;
    }

    const oversized = selectedFiles.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setError('Algunos archivos exceden el tamaño máximo de 10MB');
      return;
    }

    setFiles([...files, ...selectedFiles]);
    setError(null);
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      setError('Debes subir al menos 1 archivo como evidencia');
      return;
    }

    if (!userResponse.trim()) {
      setError('Debes agregar una explicación del cumplimiento');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('evidence', file);
      });
      formData.append('userResponse', userResponse);

      await uploadComplianceEvidence(compliance.id, formData);

      onSuccess(
        'Evidencia enviada exitosamente. El moderador la revisará pronto.',
      );
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar la evidencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            Subir Evidencia de Cumplimiento
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info del Compliance */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              {getComplianceTypeLabel(compliance.complianceType)}
            </h4>
            <p className="text-sm text-blue-800 mb-2">
              <strong>Instrucciones:</strong> {compliance.moderatorInstructions}
            </p>
            <p className="text-xs text-blue-600">
              <strong>Plazo:</strong> {formatDate(compliance.deadline)}
            </p>
          </div>

          {/* Explicación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Explicación del cumplimiento *
            </label>
            <textarea
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Ej: Realicé el reembolso completo mediante MercadoPago. Adjunto comprobante de la transacción..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-conexia-green"
              rows={4}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 20 caracteres, máximo 1000
            </p>
          </div>

          {/* Archivos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivos de evidencia *
            </label>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="evidence-files"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="evidence-files"
                className="cursor-pointer flex flex-col items-center"
              >
                <FaUpload size={32} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Haz clic para seleccionar archivos
                </p>
                <p className="text-xs text-gray-500">
                  Máximo {MAX_FILES} archivos, 10MB cada uno
                </p>
              </label>
            </div>

            {/* Lista de archivos seleccionados */}
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-gray-700 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-conexia-green text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Evidencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

## 🌐 Endpoints a Consumir

### 1. Listar Compliances de un Claim

```javascript
// Ya viene en el detalle del claim
GET /api/claims/:id/detail

Response:
{
  "claim": {...},
  "compliances": [...]
}
```

---

### 2. Subir Evidencia de Compliance

```javascript
POST /api/compliances/:complianceId/submit
Content-Type: multipart/form-data

Body:
- userResponse: string (20-1000 caracteres)
- evidence: File[] (1-5 archivos, máx 10MB cada uno)

Response:
{
  "success": true,
  "data": {
    "id": "comp-456",
    "status": "submitted",
    "submittedAt": "2026-01-24T10:00:00Z",
    "userNotes": "Realicé el reembolso completo",
    "evidenceUrls": [
      "/uploads/compliances/1737721200000-123456.png"
    ]
  }
}
```

**Implementación en services/api/claims.js**:

```javascript
export const uploadComplianceEvidence = async (complianceId, formData) => {
  const response = await api.post(
    `/compliances/${complianceId}/submit`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data;
};
```

---

### 3. Ver Detalle de un Compliance (Opcional)

```javascript
GET /api/compliances/:complianceId

Response:
{
  "success": true,
  "data": {
    "id": "comp-456",
    "claimId": "abc-123",
    "responsibleUserId": "99",
    "complianceType": "full_refund",
    "status": "pending",
    "moderatorInstructions": "...",
    "deadline": "2026-01-30T22:00:00Z",
    "evidenceUrls": [],
    "userNotes": null,
    "submittedAt": null,
    "createdAt": "2026-01-23T22:00:00Z"
  }
}
```

---

## 👥 Flujos de Usuario

### Flujo 1: Admin ve reclamo resuelto con compliance

1. Admin entra a `/admin/claims`
2. Ve tabla con columna "Compromiso"
3. Reclamos resueltos muestran badge de compliance (ej: "Pendiente", "Cumplido")
4. Admin hace clic en "Ver Detalle"
5. En el modal, ve sección "Compromisos Asignados" con:
   - Tipo de compliance
   - Estado actual
   - Deadline
   - Instrucciones que dio
   - Evidencia subida (si existe)
6. Si hay evidencia `submitted`, puede revisarla y aprobar/rechazar

---

### Flujo 2: Usuario reclamante/reclamado ve su compliance

1. Usuario entra a `/claims/my-claims`
2. Ve tabla con columna "Compromiso"
3. Reclamos con compliance asignado a él muestran badge naranja "Asignado a ti"
4. Usuario hace clic en "Ver Detalle"
5. En el modal, ve sección "Compromisos Asignados"
6. Si el compliance está `pending` y es responsable:
   - Ve botón "Subir Evidencia de Cumplimiento"
   - Hace clic → se abre `UploadComplianceEvidenceModal`
7. Usuario completa:
   - Explicación del cumplimiento (textarea)
   - Sube archivos (1-5, máx 10MB)
8. Usuario hace clic en "Enviar Evidencia"
9. Backend valida y guarda
10. Modal se cierra, se muestra toast de éxito
11. Compliance cambia a estado `submitted`

---

### Flujo 3: Usuario ve compliance ya cumplido

1. Usuario entra a detalle del reclamo
2. Ve compliance con estado "Aprobado" ✅
3. No hay botón de acción (ya está cumplido)
4. Ve mensaje: "✅ Compromiso cumplido y aprobado"

---

### Flujo 4: Usuario ve compliance vencido

1. Usuario entra a detalle del reclamo
2. Ve compliance con estado "Vencido" ⚠️
3. Card tiene fondo rojo claro
4. Ve mensaje: "⚠️ Compromiso vencido - Contacta al moderador"
5. Puede subir evidencia tardía (si backend lo permite)

---

## 🎨 Diseño y UX

### Paleta de Colores para Estados

```javascript
const COMPLIANCE_COLORS = {
  pending: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    badge: 'bg-yellow-100',
  },
  submitted: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    badge: 'bg-blue-100',
  },
  approved: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    badge: 'bg-green-100',
  },
  overdue: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-800',
    badge: 'bg-red-100',
  },
};
```

---

### Iconografía

- ⏳ **Pendiente**: Reloj
- 📤 **Enviado**: Flecha hacia arriba
- ✅ **Aprobado**: Check verde
- ⚠️ **Vencido**: Triángulo de advertencia
- 🚨 **Escalado**: Sirena

---

### Responsive

**Desktop**:

- Tabla completa con columna de compliance
- Modal de detalle ancho (max-w-4xl)
- Cards de compliance lado a lado (si hay múltiples)

**Mobile**:

- Cards apiladas
- Badge de compliance debajo del estado del claim
- Modal de detalle ocupa pantalla completa
- Botón de "Subir Evidencia" sticky en bottom

---

## 📝 Checklist de Implementación

### Fase 1: Visualización Básica

- [ ] Crear `ComplianceStatusBadge.jsx`
- [ ] Modificar `AdminClaimsTable` para mostrar compliance
- [ ] Modificar `MyClaimsPage` tabla para mostrar compliance
- [ ] Probar con datos mock

### Fase 2: Detalle del Compliance

- [ ] Crear `ComplianceCard.jsx`
- [ ] Modificar `ClaimDetailModal` para mostrar sección de compliances
- [ ] Agregar lógica de permisos (canUserUploadEvidence)
- [ ] Probar con datos reales del backend

### Fase 3: Subir Evidencia

- [ ] Crear `UploadComplianceEvidenceModal.jsx`
- [ ] Implementar `uploadComplianceEvidence` en api service
- [ ] Conectar modal con flujo de detalle
- [ ] Validaciones de archivos (tamaño, cantidad, tipo)
- [ ] Toast de éxito/error

### Fase 4: Pulido y Testing

- [ ] Responsive design (mobile + desktop)
- [ ] Loading states
- [ ] Error handling
- [ ] Edge cases (sin compliances, multiple compliances, etc.)
- [ ] Testing E2E con usuario real

---

## 🚀 Notas Finales

### Prioridades

1. **Alta**: ComplianceStatusBadge + visualización en tablas
2. **Alta**: ComplianceCard + sección en detalle
3. **Media**: UploadComplianceEvidenceModal
4. **Baja**: Animaciones y transiciones

### Performance

- Lazy load de modales (React.lazy + Suspense)
- Debounce en búsquedas de compliance
- Optimistic UI updates al subir evidencia

### Accesibilidad

- ARIA labels en botones de acción
- Focus trap en modales
- Keyboard navigation (ESC para cerrar)

---

**¿Alguna duda sobre la implementación?** 🚀
