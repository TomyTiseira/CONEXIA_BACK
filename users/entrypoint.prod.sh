#!/bin/sh
set -e

# Iniciar la aplicación en background para que TypeORM cree las tablas
echo "Iniciando aplicación para crear tablas..."
node dist/main.js &
APP_PID=$!

# Esperar un poco para que TypeORM sincronice las tablas
echo "Esperando que TypeORM cree las tablas..."
sleep 15

# Ejecutar seeds (compilados en dist/)
echo "Ejecutando seeds..."
node dist/scripts/seed-roles.js || echo "seed-roles falló o ya ejecutado"
node dist/scripts/seed-document-types.js || echo "seed-document-types falló o ya ejecutado"
node dist/scripts/seed-localities.js || echo "seed-localities falló o ya ejecutado"
node dist/scripts/seed-banks-and-platforms.js || echo "seed-banks-and-platforms falló o ya ejecutado"

echo "Seeds completados!"

# Esperar a que la aplicación termine
wait $APP_PID
