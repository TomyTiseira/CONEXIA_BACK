# 📘 Guía Completa: Compliances en Frontend

## 🔍 Pregunta 1: ¿Por qué hay `compliance` Y `compliances`?

### Respuesta Corta

- **`compliance`** (singular) = Retrocompatibilidad + Acceso rápido al compliance pendiente
- **`compliances`** (plural) = Array completo con TODOS los compliances del reclamo

### Explicación Detallada

#### `compliance` (singular)

```json
"compliance": {
  "id": "uuid",
  "type": "partial_refund",
  "status": "pending",
  "deadline": "2026-01-31T21:21:44.407Z",
  "daysRemaining": 7
}
```

**Propósito:**

- ✅ **Retrocompatibilidad**: Frontend antiguo sigue funcionando
- ✅ **Acceso rápido**: Si solo necesitas el compliance pendiente principal
- ✅ **Simplicidad**: Para mostrar "hay un compliance pendiente" sin iterar array

**Cuándo usar:**

- Badge simple en tabla: "⏳ Pendiente"
- Mostrar deadline urgente
- Acción "Subir Evidencia" (solo si es MI compliance)

#### `compliances` (plural)

```json
"compliances": [
  {
    "id": "uuid-1",
    "claimId": "claim-uuid",
    "responsibleUserId": "99",
    "complianceType": "partial_refund",
    "status": "pending",
    "moderatorInstructions": "Jimena vas a tener que hacer la reentrega del servicio.",
    "deadline": "2026-01-31T21:21:44.407Z",
    "evidenceUrls": [],
    "userNotes": null,
    "moderatorNotes": null,
    "rejectionReason": null,
    "rejectionCount": 0,
    "createdAt": "2026-01-24T18:21:44.472Z",
    "updatedAt": "2026-01-24T18:21:44.472Z"
  },
  {
    "id": "uuid-2",
    // ... segundo compliance
  }
]
```

**Propósito:**

- ✅ **Información completa**: Todos los campos de cada compliance
- ✅ **Múltiples compliances**: Si hay 2 o más compromisos
- ✅ **Detalle completo**: Instrucciones, evidencia, notas, estado, etc.

**Cuándo usar:**

- Detalle del reclamo (modal/página)
- Mostrar TODOS los compromisos asignados
- Tabla de moderador con información completa
- Cuando necesitas instrucciones, evidencia, notas

### Recomendación de Uso

```typescript
// ✅ CORRECTO: Usar compliance para badge simple
const ComplianceStatusBadge = ({ claim }) => {
  if (!claim.compliance) return null;

  return (
    <span className={`badge ${claim.compliance.status}`}>
      {claim.compliance.status === 'pending' && '⏳ Pendiente'}
      {claim.compliance.status === 'submitted' && '📤 Enviado'}
      {claim.compliance.status === 'approved' && '✅ Aprobado'}
    </span>
  );
};

// ✅ CORRECTO: Usar compliances para detalle completo
const CompliancesList = ({ claim }) => {
  if (!claim.compliances || claim.compliances.length === 0) {
    return <p>Sin compromisos</p>;
  }

  return (
    <div className="compliances-list">
      <h3>📋 Compromisos ({claim.compliances.length})</h3>
      {claim.compliances.map((compliance, index) => (
        <ComplianceCard
          key={compliance.id}
          compliance={compliance}
          index={index}
        />
      ))}
    </div>
  );
};
```

---

## 📊 Pregunta 2: ¿Cómo Mostrar Múltiples Compliances en Tablas?

### Opción 1: Badge con Contador (Recomendado para Tablas)

**Cuando hay 1 compliance:**

```
┌────────────────────┬──────────────┬────────────┐
│ Reclamo            │ Estado       │ Compromiso │
├────────────────────┼──────────────┼────────────┤
│ No se entregó      │ Resuelto     │ ⏳ Pendiente│
└────────────────────┴──────────────┴────────────┘
```

**Cuando hay 2+ compliances:**

```
┌────────────────────┬──────────────┬────────────────┐
│ Reclamo            │ Estado       │ Compromiso     │
├────────────────────┼──────────────┼────────────────┤
│ No se entregó      │ Resuelto     │ ⏳ 2 Pendientes│
└────────────────────┴──────────────┴────────────────┘
```

**Código:**

```jsx
const ComplianceColumnBadge = ({ claim }) => {
  if (!claim.compliances || claim.compliances.length === 0) {
    return <span className="text-gray-400">—</span>;
  }

  const pendingCount = claim.compliances.filter(
    (c) => c.status === 'pending' || c.status === 'submitted',
  ).length;

  const allApproved = claim.compliances.every((c) => c.status === 'approved');

  if (allApproved) {
    return (
      <span className="badge badge-success">
        ✅{' '}
        {claim.compliances.length === 1
          ? 'Aprobado'
          : `${claim.compliances.length} Aprobados`}
      </span>
    );
  }

  if (pendingCount > 0) {
    return (
      <span className="badge badge-warning">
        ⏳ {pendingCount === 1 ? 'Pendiente' : `${pendingCount} Pendientes`}
      </span>
    );
  }

  // Otros estados
  return (
    <span className="badge badge-info">
      📋 {claim.compliances.length} Compromisos
    </span>
  );
};
```

