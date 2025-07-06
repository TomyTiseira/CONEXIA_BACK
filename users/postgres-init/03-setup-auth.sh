#!/bin/bash

# Esperar a que PostgreSQL esté listo
until pg_isready -U postgres; do
  echo "Esperando a que PostgreSQL esté listo..."
  sleep 2
done

# Configurar pg_hba.conf para permitir conexiones desde contenedores Docker
cat > /var/lib/postgresql/data/pg_hba.conf << EOF
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

# Recargar la configuración
pg_ctl reload

echo "Configuración de PostgreSQL completada" 