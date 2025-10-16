#!/bin/sh
set -e

# Iniciar la aplicación en background para que TypeORM cree las tablas
echo "Iniciando aplicación para crear tablas..."
npm run start:dev &
APP_PID=$!

# Esperar un poco para que TypeORM sincronice las tablas
echo "Esperando que TypeORM cree las tablas..."
sleep 15

# Ejecutar seeds
echo "Ejecutando seeds..."
npx ts-node src/scripts/seed-service-categories.ts

# Ejecutar script para actualizar profession nulas a "test"
echo "Actualizando profession nulas a 'test'..."
npx ts-node src/scripts/set-null-professions-to-test.ts

# Esperar a que la aplicación termine
wait $APP_PID