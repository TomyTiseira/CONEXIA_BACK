#!/bin/sh

# Ejecutar seeds
npm run seed:roles
npm run seed:document-types

# Iniciar la aplicación
npm run start:dev 