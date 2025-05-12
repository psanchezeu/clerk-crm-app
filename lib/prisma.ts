import { PrismaClient } from '../node_modules/.prisma/client';

// Evitar múltiples instancias de Prisma Client en desarrollo
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  console.log('Creating new Prisma client...');
  try {
    const client = new PrismaClient({
      log: ['query', 'error', 'warn', 'info'],
      errorFormat: 'pretty',
    });

    // Test the connection
    client.$connect().then(() => {
      console.log('Successfully connected to database');
    }).catch((error: Error) => {
      console.error('Failed to connect to database:', error);
    });

    return client;
  } catch (error: unknown) {
    console.error('Error creating Prisma client:', error);
    throw error;
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  console.log('Prisma client attached to global object');
}
