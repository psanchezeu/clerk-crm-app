import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Variable para almacenar el estado de la configuración
let isConfigured: boolean | null = null;
let lastChecked = 0;
const CACHE_TTL = 60000; // 1 minuto
const SETUP_MARKER_FILE = '.setup_completed';

/**
 * Verifica si la aplicación está configurada correctamente
 * @param forceCheck Fuerza una verificación ignorando la caché
 * @returns Promise<boolean> True si está configurada, false en caso contrario
 */
export async function isAppConfigured(forceCheck = false): Promise<boolean> {
  const now = Date.now();
  
  // Si tenemos un resultado en caché y no ha expirado, lo usamos
  if (isConfigured !== null && (now - lastChecked) < CACHE_TTL && !forceCheck) {
    return isConfigured;
  }
  
  try {
    const rootDir = process.cwd();
    
    // 0. Verificar primero si existe el marcador de setup completado
    const setupMarkerPath = path.join(rootDir, SETUP_MARKER_FILE);
    if (fs.existsSync(setupMarkerPath)) {
      // El setup ya se completó previamente, consideramos la app como configurada
      isConfigured = true;
      lastChecked = now;
      return true;
    }
    
    // 1. Verificar si existe el archivo .env
    const envPath = path.join(rootDir, '.env');
    const envExists = fs.existsSync(envPath);
    
    if (!envExists) {
      isConfigured = false;
      lastChecked = now;
      return false;
    }
    
    // 2. Verificar si tiene las variables necesarias
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const hasClerkKeys = envContent.includes('CLERK_SECRET_KEY') && envContent.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
    const hasDatabaseUrl = envContent.includes('DATABASE_URL');
    
    if (!hasClerkKeys || !hasDatabaseUrl) {
      isConfigured = false;
      lastChecked = now;
      return false;
    }
    
    // 3. Intentar conectar a la base de datos
    try {
      const prisma = new PrismaClient();
      try {
        // Intentamos acceder a la tabla de usuarios para ver si existe
        await prisma.$queryRaw`SELECT 1 FROM "usuario" LIMIT 1`;
        
        // Si llegamos aquí, la conexión fue exitosa y las tablas existen
        // Creamos el marcador de setup completado para futuras verificaciones
        try {
          fs.writeFileSync(setupMarkerPath, new Date().toISOString());
          console.log('Marcador de setup completado creado correctamente');
        } catch (markerError) {
          console.warn('No se pudo crear el marcador de setup completado:', markerError);
          // Continuamos a pesar del error en la creación del marcador
        }
        
        isConfigured = true;
        lastChecked = now;
      } finally {
        await prisma.$disconnect();
      }
      return isConfigured || false;
    } catch (dbError) {
      console.error('Error al verificar la base de datos:', dbError);
      isConfigured = false;
      lastChecked = now;
      return false;
    }
  } catch (error) {
    console.error('Error al verificar la configuración:', error);
    isConfigured = false;
    lastChecked = now;
    return false;
  }
}

/**
 * Función para verificar de forma segura el estado de configuración
 * Esta función nunca lanza errores, es segura para usar en middleware
 */
export async function safeConfigCheck(): Promise<boolean> {
  try {
    return await isAppConfigured();
  } catch (error) {
    console.error('Error en verificación segura:', error);
    return false;
  }
}

/**
 * Marca explícitamente que el setup de la aplicación ha sido completado
 * Crea un archivo marcador que será verificado en futuros chequeos
 */
export async function markSetupComplete(): Promise<boolean> {
  try {
    const rootDir = process.cwd();
    const setupMarkerPath = path.join(rootDir, SETUP_MARKER_FILE);
    
    // Escribir la fecha y hora actual como contenido del marcador
    fs.writeFileSync(setupMarkerPath, new Date().toISOString());
    
    // Resetear la caché para forzar la próxima verificación
    isConfigured = null;
    
    return true;
  } catch (error) {
    console.error('Error al marcar setup como completado:', error);
    return false;
  }
}
