# Clerk CRM App

Una aplicación CRM con autenticación usando Clerk, escalable y funcionalidades que se añadiran en el futuro.

## Requisitos previos

- Cuenta [hostybee.es](https://hostybee.com/)
- Cuenta [Clerk](https://clerk.com/)
- Base datos [postgresSQL](https://www.postgresql.org/)

## Configuración

1. Crea una cuenta en Clerk.com y obten las claves de tu proyecto. (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY y CLERK_SECRET_KEY)
2. Crea una base de datos y ten a mano tu URL de la base de datos (por ejemplo: postgres://postgres:password@localhost:5432/crm)
3. Clona este repositorio en uno de tus contenedores de hostybee.es
   3.1. Valida el proyecto.
   ![Validar proyecto](image.png)
   3.2. Crea el proyecto y espera a que termine el despliegue.
   ![alt text](image-1.png)
   3.3. Haz clic en Lanzar, y espera a que termine el despliegue.
   ![alt text](image-2.png)
4. Introduce las claves de Clerk y la URL de la base de datos en el formulario de configuración.
5. Haz clic en el botón de desplegar base de datos.
6. Espera a que termine el despliegue.
7. Haz clic en el botón de ir al dashboard.

## Tecnologías

- Next.js
- Clerk para autenticación
- Tailwind CSS para estilos
