# Script para ejecutar la migración de nuevos tipos de compliance
# Uso: .\apply-compliance-migration.ps1

Write-Host "🔄 Aplicando migración: Nuevos tipos de compliance" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Ejecutar migración SQL directamente en la base de datos
$sqlScript = @"
-- Migración: Agregar nuevos tipos de compliance al enum
ALTER TYPE claim_compliances_compliance_type_enum ADD VALUE IF NOT EXISTS 'work_completion';
ALTER TYPE claim_compliances_compliance_type_enum ADD VALUE IF NOT EXISTS 'work_revision';
ALTER TYPE claim_compliances_compliance_type_enum ADD VALUE IF NOT EXISTS 'apology_required';
ALTER TYPE claim_compliances_compliance_type_enum ADD VALUE IF NOT EXISTS 'service_discount';
ALTER TYPE claim_compliances_compliance_type_enum ADD VALUE IF NOT EXISTS 'penalty_fee';
ALTER TYPE claim_compliances_compliance_type_enum ADD VALUE IF NOT EXISTS 'account_restriction';
ALTER TYPE claim_compliances_compliance_type_enum ADD VALUE IF NOT EXISTS 'other';

-- Verificar valores agregados
SELECT 'Valores del enum claim_compliances_compliance_type_enum:' as status;
SELECT unnest(enum_range(NULL::claim_compliances_compliance_type_enum)) AS compliance_types;
"@

# Ejecutar el script SQL
$sqlScript | docker-compose exec -T services-db psql -U postgres -d services_db

Write-Host ""
Write-Host "✅ Migración completada exitosamente" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Valores agregados:" -ForegroundColor Yellow
Write-Host "   - work_completion"
Write-Host "   - work_revision"
Write-Host "   - apology_required"
Write-Host "   - service_discount"
Write-Host "   - penalty_fee"
Write-Host "   - account_restriction"
Write-Host "   - other"
