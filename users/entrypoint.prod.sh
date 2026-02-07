#!/bin/sh
set -e

echo "Iniciando aplicacion para crear tablas..."
node dist/main.js &
APP_PID=$!

echo "Esperando que TypeORM cree las tablas..."
sleep 15

echo "Ejecutando seeds..."
node dist/scripts/seed-roles.js || echo "seed-roles fallo o ya ejecutado"
node dist/scripts/seed-document-types.js || echo "seed-document-types fallo o ya ejecutado"
node dist/scripts/seed-localities.js || echo "seed-localities fallo o ya ejecutado"
node dist/scripts/seed-banks-and-platforms.js || echo "seed-banks-and-platforms fallo o ya ejecutado"

echo "Seeds completados!"

wait $APP_PID
