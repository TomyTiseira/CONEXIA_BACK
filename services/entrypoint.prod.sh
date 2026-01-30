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
node dist/scripts/seed-service-categories.js || echo "seed-service-categories falló o ya ejecutado"
node dist/scripts/seed-service-hiring-statuses.js || echo "seed-service-hiring-statuses falló o ya ejecutado"

echo "Seeds completados!"

# Esperar a que la aplicación termine
wait $APP_PID
