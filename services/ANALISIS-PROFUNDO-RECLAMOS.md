# 📊 Análisis Profundo: Sistema de Reclamos y Cumplimiento Post-Resolución

## 🔍 Análisis Exhaustivo de Tipos de Reclamos

### **RECLAMOS DEL CLIENTE** (4 tipos principales + expansiones)

#### 1. **NO SE ENTREGÓ EL TRABAJO** (`not_delivered`)

**Escenarios reales:**

- ❌ Proveedor desapareció, no responde mensajes
- ❌ Proveedor dijo que entregó pero no hay evidencia en la plataforma
- ❌ Pasó el plazo acordado sin entrega
- ❌ Proveedor canceló unilateralmente sin aviso

**Resoluciones posibles:**

- **A favor del cliente (90% de casos)**:
  - ✅ **Acción requerida**: Reembolso completo automático
  - ✅ **Evidencia**: Sistema registra automáticamente si hubo pago
  - ✅ **Cumplimiento**: No requiere acción del proveedor (ya no está)
- **A favor del proveedor** (casos raros):
  - Escenario: Cliente mintió, sí hubo entrega pero fuera de plataforma
  - ✅ **Acción requerida**: Proveedor debe subir EVIDENCIAS:
    - Screenshots de conversaciones donde cliente confirmó recepción
    - Emails/WhatsApp con confirmaciones
    - Prueba de que cliente usó el trabajo
  - ✅ **Cumplimiento**: Cliente debe pagar (si no pagó) o se marca como completado

- **Acuerdo parcial**:
  - Proveedor entregó algo pero incompleto
  - ✅ **Acción requerida**:
    - Proveedor completa la entrega (sube archivos faltantes)
    - O se hace reembolso parcial (ej: 50%)

---

#### 2. **ENTREGA FUERA DE LO ACORDADO** (`off_agreement`)

**Escenarios reales:**

- ❌ Proveedor entregó algo diferente a lo cotizado
- ❌ Falta funcionalidad/características prometidas
- ❌ Formato incorrecto (pedí PSD, me dio PNG)
- ❌ Cantidad incorrecta (pedí 5 logos, recibí 3)
- ❌ Plazo no cumplido (entrega muy tarde)

**Resoluciones posibles:**

- **A favor del cliente**:
  - ✅ **Acción requerida**: Reembolso total o parcial
  - ✅ **Cumplimiento**: Automático (reembolso) + registro de incumplimiento del proveedor

- **A favor del proveedor**:
  - Escenario: Cliente cambió de opinión o malinterpretó la cotización
  - ✅ **Acción requerida**: Proveedor sube evidencias:
    - Captura de la cotización original donde está claro lo acordado
    - Prueba de que lo entregado coincide con la cotización
    - Mensajes donde cliente aceptó los términos
  - ✅ **Cumplimiento**: Se marca como completado, cliente no recibe reembolso

- **Acuerdo parcial** (MÁS COMÚN):
  - ✅ **Acción requerida**:
    - **OPCIÓN A**: Proveedor completa/corrige la entrega
      - Proveedor sube nueva versión con correcciones
      - Cliente confirma que ahora está bien
      - Moderador verifica antes de aprobar pago
    - **OPCIÓN B**: Reembolso parcial proporcional
      - Ej: "Entregaste 3 de 5 logos → reembolso 40%"
      - Proveedor sube comprobante de transferencia
      - Cliente confirma recepción del reembolso

---

#### 3. **ENTREGA DEFECTUOSA** (`defective_delivery`)

**Escenarios reales:**

- ❌ Archivos corruptos/no abren
- ❌ Calidad pésima (pixelado, mal hecho)
- ❌ Errores graves (código no funciona, diseño con typos)
- ❌ No cumple estándares profesionales mínimos
- ❌ Plagio detectado

**Resoluciones posibles:**

- **A favor del cliente**:
  - ✅ **Acción requerida**: Reembolso + posible sanción al proveedor
  - ✅ **Cumplimiento**: Automático

- **A favor del proveedor**:
  - Escenario: Cliente tiene expectativas irrealistas o no sabe del tema
  - ✅ **Acción requerida**: Proveedor demuestra que:
    - El trabajo cumple estándares profesionales (evidencias de calidad)
    - Cliente aprobó versiones preliminares
    - El "defecto" es subjetivo/opinión personal
  - ✅ **Cumplimiento**: Se marca como completado

