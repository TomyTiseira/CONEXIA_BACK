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
node dist/scripts/seed-categories.js || echo "seed-categories falló o ya ejecutado"
node dist/scripts/seed-collaboration-types.js || echo "seed-collaboration-types falló o ya ejecutado"
node dist/scripts/seed-contract-types.js || echo "seed-contract-types falló o ya ejecutado"
node dist/scripts/seed-postulation-statuses.js || echo "seed-postulation-statuses falló o ya ejecutado"
node dist/scripts/seed-rubros.js || echo "seed-rubros falló o ya ejecutado"
node dist/scripts/seed-skills.js || echo "seed-skills falló o ya ejecutado"

echo "Seeds completados!"

# Esperar a que la aplicación termine
wait $APP_PID
