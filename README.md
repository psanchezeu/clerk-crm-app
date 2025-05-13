# Clerk CRM App

🚀 **Potente CRM all-in-one con autenticación segura** 🔒

Una solución empresarial completa diseñada específicamente para hostybee.es que integra:

- 👥 **Gestión avanzada de clientes y prospectos**
- 📅 **Calendario interactivo y seguimiento de eventos**
- 📊 **Dashboard analítico con métricas clave**
- 📱 **Interfaz responsive para cualquier dispositivo**
- 🔄 **Flujos de trabajo automatizados para aumentar la productividad**
- 🌐 **Integración nativa con Clerk para autenticación robusta**
- 💾 **Almacenamiento seguro con PostgreSQL**
- ⚡ **Optimizado para rendimiento y escalabilidad**

Todo disponible en un entorno seguro y personalizable que te permitirá gestionar tu negocio de manera eficiente y profesional.

## Requisitos previos

- Cuenta [hostybee.es](https://hostybee.com/)
- Cuenta [Clerk](https://clerk.com/)
- Base datos [PostgreSQL](https://www.postgresql.org/)

## Instalación rápida

1. **Crear cuenta en Clerk**
   - Regístrate en [clerk.com](https://clerk.com)
   - Crea un nuevo proyecto
   - Copia tus claves API (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY y CLERK_SECRET_KEY)

2. **Configurar base de datos PostgreSQL**
   - Crea una base de datos PostgreSQL (local o en la nube)
   - Guarda la URL de conexión (formato: `postgres://usuario:password@host:puerto/nombre_db`)

3. **Desplegar en hostybee.es**

   3.1. Clona este repositorio

   ```bash
   git clone https://github.com/psanchezeu/clerk-crm-app.git
   ```

   3.2. **Método Tradicional (Manual)**
   - Valida el proyecto en hostybee.es
   ![Validar proyecto](image.png)
   - Crea el proyecto y espera a que termine el despliegue
   ![Crear proyecto](image-1.png)
   - Haz clic en Lanzar y espera a que termine el despliegue
   ![Lanzar proyecto](image-2.png)

   3.3. **Método Automatizado (Recomendado)**
   - Ejecuta el script de despliegue automatizado:

   ```bash
   chmod +x auto-deploy.sh
   ./auto-deploy.sh
   ```
   - Este script guiará paso a paso en el proceso de configuración y despliegue:
     - Verifica requisitos previos (Docker y Docker Compose)
     - Solicita o carga configuraciones (Clerk API y base de datos)
     - Valida la conexión a la base de datos
     - Despliega la aplicación usando Docker Compose
     - Verifica el correcto funcionamiento de la aplicación

   3.4. **Despliegue por CI/CD (Para desarrollo)**
   - Requiere configuración de GitHub Actions con los siguientes secretos:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clave pública de Clerk
     - `CLERK_SECRET_KEY`: Clave secreta de Clerk
     - `DATABASE_URL`: URL de conexión a la base de datos
     - `SERVER_HOST`, `SERVER_USERNAME`, `SERVER_SSH_KEY`: Para despliegue en servidor
   - Al hacer push a la rama principal, se ejecutará automáticamente el despliegue

## Configuración inicial

Cuando accedas por primera vez a la aplicación, serás dirigido automáticamente a la página de configuración:

1. **Método de configuración directa (Recomendado)**
   - Accede a la página de configuración directa
   - Introduce tus claves de Clerk (Publishable Key y Secret Key)
   - La aplicación se reiniciará automáticamente

2. **Configuración de la base de datos**
   - Una vez configurado Clerk, serás dirigido a la página de configuración de la base de datos
   - Introduce la URL de tu base de datos PostgreSQL
   - Haz clic en "Desplegar base de datos"
   - Espera a que termine el proceso de migración

3. **Acceso al dashboard**
   - Una vez configurada la base de datos, haz clic en "Ir al dashboard"
   - Ya puedes comenzar a utilizar la aplicación

## Solución de problemas

- **Error de redirecciones infinitas**: Limpia las cookies de tu navegador e intenta acceder nuevamente
- **Problemas con la base de datos**: Verifica que la URL de conexión sea correcta y que la base de datos exista
- **Errores con Clerk**: Asegúrate de que las claves API sean correctas y que el proyecto esté activo

## Tecnologías

- **Frontend**: Next.js, React, Tailwind CSS, Shadcn UI
- **Autenticación**: Clerk
- **Base de datos**: PostgreSQL, Prisma
- **Despliegue**: hostybee.es (Docker)

## Características

- Autenticación completa con Clerk
- Dashboard interactivo
- Gestión de clientes y leads
- Calendario y tareas
- Configuración personalizada
- Integración con servicios externos
