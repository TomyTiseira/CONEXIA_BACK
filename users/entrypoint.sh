#!/bin/sh
set -e

# Ejecutar seeds
echo "Ejecutando seeds..."
npm run seed:roles
npm run seed:document-types

# Iniciar la aplicación
echo "Iniciando aplicación..."
npm run start:dev 