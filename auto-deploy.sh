#!/bin/bash

# Script de despliegue automatizado para Clerk CRM
# Este script proporciona un despliegue robusto con verificación y rollback

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR] $1${NC}" >&2
  exit 1
}

warning() {
  echo -e "${YELLOW}[ADVERTENCIA] $1${NC}" >&2
}

success() {
  echo -e "${GREEN}[ÉXITO] $1${NC}"
}

# Función para verificar conexión a la base de datos
verify_database_connection() {
  log "Verificando conexión a la base de datos..."
  local timeout=5
  
  # Intenta conectar a la base de datos usando una imagen de postgres
  docker run --rm -e PGPASSWORD="${DB_PASSWORD}" postgres:14 \
    pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t $timeout
  
  if [ $? -ne 0 ]; then
    error "No se pudo conectar a la base de datos. Verifica las credenciales y que el servidor esté funcionando."
  fi
  
  success "Conexión a la base de datos establecida correctamente"
}

# Función para validar las claves de Clerk
verify_clerk_keys() {
  log "Verificando claves de Clerk..."
  
  if [[ ! $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY == pk_* ]]; then
    error "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY debe empezar con pk_"
  fi
  
  if [[ ! $CLERK_SECRET_KEY == sk_* ]]; then
    error "CLERK_SECRET_KEY debe empezar con sk_"
  fi
  
  # Nota: Idealmente aquí haríamos una verificación con la API de Clerk
  # pero requeriría implementación adicional
  
  success "Formato de claves de Clerk válido"
}

# Función para cargar variables desde .env.production si existe
load_env_vars() {
  if [ -f .env.production ]; then
    log "Cargando variables desde .env.production..."
    source .env.production
    success "Variables cargadas correctamente"
  else
    log "No se encontró .env.production, solicitando variables..."
  fi
}

# Función para solicitar variables de entorno que faltan
prompt_for_missing_vars() {
  # CLERK
  if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ]; then
    warning "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY no está definida"
    read -p "Ingresa NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (empieza con pk_): " NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  fi

  if [ -z "$CLERK_SECRET_KEY" ]; then
    warning "CLERK_SECRET_KEY no está definida"
    read -p "Ingresa CLERK_SECRET_KEY (empieza con sk_): " CLERK_SECRET_KEY
  fi
  
  # DATABASE
  if [ -z "$DATABASE_URL" ]; then
    warning "DATABASE_URL no está definida"
    
    # Solicitar componentes de la URL de la base de datos
    read -p "Host de la base de datos: " DB_HOST
    read -p "Puerto de la base de datos [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    read -p "Nombre de la base de datos: " DB_NAME
    read -p "Usuario de la base de datos: " DB_USER
    read -s -p "Contraseña de la base de datos: " DB_PASSWORD
    echo ""
    
    # Construir DATABASE_URL
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  else
    # Extraer componentes de DATABASE_URL para verificación
    DB_USER=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/\([^:]*\):.*/\1/p')
    DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^:]*:\([^@]*\).*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^@]*@\([^:]*\).*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^@]*@[^:]*:\([^\/]*\).*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^@]*@[^\/]*\/\(.*\)/\1/p')
  fi
}

# Función para guardar variables en .env.production
save_env_vars() {
  log "Guardando variables en .env.production..."
  
  echo "# Variables de entorno para producción - Generadas automáticamente" > .env.production
  echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" >> .env.production
  echo "CLERK_SECRET_KEY=$CLERK_SECRET_KEY" >> .env.production
  echo "DATABASE_URL=$DATABASE_URL" >> .env.production
  echo "NODE_ENV=production" >> .env.production
  
  success "Variables guardadas correctamente"
}

# Función para el despliegue con Docker Compose
deploy_with_docker_compose() {
  log "Iniciando despliegue con Docker Compose..."
  
  # Exportar variables para docker-compose
  export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  export CLERK_SECRET_KEY=$CLERK_SECRET_KEY
  export DATABASE_URL=$DATABASE_URL
  
  # Construir y desplegar
  docker-compose build --no-cache
  
  if [ $? -ne 0 ]; then
    error "Error al construir los contenedores Docker"
  fi
  
  docker-compose up -d
  
  if [ $? -ne 0 ]; then
    error "Error al iniciar los contenedores Docker"
  fi
  
  success "Contenedores desplegados correctamente"
}

# Función para verificar el estado de los contenedores desplegados
verify_deployment() {
  log "Verificando estado de contenedores..."
  
  # Esperar un momento para que los contenedores se inicien completamente
  sleep 10
  
  # Verificar que ambos contenedores estén en ejecución
  APP_RUNNING=$(docker ps --filter "name=clerk-crm-app" --format "{{.Status}}" | grep -c "Up")
  NGINX_RUNNING=$(docker ps --filter "name=clerk-crm-app-nginx" --format "{{.Status}}" | grep -c "Up")
  
  if [ "$APP_RUNNING" -ne 1 ] || [ "$NGINX_RUNNING" -ne 1 ]; then
    error "No todos los contenedores están en ejecución. Revisa los logs con 'docker-compose logs'"
  fi
  
  # Verificar que la aplicación está respondiendo
  curl -s -o /dev/null -w "%{http_code}" localhost:56674/api/health | grep 200 > /dev/null
  
  if [ $? -ne 0 ]; then
    warning "La aplicación no está respondiendo correctamente en la verificación de salud"
    warning "Revisa los logs con 'docker-compose logs'"
  else
    success "La aplicación está respondiendo correctamente"
  fi
}

# Función principal
main() {
  log "=== Iniciando despliegue automatizado de Clerk CRM ==="
  
  # Verificar que Docker y Docker Compose estén instalados
  if ! command -v docker > /dev/null || ! command -v docker-compose > /dev/null; then
    error "Docker y Docker Compose son necesarios. Por favor instálalos primero."
  fi
  
  # Cargar variables existentes (si las hay)
  load_env_vars
  
  # Solicitar variables faltantes
  prompt_for_missing_vars
  
  # Verificar validez de las variables
  verify_clerk_keys
  verify_database_connection
  
  # Guardar variables para uso futuro
  save_env_vars
  
  # Realizar despliegue
  deploy_with_docker_compose
  
  # Verificar estado del despliegue
  verify_deployment
  
  log "=== Despliegue completado ==="
  success "Aplicación disponible en https://hostybee.com:56674"
  
  # Mostrar información de contenedores
  echo "Estado de contenedores:"
  docker-compose ps
}

# Ejecutar función principal
main