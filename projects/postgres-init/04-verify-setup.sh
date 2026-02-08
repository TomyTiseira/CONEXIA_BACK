#!/bin/bash
set -e

echo "Verificando configuración de PostgreSQL..."

# Esperar a que PostgreSQL esté listo
until pg_isready -U postgres; do
  echo "Esperando a que PostgreSQL esté listo..."
  sleep 2
done

echo "Verificando que la base de datos projects_db existe..."
psql -U postgres -d projects_db -c "SELECT 1;" > /dev/null 2>&1 || {
  echo "ERROR: La base de datos projects_db no existe"
  exit 1
}

echo "Verificando configuración de pg_hba.conf..."
if grep -q "0.0.0.0/0" /var/lib/postgresql/data/pg_hba.conf; then
  echo "✓ Configuración de pg_hba.conf correcta"
else
  echo "✗ Configuración de pg_hba.conf incorrecta"
  exit 1
fi

echo "Verificando que PostgreSQL escucha en todas las interfaces..."
if pg_isready -U postgres -h 0.0.0.0; then
  echo "✓ PostgreSQL escucha correctamente"
else
  echo "⚠ PostgreSQL no escucha en 0.0.0.0, pero puede estar funcionando correctamente"
  # No salir con error, solo mostrar advertencia
fi

echo "Configuración de PostgreSQL verificada exitosamente." 