---

### Opción 2: Badge Apilado (Para Tablas Anchas)

```
┌────────────────────┬──────────────┬──────────────────────┐
│ Reclamo            │ Estado       │ Compromiso           │
├────────────────────┼──────────────┼──────────────────────┤
│ No se entregó      │ Resuelto     │ ⏳ Reentrega         │
│                    │              │ 💰 Pago parcial      │
└────────────────────┴──────────────┴──────────────────────┘
```

**Código:**

```jsx
const ComplianceStackedBadges = ({ claim }) => {
  if (!claim.compliances || claim.compliances.length === 0) {
    return <span className="text-gray-400">—</span>;
  }

  const complianceIcons = {
    full_refund: '💸',
    partial_refund: '💰',
    full_redelivery: '📦',
    work_completion: '🔨',
    payment_required: '💳',
    evidence_upload: '📎',
    // ... más tipos
  };

  const complianceLabels = {
    full_refund: 'Reembolso Completo',
    partial_refund: 'Reembolso Parcial',
    full_redelivery: 'Reentrega',
    work_completion: 'Completar Trabajo',
    payment_required: 'Pago Requerido',
    // ... más tipos
  };

  return (
    <div className="flex flex-col gap-1">
      {claim.compliances.slice(0, 2).map((compliance) => (
        <span
          key={compliance.id}
          className={`badge badge-sm ${
            compliance.status === 'approved'
              ? 'badge-success'
              : compliance.status === 'pending'
                ? 'badge-warning'
                : 'badge-info'
          }`}
        >
          {complianceIcons[compliance.complianceType] || '📋'}{' '}
          {complianceLabels[compliance.complianceType] ||
            compliance.complianceType}
        </span>
      ))}
      {claim.compliances.length > 2 && (
        <span className="text-xs text-gray-500">
          +{claim.compliances.length - 2} más
        </span>
      )}
    </div>
  );
};
```

---

### Opción 3: Popover/Tooltip (Mejor UX)

```
┌────────────────────┬──────────────┬────────────────┐
│ Reclamo            │ Estado       │ Compromiso     │
├────────────────────┼──────────────┼────────────────┤
│ No se entregó      │ Resuelto     │ 📋 2 (hover)  │
└────────────────────┴──────────────┴────────────────┘
                                        ↓
                                    ┌───────────────────┐
                                    │ 1. ⏳ Reentrega   │
                                    │ 2. 💰 Pago parcial│
                                    └───────────────────┘
```

**Código (con Tooltip):**

```jsx
const ComplianceWithTooltip = ({ claim }) => {
  if (!claim.compliances || claim.compliances.length === 0) {
    return <span className="text-gray-400">—</span>;
  }

  const pendingCount = claim.compliances.filter(
    (c) => c.status === 'pending' || c.status === 'submitted',
  ).length;

  return (
    <Tooltip
      content={
        <div className="p-2">
          <p className="font-semibold mb-2">Compromisos:</p>
          {claim.compliances.map((c, i) => (
            <div key={c.id} className="text-sm py-1">
              {i + 1}. {getComplianceIcon(c.status)}{' '}
              {getComplianceLabel(c.complianceType)}
            </div>
          ))}
        </div>
      }
    >
      <span className="badge badge-warning cursor-help">
        📋 {claim.compliances.length} ({pendingCount} pendientes)
      </span>
    </Tooltip>
  );
};
```

---

### Opción 4: Expandible (Para Tablas Complejas)

```
┌────────────────────┬──────────────┬────────────────┐
│ Reclamo            │ Estado       │ Compromiso  [+]│ ← Click para expandir
├────────────────────┼──────────────┼────────────────┤
│ No se entregó      │ Resuelto     │ 📋 2           │
└────────────────────┴──────────────┴────────────────┘
                     ↓ Click
┌────────────────────┬──────────────┬────────────────┐
│ No se entregó      │ Resuelto     │ 📋 2        [-]│
│  └─ Compromisos:                                   │
│     1. ⏳ Reentrega (Vence: 31/01)                │
│     2. 💰 Pago parcial (Vence: 7/02)              │
└────────────────────────────────────────────────────┘
```

**Código:**

