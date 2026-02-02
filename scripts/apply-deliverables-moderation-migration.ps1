# Script para aplicar migración de estados de moderación a deliverables
# Ejecuta el archivo SQL 29-add-moderation-states-to-deliverables.sql en la base de datos de services

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Aplicando migración: Estados de moderación" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Ruta al archivo SQL
$sqlFile = ".\services\postgres-init\29-add-moderation-states-to-deliverables.sql"

# Verificar que el archivo existe
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Error: No se encontró el archivo $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Archivo SQL encontrado: $sqlFile" -ForegroundColor Green
Write-Host ""

# Aplicar migración
Write-Host "🔄 Ejecutando migración en base de datos de services..." -ForegroundColor Yellow
Write-Host ""

try {
    # Ejecutar el SQL en el contenedor de PostgreSQL de services
    $result = docker exec -i conexia_back-services-postgres-1 psql -U services_user -d services_db -f /docker-entrypoint-initdb.d/29-add-moderation-states-to-deliverables.sql 2>&1
    
    # Verificar si hubo error
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al ejecutar la migración:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
    
    Write-Host $result -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ Migración aplicada exitosamente!" -ForegroundColor Green
    Write-Host ""
    
    # Verificar que los cambios se aplicaron
    Write-Host "🔍 Verificando cambios en la base de datos..." -ForegroundColor Yellow
    Write-Host ""
    
    # Verificar enum deliverable_status
    $verifyDeliverableStatus = docker exec -i conexia_back-services-postgres-1 psql -U services_user -d services_db -t -c "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'deliverable_status') AND enumlabel = 'cancelled_by_moderation';"
    
    if ($verifyDeliverableStatus -match "cancelled_by_moderation") {
        Write-Host "  ✓ Estado 'cancelled_by_moderation' agregado a deliverable_status" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Advertencia: Estado 'cancelled_by_moderation' no encontrado en deliverable_status" -ForegroundColor Yellow
    }
    
    # Verificar enum delivery_status
    $verifyDeliveryStatus = docker exec -i conexia_back-services-postgres-1 psql -U services_user -d services_db -t -c "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'delivery_status') AND enumlabel = 'cancelled_by_moderation';"
    
    if ($verifyDeliveryStatus -match "cancelled_by_moderation") {
        Write-Host "  ✓ Estado 'cancelled_by_moderation' agregado a delivery_status" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Advertencia: Estado 'cancelled_by_moderation' no encontrado en delivery_status" -ForegroundColor Yellow
    }
    
    # Verificar columnas en deliverables
    $verifyDeliverablesColumns = docker exec -i conexia_back-services-postgres-1 psql -U services_user -d services_db -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name IN ('moderation_reason', 'cancelled_by_moderation_at');"
    
    if ($verifyDeliverablesColumns -match "moderation_reason" -and $verifyDeliverablesColumns -match "cancelled_by_moderation_at") {
        Write-Host "  ✓ Columnas de auditoría agregadas a tabla deliverables" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Advertencia: Columnas de auditoría no encontradas en deliverables" -ForegroundColor Yellow
    }
    
    # Verificar columnas en delivery_submissions
    $verifySubmissionsColumns = docker exec -i conexia_back-services-postgres-1 psql -U services_user -d services_db -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'delivery_submissions' AND column_name IN ('moderation_reason', 'cancelled_by_moderation_at');"
    
    if ($verifySubmissionsColumns -match "moderation_reason" -and $verifySubmissionsColumns -match "cancelled_by_moderation_at") {
        Write-Host "  ✓ Columnas de auditoría agregadas a tabla delivery_submissions" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Advertencia: Columnas de auditoría no encontradas en delivery_submissions" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "✅ Migración completada con éxito" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ahora puedes reiniciar el microservicio de services:" -ForegroundColor White
    Write-Host "  docker-compose restart services" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "❌ Error inesperado:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
