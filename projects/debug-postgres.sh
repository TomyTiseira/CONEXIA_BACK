#!/bin/bash

echo "=== Diagnóstico de PostgreSQL ==="
echo "Fecha: $(date)"
echo "Sistema: $(uname -a)"
echo ""

echo "=== Verificando archivos de inicialización ==="
echo "Contenido del directorio postgres-init:"
ls -la postgres-init/

echo ""
echo "=== Verificando permisos de archivos .sh ==="
find postgres-init/ -name "*.sh" -exec ls -la {} \;

echo ""
echo "=== Verificando formato de archivos ==="
echo "Archivo 03-setup-auth.sh (primeras 10 líneas):"
head -10 postgres-init/03-setup-auth.sh

echo ""
echo "=== Verificando codificación de archivos ==="
file postgres-init/03-setup-auth.sh
file postgres-init/01-init.sql

echo ""
echo "=== Verificando Docker ==="
docker --version
docker-compose --version

echo ""
echo "=== Verificando volúmenes de Docker ==="
docker volume ls | grep postgres || echo "No se encontraron volúmenes de postgres"

echo ""
echo "=== Verificando contenedores de PostgreSQL ==="
docker ps -a | grep postgres || echo "No se encontraron contenedores de postgres"

echo ""
echo "=== Fin del diagnóstico ===" 