- **Acuerdo parcial** (MUY COMÚN):
  - ✅ **Acción requerida**:
    - Proveedor **corrige los defectos** y re-entrega
    - Sube nueva versión mejorada
    - Cliente verifica y confirma
    - Moderador aprueba antes de liberar pago

---

#### 4. **OTROS PROBLEMAS DEL CLIENTE** (`client_other`)

**Escenarios reales adicionales:**

- ❌ **Comunicación pésima**: Proveedor tarda días en responder
- ❌ **Falta de profesionalismo**: Actitudes groseras, no cumple horarios
- ❌ **Uso no autorizado**: Proveedor usó el trabajo del cliente en su portafolio sin permiso
- ❌ **Violación de NDA**: Compartió información confidencial
- ❌ **Seguridad**: Entrega con virus/malware
- ❌ **Derechos de autor**: Usó assets con licencia sin pagar
- ❌ **No cumple requisitos legales**: Ej: Factura no válida

**Resoluciones**: Varían según el caso, similar a los anteriores

---

### **RECLAMOS DEL PROVEEDOR** (2 tipos principales + expansiones)

#### 5. **NO SE RECIBIÓ EL PAGO** (`payment_not_received`)

**Escenarios reales:**

- ❌ Cliente no completó el pago en MercadoPago
- ❌ Cliente canceló el pago después de recibir entrega
- ❌ Problemas técnicos con la plataforma de pago
- ❌ Cliente reclama problema con el banco (pero el trabajo ya fue entregado)
- ❌ Cliente desapareció después de recibir todo

**Resoluciones posibles:**

- **A favor del proveedor** (MÁS COMÚN):
  - ✅ **Acción requerida**:
    - Sistema verifica estado del pago automáticamente
    - Si el pago está `PENDING` → Se procesa manualmente
    - Si el cliente canceló → Se le exige pagar o banear
  - ✅ **Cumplimiento**:
    - **CLIENTE debe pagar**: Sistema genera nuevo link de pago
    - Cliente tiene X días para pagar o se banea
    - Proveedor puede subir evidencias adicionales de entrega

- **A favor del cliente**:
  - Escenario: Proveedor no entregó nada válido
  - ✅ **Acción requerida**: Se cancela la orden, no hay pago
  - ✅ **Cumplimiento**: Automático

- **Acuerdo parcial**:
  - Entrega parcial/incompleta
  - ✅ **Acción requerida**:
    - Se calcula pago proporcional
    - Cliente paga el % acordado
    - Proveedor puede completar entrega o aceptar pago parcial

---

#### 6. **OTROS PROBLEMAS DEL PROVEEDOR** (`provider_other`)

**Escenarios reales adicionales:**

- ❌ **Cliente cambió requirements constantemente**: "Scope creep"
- ❌ **Cliente pide trabajo extra no cotizado**: "Ahora también quiero X"
- ❌ **Falta de colaboración del cliente**: No da información necesaria a tiempo
- ❌ **Cliente abusivo**: Mensajes fuera de horario, trato irrespetuoso
- ❌ **Cliente usa trabajo antes de pagar**: Descargó y desapareció
- ❌ **Falsas revisiones**: Cliente pide "revisiones" que son trabajos nuevos
- ❌ **Amenazas**: Cliente amenaza con mala review si no le das más cosas gratis

**Resoluciones**: Varían, pero generalmente:

- A favor del proveedor → Cliente debe pagar extra o se completa con lo entregado
- A favor del cliente → Si el proveedor exagera o malinterpretó
- Acuerdo parcial → Se redefinen términos justos para ambos

---

## ✅ **VIABILIDAD DE LA OPCIÓN 1: ANÁLISIS TÉCNICO PROFUNDO**

### **¿Es viable que el RECLAMADO (no el reclamante) suba evidencias?**

**RESPUESTA: SÍ, 100% VIABLE Y NECESARIO** ✅

**Razones:**

1. **El reclamado tiene la RESPONSABILIDAD de demostrar cumplimiento**
   - Si moderador resuelve "a favor del proveedor" → Cliente debe demostrar que pagó
   - Si moderador resuelve "a favor del cliente" → Proveedor debe demostrar que reembolsó/re-entregó
   - Si es acuerdo parcial → AMBOS deben subir evidencias de su parte

