import { PrismaClient } from '../node_modules/.prisma/client';

// Evitar múltiples instancias de Prisma Client en desarrollo
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

const globalForPrisma = global as unknown as { prisma: PrismaClient | null };

function createPrismaClient() {
  // No crear cliente si DATABASE_URL no está definido (durante build)
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    console.log('DATABASE_URL no está definido. Saltando conexión a la base de datos durante build.');
    return null;
  }
  
  console.log('Creating new Prisma client...');
  try {
    // Si DATABASE_URL está disponible o estamos en desarrollo
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn', 'info'] : ['error'],
      errorFormat: 'pretty',
    });

    // Test the connection solo si no estamos en proceso de build
    if (process.env.NODE_ENV !== 'production' || process.env.DATABASE_URL) {
      console.log(`Conectando a la base de datos con URL: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1****$2') : 'no disponible'}`);
      client.$connect().then(() => {
        console.log('Successfully connected to database');
      }).catch((error: Error) => {
        console.error('Failed to connect to database:', error);
      });
    }

    return client;
  } catch (error: unknown) {
    console.error('Error creating Prisma client:', error);
    // No lanzar error durante el build
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
    return null;
  }
}

// Solo inicializar Prisma si no estamos en proceso de build o si DATABASE_URL está disponible
export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  console.log('Prisma client attached to global object');
}
