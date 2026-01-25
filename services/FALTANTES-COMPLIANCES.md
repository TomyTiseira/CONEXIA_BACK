# 🔧 Faltantes de Implementación - Sistema de Compliances

## ✅ Ya Implementado

1. **Base de Datos**
   - ✅ Tabla `claim_compliances` creada
   - ✅ Enum `claim_compliances_compliance_type_enum` actualizado con todos los valores
   - ✅ Enum `claim_compliances_status_enum` creado

2. **Backend - DTOs y Validaciones**
   - ✅ `CreateComplianceItemDto` en services y api-gateway
   - ✅ Validación de máximo 5 compliances por resolución
   - ✅ Validación de instrucciones (20-2000 caracteres)
   - ✅ Validación de deadline (1-90 días)

3. **Backend - Use Cases**
   - ✅ `ResolveClaimUseCase` crea compliances al resolver claim
   - ✅ `CreateComplianceUseCase` guarda compliances en DB
   - ✅ `GetClaimDetailUseCase` trae compliances del claim
   - ✅ Validación de responsables (deben ser parte del claim)

4. **Backend - Emails**
   - ✅ `sendComplianceCreatedEmail` implementado en NodemailerService
   - ✅ Email HTML con formato profesional
   - ✅ Email enviado a usuarios con compliances asignados

---

## ❌ Pendientes Críticos

### 1. **Endpoints de Consulta NO traen compliances** 🚨

#### Problema:

- `GET /api/claims` (lista de claims del admin) NO trae campo `compliance`
- `GET /api/claims/my-claims` (lista del usuario) NO trae campo `compliance`

#### Solución Requerida:

Modificar los use cases de listado para incluir el primer compliance pendiente/activo de cada claim:

**Archivos a modificar:**

- `services/src/service-hirings/services/use-cases/get-admin-claims.use-case.ts`
- `services/src/service-hirings/services/use-cases/get-user-claims.use-case.ts`

**Lógica:**

```typescript
// Para cada claim, obtener el primer compliance activo
const compliance = await this.complianceRepository.findOne({
  where: {
    claimId: claim.id,
    status: In(['pending', 'submitted', 'overdue', 'warning']),
  },
  order: {
    orderNumber: 'ASC',
    createdAt: 'ASC',
  },
});
```

---

### 2. **Falta campo `availableActions` con acciones de compliance** 🚨

#### Problema:

Los claims NO retornan las acciones disponibles para interactuar con compliances:

- `upload_compliance_evidence` (usuario sube evidencia)
- `review_compliance` (moderador aprueba/rechaza)

#### Solución Requerida:

Extender la lógica de `getAvailableActions()` en:

- `services/src/service-hirings/services/use-cases/get-admin-claims.use-case.ts`
- `services/src/service-hirings/services/use-cases/get-user-claims.use-case.ts`
- `services/src/service-hirings/services/use-cases/get-claim-detail.use-case.ts`

**Nueva lógica:**

```typescript
// Si el claim está resolved y tiene compliances
if (claim.status === 'resolved') {
  const compliances = await this.complianceRepository.findByClaimId(claim.id);

  for (const compliance of compliances) {
    // Si es el responsable y está pending, puede subir evidencia
    if (
      compliance.responsibleUserId === String(userId) &&
      compliance.status === 'pending'
    ) {
      actions.push('upload_compliance_evidence');
    }

    // Si es staff y está submitted, puede revisar
    if (isStaff && compliance.status === 'submitted') {
      actions.push('review_compliance');
    }
  }
}
```

---

### 3. **Endpoint para subir evidencia de compliance** 🚨

#### Falta Crear:

**Archivo**: `services/src/service-hirings/services/use-cases/submit-compliance.use-case.ts`

**Lógica:**

```typescript
async execute(params: {
  complianceId: string;
  userId: number;
  userResponse: string;
  evidenceFiles: Express.Multer.File[];
}) {
  // 1. Validar que el compliance existe
  const compliance = await this.complianceRepository.findById(params.complianceId);

  // 2. Validar que el usuario es el responsable
  if (compliance.responsibleUserId !== String(params.userId)) {
    throw new ForbiddenException('No autorizado');
  }

  // 3. Validar que está en pending
  if (compliance.status !== 'pending') {
    throw new BadRequestException('El compliance no está pendiente');
  }

  // 4. Guardar archivos en /uploads/compliances/
  const evidenceUrls = await this.uploadFiles(params.evidenceFiles);

  // 5. Actualizar compliance
  await this.complianceRepository.update(params.complianceId, {
    status: 'submitted',
    userNotes: params.userResponse,
    evidenceUrls,
    submittedAt: new Date()
  });

  // 6. Notificar al moderador
  await this.emailService.sendComplianceSubmittedEmail(...);

  return compliance;
}
```

**También crear:**

- `api-gateway/src/service-hirings/compliances.controller.ts` → `POST /compliances/:id/submit`
- Pattern de NATS: `submitCompliance`