```jsx
const ExpandableCompliances = ({ claim }) => {
  const [expanded, setExpanded] = useState(false);

  if (!claim.compliances || claim.compliances.length === 0) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="btn btn-sm btn-ghost"
      >
        📋 {claim.compliances.length} {expanded ? '[-]' : '[+]'}
      </button>

      {expanded && (
        <div className="mt-2 pl-4 border-l-2 border-gray-300">
          {claim.compliances.map((c, i) => (
            <div key={c.id} className="text-sm py-1">
              <ComplianceStatusBadge compliance={c} />
              <span className="ml-2">
                {getComplianceLabel(c.complianceType)}
              </span>
              <span className="text-gray-500 text-xs ml-2">
                (Vence: {new Date(c.deadline).toLocaleDateString()})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 🎨 Recomendaciones Finales para Tablas

### Para Tabla de "Mis Reclamos" (Usuario)

✅ **Opción 1 (Badge con Contador)** - Simple y efectivo

```jsx
<td>
  <ComplianceColumnBadge claim={claim} />
</td>
```

**Por qué:**

- Usuario solo necesita saber si tiene algo pendiente
- Espacio limitado en mobile
- Click en la fila abre detalle completo

---

### Para Tabla de Moderador

✅ **Opción 3 (Popover/Tooltip)** - Balance entre info y espacio

```jsx
<td>
  <ComplianceWithTooltip claim={claim} />
</td>
```

**Por qué:**

- Moderador necesita ver rápido qué tipo de compliance
- Hover muestra detalles sin abrir modal
- Mantiene tabla compacta

---

### Para Vista de Detalle

✅ **Lista Completa con Cards** (Ya está en la guía)

```jsx
<div className="compliances-section">
  <h3>📋 Compromisos ({claim.compliances.length})</h3>
  {claim.compliances.map((compliance, index) => (
    <ComplianceCard key={compliance.id} compliance={compliance} index={index} />
  ))}