2. **El reclamante YA subió sus evidencias al crear el reclamo**
   - No tiene sentido que suba más (él ya presentó su caso)
   - El reclamado es quien debe "defenderse" o "cumplir"

3. **Flujo lógico correcto:**
   ```
   RECLAMANTE crea reclamo + evidencias iniciales
        ↓
   MODERADOR revisa y resuelve
        ↓
   RECLAMADO debe cumplir con la resolución
        ↓
   RECLAMADO sube evidencias de cumplimiento
        ↓
   MODERADOR verifica que efectivamente cumplió
        ↓
   CIERRA EL RECLAMO DEFINITIVAMENTE
   ```

---

## 🏗️ **DISEÑO TÉCNICO ÓPTIMO: Sistema de Cumplimiento**

### **Arquitectura Propuesta (siguiendo estructura de Conexia)**

#### **1. Nueva Entidad: `ClaimCompliance`**

```typescript
// services/src/service-hirings/entities/claim-compliance.entity.ts
@Entity('claim_compliances')
export class ClaimCompliance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con el reclamo
  @Column({ name: 'claim_id', type: 'uuid' })
  claimId: string;

  @ManyToOne(() => Claim, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'claim_id' })
  claim: Claim;

  // Usuario responsable (el reclamado)
  @Column({ name: 'responsible_user_id', type: 'int' })
  responsibleUserId: number;

  @Column({
    name: 'responsible_role',
    type: 'enum',
    enum: ['client', 'provider'],
  })
  responsibleRole: 'client' | 'provider';

  // Tipo de cumplimiento requerido
  @Column({
    name: 'compliance_type',
    type: 'enum',
    enum: ComplianceType, // Definiremos abajo
  })
  complianceType: ComplianceType;

  // Estado del cumplimiento
  @Column({
    type: 'enum',
    enum: ComplianceStatus,
    default: ComplianceStatus.PENDING,
  })
  status: ComplianceStatus;

  // Plazo para cumplir
  @Column({ name: 'due_date', type: 'timestamp' })
  dueDate: Date;

  // Evidencias subidas por el responsable
  @Column({
    name: 'evidence_urls',
    type: 'jsonb',
    nullable: true,
    default: [],
  })
  evidenceUrls: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Revisión del moderador
  @Column({ name: 'reviewed_by', type: 'int', nullable: true })
  reviewedBy: number | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes: string | null;

  // Información de reembolso (si aplica)
  @Column({
    name: 'refund_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  refundAmount: number | null;

  @Column({ name: 'payment_id', type: 'int', nullable: true })
  paymentId: number | null; // Referencia al payment si hay reembolso automático

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### **2. Nuevos Enums**

```typescript
// services/src/service-hirings/enums/claim-compliance.enum.ts

export enum ComplianceType {
  // Reembolsos
  FULL_REFUND = 'full_refund', // Reembolso completo
  PARTIAL_REFUND = 'partial_refund', // Reembolso parcial

  // Re-entregas
  FULL_REDELIVERY = 'full_redelivery', // Re-entrega completa
  CORRECTED_DELIVERY = 'corrected_delivery', // Corrección de entrega
  ADDITIONAL_DELIVERY = 'additional_delivery', // Entrega adicional/completar

  // Pagos
  PAYMENT_REQUIRED = 'payment_required', // Cliente debe pagar
  PARTIAL_PAYMENT = 'partial_payment', // Pago parcial acordado

  // Evidencias/Documentación
  EVIDENCE_UPLOAD = 'evidence_upload', // Solo subir evidencias
  CONFIRMATION_ONLY = 'confirmation_only', // Solo confirmar (sin upload)

  // Automático
  AUTO_REFUND = 'auto_refund', // Reembolso procesado automáticamente
  NO_ACTION_REQUIRED = 'no_action_required', // No requiere acción
}

