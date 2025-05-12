# Clerk CRM App

Una aplicación CRM con autenticación usando Clerk.

## Configuración

1. Clona este repositorio
2. Ejecuta `npm install` para instalar las dependencias
3. Crea un archivo `.env` basado en `.env.example` con tus claves de Clerk:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=tu_publishable_key
   CLERK_SECRET_KEY=tu_secret_key
   ```
   O visita `/setup` al iniciar la aplicación para configurar tus claves.

4. Ejecuta `npm run dev` para iniciar el servidor de desarrollo

## Tecnologías

- Next.js
- Clerk para autenticación
- Tailwind CSS para estilos
