#!/bin/sh
set -e

# Iniciar la aplicación en background para que TypeORM cree las tablas
echo "Iniciando aplicación para crear tablas..."
npm run start:dev &
APP_PID=$!

# Esperar un poco para que TypeORM sincronice las tablas
echo "Esperando que TypeORM cree las tablas..."
sleep 15

# Ejecutar seed de preguntas y embeddings
echo "Ejecutando seed de preguntas y embeddings..."
npm run seed:questions

# Esperar a que la aplicación termine
wait $APP_PID