export enum ComplianceStatus {
  PENDING = 'pending', // Esperando acción del responsable
  IN_PROGRESS = 'in_progress', // Responsable empezó a subir evidencias
  SUBMITTED = 'submitted', // Evidencias subidas, esperando revisión
  UNDER_REVIEW = 'under_review', // Moderador revisando
  APPROVED = 'approved', // Moderador aprobó el cumplimiento
  REJECTED = 'rejected', // Moderador rechazó, debe rehacer
  OVERDUE = 'overdue', // Pasó el plazo sin cumplir
  ESCALATED = 'escalated', // Escalado a suspensión/ban
  AUTO_COMPLETED = 'auto_completed', // Completado automáticamente (ej: reembolso auto)
}
```

#### **3. Campos adicionales en `Claim`**

```typescript
// Agregar a services/src/service-hirings/entities/claim.entity.ts

@Column({
  name: 'compliance_required',
  type: 'boolean',
  default: false,
})
complianceRequired: boolean;

@Column({
  name: 'compliance_status',
  type: 'enum',
  enum: ['not_started', 'in_progress', 'completed', 'failed'],
  nullable: true,
})
complianceStatus: string | null;

@Column({ name: 'final_closed_at', type: 'timestamp', nullable: true })
finalClosedAt: Date | null; // Cuando se cierra DEFINITIVAMENTE tras verificar cumplimiento
```

---

## 📋 **MATRIZ DE RESOLUCIONES → CUMPLIMIENTOS**

| Reclamo                | Resolución      | Responsable | Tipo de Cumplimiento             | Evidencia Requerida       | Plazo  |
| ---------------------- | --------------- | ----------- | -------------------------------- | ------------------------- | ------ |
| `not_delivered`        | Cliente Favor   | Sistema     | `AUTO_REFUND`                    | Automático                | N/A    |
| `not_delivered`        | Proveedor Favor | Proveedor   | `EVIDENCE_UPLOAD`                | Prueba de entrega externa | 5 días |
| `not_delivered`        | Acuerdo Parcial | Proveedor   | `ADDITIONAL_DELIVERY`            | Sube trabajo faltante     | 7 días |
| `off_agreement`        | Cliente Favor   | Sistema     | `AUTO_REFUND` o `PARTIAL_REFUND` | Automático                | N/A    |
| `off_agreement`        | Proveedor Favor | Proveedor   | `EVIDENCE_UPLOAD`                | Screenshots cotización    | 5 días |
| `off_agreement`        | Acuerdo Parcial | Proveedor   | `CORRECTED_DELIVERY`             | Nueva versión corregida   | 7 días |
| `defective_delivery`   | Cliente Favor   | Sistema     | `AUTO_REFUND`                    | Automático                | N/A    |
| `defective_delivery`   | Proveedor Favor | Proveedor   | `EVIDENCE_UPLOAD`                | Prueba de calidad         | 5 días |
| `defective_delivery`   | Acuerdo Parcial | Proveedor   | `CORRECTED_DELIVERY`             | Versión corregida         | 7 días |
| `payment_not_received` | Proveedor Favor | Cliente     | `PAYMENT_REQUIRED`               | Comprobante de pago       | 3 días |
| `payment_not_received` | Cliente Favor   | Sistema     | `NO_ACTION_REQUIRED`             | N/A                       | N/A    |
| `payment_not_received` | Acuerdo Parcial | Cliente     | `PARTIAL_PAYMENT`                | Comprobante pago parcial  | 5 días |

---

## 🔄 **FLUJO COMPLETO IMPLEMENTADO**

### **Fase 1: Moderador Resuelve**

```typescript
// services/src/service-hirings/services/use-cases/resolve-claim.use-case.ts

