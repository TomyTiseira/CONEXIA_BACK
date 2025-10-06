#!/bin/sh

echo "🚀 Iniciando ngrok con pooling habilitado..."

# Intentar iniciar ngrok con pooling habilitado
# Si el endpoint ya existe, ngrok debería unirse automáticamente
ngrok http api-gateway:8080 \
    --log stdout \
    --host-header rewrite \
    --pooling-enabled