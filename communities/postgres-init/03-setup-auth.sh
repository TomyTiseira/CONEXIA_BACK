#!/bin/bash
set -e

echo "Iniciando configuración de PostgreSQL..."

# Verificar que estamos ejecutando como usuario postgres
if [ "$(whoami)" != "postgres" ]; then
    echo "Error: Este script debe ejecutarse como usuario postgres"
    exit 1
fi

# Verificar que PostgreSQL está instalado
if ! command -v pg_isready &> /dev/null; then
    echo "Error: pg_isready no está disponible"
    exit 1
fi

# Esperar a que PostgreSQL esté listo
echo "Esperando a que PostgreSQL esté listo..."
until pg_isready -U postgres; do
  echo "PostgreSQL no está listo aún, esperando..."
  sleep 2
done

echo "PostgreSQL está listo. Configurando pg_hba.conf..."

# Verificar que el directorio de datos existe
if [ ! -d "/var/lib/postgresql/data" ]; then
    echo "Error: Directorio de datos de PostgreSQL no encontrado"
    exit 1
fi

# Configurar pg_hba.conf para permitir conexiones desde contenedores Docker
cat > /var/lib/postgresql/data/pg_hba.conf << 'EOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     trust

# IPv4 local connections:
host    all             all             127.0.0.1/32            trust

# IPv6 local connections:
host    all             all             ::1/128                 trust

# Allow replication connections from localhost, by a user with the
# replication privilege.
local   replication     all                                     trust
host    replication     all             127.0.0.1/32            trust
host    replication     all             ::1/128                 trust

# Allow connections from Docker containers - all possible Docker networks
host    all             all             172.16.0.0/12           trust
host    all             all             192.168.0.0/16          trust
host    all             all             10.0.0.0/8              trust

# Allow connections from any IP (for development purposes)
host    all             all             0.0.0.0/0               trust
EOF

echo "Configuración de pg_hba.conf aplicada."

# Verificar que el archivo se creó correctamente
if [ ! -f "/var/lib/postgresql/data/pg_hba.conf" ]; then
    echo "Error: No se pudo crear el archivo pg_hba.conf"
    exit 1
fi

# Recargar la configuración
echo "Recargando configuración de PostgreSQL..."
pg_ctl reload

echo "Configuración de PostgreSQL completada exitosamente." 