async execute(claimId: string, resolvedBy: number, dto: ResolveClaimDto) {
  // 1. Resolver el reclamo (lógica actual)
  const claim = await this.claimRepository.resolve(...);

  // 2. Determinar si requiere cumplimiento
  const complianceRequired = this.requiresCompliance(
    claim.resolutionType,
    claim.claimType,
  );

  if (!complianceRequired) {
    // Cerrar directamente (ej: rechazado, o reembolso automático)
    await this.claimRepository.update(claim.id, {
      complianceRequired: false,
      complianceStatus: 'completed',
      finalClosedAt: new Date(),
    });
    return claim;
  }

  // 3. Crear compliance task
  const complianceConfig = this.getComplianceConfig(
    claim.resolutionType,
    claim.claimType,
  );

  const compliance = await this.complianceRepository.create({
    claimId: claim.id,
    responsibleUserId: complianceConfig.responsibleUserId,
    responsibleRole: complianceConfig.responsibleRole,
    complianceType: complianceConfig.type,
    dueDate: this.calculateDueDate(complianceConfig.daysToComply),
    status: ComplianceStatus.PENDING,
  });

  // 4. Actualizar claim
  await this.claimRepository.update(claim.id, {
    complianceRequired: true,
    complianceStatus: 'in_progress',
  });

  // 5. Notificar al responsable
  await this.notificationService.sendComplianceRequiredEmail({
    userId: compliance.responsibleUserId,
    claimId: claim.id,
    complianceType: compliance.complianceType,
    dueDate: compliance.dueDate,
  });

  // 6. Procesar reembolso automático si aplica
  if (complianceConfig.type === ComplianceType.AUTO_REFUND) {
    await this.processAutoRefund(claim, compliance);
  }

  return claim;
}
```

### **Fase 2: Usuario Sube Evidencias**

```typescript
// services/src/service-hirings/services/use-cases/submit-compliance-evidence.use-case.ts

async execute(complianceId: string, userId: number, dto: SubmitComplianceDto) {
  // 1. Verificar que el usuario es el responsable
  const compliance = await this.complianceRepository.findById(complianceId);

  if (compliance.responsibleUserId !== userId) {
    throw new ForbiddenException('No eres el responsable de este cumplimiento');
  }

  // 2. Verificar que está en estado válido
  if (![ComplianceStatus.PENDING, ComplianceStatus.REJECTED].includes(compliance.status)) {
    throw new BadRequestException('No puedes subir evidencias en este momento');
  }

  // 3. Validar archivos
  await this.validateEvidenceFiles(dto.files);

  // 4. Subir archivos (S3, Cloudinary, etc.)
  const uploadedUrls = await this.fileUploadService.uploadFiles(
    dto.files,
    `claims/${compliance.claimId}/compliance`,
  );

  // 5. Actualizar compliance
  await this.complianceRepository.update(complianceId, {
    evidenceUrls: uploadedUrls,
    notes: dto.notes,
    status: ComplianceStatus.SUBMITTED,
  });

  // 6. Notificar a moderadores
  await this.notificationService.notifyModeratorsComplianceSubmitted(compliance);

  return compliance;
}
```

### **Fase 3: Moderador Verifica**

```typescript
// services/src/service-hirings/services/use-cases/review-compliance.use-case.ts

async execute(complianceId: string, reviewedBy: number, dto: ReviewComplianceDto) {
  const compliance = await this.complianceRepository.findById(complianceId);

  if (dto.approved) {
    // ✅ APROBAR
    await this.complianceRepository.update(complianceId, {
      status: ComplianceStatus.APPROVED,
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: dto.reviewNotes,
    });

    // Cerrar el reclamo definitivamente
    await this.claimRepository.update(compliance.claimId, {
      complianceStatus: 'completed',
      finalClosedAt: new Date(),
    });

    // Notificar al responsable
    await this.notificationService.sendComplianceApprovedEmail(compliance);

  } else {
    // ❌ RECHAZAR
    await this.complianceRepository.update(complianceId, {
      status: ComplianceStatus.REJECTED,
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: dto.reviewNotes,
    });

    // Notificar que debe corregir
    await this.notificationService.sendComplianceRejectedEmail(
      compliance,
      dto.reviewNotes,
    );
  }

  return compliance;
}
```

### **Fase 4: Sistema de Plazos y Consecuencias**

```typescript
// services/src/common/cron/compliance-checker.service.ts

