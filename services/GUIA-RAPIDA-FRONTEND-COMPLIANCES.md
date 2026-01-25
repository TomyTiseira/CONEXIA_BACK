# 🎯 Guía Rápida para Implementar Compliances en el Frontend

## 📝 Resumen Ejecutivo

El backend está **100% listo** para manejar compliances. Esta guía te dice exactamente qué cambios hacer en el frontend para que funcione todo.

---

## 🔍 Cambios Mínimos Requeridos

### 1. Agregar Columna "Compromiso" en Tablas de Claims

**Archivos a modificar:**

- `AdminClaimsTable.jsx` (o componente similar)
- `MyClaimsPage.jsx` (o componente similar)

**Agregar en el `<thead>`:**

```jsx
<th>Estado</th>
<th>Compromiso</th> {/* ← NUEVA COLUMNA */}
<th>Acciones</th>
```

**Agregar en el `<tbody>`:**

```jsx
<td>
  {claim.compliance ? (
    <ComplianceStatusBadge compliance={claim.compliance} />
  ) : (
    <span className="text-gray-400">Sin compromiso</span>
  )}
</td>
```

---

### 2. Crear Componente de Badge

**Archivo nuevo:** `components/ComplianceStatusBadge.jsx`

```jsx
import React from 'react';

const ComplianceStatusBadge = ({ compliance }) => {
  if (!compliance) return null;

  const statusConfig = {
    pending: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: '⏳',
      text: 'Pendiente',
    },
    submitted: {
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: '📤',
      text: 'Enviado',
    },
    approved: {
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: '✅',
      text: 'Aprobado',
    },
    rejected: {
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: '❌',
      text: 'Rechazado',
    },
    overdue: {
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: '⚠️',
      text: 'Vencido',
    },
  };

  const config = statusConfig[compliance.status] || statusConfig.pending;

  // Calcular días restantes si está pending o submitted
  let daysInfo = '';
  if (
    compliance.daysRemaining !== undefined &&
    compliance.status !== 'approved'
  ) {
    if (compliance.daysRemaining < 0) {
      daysInfo = ` (${Math.abs(compliance.daysRemaining)} días vencido)`;
    } else if (compliance.daysRemaining <= 3) {
      daysInfo = ` (${compliance.daysRemaining} días)`;
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      <span>{config.icon}</span>
      <span>
        {config.text}
        {daysInfo}
      </span>
    </span>
  );
};

export default ComplianceStatusBadge;
```

---

### 3. Agregar Acción "Subir Evidencia" (Usuarios)

**En el componente donde muestras las acciones del claim** (ej: `ClaimActions.jsx` o botones en la tabla):

```jsx
// Verificar si hay acción disponible
const canUploadCompliance =
  claim.availableActions?.includes('upload_compliance');

// Agregar botón
{
  canUploadCompliance && (
    <button
      onClick={() => setShowUploadModal(true)}
      className="btn btn-primary"
    >
      📤 Subir Evidencia
    </button>
  );
}

// Estado y modal
const [showUploadModal, setShowUploadModal] = useState(false);

{
  showUploadModal && (
    <UploadComplianceEvidenceModal
      compliance={claim.compliance}
      onClose={() => setShowUploadModal(false)}
      onSuccess={(updated) => {
        // Recargar los claims
        refetchClaims();
        setShowUploadModal(false);
        toast.success('Evidencia enviada correctamente');
      }}
    />
  );
}
```

---

### 4. Crear Modal para Subir Evidencia

**Archivo nuevo:** `components/UploadComplianceEvidenceModal.jsx`

