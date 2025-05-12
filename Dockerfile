FROM node:18-alpine AS base

# Instalar dependencias solo si es necesario
FROM base AS deps
WORKDIR /app

# Copiar archivos necesarios para instalar dependencias
COPY package.json package-lock.json* ./
RUN npm ci

# Compilar la aplicación
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Establecer variable de entorno para evitar errores de conexión durante el build
ENV DATABASE_URL="postgresql://postgres:dummy@localhost:5432/dummy"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV="production"

# Construir Next.js app
RUN npm run build

# Producción final
FROM base AS runner
WORKDIR /app

ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED=1

# Crear un usuario no root para producción
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Asignar permisos al usuario nextjs
RUN chown -R nextjs:nodejs /app

# Cambiar al usuario no root
USER nextjs

# Exponer puerto (ajustar según necesidad)
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["node", "server.js"]