@Cron('0 */6 * * *') // Cada 6 horas
async checkOverdueCompliances() {
  const overdueCompliances = await this.complianceRepository.findOverdue();

  for (const compliance of overdueCompliances) {
    // Marcar como vencido
    await this.complianceRepository.update(compliance.id, {
      status: ComplianceStatus.OVERDUE,
    });

    // Aplicar consecuencias según política
    const daysSinceOverdue = this.getDaysSince(compliance.dueDate);

    if (daysSinceOverdue === 0) {
      // Primer día vencido: Advertencia
      await this.usersClient.sendWarningEmail(compliance.responsibleUserId, {
        type: 'compliance_overdue',
        claimId: compliance.claimId,
        daysRemaining: 2, // 2 días de gracia
      });

    } else if (daysSinceOverdue === 2) {
      // 2 días después: Suspensión temporal
      await this.usersClient.suspendUser({
        userId: compliance.responsibleUserId,
        reason: `No cumplió con resolución de reclamo ${compliance.claimId}`,
        days: 3,
      });

      await this.complianceRepository.update(compliance.id, {
        status: ComplianceStatus.ESCALATED,
      });

    } else if (daysSinceOverdue === 5) {
      // 5 días después: Ban permanente
      await this.usersClient.banUser({
        userId: compliance.responsibleUserId,
        reason: `Incumplimiento reiterado de resolución de reclamo`,
        claimId: compliance.claimId,
      });

      // Cerrar el reclamo como fallido
      await this.claimRepository.update(compliance.claimId, {
        complianceStatus: 'failed',
        finalClosedAt: new Date(),
      });
    }
  }
}
```

---

## 📊 **VENTAJAS DE ESTA ARQUITECTURA**

✅ **1. Separación de Responsabilidades**

- `Claim`: Representa el reclamo en sí (inmutable tras resolverse)
- `ClaimCompliance`: Representa el proceso de cumplimiento (mutable, con estados)

✅ **2. Trazabilidad Completa**

- Cada paso queda registrado con timestamps
- Historial de revisiones y rechazos
- Auditoría completa para casos legales

✅ **3. Escalabilidad**

- Fácil agregar nuevos tipos de cumplimiento
- Puede extenderse a pagos automáticos futuros
- Soporte para múltiples compliances por claim (raro pero posible)

✅ **4. Automatización Inteligente**

- Reembolsos automáticos vía Payment entity
- Notificaciones automáticas en cada paso
- Consecuencias automáticas por plazos vencidos

✅ **5. Flexibilidad**

- Moderador puede extender plazos manualmente
- Puede revocar suspensiones si hay justificación
- Permite casos especiales sin romper el flujo

✅ **6. Integración Perfecta con Arquitectura Actual**

- Usa el mismo patrón de repositorios
- Integra con microservicio Users para suspensiones
- Usa el mismo sistema de notificaciones por email
- Compatible con el State Pattern de ServiceHiring

---

## 🎯 **CONCLUSIÓN Y RECOMENDACIÓN**

### **SÍ, la Opción 1 es TOTALMENTE VIABLE y es la MEJOR opción porque:**

1. ✅ **Cubre TODOS los tipos de reclamos** (actuales y futuros)
2. ✅ **Permite verificación real** del cumplimiento
3. ✅ **Automatiza lo automatizable** (reembolsos, suspensiones)
4. ✅ **Da control a moderadores** (revisión final)
5. ✅ **Escala perfectamente** con el crecimiento de Conexia
6. ✅ **Sigue las mejores prácticas** de arquitectura de software
7. ✅ **Se integra naturalmente** con tu backend actual
8. ✅ **Protege a ambas partes**: Cliente y Proveedor tienen proceso justo
9. ✅ **Genera confianza**: Los usuarios ven que Conexia sí hace seguimiento
10. ✅ **Reduce carga de moderadores**: Solo verifican, no ejecutan manualmente

### **Estimación de Implementación Realista:**

**Fase 1 - Base (2-3 días):**

- ✅ Migración SQL: Tabla `claim_compliances` + nuevos campos en `claims`
- ✅ Entidad TypeORM + Repository
- ✅ DTOs básicos

**Fase 2 - Lógica Core (3-4 días):**

- ✅ Crear compliance al resolver claim
- ✅ Submit evidence endpoint
- ✅ Review compliance endpoint
- ✅ Auto-refund logic

**Fase 3 - Cron y Consecuencias (2 días):**

- ✅ Job de verificación de plazos
- ✅ Integración con Users para suspensiones/bans
- ✅ Sistema de notificaciones

**Fase 4 - Frontend Support (1 día):**

- ✅ Endpoints GET para dashboard moderador
- ✅ Endpoints GET para usuarios (ver su compliance pendiente)

**TOTAL: 8-10 días de desarrollo** (1 desarrollador full-time)

---

## 🚀 **¿Empezamos a implementar?**

Si estás de acuerdo, empezaré por:

1. Crear la migración SQL
2. Crear las entidades y enums
3. Implementar los casos de uso principales
4. Integrar con el flujo de resolución existente

¿Procedo? 🎯