```jsx
import React, { useState } from 'react';

const UploadComplianceEvidenceModal = ({ compliance, onClose, onSuccess }) => {
  const [userNotes, setUserNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validar cantidad (max 10)
    if (selectedFiles.length > 10) {
      setError('Máximo 10 archivos permitidos');
      return;
    }

    // Validar tamaño (max 10MB cada uno)
    const invalidFiles = selectedFiles.filter((f) => f.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError('Algunos archivos exceden el tamaño máximo de 10MB');
      return;
    }

    setFiles(selectedFiles);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar evidencia');
      }

      const result = await response.json();
      onSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const complianceTypes = {
    work_completion: 'Completar Trabajo',
    work_revision: 'Revisión de Trabajo',
    payment_required: 'Pago Requerido',
    apology_required: 'Disculpa Requerida',
    // ... agregar más tipos según necesites
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📤 Enviar Evidencia de Cumplimiento</h2>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Instrucciones del moderador */}
          <div className="instructions-box bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              Tipo: {complianceTypes[compliance.type] || compliance.type}
            </h3>
            <p className="text-blue-800 mb-2">
              <strong>Instrucciones del moderador:</strong>
            </p>
            <p className="text-blue-700">
              {compliance.moderatorInstructions ||
                'No hay instrucciones específicas'}
            </p>
            <p className="text-sm text-blue-600 mt-2">
              <strong>⏰ Plazo:</strong>{' '}
              {new Date(compliance.deadline).toLocaleDateString()}
              {compliance.daysRemaining !== undefined && (
                <span
                  className={
                    compliance.daysRemaining < 3 ? 'text-red-600 font-bold' : ''
                  }
                >
                  {' '}
                  ({compliance.daysRemaining} días restantes)
                </span>
              )}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-4">
              <label className="block font-medium mb-2">Notas (opcional)</label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Explica cómo cumpliste con el compromiso..."
                className="w-full border rounded p-2"
                rows={4}
                maxLength={1000}
              />
              <small className="text-gray-500">
                {userNotes.length}/1000 caracteres
              </small>
            </div>

            <div className="form-group mb-4">
              <label className="block font-medium mb-2">
                Archivos de evidencia
              </label>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="w-full"
              />
              <small className="text-gray-500 block mt-1">
                Max 10 archivos, 10MB cada uno. Formatos: JPG, PNG, PDF, DOC,
                DOCX
              </small>

              {files.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Archivos seleccionados:</p>
                  <ul className="text-sm text-gray-600">
                    {files.map((file, index) => (
                      <li key={index}>
                        📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{' '}
                        MB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="modal-actions flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Enviando...' : 'Enviar Evidencia'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadComplianceEvidenceModal;
```

---

### 5. Agregar Acción "Revisar Compliance" (Moderadores)

**En el panel de moderador:**

```jsx
const canReviewCompliance =
  claim.availableActions?.includes('review_compliance');

{
  canReviewCompliance && (
    <button
      onClick={() => setShowReviewModal(true)}
      className="btn btn-warning"
    >
      🔍 Revisar Compromiso
    </button>
  );
}

const [showReviewModal, setShowReviewModal] = useState(false);

{
  showReviewModal && (
    <ReviewComplianceModal
      compliance={claim.compliance}
      onClose={() => setShowReviewModal(false)}
      onSuccess={(updated) => {
        refetchClaims();
        setShowReviewModal(false);
        toast.success('Compliance revisado correctamente');
      }}
    />
  );
}
```

---

### 6. Crear Modal para Revisar Compliance (Moderador)

**Archivo nuevo:** `components/ReviewComplianceModal.jsx`

