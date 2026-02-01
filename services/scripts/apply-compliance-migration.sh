#!/bin/bash

# Script para ejecutar la migración de nuevos tipos de compliance
# Uso: ./apply-compliance-migration.sh

echo "🔄 Aplicando migración: Nuevos tipos de compliance"
echo "=================================================="
echo ""

# Ejecutar migración SQL directamente en la base de datos
docker-compose exec -T services-db psql -U postgres -d services_db -f - << 'EOF'
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
EOF

echo ""
echo "✅ Migración completada exitosamente"
echo ""
echo "📝 Valores agregados:"
echo "   - work_completion"
echo "   - work_revision"
echo "   - apology_required"
echo "   - service_discount"
echo "   - penalty_fee"
echo "   - account_restriction"
echo "   - other"
