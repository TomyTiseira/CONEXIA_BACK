#!/bin/sh
set -e

# Iniciar la aplicaciÃ³n en background para que TypeORM cree las tablas
echo "Iniciando aplicaciÃ³n para crear tablas..."
node dist/main.js &
APP_PID=$!

# Esperar un poco para que TypeORM sincronice las tablas
echo "Esperando que TypeORM cree las tablas..."
sleep 15

# Ejecutar seeds (compilados en dist/)
echo "Ejecutando seeds..."
node dist/scripts/seed-service-categories.js || echo "seed-service-categories fallÃ³ o ya ejecutado"
node dist/scripts/seed-service-hiring-statuses.js || echo "seed-service-hiring-statuses fallÃ³ o ya ejecutado"

echo "Seeds completados!"

# Esperar a que la aplicaciÃ³n termine
wait $APP_PID
