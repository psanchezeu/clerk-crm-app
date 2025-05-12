# Clerk CRM App

Una aplicación CRM con autenticación Clerk para hostybee.es

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

   3.2. Valida el proyecto en hostybee.es
   ![Validar proyecto](image.png)
   
   3.3. Crea el proyecto y espera a que termine el despliegue
   ![Crear proyecto](image-1.png)
   
   3.4. Haz clic en Lanzar y espera a que termine el despliegue
   ![Lanzar proyecto](image-2.png)

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
