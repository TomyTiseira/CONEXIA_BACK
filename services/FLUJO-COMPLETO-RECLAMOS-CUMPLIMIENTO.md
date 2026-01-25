# 🔄 FLUJO COMPLETO: Sistema de Reclamos con Cumplimiento Post-Resolución

## 📖 ÍNDICE

1. [Flujo Básico Paso a Paso](#flujo-básico)
2. [Estados y Transiciones](#estados)
3. [Roles y Responsabilidades](#roles)
4. [Escenarios de Evidencia](#escenarios)
5. [Sistema de Confirmación Bilateral](#confirmacion)
6. [Ideas Innovadoras](#ideas)
7. [Sistema de Consecuencias Progresivas](#consecuencias)
8. [Casos Especiales](#casos-especiales)
9. [Arquitectura Técnica](#arquitectura)
10. [Cobertura de Casos de Uso](#cobertura)

---

## 🔄 PARTE 1: FLUJO BÁSICO PASO A PASO <a name="flujo-básico"></a>

### **FASE 1: CREACIÓN DEL RECLAMO**

```
┌─────────────────────────────────────────────────────────────┐
│  USUARIO (Cliente o Proveedor) - RECLAMANTE                │
└─────────────────────────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 1. Crea reclamo desde ServiceHiring    │
    │    - Selecciona tipo de reclamo        │
    │    - Describe el problema              │
    │    - Sube evidencias (obligatorio)     │
    │      * Screenshots                      │
    │      * Documentos                       │
    │      * Videos                           │
    │      * Archivos de trabajo              │
    └────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ Estado: OPEN                            │
    │ Claim.role: client o provider          │
    │ Claim.claimantUserId: ID reclamante    │
    │ Claim.defendantUserId: ID reclamado    │
    └────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ Notificaciones automáticas:             │
    │ ✉ Reclamado: "Tienes un reclamo nuevo" │
    │ ✉ Moderadores: "Nuevo reclamo #123"    │
    └────────────────────────────────────────┘
```

---

### **FASE 2: MODERACIÓN Y ANÁLISIS**

```
┌─────────────────────────────────────────────────────────────┐
│  MODERADOR                                                   │
└─────────────────────────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 2. Moderador revisa el reclamo         │
    │    - Ve evidencias del reclamante      │
    │    - Ve contexto de la contratación    │
    │    - Historial de mensajes             │
    │    - Entregas previas                  │
    └────────────────────────────────────────┘
                         ↓
         ┌───────────────┴───────────────┐
         │ ¿Necesita más información?    │
         └───────────────┬───────────────┘
                    ┌────┴────┐
                    │   SÍ    │
                    └────┬────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 3. Moderador solicita clarificación    │
    │    - Estado: PENDING_CLARIFICATION     │
    │    - Puede agregar observaciones:      │
    │      "Necesito ver la cotización       │
    │       original donde se especifica X"  │
    └────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 4. Reclamante responde clarificación   │
    │    - Sube documentos adicionales       │
    │    - Explica con más detalle           │
    │    - Estado vuelve a: IN_REVIEW        │
    └────────────────────────────────────────┘
                         ↓
                    ┌────┴────┐
                    │   NO    │
                    └────┬────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 5. Moderador tiene info suficiente     │
    │    - Estado: IN_REVIEW                 │
    │    - Analiza todas las evidencias      │
    │    - Revisa términos de servicio       │
    │    - Verifica cotización original      │
    └────────────────────────────────────────┘
```

---

### **FASE 3: RESOLUCIÓN DEL MODERADOR** ⚖️

```
┌─────────────────────────────────────────────────────────────┐
│  MODERADOR TOMA DECISIÓN                                     │
└─────────────────────────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 6. Moderador resuelve el reclamo       │
    │    Opciones:                            │
    │    A) A favor del cliente              │
    │    B) A favor del proveedor            │
    │    C) Acuerdo parcial                  │
    │    D) Rechazar (sin fundamento)        │
    └────────────────────────────────────────┘
                         ↓
         ┌───────────────┴───────────────┐
         │  Tipo de resolución           │
         └───────────────┬───────────────┘
              ┌──────────┼──────────┐
              │          │          │
         ┌────┴───┐ ┌───┴────┐ ┌──┴─────┐
         │CLIENTE │ │PROVEEDOR│ │ACUERDO │
         │ FAVOR  │ │ FAVOR   │ │PARCIAL │
         └────┬───┘ └───┬────┘ └──┬─────┘
              │         │          │
              └─────────┴──────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 7. Moderador agrega resolución:        │
    │                                         │
    │ Claim.status = RESOLVED                │
    │ Claim.resolutionType = [tipo]          │
    │ Claim.resolutionDetails = texto        │
    │                                         │
    │ Ejemplo de resolutionDetails:          │
    │ "El proveedor debe rehacer el logo    │
    │  agregando el nombre de la empresa     │
    │  en formato vectorial (.AI o .SVG)     │
    │  según cotización original. Plazo:     │
    │  7 días."                              │
    └────────────────────────────────────────┘
```

---

### **FASE 4: CREACIÓN AUTOMÁTICA DE CUMPLIMIENTO(S)** 🎯

```
┌─────────────────────────────────────────────────────────────┐
│  SISTEMA (Automático al resolver)                           │
└─────────────────────────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 8. Sistema analiza la resolución       │
    │    y determina:                         │
    │                                         │
    │    ¿Requiere acción del reclamado?     │
    │    ¿Requiere acción del reclamante?    │
    │    ¿Requiere acción de AMBOS?          │
    └────────────────────────────────────────┘
                         ↓
         ┌───────────────┴───────────────┐
         │   MATRIZ DE DECISIÓN          │
         └───────────────┬───────────────┘
                         ↓

┌─────────────────────────────────────────────────────────────┐
│ ESCENARIO A: Solo el RECLAMADO debe cumplir (80% de casos) │
└─────────────────────────────────────────────────────────────┘
    ┌────────────────────────────────────────┐
    │ Se crea 1 COMPLIANCE:                   │
    │                                         │
    │ ClaimCompliance {                       │
    │   claimId: reclamo actual              │
    │   responsibleUserId: reclamado         │
    │   complianceType: según resolución     │
    │   status: PENDING                      │
    │   deadline: now + plazo días           │
    │   moderatorInstructions: detalles      │
    │ }                                       │
    └────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ESCENARIO B: Solo el RECLAMANTE debe cumplir (10% de casos)│
└─────────────────────────────────────────────────────────────┘
    Ejemplo: Cliente debe pagar, subir comprobante, confirmar

    ┌────────────────────────────────────────┐
    │ Se crea 1 COMPLIANCE:                   │
    │                                         │
    │ ClaimCompliance {                       │
    │   responsibleUserId: reclamante        │
    │   complianceType: PAYMENT_REQUIRED     │
    │   status: PENDING                      │
    │ }                                       │
    └────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ESCENARIO C: AMBOS deben cumplir (10% de casos) 🔥         │
└─────────────────────────────────────────────────────────────┘
    Ejemplo: Proveedor reentrega + Cliente paga extra

    ┌────────────────────────────────────────┐
    │ Se crean 2 COMPLIANCES:                 │
    │                                         │
    │ Compliance #1: {                        │
    │   responsibleUserId: proveedor         │
    │   complianceType: CORRECTED_DELIVERY   │
    │   dependsOn: null (primero)            │
    │ }                                       │
    │                                         │
    │ Compliance #2: {                        │
    │   responsibleUserId: cliente           │
    │   complianceType: PARTIAL_PAYMENT      │
    │   dependsOn: compliance #1 (segundo)   │
    │ }                                       │
    └────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ESCENARIO D: No requiere cumplimiento (raro)                │
└─────────────────────────────────────────────────────────────┘
    Ejemplo: Reclamo rechazado por infundado

    ┌────────────────────────────────────────┐
    │ NO se crea compliance                   │
    │ Claim se cierra directamente           │
    │ Estado final: RESOLVED                 │
    └────────────────────────────────────────┘
```

---

### **FASE 5: CUMPLIMIENTO POR PARTE RESPONSABLE** 📤

```
┌─────────────────────────────────────────────────────────────┐
│  USUARIO RESPONSABLE (puede ser reclamante o reclamado)    │
└─────────────────────────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 9. Usuario responsable recibe          │
    │    notificación con:                    │
    │                                         │
    │    ✉ Email urgente                     │
    │    🔔 Notificación en plataforma       │
    │    📱 Enlace directo al compliance     │
    │    ⏰ Contador de plazo visible        │
    └────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 10. Usuario ve:                         │
    │     - Resolución del moderador          │
    │     - Instrucciones específicas         │
    │     - Plazo límite                      │
    │     - Tipo de evidencia requerida       │
    │     - Consecuencias si no cumple        │
    └────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 11. Usuario sube evidencia del         │
    │     cumplimiento:                       │
    │                                         │
    │     TIPOS DE EVIDENCIA según caso:     │
    │     📎 Archivos (reentrega)            │
    │     💰 Comprobante de pago             │
    │     📸 Screenshots                      │
    │     📝 Documentación                    │
    │     ✅ Confirmación simple (checkbox)  │
    │                                         │
    │ Compliance.status = SUBMITTED          │
    │ Compliance.evidenceUrls = [archivos]   │
    │ Compliance.submittedAt = now           │
    │ Compliance.userNotes = "Adjunto..."    │
    └────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ Notificaciones:                         │
    │ ✉ Moderador: "Compliance enviado"     │
    │ ✉ Otra parte: "Hay evidencia nueva"   │
    └────────────────────────────────────────┘
```

---

### **FASE 6: SISTEMA DE CONFIRMACIÓN BILATERAL** ✅✅

```
┌─────────────────────────────────────────────────────────────┐
│  INNOVACIÓN: VALIDACIÓN POR LA OTRA PARTE 🔥                │
└─────────────────────────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 12. La OTRA PARTE (no responsable)     │
    │     también puede ver la evidencia:     │
    │                                         │
    │     Ejemplo:                            │
    │     - Reclamante ve que proveedor      │
    │       subió versión corregida          │
    │     - Cliente ve comprobante que       │
    │       proveedor transfirió devolución  │
    └────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 13. La otra parte puede:               │
    │                                         │
    │     A) ✅ APROBAR (pre-validación)     │
    │        "Confirmo que recibí/está bien" │
    │        → Compliance.peerApproved = true│
    │                                         │
    │     B) ⚠️ OBJETAR                      │
    │        "Esto no cumple porque..."      │
    │        → Compliance.peerObjection      │
    │        → Moderador revisa objeción     │
    │                                         │
    │     C) ⏭️ NO HACER NADA (3 días)       │
    │        → Auto-pasa a moderador         │
    └────────────────────────────────────────┘
                         ↓
         ┌───────────────┴───────────────┐
         │  ¿La otra parte aprobó?       │
         └───────────────┬───────────────┘
                    ┌────┴────┐
                    │   SÍ    │
                    └────┬────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ → ACELERA EL PROCESO ⚡                │
    │ Compliance.status = PEER_APPROVED      │
    │ Moderador lo ve con indicador verde   │
    │ "Ambas partes están de acuerdo"       │
    └────────────────────────────────────────┘
                    ┌────┴────┐
                    │   NO    │
                    └────┬────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ → Moderador debe revisar con          │
    │   más detalle la objeción             │
    └────────────────────────────────────────┘
```

---

### **FASE 7: REVISIÓN FINAL DEL MODERADOR** 🔍

```
┌─────────────────────────────────────────────────────────────┐
│  MODERADOR - VERIFICACIÓN FINAL                              │
└─────────────────────────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 14. Moderador recibe notificación:     │
    │     "Compliance enviado para revisión" │
    │                                         │
    │     Ve indicadores:                     │
    │     ✅ Pre-aprobado por otra parte     │
    │     ⚠️ Objetado por otra parte         │
    │     ⏳ Pendiente opinión otra parte    │
    └────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 15. Moderador revisa evidencia:        │
    │     - Descarga archivos                 │
    │     - Verifica que cumple resolución    │
    │     - Lee objeciones si hay             │
    │     - Compara con lo solicitado         │
    └────────────────────────────────────────┘
                         ↓
         ┌───────────────┴───────────────┐
         │   DECISIÓN DEL MODERADOR      │
         └───────────────┬───────────────┘
              ┌──────────┼──────────┐
              │          │          │
         ┌────┴───┐ ┌───┴────┐ ┌──┴─────┐
         │APRUEBA │ │RECHAZA │ │REQUIERE│
         │   ✅   │ │   ❌   │ │ AJUSTE │
         └────┬───┘ └───┬────┘ └──┬─────┘
              │         │          │
              └─────────┴──────────┘
                         ↓

┌─────────────────────────────────────────────────────────────┐
│ A) MODERADOR APRUEBA ✅                                     │
└─────────────────────────────────────────────────────────────┘
    ┌────────────────────────────────────────┐
    │ Compliance.status = APPROVED            │
    │ Compliance.reviewedAt = now            │
    │ Compliance.reviewedBy = moderadorId    │
    │ Compliance.moderatorNotes = "OK"       │
    └────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ ¿Hay más compliances pendientes?       │
    └────────────────────────────────────────┘
         ┌────────────┴────────────┐
         │ NO                       │ SÍ
         ↓                          ↓
    ┌─────────┐        ┌─────────────────────┐
    │ CIERRA  │        │ Activa el siguiente │
    │ RECLAMO │        │ compliance en cadena│
    │ FINAL   │        └─────────────────────┘
    └─────────┘

┌─────────────────────────────────────────────────────────────┐
│ B) MODERADOR RECHAZA ❌                                     │
└─────────────────────────────────────────────────────────────┘
    ┌────────────────────────────────────────┐
    │ Compliance.status = REJECTED            │
    │ Compliance.rejectionReason = "porque..."│
    │                                         │
    │ ¿Cuántos rechazos lleva?               │
    │ - Primera vez → PENDING (reintento)    │
    │ - Segunda vez → WARNING (advertencia)  │
    └────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ Usuario debe corregir y reenviar       │
    │ Plazo se reduce a la mitad             │
    └────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ C) REQUIERE AJUSTE MENOR ⚠️                                │
└─────────────────────────────────────────────────────────────┘
    ┌────────────────────────────────────────┐
    │ Compliance.status = REQUIRES_ADJUSTMENT │
    │ Moderador indica qué ajustar:          │
    │ "Falta agregar el archivo .AI además   │
    │  del .SVG que subiste"                 │
    └────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ Usuario complementa evidencia          │
    │ No cuenta como rechazo completo        │
    └────────────────────────────────────────┘
```

---

### **FASE 8: CIERRE DEFINITIVO DEL RECLAMO** 🎯

```
┌─────────────────────────────────────────────────────────────┐
│  TODOS LOS COMPLIANCES APROBADOS                             │
└─────────────────────────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 16. Sistema verifica:                   │
    │     ✅ Todos los compliances APPROVED  │
    │     ✅ Ambas partes cumplieron         │
    │     ✅ No hay objeciones pendientes    │
    └────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 17. Claim.status = CLOSED              │
    │     Claim.closedAt = now               │
    │     Claim.finalOutcome = "RESOLVED"    │
    └────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 18. Acciones finales automáticas:      │
    │                                         │
    │     💰 Libera pago al proveedor        │
    │        (si corresponde)                 │
    │                                         │
    │     📊 Actualiza reputación:           │
    │        - Proveedor: +puntos si cumplió │
    │        - Cliente: +puntos si justo     │
    │                                         │
    │     📝 Habilita reviews:               │
    │        - Ambos pueden dejar reseña     │
    │                                         │
    │     🔓 Desbloquea servicio:            │
    │        - ServiceHiring.status final    │
    └────────────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │ 19. Notificaciones finales:            │
    │     ✉ Reclamante: "Tu reclamo fue     │
    │        resuelto satisfactoriamente"    │
    │     ✉ Reclamado: "Cumpliste con la    │
    │        resolución, caso cerrado"       │
    └────────────────────────────────────────┘
```

---

## 📊 PARTE 2: ESTADOS Y TRANSICIONES <a name="estados"></a>

### **ESTADOS DEL CLAIM**

```typescript
enum ClaimStatus {
  // Fase inicial
  OPEN = 'open', // Recién creado
  IN_REVIEW = 'in_review', // Moderador lo está analizando
  PENDING_CLARIFICATION = 'pending_clarification', // Esperando más info

  // Fase de resolución
  RESOLVED = 'resolved', // Moderador ya decidió

  // Fase de cumplimiento
  PENDING_COMPLIANCE = 'pending_compliance', // Esperando que cumplan
  COMPLIANCE_IN_REVIEW = 'compliance_in_review', // Verificando cumplimiento

  // Estados finales
  CLOSED = 'closed', // TODO cumplido, cerrado
  REJECTED = 'rejected', // Reclamo sin fundamento
  CANCELLED = 'cancelled', // Cancelado por reclamante
}
```

### **ESTADOS DEL COMPLIANCE**

```typescript
enum ComplianceStatus {
  // Estados activos
  PENDING = 'pending', // Esperando que el usuario actúe
  SUBMITTED = 'submitted', // Usuario subió evidencia
  PEER_APPROVED = 'peer_approved', // Otra parte lo pre-aprobó ⭐
  PEER_OBJECTED = 'peer_objected', // Otra parte objetó ⚠️
  IN_REVIEW = 'in_review', // Moderador revisando
  REQUIRES_ADJUSTMENT = 'requires_adjustment', // Falta algo menor

  // Estados finales
  APPROVED = 'approved', // Moderador aprobó ✅
  REJECTED = 'rejected', // No cumple, rechazado ❌

  // Estados de incumplimiento
  OVERDUE = 'overdue', // Pasó el plazo
  WARNING = 'warning', // Segunda advertencia
  ESCALATED = 'escalated', // Escalado a admin
}
```

### **DIAGRAMA DE TRANSICIONES**

```
CLAIM FLOW:
───────────

OPEN → IN_REVIEW → PENDING_CLARIFICATION → IN_REVIEW
                   (si necesita info)    (vuelve)
      ↓
      RESOLVED → PENDING_COMPLIANCE → COMPLIANCE_IN_REVIEW → CLOSED
                                                           ↘
                                                             REJECTED
                                                           (sin fundamento)

COMPLIANCE FLOW:
────────────────

PENDING → SUBMITTED → PEER_APPROVED → IN_REVIEW → APPROVED
                   ↘                ↗
                     PEER_OBJECTED

PENDING → OVERDUE → WARNING → ESCALATED
        (plazo)   (reincide)  (admin decide)

IN_REVIEW → REQUIRES_ADJUSTMENT → SUBMITTED → IN_REVIEW
          (falta algo)         (corrije)    (re-revisa)

IN_REVIEW → REJECTED → PENDING
          (1ra vez)  (reintento)
```

---

## 👥 PARTE 3: ROLES Y RESPONSABILIDADES <a name="roles"></a>

### **RECLAMANTE (Demandante)**

```typescript
interface Reclamante {
  accionesIniciales: [
    'Crear el reclamo',
    'Subir evidencias del problema',
    'Describir lo que reclama',
    'Responder clarificaciones del moderador',
  ];

  duranteCumplimiento: [
    'Ver resolución del moderador',
    'Ver evidencias que sube el reclamado',
    'Pre-aprobar o objetar evidencias',
    'Confirmar recepción final (en algunos casos)',
  ];

  // Casos especiales donde RECLAMANTE debe cumplir:
  cumplimientosPosibles: [
    'Pagar monto adeudado (si pierde el reclamo)',
    'Aceptar trabajo como está (scope creep)',
    'Devolver archivos (en disputas de propiedad)',
    'Completar información faltante',
  ];
}
```

### **RECLAMADO (Demandado)**

```typescript
interface Reclamado {
  accionesIniciales: [
    'Recibir notificación del reclamo',
    'Ver evidencias del reclamante',
    'Opcionalmente comentar (antes de moderación)',
  ];

  duranteCumplimiento: [
    'Ver resolución del moderador',
    'Subir evidencias de cumplimiento',
    'Cumplir en plazo establecido',
    'Responder objeciones si hay',
  ];

  // Cumplimientos más comunes del reclamado:
  cumplimientosTipicos: [
    'Rehacer/corregir entrega',
    'Subir archivos faltantes',
    'Devolver dinero (comprobante)',
    'Demostrar que sí cumplió (evidencias)',
    'Pagar monto adeudado',
  ];
}
```

### **MODERADOR**

```typescript
interface Moderador {
  poderes: [
    'Solicitar clarificaciones a cualquier parte',
    'Resolver el reclamo con decisión final',
    'Aprobar o rechazar cumplimientos',
    'Ajustar plazos en casos excepcionales',
    'Escalar a admin casos complejos',
    'Banear usuarios por incumplimiento',
  ];

  responsabilidades: [
    'Analizar evidencias objetivamente',
    'Redactar resolución clara y específica',
    'Verificar que cumplimientos sean válidos',
    'Mantener imparcialidad',
    'Responder objeciones de las partes',
  ];
}
```

---

## 🎭 PARTE 4: ESCENARIOS DE EVIDENCIA <a name="escenarios"></a>

### **ESCENARIO 1: Solo RECLAMADO sube evidencia (80%)**

```
Caso: Cliente reclama trabajo defectuoso
Resolución: Proveedor debe rehacer el logo

┌─────────────────────────────────────────────────────────┐
│ Compliance creado:                                      │
│   responsibleUserId: proveedorId                        │
│   complianceType: CORRECTED_DELIVERY                    │
│                                                          │
│ Proveedor sube: logo-corregido-v2.ai                   │
│ Cliente revisa y pre-aprueba                           │
│ Moderador verifica y aprueba ✅                        │
│ Reclamo CERRADO                                         │
└─────────────────────────────────────────────────────────┘
```

### **ESCENARIO 2: Solo RECLAMANTE sube evidencia (10%)**

```
Caso: Proveedor reclama falta de pago
Resolución: Cliente debe pagar $5000

┌─────────────────────────────────────────────────────────┐
│ Compliance creado:                                      │
│   responsibleUserId: clienteId                          │
│   complianceType: PAYMENT_REQUIRED                      │
│   amount: 5000                                          │
│                                                          │
│ Cliente paga en MercadoPago                            │
│ Webhook actualiza payment.status = APPROVED            │
│ Sistema auto-aprueba compliance ✅                     │
│ Reclamo CERRADO                                         │
└─────────────────────────────────────────────────────────┘
```

### **ESCENARIO 3: AMBAS partes deben actuar (10%)**

```
Caso: Trabajo parcialmente incorrecto + cliente pide extras
Resolución: Proveedor corrige errores + Cliente paga $2000 extra

┌─────────────────────────────────────────────────────────┐
│ Compliance #1 (SECUENCIAL):                            │
│   responsibleUserId: proveedorId                        │
│   complianceType: CORRECTED_DELIVERY                    │
│   order: 1 (primero)                                    │
│                                                          │
│ → Proveedor sube versión corregida                     │
│ → Cliente pre-aprueba                                   │
│ → Moderador aprueba                                     │
│ → ACTIVA Compliance #2 automáticamente                 │
│                                                          │
│ Compliance #2:                                          │
│   responsibleUserId: clienteId                          │
│   complianceType: PARTIAL_PAYMENT                       │
│   amount: 2000                                          │
│   dependsOn: compliance #1                              │
│   order: 2 (segundo)                                    │
│                                                          │
│ → Cliente paga los $2000                               │
│ → Sistema verifica pago                                 │
│ → Auto-aprueba compliance #2                           │
│ → Reclamo CERRADO ✅                                   │
└─────────────────────────────────────────────────────────┘
```

### **ESCENARIO 4: Confirmación simple sin archivos**

```
Caso: Cliente pide revisiones excesivas
Resolución: Cliente debe aceptar trabajo como está

┌─────────────────────────────────────────────────────────┐
│ Compliance creado:                                      │
│   responsibleUserId: clienteId                          │
│   complianceType: CONFIRMATION_ONLY                     │
│   requiresFiles: false                                  │
│                                                          │
│ Cliente ve botón: "Aceptar trabajo"                   │
│ Cliente hace click en aceptar                          │
│ Compliance.status = SUBMITTED                          │
│ Moderador ve y aprueba (instantáneo)                  │
│ Reclamo CERRADO                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ PARTE 5: SISTEMA DE CONFIRMACIÓN BILATERAL <a name="confirmacion"></a>

### **CONCEPTO: PEER VALIDATION (Validación entre pares)** 🔥

```
PROBLEMA TRADICIONAL:
Solo el moderador verifica → Carga alta + Puede no tener contexto técnico

SOLUCIÓN INNOVADORA:
La otra parte (víctima/afectada) PRE-VALIDA la evidencia
```

### **CÓMO FUNCIONA:**

```typescript
interface PeerValidation {
  // Después de que el responsable sube evidencia

  step1_notification: {
    to: 'otra parte (no responsable)';
    message: 'El {usuario} subió evidencia de cumplimiento';
    action: 'Ver evidencia y opinar';
  };

  step2_review: {
    options: [
      {
        action: 'APROBAR';
        effect: 'Compliance.peerApproved = true';
        consequence: 'Moderador ve señal verde, aprueba más rápido';
        label: '✅ Confirmo que cumple con lo que necesito';
      },
      {
        action: 'OBJETAR';
        effect: 'Compliance.peerObjection = "razones..."';
        consequence: 'Moderador revisa objeción con más detalle';
        label: '⚠️ Esto no cumple porque...';
        requiresReason: true;
      },
      {
        action: 'NO OPINAR';
        effect: 'Timeout de 3 días';
        consequence: 'Pasa directo a moderador sin opinión';
        label: '⏭️ (No hacer nada)';
      },
    ];
  };

  step3_moderation: {
    if_peer_approved: {
      moderatorAction: 'Revisión rápida (solo verifica)';
      probability_approval: '95%';
      time: '< 24 horas';
    };
    if_peer_objected: {
      moderatorAction: 'Revisión detallada (analiza objeción)';
      mustResolve: 'La disputa entre las partes';
      time: '24-48 horas';
    };
    if_no_opinion: {
      moderatorAction: 'Revisión estándar';
      time: '24-48 horas';
    };
  };
}
```

### **BENEFICIOS DEL PEER VALIDATION:**

```
✅ Reduce carga de moderadores (pre-filtro)
✅ Acelera aprobaciones cuando ambas partes de acuerdo
✅ Detecta problemas antes de moderación
✅ Empodera a los usuarios (no solo esperan)
✅ Más transparencia (ambas partes ven todo)
✅ Mejor satisfacción (sienten que tienen voz)
```

### **IMPLEMENTACIÓN TÉCNICA:**

```typescript
// Nuevo campo en ClaimCompliance entity
@Entity('claim_compliances')
export class ClaimCompliance {
  // ... campos existentes

  @Column({ nullable: true, default: null })
  peerReviewedBy: string; // userId de quien revisó

  @Column({ nullable: true, default: null })
  peerApproved: boolean; // true = aprobó, false = objetó, null = no opinó

  @Column({ type: 'text', nullable: true })
  peerObjection: string; // Razón de la objeción

  @Column({ nullable: true })
  peerReviewedAt: Date;

  @Column({ default: 3 })
  peerReviewDeadlineDays: number; // Plazo para opinar
}

// Nuevo use case
@Injectable()
export class PeerReviewComplianceUseCase {
  async execute(dto: PeerReviewComplianceDto): Promise<void> {
    // 1. Validar que el usuario es "la otra parte"
    const compliance = await this.complianceRepo.findOne(dto.complianceId);
    const claim = await this.claimRepo.findOne(compliance.claimId);

    const isOtherParty =
      (claim.claimantUserId === dto.userId &&
        compliance.responsibleUserId === claim.defendantUserId) ||
      (claim.defendantUserId === dto.userId &&
        compliance.responsibleUserId === claim.claimantUserId);

    if (!isOtherParty)
      throw new ForbiddenException('No eres parte del reclamo');

    // 2. Registrar la revisión
    compliance.peerReviewedBy = dto.userId;
    compliance.peerApproved = dto.approved;
    compliance.peerObjection = dto.objection;
    compliance.peerReviewedAt = new Date();

    // 3. Actualizar estado si aprobó
    if (dto.approved) {
      compliance.status = ComplianceStatus.PEER_APPROVED;
    } else if (dto.objection) {
      compliance.status = ComplianceStatus.PEER_OBJECTED;
    }

    await this.complianceRepo.save(compliance);

    // 4. Notificar al moderador
    await this.notificationService.notifyModerator({
      type: dto.approved ? 'PEER_APPROVED' : 'PEER_OBJECTED',
      complianceId: compliance.id,
      message: dto.approved
        ? 'Ambas partes están de acuerdo'
        : `Objeción: ${dto.objection}`,
    });
  }
}
```

---

## 💡 PARTE 6: IDEAS INNOVADORAS Y CREATIVAS <a name="ideas"></a>

### **IDEA 1: Sistema de Milestones (Cumplimientos por Etapas)** 🎯

```
Para reclamos complejos que requieren múltiples entregas:

Ejemplo: "Proveedor debe rehacer 5 pantallas de la app"

┌─────────────────────────────────────────────────────────┐
│ Se crean 5 COMPLIANCES en cascada:                     │
│                                                          │
│ ✅ Milestone 1: Pantalla de login (2 días)            │
│    → Cliente pre-aprueba → Moderador aprueba           │
│                                                          │
│ 🔄 Milestone 2: Pantalla de perfil (2 días)           │
│    → Cliente objetó → Moderador requiere ajuste        │
│    → Proveedor corrige → Cliente aprueba               │
│                                                          │
│ ⏳ Milestone 3: Dashboard (3 días)                     │
│    → En progreso...                                     │
│                                                          │
│ ⏸️ Milestone 4: Configuración (2 días)                │
│    → Bloqueado hasta que #3 termine                    │
│                                                          │
│ ⏸️ Milestone 5: Notificaciones (2 días)               │
│    → Bloqueado hasta que #4 termine                    │
└─────────────────────────────────────────────────────────┘

BENEFICIOS:
✅ Progreso visible para ambas partes
✅ Pagos parciales al completar milestones
✅ Detecta problemas temprano
✅ Reduce riesgo de rechazo total al final
```

### **IDEA 2: Plazos Dinámicos Según Complejidad** ⏰

```typescript
enum ComplianceComplexity {
  SIMPLE = 'simple',      // 2 días (confirmar, subir doc)
  MEDIUM = 'medium',      // 7 días (reentrega menor)
  COMPLEX = 'complex',    // 14 días (rehacer completo)
  VERY_COMPLEX = 'very_complex' // 21 días (desarrollo)
}

class DeadlineCalculator {
  calculate(complianceType: ComplianceType, context: any): number {
    const baseDeadlines = {
      CONFIRMATION_ONLY: 2,
      EVIDENCE_UPLOAD: 3,
      PARTIAL_PAYMENT: 3,
      PAYMENT_REQUIRED: 5,
      CORRECTED_DELIVERY: 7,
      FULL_REDELIVERY: 14,
    };

    let days = baseDeadlines[complianceType];

    // Ajustes dinámicos:
    if (context.fileSize > 1GB) days += 2; // Archivos pesados
    if (context.isFirstOffense) days += 3; // Primera vez
    if (context.userReputation > 4.5) days -= 1; // Buen historial
    if (context.weekday === 'friday') days += 2; // Fin de semana

    return days;
  }
}
```

### **IDEA 3: Sistema de Escalamiento Inteligente** 🚨

```
NIVEL 1: AUTO-RESOLUCIÓN
- Casos simples donde peer validation = approved
- Moderador solo hace check rápido
- 80% de casos

NIVEL 2: MODERACIÓN ESTÁNDAR
- Casos sin consenso de las partes
- Moderador analiza en detalle
- 15% de casos

NIVEL 3: PANEL DE MODERADORES
- Casos donde hay múltiples objeciones
- 3 moderadores votan (mayoría decide)
- 4% de casos

NIVEL 4: ADMINISTRACIÓN + LEGAL
- Violaciones graves, amenazas legales
- Requiere decisión ejecutiva
- 1% de casos

┌─────────────────────────────────────────────────────────┐
│ Lógica de escalamiento:                                 │
│                                                          │
│ IF peerApproved = true                                  │
│    → NIVEL 1 (auto-resolución rápida)                  │
│                                                          │
│ ELSE IF peerObjection exists                           │
│    → NIVEL 2 (moderación estándar)                     │
│                                                          │
│ ELSE IF rejected > 2 times                             │
│    → NIVEL 3 (panel de moderadores)                    │
│                                                          │
│ ELSE IF involves legal threats OR > $5000              │
│    → NIVEL 4 (admin + legal)                           │
└─────────────────────────────────────────────────────────┘
```

### **IDEA 4: Score de Cumplimiento (Compliance Score)** 📊

```typescript
interface ComplianceScore {
  userId: string;

  metrics: {
    totalCompliances: number;
    approvedFirstTime: number;      // Aprobados a la primera
    requiredAdjustments: number;     // Requirieron corrección
    rejected: number;                 // Rechazados
    overdues: number;                 // Vencidos
    averageDaysToComply: number;     // Promedio días en cumplir
  };

  score: number; // 0-100

  badge: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';

  consequences: {
    if_excellent: [
      'Plazos extendidos (+2 días)',
      'Priority support',
      'Badge en perfil'
    ],
    if_poor: [
      'Plazos reducidos (-1 día)',
      'Más supervisión',
      'Advertencia visible'
    ],
    if_critical: [
      'Suspensión preventiva',
      'Todos los reclamos a NIVEL 3',
      'Requiere fianza'
    ]
  };
}

// Cálculo del score
calculateComplianceScore(metrics): number {
  const weights = {
    approvedFirstTime: 10,    // +10 puntos por cada uno
    requiredAdjustments: -3,  // -3 puntos
    rejected: -8,             // -8 puntos
    overdues: -15,            // -15 puntos (grave)
  };

  let score = 100;
  score += metrics.approvedFirstTime * weights.approvedFirstTime;
  score += metrics.requiredAdjustments * weights.requiredAdjustments;
  score += metrics.rejected * weights.rejected;
  score += metrics.overdues * weights.overdues;

  // Bonus por rapidez
  if (metrics.averageDaysToComply < 2) score += 10;

  return Math.max(0, Math.min(100, score));
}
```

### **IDEA 5: Mediación Asistida (Chat en vivo durante compliance)** 💬

```
Durante el periodo de cumplimiento, habilitar chat 3-way:

┌─────────────────────────────────────────────────────────┐
│  CHAT DE COMPLIANCE #123                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [RECLAMANTE] ¿El logo debe incluir el slogan?         │
│  [MODERADOR] Sí, según cotización original              │
│  [RECLAMADO] Entendido, lo agrego en 1 hora            │
│                                                          │
│  [RECLAMADO] subió: logo-v3-con-slogan.ai              │
│  [RECLAMANTE] Perfecto, ese sí me sirve ✅            │
│  [MODERADOR] Aprobado, cerrando reclamo                │
│                                                          │
└─────────────────────────────────────────────────────────┘

BENEFICIOS:
✅ Resuelve dudas en tiempo real
✅ Evita rechazos por malentendidos
✅ Acelera el proceso
✅ Mejor comunicación = mejor resultado
✅ Trazabilidad de toda la conversación
```

### **IDEA 6: Compliance Templates (Plantillas pre-configuradas)** 📋

```typescript
// Moderador puede usar templates para resoluciones comunes

const COMPLIANCE_TEMPLATES = {
  LOGO_REDESIGN: {
    complianceType: 'CORRECTED_DELIVERY',
    deadline: 7,
    instructions: `
      Debes entregar nueva versión del logo que incluya:
      - Formato vectorial (.AI o .SVG)
      - Versión en color y blanco/negro
      - Variaciones horizontal y vertical
      - Archivos fuente editables
    `,
    requiredFiles: ['*.ai', '*.svg'],
    milestones: [
      { name: 'Bocetos', days: 2 },
      { name: 'Versión color', days: 3 },
      { name: 'Versiones finales', days: 2 },
    ],
  },

  REFUND_PARTIAL: {
    complianceType: 'PARTIAL_REFUND',
    deadline: 5,
    instructions: `
      Debes devolver el {percentage}% del pago ({amount} {currency}).
      
      Transferir a:
      - Nombre: {clientName}
      - Método: {paymentMethod}
      
      Luego subir comprobante de transferencia.
    `,
    requiredFiles: ['comprobante.*'],
  },

  PAYMENT_OVERDUE: {
    complianceType: 'PAYMENT_REQUIRED',
    deadline: 3,
    instructions: `
      Debes completar el pago de {amount} {currency}.
      
      Link de pago: {paymentLink}
      
      Si no pagas en {deadline} días, serás suspendido.
    `,
    autoPaymentLink: true,
  },
};

// Moderador selecciona template, sistema completa variables
```

---

## ⚠️ PARTE 7: SISTEMA DE CONSECUENCIAS PROGRESIVAS <a name="consecuencias"></a>

### **NIVELES DE INCUMPLIMIENTO:**

```
NIVEL 0: Usuario cumple bien
         ↓
         (No pasa nada, todo bien)

NIVEL 1: Vence plazo sin cumplir (OVERDUE)
         ↓
         ✉️ EMAIL ADVERTENCIA URGENTE
         ⏰ Plazo extendido: +50% días
         ⚠️ Marca visible en perfil

NIVEL 2: Vence plazo extendido (WARNING)
         ↓
         🚫 SUSPENSIÓN TEMPORAL (7 días)
         💰 Bloqueo de nuevos servicios
         📧 Email a admin para revisión
         ⏰ Último plazo: +25% días

NIVEL 3: Vence último plazo (CRITICAL)
         ↓
         ⛔ BAN PERMANENTE
         💸 Pérdida de pagos pendientes
         📝 Reporte a sistema de reputación
         🔒 No puede crear nueva cuenta

EXCEPCIÓN: Si el usuario responde antes del ban
           ↓
           REVISIÓN MANUAL POR ADMIN
           (Puede darse una última oportunidad)
```

### **IMPLEMENTACIÓN TÉCNICA:**

```typescript
@Injectable()
export class ConsequenceService {
  async checkOverdueCompliances(): Promise<void> {
    // Cron job que corre cada 6 horas

    const overdueCompliances = await this.complianceRepo.find({
      where: {
        status: In([ComplianceStatus.PENDING, ComplianceStatus.SUBMITTED]),
        deadline: LessThan(new Date()),
      },
    });

    for (const compliance of overdueCompliances) {
      await this.applyConsequence(compliance);
    }
  }

  private async applyConsequence(compliance: ClaimCompliance): Promise<void> {
    const user = await this.userService.findOne(compliance.responsibleUserId);
    const hoursOverdue = this.getHoursOverdue(compliance.deadline);

    // NIVEL 1: Primera advertencia (6-24 horas de retraso)
    if (hoursOverdue >= 6 && compliance.status !== ComplianceStatus.OVERDUE) {
      compliance.status = ComplianceStatus.OVERDUE;
      compliance.warningLevel = 1;
      compliance.extendedDeadline = this.addDays(
        compliance.deadline,
        Math.ceil(compliance.originalDeadlineDays * 0.5),
      );

      await this.emailService.sendWarningEmail({
        to: user.email,
        subject: '⚠️ URGENTE: Cumplimiento vencido',
        template: 'compliance-overdue',
        data: {
          complianceId: compliance.id,
          originalDeadline: compliance.deadline,
          newDeadline: compliance.extendedDeadline,
          consequence: 'Si no cumples antes del nuevo plazo, serás suspendido',
        },
      });

      await this.complianceRepo.save(compliance);
      return;
    }

    // NIVEL 2: Suspensión (vence plazo extendido)
    if (
      compliance.warningLevel === 1 &&
      new Date() > compliance.extendedDeadline
    ) {
      compliance.status = ComplianceStatus.WARNING;
      compliance.warningLevel = 2;
      compliance.finalDeadline = this.addDays(
        compliance.extendedDeadline,
        Math.ceil(compliance.originalDeadlineDays * 0.25),
      );

      // Suspender al usuario
      await this.userService.suspend(user.id, {
        reason: 'Incumplimiento de resolución de reclamo',
        duration: 7, // días
        claimId: compliance.claimId,
      });

      await this.emailService.sendSuspensionEmail({
        to: user.email,
        subject: '🚫 CUENTA SUSPENDIDA - Incumplimiento grave',
        template: 'user-suspended',
        data: {
          suspensionDays: 7,
          reason: 'No cumpliste con la resolución del moderador',
          finalDeadline: compliance.finalDeadline,
          consequence:
            'Si no cumples antes de esta fecha final, serás baneado permanentemente',
        },
      });

      // Notificar a admin
      await this.notificationService.notifyAdmin({
        type: 'USER_SUSPENDED',
        userId: user.id,
        claimId: compliance.claimId,
        reason: 'Overdue compliance - Level 2',
      });

      await this.complianceRepo.save(compliance);
      return;
    }

    // NIVEL 3: Ban permanente (vence plazo final)
    if (
      compliance.warningLevel === 2 &&
      new Date() > compliance.finalDeadline
    ) {
      compliance.status = ComplianceStatus.ESCALATED;
      compliance.warningLevel = 3;

      // Banear al usuario
      await this.userService.ban(user.id, {
        reason: 'Incumplimiento reiterado de resolución de reclamo',
        permanent: true,
        claimId: compliance.claimId,
        evidence: [
          `Plazo original vencido: ${compliance.deadline}`,
          `Plazo extendido vencido: ${compliance.extendedDeadline}`,
          `Plazo final vencido: ${compliance.finalDeadline}`,
          `Total advertencias ignoradas: 3`,
        ],
      });

      await this.emailService.sendBanEmail({
        to: user.email,
        subject: '⛔ CUENTA BANEADA PERMANENTEMENTE',
        template: 'user-banned',
        data: {
          reason: 'Incumplimiento grave y reiterado',
          appealProcess: 'Puedes apelar contactando a admin@conexia.com',
        },
      });

      // Escalar a admin para revisión final
      await this.notificationService.notifyAdmin({
        type: 'USER_BANNED',
        userId: user.id,
        claimId: compliance.claimId,
        reason: 'Overdue compliance - Level 3 (FINAL)',
        requiresReview: true,
      });

      await this.complianceRepo.save(compliance);
    }
  }

  private getHoursOverdue(deadline: Date): number {
    const now = new Date();
    return Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60));
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
```

### **SISTEMA DE APELACIONES (NIVEL 3):**

```typescript
// Antes del ban definitivo, usuario puede apelar

interface AppealRequest {
  complianceId: string;
  userId: string;
  reason: string; // Por qué no pudo cumplir
  evidence: string[]; // Pruebas de fuerza mayor
  requestedExtension: number; // Días adicionales solicitados
}

@Injectable()
export class AppealService {
  async submitAppeal(dto: AppealRequest): Promise<void> {
    // Solo se puede apelar en WARNING (Nivel 2)
    const compliance = await this.complianceRepo.findOne(dto.complianceId);

    if (compliance.warningLevel !== 2) {
      throw new BadRequestException(
        'Solo puedes apelar en nivel de advertencia',
      );
    }

    // Crear apelación
    const appeal = await this.appealRepo.create({
      complianceId: dto.complianceId,
      userId: dto.userId,
      reason: dto.reason,
      evidence: dto.evidence,
      requestedExtension: dto.requestedExtension,
      status: 'PENDING_REVIEW',
    });

    // Pausar consecuencias temporalmente
    compliance.appealed = true;
    compliance.appealId = appeal.id;
    await this.complianceRepo.save(compliance);

    // Notificar a admin para revisión urgente
    await this.notificationService.notifyAdmin({
      type: 'APPEAL_SUBMITTED',
      appealId: appeal.id,
      userId: dto.userId,
      priority: 'HIGH',
    });
  }

  async reviewAppeal(
    appealId: string,
    decision: 'GRANTED' | 'DENIED',
  ): Promise<void> {
    const appeal = await this.appealRepo.findOne(appealId);
    const compliance = await this.complianceRepo.findOne(appeal.complianceId);

    if (decision === 'GRANTED') {
      // Dar una última oportunidad
      compliance.finalDeadline = this.addDays(
        new Date(),
        appeal.requestedExtension,
      );
      compliance.warningLevel = 2; // Mantiene en nivel 2
      compliance.appealed = false;

      // Levantar suspensión
      await this.userService.unsuspend(appeal.userId);

      await this.emailService.send({
        to: appeal.userId,
        subject: '✅ Apelación APROBADA',
        body: `Tu apelación fue aprobada. Tienes hasta ${compliance.finalDeadline} para cumplir.`,
      });
    } else {
      // Denegar apelación → Ban inmediato
      await this.userService.ban(appeal.userId, {
        reason: 'Apelación denegada - Incumplimiento grave',
        permanent: true,
      });
    }

    appeal.status = decision;
    appeal.reviewedAt = new Date();
    await this.appealRepo.save(appeal);
  }
}
```

---

## 🎭 PARTE 8: CASOS ESPECIALES <a name="casos-especiales"></a>

### **CASO ESPECIAL 1: Resolución que NO requiere cumplimiento**

```
Ejemplos:
- Reclamo rechazado por infundado
- A favor del cliente SIN pago previo (solo cierra)
- Casos de comportamiento (se cancela servicio)

Flujo:
1. Moderador resuelve → Claim.status = CLOSED directamente
2. NO se crea ningún compliance
3. Notificación a ambas partes de cierre
4. ServiceHiring actualizado automáticamente
```

### **CASO ESPECIAL 2: Cliente debe pagar, pero con integración MercadoPago**

```typescript
// Flujo automatizado completo

async resolveClaimRequiringPayment(claim: Claim): Promise<void> {
  // 1. Moderador resuelve "Cliente debe pagar $X"

  // 2. Sistema crea compliance
  const compliance = await this.createCompliance({
    claimId: claim.id,
    responsibleUserId: claim.claimantUserId, // Cliente
    complianceType: ComplianceType.PAYMENT_REQUIRED,
    amount: claim.serviceHiring.amount,
  });

  // 3. Sistema genera link de pago en MercadoPago
  const paymentLink = await this.mercadoPagoService.createPaymentLink({
    amount: compliance.amount,
    description: `Pago requerido por resolución de reclamo #${claim.id}`,
    metadata: {
      complianceId: compliance.id,
      claimId: claim.id,
      type: 'claim_compliance_payment'
    },
    notification_url: `${process.env.API_URL}/webhooks/mercadopago`
  });

  compliance.paymentLink = paymentLink.init_point;
  await this.complianceRepo.save(compliance);

  // 4. Notificar al cliente con el link
  await this.emailService.send({
    to: client.email,
    subject: 'Debes completar el pago',
    template: 'compliance-payment-required',
    data: {
      amount: compliance.amount,
      paymentLink: paymentLink.init_point,
      deadline: compliance.deadline
    }
  });
}

// Webhook de MercadoPago
@Post('/webhooks/mercadopago')
async handleMercadoPagoWebhook(@Body() webhook: any): Promise<void> {
  if (webhook.type === 'payment' && webhook.action === 'payment.created') {
    const payment = await this.mercadoPagoService.getPayment(webhook.data.id);

    if (payment.status === 'approved' && payment.metadata.type === 'claim_compliance_payment') {
      // Pago exitoso → Auto-aprobar compliance
      const compliance = await this.complianceRepo.findOne(payment.metadata.complianceId);
      compliance.status = ComplianceStatus.APPROVED;
      compliance.evidenceUrls = [payment.receipt_url];
      compliance.autoApproved = true;
      await this.complianceRepo.save(compliance);

      // Cerrar reclamo automáticamente
      await this.closeClaimAfterCompliance(compliance.claimId);
    }
  }
}
```

### **CASO ESPECIAL 3: Ambas partes deben cumplir SIMULTÁNEAMENTE**

```
Ejemplo: Intercambio de archivos + confirmación mutua

┌─────────────────────────────────────────────────────────┐
│ Compliance #1 (Proveedor):                             │
│   - Subir archivos editables                            │
│   - order: 1, dependsOn: null                           │
│   - requirement: 'parallel'                             │
│                                                          │
│ Compliance #2 (Cliente):                               │
│   - Confirmar recepción correcta                        │
│   - order: 1, dependsOn: null                           │
│   - requirement: 'parallel'                             │
│                                                          │
│ Sistema espera a que AMBOS estén en SUBMITTED          │
│ Moderador los revisa juntos                            │
│ Si ambos OK → Cierra reclamo                           │
└─────────────────────────────────────────────────────────┘

// Lógica de verificación
async checkParallelCompliances(claimId: string): Promise<void> {
  const compliances = await this.complianceRepo.find({
    where: { claimId, requirement: 'parallel' }
  });

  const allSubmitted = compliances.every(c =>
    c.status === ComplianceStatus.SUBMITTED ||
    c.status === ComplianceStatus.APPROVED
  );

  if (allSubmitted) {
    // Notificar a moderador que puede revisar ambos
    await this.notificationService.notifyModerator({
      type: 'PARALLEL_COMPLIANCES_READY',
      claimId,
      message: 'Ambas partes cumplieron, puedes revisar'
    });
  }
}
```

### **CASO ESPECIAL 4: Cumplimiento que genera nuevo servicio**

```
Ejemplo: Cliente paga extra por trabajo adicional

Flujo:
1. Compliance tipo PARTIAL_PAYMENT aprobado
2. Sistema detecta que era para "trabajo extra"
3. Crea automáticamente nuevo ServiceHiring
4. Proveedor recibe nueva contratación
5. Ciclo de trabajo normal comienza
```

---

## 🏗️ PARTE 9: ARQUITECTURA TÉCNICA <a name="arquitectura"></a>

### **NUEVAS ENTIDADES:**

```typescript
// claim-compliance.entity.ts
@Entity('claim_compliances')
export class ClaimCompliance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  claimId: string;

  @Column()
  responsibleUserId: string; // Quien debe cumplir

  @Column({
    type: 'enum',
    enum: ComplianceType,
  })
  complianceType: ComplianceType;

  @Column({
    type: 'enum',
    enum: ComplianceStatus,
    default: ComplianceStatus.PENDING,
  })
  status: ComplianceStatus;

  @Column()
  deadline: Date;

  @Column({ nullable: true })
  extendedDeadline: Date;

  @Column({ nullable: true })
  finalDeadline: Date;

  @Column({ type: 'text' })
  moderatorInstructions: string; // Lo que debe hacer

  @Column({ type: 'simple-array', nullable: true })
  evidenceUrls: string[]; // Archivos que subió

  @Column({ type: 'text', nullable: true })
  userNotes: string; // Nota del usuario al subir

  @Column({ nullable: true })
  submittedAt: Date;

  // PEER VALIDATION
  @Column({ nullable: true })
  peerReviewedBy: string;

  @Column({ nullable: true })
  peerApproved: boolean;

  @Column({ type: 'text', nullable: true })
  peerObjection: string;

  @Column({ nullable: true })
  peerReviewedAt: Date;

  // MODERADOR REVIEW
  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  moderatorNotes: string;

  @Column({ nullable: true })
  rejectionReason: string;

  // CONSECUENCIAS
  @Column({ default: 0 })
  warningLevel: number; // 0, 1, 2, 3

  @Column({ default: false })
  appealed: boolean;

  @Column({ nullable: true })
  appealId: string;

  // DEPENDENCIAS (para compliances secuenciales)
  @Column({ nullable: true })
  dependsOn: string; // ID de otro compliance

  @Column({ default: 1 })
  order: number; // Orden de ejecución

  @Column({ default: 'sequential' })
  requirement: 'sequential' | 'parallel';

  // MONTOS (si aplica)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ nullable: true })
  paymentLink: string; // Link de MercadoPago

  @Column({ default: false })
  autoApproved: boolean; // Si se aprobó automáticamente

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Claim, (claim) => claim.compliances)
  claim: Claim;
}
```

### **MODIFICACIONES EN CLAIM ENTITY:**

```typescript
// claim.entity.ts (agregar)
@Entity('claims')
export class Claim {
  // ... campos existentes

  @Column({ nullable: true })
  claimantUserId: string; // ID del reclamante

  @Column({ nullable: true })
  defendantUserId: string; // ID del reclamado

  @OneToMany(() => ClaimCompliance, (compliance) => compliance.claim)
  compliances: ClaimCompliance[];

  @Column({ type: 'text', nullable: true })
  finalOutcome: string; // Resultado final del reclamo

  @Column({ nullable: true })
  closedAt: Date;
}
```

### **NUEVOS USE CASES:**

```
services/src/service-hirings/services/use-cases/
├── compliance/
│   ├── create-compliance.use-case.ts
│   ├── submit-compliance.use-case.ts
│   ├── peer-review-compliance.use-case.ts
│   ├── moderator-review-compliance.use-case.ts
│   ├── reject-compliance.use-case.ts
│   └── check-overdue-compliances.use-case.ts (cron)
├── claims/
│   └── resolve-claim.use-case.ts (MODIFICAR)
```

### **NUEVOS ENDPOINTS:**

```typescript
// compliance.controller.ts

@Controller('service-hirings/:hiringId/claims/:claimId/compliances')
export class ComplianceController {
  // Obtener compliances de un reclamo
  @Get()
  async getCompliances(@Param('claimId') claimId: string) {
    return this.complianceService.findByClaimId(claimId);
  }

  // Subir evidencia de cumplimiento
  @Post(':complianceId/submit')
  @UseInterceptors(FilesInterceptor('files', 10))
  async submitCompliance(
    @Param('complianceId') complianceId: string,
    @Body() dto: SubmitComplianceDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.submitComplianceUseCase.execute({
      complianceId,
      userId: dto.userId,
      notes: dto.notes,
      files,
    });
  }

  // Peer review (otra parte revisa)
  @Post(':complianceId/peer-review')
  async peerReview(
    @Param('complianceId') complianceId: string,
    @Body() dto: PeerReviewDto,
  ) {
    return this.peerReviewUseCase.execute({
      complianceId,
      userId: dto.userId,
      approved: dto.approved,
      objection: dto.objection,
    });
  }

  // Moderador revisa
  @Post(':complianceId/review')
  @Roles('moderador')
  async moderatorReview(
    @Param('complianceId') complianceId: string,
    @Body() dto: ModeratorReviewDto,
  ) {
    return this.moderatorReviewUseCase.execute({
      complianceId,
      moderatorId: dto.moderatorId,
      decision: dto.decision, // 'approve' | 'reject' | 'adjust'
      notes: dto.notes,
      rejectionReason: dto.rejectionReason,
    });
  }
}
```

### **CRON JOB:**

```typescript
// compliance-checker.service.ts

@Injectable()
export class ComplianceCheckerService {
  @Cron('0 */6 * * *') // Cada 6 horas
  async checkOverdueCompliances(): Promise<void> {
    const overdueCompliances = await this.complianceRepo.find({
      where: {
        status: In([ComplianceStatus.PENDING, ComplianceStatus.SUBMITTED]),
        deadline: LessThan(new Date()),
        appealed: false,
      },
    });

    for (const compliance of overdueCompliances) {
      await this.consequenceService.applyConsequence(compliance);
    }
  }

  @Cron('0 0 * * *') // Diario a medianoche
  async sendDeadlineReminders(): Promise<void> {
    // Enviar recordatorios 24h antes del vencimiento
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const expiringCompliances = await this.complianceRepo.find({
      where: {
        status: ComplianceStatus.PENDING,
        deadline: Between(new Date(), tomorrow),
      },
    });

    for (const compliance of expiringCompliances) {
      await this.emailService.sendDeadlineReminder(compliance);
    }
  }
}
```

---

## ✅ PARTE 10: COBERTURA DE CASOS DE USO <a name="cobertura"></a>

### **VERIFICACIÓN: ¿Cubre la mayoría de reclamos?**

```
✅ Reclamos de clientes (6 tipos):
   1. No entregó trabajo → SÍ cubre (compliance: reentrega o evidencia)
   2. Trabajo no corresponde → SÍ cubre (compliance: reentrega corregida)
   3. Trabajo defectuoso → SÍ cubre (compliance: corrección)
   4. Comunicación/actitud → PARCIAL (subjetivo, cierre directo)
   5. Violaciones graves → PARCIAL (escala a legal)
   6. Problemas técnicos → NO APLICA (soporte, no reclamo)

✅ Reclamos de proveedores (5 tipos):
   1. No me pagó → SÍ cubre (compliance: pago forzoso)
   2. Revisiones excesivas → SÍ cubre (compliance: confirmación)
   3. Cliente abusivo → PARCIAL (cierre directo)
   4. Usa trabajo sin pagar → SÍ cubre (compliance: pago urgente)
   5. Falsas acusaciones → SÍ cubre (compliance: evidencia)

COBERTURA TOTAL: 9 de 11 tipos = 81% ✅

Los 2 casos no cubiertos (comunicación, abusivo) son subjetivos
y se resuelven con cierre directo sin necesidad de compliance.
```

### **CASOS EDGE CUBIERTOS:**

```
✅ Ambas partes deben cumplir (secuencial)
✅ Ambas partes deben cumplir (paralelo)
✅ Solo reclamado cumple
✅ Solo reclamante cumple
✅ No requiere cumplimiento (cierre directo)
✅ Compliance en múltiples etapas (milestones)
✅ Pagos automatizados (MercadoPago)
✅ Devoluciones manuales (con verificación)
✅ Confirmaciones simples (sin archivos)
✅ Evidencias documentales
✅ Reentregas de archivos
```

### **BENEFICIOS DEL SISTEMA COMPLETO:**

```
1. ✅ Trazabilidad total (audit trail)
2. ✅ Automatización de consecuencias (reduce carga admin)
3. ✅ Peer validation (reduce carga moderadores)
4. ✅ Notificaciones automáticas (email + in-app)
5. ✅ Plazos dinámicos según complejidad
6. ✅ Sistema de apelaciones (justicia)
7. ✅ Score de cumplimiento (reputación)
8. ✅ Integración con pagos (automático)
9. ✅ Escalamiento inteligente (casos complejos)
10. ✅ Dashboard completo para moderadores
```

---

## 🎯 RESUMEN EJECUTIVO

### **FLUJO SIMPLIFICADO:**

```
1. Usuario crea reclamo + evidencias
2. Moderador analiza (puede pedir clarificación)
3. Moderador resuelve (cliente/proveedor favor o acuerdo)
4. Sistema crea compliance(s) automáticamente
5. Usuario responsable sube evidencia de cumplimiento
6. Otra parte puede pre-aprobar o objetar (peer validation)
7. Moderador revisa y aprueba/rechaza
8. Si aprueba → Reclamo cerrado
9. Si rechaza → Usuario corrige y reenvía
10. Si no cumple en plazo → Suspensión → Ban
```

### **INNOVACIONES CLAVE:**

1. **Peer Validation**: La otra parte pre-valida (acelera proceso)
2. **Compliance Score**: Sistema de reputación
3. **Plazos Dinámicos**: Ajustados según complejidad
4. **Consecuencias Progresivas**: Advertencia → Suspensión → Ban
5. **Escalamiento Inteligente**: 4 niveles según gravedad
6. **Templates**: Moderadores trabajan más rápido
7. **Milestones**: Cumplimientos por etapas
8. **Chat 3-way**: Comunicación en tiempo real

### **IMPLEMENTACIÓN:**

```
Fase 1 (2-3 días):
- Migración SQL (claim_compliances table)
- Entidad ClaimCompliance
- Modificar Claim entity

Fase 2 (3-4 días):
- Use cases de compliance
- Endpoints API
- Integración con MercadoPago

Fase 3 (2 días):
- Cron job verificación
- Sistema de consecuencias
- Notificaciones email

Fase 4 (2 días):
- Peer validation
- Dashboard moderadores
- Testing integral

TOTAL: 9-11 días
```

**¿Procedemos con la implementación?** 🚀