</div>
```

---

## 📦 Componentes Reutilizables

### 1. Badge de Estado

```jsx
const ComplianceStatusBadge = ({ status }) => {
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
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${config.color}`}>
      {config.icon} {config.text}
    </span>
  );
};
```

### 2. Helper de Etiquetas

```jsx
const getComplianceLabel = (type) => {
  const labels = {
    full_refund: 'Reembolso Completo',
    partial_refund: 'Reembolso Parcial',
    full_redelivery: 'Reentrega Completa',
    corrected_delivery: 'Entrega Corregida',
    additional_delivery: 'Entrega Adicional',
    payment_required: 'Pago Requerido',
    partial_payment: 'Pago Parcial',
    evidence_upload: 'Subir Evidencia',
    confirmation_only: 'Solo Confirmación',
    auto_refund: 'Reembolso Automático',
    no_action_required: 'Sin Acción Requerida',
    work_completion: 'Completar Trabajo',
    work_revision: 'Revisión de Trabajo',
    apology_required: 'Disculpa Requerida',
    service_discount: 'Descuento en Servicio',
    penalty_fee: 'Penalización',
    account_restriction: 'Restricción de Cuenta',
    other: 'Otro',
  };

  return labels[type] || type;
};

const getComplianceIcon = (type) => {
  const icons = {
    full_refund: '💸',
    partial_refund: '💰',
    full_redelivery: '📦',
    work_completion: '🔨',
    payment_required: '💳',
    evidence_upload: '📎',
    confirmation_only: '✔️',
    apology_required: '🙏',
    service_discount: '🏷️',
    penalty_fee: '⚠️',
    account_restriction: '🚫',
  };

  return icons[type] || '📋';
};
```

### 3. Cálculo de Días Restantes

```jsx
const getDaysRemaining = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const daysRemaining = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

  return daysRemaining;
};

const formatDeadline = (deadline) => {
  const days = getDaysRemaining(deadline);

  if (days < 0) {
    return {
      text: `Vencido hace ${Math.abs(days)} días`,
      color: 'text-red-600 font-bold',
      urgent: true,
    };
  } else if (days === 0) {
    return {
      text: 'Vence HOY',
      color: 'text-red-600 font-bold',
      urgent: true,
    };
  } else if (days <= 3) {
    return {
      text: `${days} días restantes`,
      color: 'text-orange-600 font-semibold',
      urgent: true,
    };
  } else {
    return {
      text: `${days} días restantes`,
      color: 'text-gray-600',
      urgent: false,
    };
  }
};
```

---

## 🎯 Ejemplos Completos de Implementación

### Tabla de Mis Reclamos (Usuario)

```jsx
const MyClaimsTable = ({ claims }) => {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Servicio</th>
          <th>Tipo</th>
          <th>Estado</th>
          <th>Compromiso</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {claims.map((claim) => (
          <tr key={claim.id}>
            <td>{claim.relatedService.title}</td>
            <td>{claim.claimType}</td>
            <td>
              <ClaimStatusBadge status={claim.status} />
            </td>
            <td>
              {/* ✅ OPCIÓN 1: Badge simple */}
              {claim.compliances && claim.compliances.length > 0 ? (
                <ComplianceColumnBadge claim={claim} />
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </td>
            <td>
              <button onClick={() => openDetail(claim.id)}>Ver Detalle</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### Tabla de Moderador

```jsx
const ModeratorClaimsTable = ({ claims }) => {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>ID</th>
          <th>Servicio</th>
          <th>Reclamante</th>
          <th>Estado</th>
          <th>Compromisos</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {claims.map((claim) => (
          <tr key={claim.id}>
            <td>{claim.id.slice(0, 8)}...</td>
            <td>{claim.hiring.service.title}</td>
            <td>{claim.claimant.profile.name}</td>
            <td>
              <ClaimStatusBadge status={claim.status} />
            </td>
            <td>
              {/* ✅ OPCIÓN 3: Tooltip con detalles */}
              {claim.compliances && claim.compliances.length > 0 ? (
                <ComplianceWithTooltip claim={claim} />
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </td>
            <td>
              {claim.availableActions.includes('resolve_claim') && (
                <button onClick={() => resolveClaim(claim.id)}>Resolver</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### Modal de Detalle

```jsx
const ClaimDetailModal = ({ claim }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Detalle del Reclamo</h2>

        {/* Información básica */}
        <div className="claim-info">
          <p>
            <strong>Servicio:</strong> {claim.hiring.service.title}
          </p>
          <p>
            <strong>Estado:</strong> <ClaimStatusBadge status={claim.status} />
          </p>
          <p>
            <strong>Descripción:</strong> {claim.description}
          </p>
        </div>

        {/* ✅ Sección de Compliances */}
        {claim.compliances && claim.compliances.length > 0 && (
          <div className="compliances-section mt-6">
            <h3 className="text-xl font-semibold mb-4">
              📋 Compromisos ({claim.compliances.length})
            </h3>

            <div className="space-y-4">
              {claim.compliances.map((compliance, index) => (
                <ComplianceCard
                  key={compliance.id}
                  compliance={compliance}
                  index={index}
                  currentUserId={currentUser.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ComplianceCard = ({ compliance, index, currentUserId }) => {
  const deadline = formatDeadline(compliance.deadline);
  const isMyCompliance = Number(compliance.responsibleUserId) === currentUserId;

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-lg">
            {getComplianceIcon(compliance.complianceType)} Compromiso{' '}
            {index + 1}: {getComplianceLabel(compliance.complianceType)}
          </h4>
          {isMyCompliance && (
            <span className="text-sm text-blue-600 font-medium">
              👤 Asignado a TI
            </span>
          )}
        </div>
        <ComplianceStatusBadge status={compliance.status} />
      </div>

      <div className="space-y-2 text-sm">
        <p>
          <strong>Instrucciones:</strong> {compliance.moderatorInstructions}
        </p>

        <p className={deadline.color}>
          <strong>⏰ Plazo:</strong>{' '}
          {new Date(compliance.deadline).toLocaleDateString()}({deadline.text})
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

      {isMyCompliance && compliance.status === 'pending' && (
        <button
          onClick={() => uploadEvidence(compliance.id)}
          className="btn btn-primary mt-3"
        >
          📤 Subir Evidencia
        </button>
      )}
    </div>
  );
};
```

---

## 📋 Resumen de Decisiones

| Ubicación                | Campo a usar                        | Motivo                           |
| ------------------------ | ----------------------------------- | -------------------------------- |
| Tabla (columna)          | `compliance` (singular)             | Acceso rápido, espacio limitado  |
| Badge con contador       | `compliances.length`                | Mostrar cantidad total           |
| Tooltip/Hover            | `compliances` (plural)              | Mostrar todos sin modal          |
| Detalle completo         | `compliances` (plural)              | Mostrar toda la información      |
| Acción "Subir Evidencia" | `compliance` o `compliances.find()` | Buscar el compliance del usuario |

---

## ✅ Checklist de Implementación

- [ ] Importar helpers de etiquetas y iconos
- [ ] Crear componente `ComplianceStatusBadge`
- [ ] Crear componente `ComplianceColumnBadge` para tablas
- [ ] Agregar columna "Compromiso" en tabla de usuario
- [ ] Agregar columna "Compromisos" en tabla de moderador
- [ ] Crear componente `ComplianceCard` para detalle
- [ ] Agregar sección de compliances en modal de detalle
- [ ] Implementar lógica de "Subir Evidencia" cuando `availableActions` incluye `upload_compliance`
- [ ] Implementar lógica de "Revisar Compliance" cuando `availableActions` incluye `review_compliance`
- [ ] Probar con reclamo sin compliances (debe mostrar "—" o "Sin compromisos")
- [ ] Probar con reclamo con 1 compliance
- [ ] Probar con reclamo con 2+ compliances
