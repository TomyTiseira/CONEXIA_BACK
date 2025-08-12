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
npm run seed:categories
npm run seed:collaboration-types
npm run seed:contract-types
npm run seed:postulation-statuses

# Esperar a que la aplicación termine
wait $APP_PID 