```jsx
import React, { useState } from 'react';

const ReviewComplianceModal = ({ compliance, onClose, onSuccess }) => {
  const [decision, setDecision] = useState('approve');
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (decision === 'reject' && !rejectionReason.trim()) {
      setError('Debes especificar el motivo del rechazo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/compliances/${compliance.id}/review`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision,
          moderatorNotes: moderatorNotes || undefined,
          rejectionReason: decision === 'reject' ? rejectionReason : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al revisar compliance');
      }

      const result = await response.json();
      onSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>🔍 Revisar Cumplimiento</h2>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Evidencia del usuario */}
          <div className="evidence-section bg-gray-50 p-4 rounded mb-4">
            <h3 className="font-semibold mb-3">📎 Evidencia del usuario:</h3>

            {compliance.evidenceUrls && compliance.evidenceUrls.length > 0 ? (
              <ul className="space-y-1 mb-3">
                {compliance.evidenceUrls.map((url, index) => (
                  <li key={index}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      📄 Archivo {index + 1}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No hay archivos adjuntos</p>
            )}

            {compliance.userNotes && (
              <div className="mt-3">
                <h4 className="font-medium text-sm mb-1">
                  💬 Notas del usuario:
                </h4>
                <p className="text-gray-700 bg-white p-2 rounded border">
                  {compliance.userNotes}
                </p>
              </div>
            )}
          </div>

          {/* Formulario de decisión */}
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-4">
              <label className="block font-medium mb-2">Decisión *</label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="approve">✅ Aprobar</option>
                <option value="reject">❌ Rechazar</option>
                <option value="adjust">🔄 Solicitar Ajustes</option>
              </select>
            </div>

            {decision === 'reject' && (
              <div className="form-group mb-4">
                <label className="block font-medium mb-2 text-red-700">
                  Motivo del rechazo *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explica por qué se rechaza el cumplimiento..."
                  className="w-full border border-red-300 rounded p-2"
                  rows={3}
                  required
                  maxLength={1000}
                />
              </div>
            )}

            <div className="form-group mb-4">
              <label className="block font-medium mb-2">
                Comentarios adicionales (opcional)
              </label>
              <textarea
                value={moderatorNotes}
                onChange={(e) => setModeratorNotes(e.target.value)}
                placeholder="Comentarios adicionales para el usuario..."
                className="w-full border rounded p-2"
                rows={3}
                maxLength={1000}
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="modal-actions flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`btn ${
                  decision === 'approve'
                    ? 'btn-success'
                    : decision === 'reject'
                      ? 'btn-danger'
                      : 'btn-warning'
                }`}
              >
                {loading ? 'Procesando...' : 'Confirmar Decisión'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewComplianceModal;
```

---

### 7. Mostrar Compliances en Detalle del Claim

**En `ClaimDetailModal.jsx` (o componente similar):**

```jsx
{
  /* Agregar sección de compliances */
}
{
  claim.compliances && claim.compliances.length > 0 && (
    <div className="compliances-section mt-6">
      <h3 className="text-xl font-semibold mb-4">📋 Compromisos</h3>

      <div className="space-y-4">
        {claim.compliances.map((compliance, index) => (
          <ComplianceCard
            key={compliance.id}
            compliance={compliance}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
```

**Componente ComplianceCard:**

```jsx
const ComplianceCard = ({ compliance, index }) => {
  const complianceTypes = {
    work_completion: 'Completar Trabajo',
    work_revision: 'Revisión de Trabajo',
    payment_required: 'Pago Requerido',
    apology_required: 'Disculpa Requerida',
    // ... más tipos
  };

  const deadline = new Date(compliance.deadline);
  const now = new Date();
  const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-lg">
            Compromiso {index + 1}:{' '}
            {complianceTypes[compliance.complianceType] ||
              compliance.complianceType}
          </h4>
          <ComplianceStatusBadge compliance={compliance} />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <p>
          <strong>Instrucciones:</strong> {compliance.moderatorInstructions}
        </p>

        <p className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
          <strong>⏰ Plazo:</strong> {deadline.toLocaleDateString()}
          {isOverdue
            ? ` (VENCIDO hace ${Math.abs(daysRemaining)} días)`
            : ` (${daysRemaining} días restantes)`}
        </p>

        {compliance.evidenceUrls && compliance.evidenceUrls.length > 0 && (
          <div>
            <p className="font-medium">📎 Evidencia enviada:</p>
            <ul className="list-disc list-inside">
              {compliance.evidenceUrls.map((url, i) => (
                <li key={i}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Ver archivo {i + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {compliance.userNotes && (
          <div className="bg-blue-50 p-2 rounded">
            <p className="font-medium">💬 Notas del usuario:</p>
            <p>{compliance.userNotes}</p>
          </div>
        )}

        {compliance.moderatorNotes && (
          <div className="bg-green-50 p-2 rounded">
            <p className="font-medium">✅ Comentarios del moderador:</p>
            <p>{compliance.moderatorNotes}</p>
          </div>
        )}

        {compliance.rejectionReason && (
          <div className="bg-red-50 p-2 rounded">
            <p className="font-medium">❌ Motivo del rechazo:</p>
            <p>{compliance.rejectionReason}</p>
            <p className="text-xs mt-1">
              Intentos: {compliance.rejectionCount}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 🎨 Estilos CSS Sugeridos

Agrega a tu CSS global o Tailwind config:

```css
/* Modal overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Modal content */
.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-body {
  padding: 20px;
}

.modal-actions {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.close-button:hover {
  color: #374151;
}
```

---

## ✅ Checklist de Implementación

- [ ] Agregar columna "Compromiso" en tabla de claims del usuario
- [ ] Agregar columna "Compromiso" en tabla de claims del moderador
- [ ] Crear componente `ComplianceStatusBadge`
- [ ] Crear componente `UploadComplianceEvidenceModal`
- [ ] Crear componente `ReviewComplianceModal` (solo moderadores)
- [ ] Crear componente `ComplianceCard`
- [ ] Agregar botón "Subir Evidencia" cuando `availableActions` incluye `upload_compliance`
- [ ] Agregar botón "Revisar Compliance" cuando `availableActions` incluye `review_compliance`
- [ ] Mostrar sección de compliances en detalle del claim
- [ ] Agregar manejo de errores para cada endpoint
- [ ] Probar flujo completo: asignar → subir → revisar

---

## 🚨 Importante

1. **Actualizar token de autenticación**: Asegúrate de que `localStorage.getItem('token')` sea el token correcto
2. **Refetch de datos**: Después de cada acción exitosa, recarga la lista de claims
3. **Notificaciones**: Usa toast/alerts para feedback al usuario
4. **Validación de archivos**: El backend valida tipos y tamaños, pero es mejor validar en el frontend también

---

## 📚 Documentación Completa

Para más detalles, consulta:

- `DOCUMENTACION-COMPLIANCES-FRONTEND.md` - Documentación completa con todos los endpoints
- `FRONTEND-COMPLIANCES-PLAN.md` - Plan de diseño UI/UX detallado

---

**¡Con estos cambios, el frontend estará completamente integrado con el sistema de compliances!** 🎉
