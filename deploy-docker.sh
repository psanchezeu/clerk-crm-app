#!/bin/bash
# Script de despliegue para entorno Docker con variables de entorno

# Definir variables
PORT=33194
NGINX_PORT=56674
IMAGE_NAME=clerk-crm-app
NGINX_IMAGE_NAME=clerk-crm-app-nginx

# Detener contenedores existentes
echo "Deteniendo contenedores existentes..."
docker stop $IMAGE_NAME || true
docker stop $NGINX_IMAGE_NAME || true
docker rm $IMAGE_NAME || true
docker rm $NGINX_IMAGE_NAME || true

# Construir imagen Next.js
echo "Construyendo imagen Next.js..."
docker build -t $IMAGE_NAME:latest .

# Construir imagen Nginx proxy
echo "Construyendo imagen Nginx..."
docker build -f Dockerfile.nginx -t $NGINX_IMAGE_NAME:latest .

# Iniciar contenedor Next.js con variables de entorno
echo "Iniciando contenedor Next.js..."
docker run -d --name $IMAGE_NAME \
  -p $PORT:3000 \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dXB3YXJkLWxlb3BhcmQtNzUuY2xlcmsuYWNjb3VudHMuZGV2JA \
  -e CLERK_SECRET_KEY=sk_test_RbkqeBdd0moXc1elXmW7EZQqKm5riww2BkHPp1mo87 \
  -e DATABASE_URL="postgresql://postgres:postgres@hostybee.com:53998/crm" \
  -e NODE_ENV=production \
  $IMAGE_NAME:latest

# Iniciar contenedor Nginx
echo "Iniciando contenedor Nginx..."
docker run -d --name $NGINX_IMAGE_NAME -p $NGINX_PORT:$NGINX_PORT $NGINX_IMAGE_NAME:latest

# Verificar estado
echo "Contenedores iniciados:"
echo "Next.js en puerto $PORT"
echo "Nginx en puerto $NGINX_PORT"
echo ""
echo "Estado de los contenedores:"
docker ps --filter "name=$IMAGE_NAME" --filter "name=$NGINX_IMAGE_NAME" --format "{{.Names}}"
