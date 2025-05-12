import { PrismaClient } from '@prisma/client';

// Evitar múltiples instancias de Prisma Client en desarrollo
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

declare global {
  var prisma: PrismaClient | null | undefined;
}

// Función para crear cliente de forma segura durante el build
function createPrismaClientSafe(): PrismaClient | null {
  // Si no tenemos DATABASE_URL en producción (durante build), no creamos el cliente
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    console.log('DATABASE_URL no disponible durante build. Saltando inicialización de Prisma.');
    return null;
  }
  
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (error) {
    console.error('Error al crear cliente Prisma:', error);
    return null;
  }
}

// Inicialización segura del cliente
export const prisma = global.prisma || createPrismaClientSafe();

// Guardar instancia en global sólo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
