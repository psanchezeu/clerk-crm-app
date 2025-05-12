#!/bin/bash

# Script para desplegar la aplicación Clerk CRM en producción
# Este script configura correctamente todas las variables de entorno necesarias

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Iniciando despliegue de Clerk CRM ===${NC}"

# Solicitar variables de entorno si no existen
if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ]; then
  echo -e "${YELLOW}NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY no está definida${NC}"
  read -p "Ingresa NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (empieza con pk_): " NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
fi

if [ -z "$CLERK_SECRET_KEY" ]; then
  echo -e "${YELLOW}CLERK_SECRET_KEY no está definida${NC}"
  read -p "Ingresa CLERK_SECRET_KEY (empieza con sk_): " CLERK_SECRET_KEY
fi

if [ -z "$DATABASE_URL" ]; then
  echo -e "${YELLOW}DATABASE_URL no está definida${NC}"
  read -p "Ingresa DATABASE_URL (formato postgresql://...): " DATABASE_URL
fi

# Verificar que las variables tengan el formato correcto
if [[ ! $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY == pk_* ]]; then
  echo -e "${RED}NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY debe empezar con pk_${NC}"
  exit 1
fi

if [[ ! $CLERK_SECRET_KEY == sk_* ]]; then
  echo -e "${RED}CLERK_SECRET_KEY debe empezar con sk_${NC}"
  exit 1
fi

if [[ ! $DATABASE_URL == postgresql://* ]]; then
  echo -e "${RED}DATABASE_URL debe empezar con postgresql://${NC}"
  exit 1
fi

# Guardar variables en .env.production
echo "# Variables de entorno para producción - Generadas por deploy.sh" > .env.production
echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" >> .env.production
echo "CLERK_SECRET_KEY=$CLERK_SECRET_KEY" >> .env.production
echo "DATABASE_URL=$DATABASE_URL" >> .env.production
echo "NODE_ENV=production" >> .env.production

echo -e "${GREEN}Variables de entorno guardadas en .env.production${NC}"

# Construir imagen Next.js utilizando .env.production
echo -e "${GREEN}Construyendo imagen Next.js con variables de entorno...${NC}"
docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
  --build-arg CLERK_SECRET_KEY=$CLERK_SECRET_KEY \
  --build-arg DATABASE_URL=$DATABASE_URL \
  -t clerk-crm-app .

# Construir Nginx (si es necesario)
echo -e "${GREEN}Construyendo imagen Nginx...${NC}"
docker build -f Dockerfile.nginx -t clerk-crm-app-nginx .

# Detener contenedores existentes
echo -e "${GREEN}Deteniendo contenedores existentes...${NC}"
docker stop clerk-crm-app clerk-crm-app-nginx 2>/dev/null || true
docker rm clerk-crm-app clerk-crm-app-nginx 2>/dev/null || true

# Iniciar contenedor Next.js con variables de entorno
echo -e "${GREEN}Iniciando contenedor Next.js...${NC}"
docker run -d \
  --name clerk-crm-app \
  -p 33194:3000 \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
  -e CLERK_SECRET_KEY=$CLERK_SECRET_KEY \
  -e DATABASE_URL=$DATABASE_URL \
  clerk-crm-app

# Iniciar contenedor Nginx
echo -e "${GREEN}Iniciando contenedor Nginx...${NC}"
docker run -d \
  --name clerk-crm-app-nginx \
  -p 56674:56674 \
  --link clerk-crm-app:clerk-crm-app \
  clerk-crm-app-nginx

echo -e "${GREEN}=== Despliegue completado ====${NC}"
echo -e "Aplicación disponible en https://hostybee.com:56674"
echo -e "Contenedores:"
docker ps --filter "name=clerk-crm-app" --filter "name=clerk-crm-app-nginx"
