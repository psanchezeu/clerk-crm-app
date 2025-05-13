#!/bin/bash

# Verificación de requisitos previos para Clerk CRM App
# Este script comprueba que todas las herramientas necesarias estén instaladas

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Verificando requisitos previos para Clerk CRM App ===${NC}"

# Función para verificar si un comando está disponible
check_command() {
  local cmd=$1
  local name=$2
  local install_guide=$3
  
  echo -ne "Verificando $name... "
  
  if command -v $cmd &> /dev/null; then
    echo -e "${GREEN}✓ Instalado${NC}"
    return 0
  else
    echo -e "${RED}✗ No instalado${NC}"
    echo -e "${YELLOW}Para instalar $name: $install_guide${NC}"
    return 1
  fi
}

# Verificar Docker
DOCKER_INSTALL="https://docs.docker.com/get-docker/"
check_command docker Docker "$DOCKER_INSTALL"
DOCKER_OK=$?

# Verificar Docker Compose
COMPOSE_INSTALL="https://docs.docker.com/compose/install/"
check_command docker-compose "Docker Compose" "$COMPOSE_INSTALL"
COMPOSE_OK=$?

# Verificar curl (necesario para healthchecks)
CURL_INSTALL="Instala curl con tu gestor de paquetes (apt, yum, etc.)"
check_command curl curl "$CURL_INSTALL"
CURL_OK=$?

# Verificar Node.js y npm (útil para desarrollo)
NODE_INSTALL="https://nodejs.org/en/download/"
check_command node "Node.js" "$NODE_INSTALL"
NODE_OK=$?

check_command npm npm "$NODE_INSTALL"
NPM_OK=$?

# Verificar Git
GIT_INSTALL="https://git-scm.com/downloads"
check_command git Git "$GIT_INSTALL"
GIT_OK=$?

echo ""
echo -e "${BLUE}=== Resumen de requisitos ===${NC}"

# Requisitos obligatorios
echo -e "Requisitos obligatorios:"
if [ $DOCKER_OK -eq 0 ] && [ $COMPOSE_OK -eq 0 ] && [ $CURL_OK -eq 0 ]; then
  echo -e "${GREEN}✓ Todos los requisitos obligatorios están instalados${NC}"
else
  echo -e "${RED}✗ Faltan requisitos obligatorios${NC}"
  echo -e "${YELLOW}Por favor, instala las herramientas faltantes antes de continuar${NC}"
fi

# Requisitos opcionales
echo -e "\nRequisitos opcionales (para desarrollo):"
if [ $NODE_OK -eq 0 ] && [ $NPM_OK -eq 0 ] && [ $GIT_OK -eq 0 ]; then
  echo -e "${GREEN}✓ Todos los requisitos opcionales están instalados${NC}"
else
  echo -e "${YELLOW}⚠ Algunos requisitos opcionales no están instalados${NC}"
  echo -e "${YELLOW}Estos son útiles para desarrollo pero no esenciales para el despliegue${NC}"
fi

# Verificar versión de Docker
if [ $DOCKER_OK -eq 0 ]; then
  DOCKER_VERSION=$(docker --version | cut -d ' ' -f3 | cut -d ',' -f1)
  echo -e "\nVersión de Docker: $DOCKER_VERSION"
  
  # Comparar versión (necesitamos al menos 19.03)
  MAJOR=$(echo $DOCKER_VERSION | cut -d '.' -f1)
  MINOR=$(echo $DOCKER_VERSION | cut -d '.' -f2)
  
  if [ $MAJOR -lt 19 ] || ([ $MAJOR -eq 19 ] && [ $MINOR -lt 3 ]); then
    echo -e "${YELLOW}⚠ Se recomienda Docker 19.03 o superior${NC}"
  else
    echo -e "${GREEN}✓ Versión de Docker compatible${NC}"
  fi
fi

# Verificar si se puede conectar al registry de Docker
if [ $DOCKER_OK -eq 0 ]; then
  echo -ne "\nProbando conexión a Docker Hub... "
  if docker info &> /dev/null; then
    echo -e "${GREEN}✓ Conectado${NC}"
  else
    echo -e "${YELLOW}⚠ No se pudo conectar a Docker Hub${NC}"
    echo -e "${YELLOW}Asegúrate de que el servicio de Docker esté en ejecución${NC}"
  fi
fi

echo -e "\n${BLUE}=== Verificación de requisitos completada ===${NC}"

# Salir con código de error si faltan requisitos obligatorios
if [ $DOCKER_OK -ne 0 ] || [ $COMPOSE_OK -ne 0 ] || [ $CURL_OK -ne 0 ]; then
  exit 1
fi

exit 0