---

### 4. **Endpoint para aprobar/rechazar compliance** 🚨

#### Falta Crear:

**Archivo**: `services/src/service-hirings/services/use-cases/review-compliance.use-case.ts`

**Lógica:**

```typescript
async execute(params: {
  complianceId: string;
  moderatorId: number;
  approved: boolean;
  comment?: string;
}) {
  // 1. Validar que el compliance existe y está submitted
  const compliance = await this.complianceRepository.findById(params.complianceId);

  if (compliance.status !== 'submitted') {
    throw new BadRequestException('Solo se pueden revisar compliances enviados');
  }

  // 2. Si aprobado
  if (params.approved) {
    await this.complianceRepository.update(params.complianceId, {
      status: 'approved',
      reviewedBy: String(params.moderatorId),
      reviewedAt: new Date(),
      moderatorNotes: params.comment
    });

    // Notificar al usuario
    await this.emailService.sendComplianceApprovedEmail(...);

  } else {
    // 3. Si rechazado
    await this.complianceRepository.update(params.complianceId, {
      status: 'pending',
      rejectionCount: compliance.rejectionCount + 1,
      rejectionReason: params.comment,
      // Reducir deadline 20%
      deadline: this.calculateReducedDeadline(compliance.deadline)
    });

    // Notificar al usuario
    await this.emailService.sendComplianceRejectedEmail(...);
  }

  return compliance;
}
```

**También crear:**

- Endpoint en API Gateway: `POST /compliances/:id/review`
- Pattern de NATS: `reviewCompliance`

---

### 5. **Emails de compliance NO se están enviando correctamente** ⚠️

#### Problema:

El método `sendComplianceCreatedEmail` está implementado pero parece no enviarse o no incluir toda la información.

#### Solución:

Verificar que se está llamando correctamente en `ResolveClaimUseCase.sendResolutionNotifications()`:

**Revisar:**

1. Que los emails se envíen después de crear los compliances
2. Que el array de compliances tenga datos
3. Que el método `sendComplianceCreatedEmail` reciba los parámetros correctos

**Test Manual:**

```bash
# Ver logs de emails
docker compose logs services | grep -i "sendComplianceCreatedEmail"
```

---

### 6. **Frontend NO muestra compliances** ⚠️

#### Problema:

Aunque el backend devuelva compliances, el frontend NO los está mostrando porque:

1. Los endpoints de listado NO los traen
2. El detalle SÍ los trae, pero falta implementar la UI

#### Solución:

Según `FRONTEND-COMPLIANCES-PLAN.md`:

1. Crear `ComplianceStatusBadge.jsx`
2. Crear `ComplianceCard.jsx`
3. Modificar `ClaimDetailModal` para mostrar sección de compliances
4. Agregar columna "Compromiso" en tablas

---

## 📝 Checklist de Implementación

### Prioridad Alta (Bloqueante)

- [ ] Modificar `GetAdminClaimsUseCase` para traer compliance
- [ ] Modificar `GetUserClaimsUseCase` para traer compliance
- [ ] Agregar `availableActions` con acciones de compliance
- [ ] Crear `SubmitComplianceUseCase`
- [ ] Crear endpoint `POST /compliances/:id/submit` en gateway
- [ ] Crear `ReviewComplianceUseCase`
- [ ] Crear endpoint `POST /compliances/:id/review` en gateway

### Prioridad Media (Importante)

- [ ] Implementar emails:
  - `sendComplianceSubmittedEmail`
  - `sendComplianceApprovedEmail`
  - `sendComplianceRejectedEmail`
  - `sendComplianceOverdueWarningEmail`
- [ ] Frontend: Crear componentes de compliance
- [ ] Frontend: Modificar tablas para mostrar badge de compliance

### Prioridad Baja (Opcional)

- [ ] Activar cron job para verificar compliances vencidos
- [ ] Sistema de consecuencias automáticas (overdue → warning → escalated)
- [ ] Peer review (validación por la otra parte)

---

## 🚀 Próximos Pasos

1. **AHORA**: Probá resolver un claim con compliances. Deberían guardarse correctamente en la DB.

2. **Siguiente**: Implementar los use cases faltantes:
   - `SubmitComplianceUseCase`
   - `ReviewComplianceUseCase`

3. **Después**: Modificar los endpoints de consulta para traer compliances y acciones

4. **Finalmente**: Implementar UI en el frontend

---

## 📊 Estado Actual

- **Creación de compliances**: ✅ FUNCIONA (después de arreglar el enum)
- **Consulta de compliances**: ⚠️ Solo en detalle, falta en listados
- **Acciones de compliance**: ❌ NO IMPLEMENTADAS
- **Emails**: ⚠️ Parcialmente implementado
- **Frontend**: ❌ NO IMPLEMENTADO

---

**Próxima acción inmediata**: Probá resolver un claim para confirmar que los compliances se guardan.
