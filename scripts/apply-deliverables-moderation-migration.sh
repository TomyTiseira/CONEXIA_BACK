#!/bin/bash

# Script para aplicar migración de estados de moderación a deliverables
# Ejecuta el archivo SQL 29-add-moderation-states-to-deliverables.sql en la base de datos de services

echo "============================================="
echo "Aplicando migración: Estados de moderación"
echo "============================================="
echo ""

# Ruta al archivo SQL
SQL_FILE="./services/postgres-init/29-add-moderation-states-to-deliverables.sql"

# Verificar que el archivo existe
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: No se encontró el archivo $SQL_FILE"
    exit 1
fi

echo "📄 Archivo SQL encontrado: $SQL_FILE"
echo ""

# Aplicar migración
echo "🔄 Ejecutando migración en base de datos de services..."
echo ""

# Ejecutar el SQL en el contenedor de PostgreSQL de services
if docker exec -i conexia_back-services-postgres-1 psql -U services_user -d services_db -f /docker-entrypoint-initdb.d/29-add-moderation-states-to-deliverables.sql; then
    echo ""
    echo "✅ Migración aplicada exitosamente!"
    echo ""
    
    # Verificar que los cambios se aplicaron
    echo "🔍 Verificando cambios en la base de datos..."
    echo ""
    
    # Verificar enum deliverable_status
    DELIVERABLE_STATUS=$(docker exec -i conexia_back-services-postgres-1 psql -U services_user -d services_db -t -c "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'deliverable_status') AND enumlabel = 'cancelled_by_moderation';")
    
    if echo "$DELIVERABLE_STATUS" | grep -q "cancelled_by_moderation"; then
        echo "  ✓ Estado 'cancelled_by_moderation' agregado a deliverable_status"
    else
        echo "  ⚠ Advertencia: Estado 'cancelled_by_moderation' no encontrado en deliverable_status"
    fi
    
    # Verificar enum delivery_status
    DELIVERY_STATUS=$(docker exec -i conexia_back-services-postgres-1 psql -U services_user -d services_db -t -c "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'delivery_status') AND enumlabel = 'cancelled_by_moderation';")
    
    if echo "$DELIVERY_STATUS" | grep -q "cancelled_by_moderation"; then
        echo "  ✓ Estado 'cancelled_by_moderation' agregado a delivery_status"
    else
        echo "  ⚠ Advertencia: Estado 'cancelled_by_moderation' no encontrado en delivery_status"
    fi
    
    # Verificar columnas en deliverables
    DELIVERABLES_COLUMNS=$(docker exec -i conexia_back-services-postgres-1 psql -U services_user -d services_db -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name IN ('moderation_reason', 'cancelled_by_moderation_at');")
    
    if echo "$DELIVERABLES_COLUMNS" | grep -q "moderation_reason" && echo "$DELIVERABLES_COLUMNS" | grep -q "cancelled_by_moderation_at"; then
        echo "  ✓ Columnas de auditoría agregadas a tabla deliverables"
    else
        echo "  ⚠ Advertencia: Columnas de auditoría no encontradas en deliverables"
    fi
    
    # Verificar columnas en delivery_submissions
    SUBMISSIONS_COLUMNS=$(docker exec -i conexia_back-services-postgres-1 psql -U services_user -d services_db -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'delivery_submissions' AND column_name IN ('moderation_reason', 'cancelled_by_moderation_at');")
    
    if echo "$SUBMISSIONS_COLUMNS" | grep -q "moderation_reason" && echo "$SUBMISSIONS_COLUMNS" | grep -q "cancelled_by_moderation_at"; then
        echo "  ✓ Columnas de auditoría agregadas a tabla delivery_submissions"
    else
        echo "  ⚠ Advertencia: Columnas de auditoría no encontradas en delivery_submissions"
    fi
    
    echo ""
    echo "============================================="
    echo "✅ Migración completada con éxito"
    echo "============================================="
    echo ""
    echo "Ahora puedes reiniciar el microservicio de services:"
    echo "  docker-compose restart services"
    echo ""
    
else
    echo ""
    echo "❌ Error al ejecutar la migración"
    exit 1
fi
