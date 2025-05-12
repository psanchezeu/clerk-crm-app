import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Variable para almacenar el estado de la configuración
let isConfigured: boolean | null = null;
let lastChecked = 0;
const CACHE_TTL = 60000; // 1 minuto

// Constante con el nombre del archivo para marcar setup completado
const SETUP_COMPLETE_MARKER = '.setup-complete';

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
    // 1. Verificar si existe el archivo .env
    const rootDir = process.cwd();
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
    
    // 2.5 Verificar si existe el marcador de setup completado
    const setupMarkerPath = path.join(rootDir, SETUP_COMPLETE_MARKER);
    const setupCompleted = fs.existsSync(setupMarkerPath);
    
    // Si existe el marcador de setup completado, consideramos que está configurado
    if (setupCompleted) {
      console.log('Marcador de setup completado encontrado');
      isConfigured = true;
      lastChecked = now;
      return true;
    }
    
    // 3. Intentar conectar a la base de datos
    try {
      const prisma = new PrismaClient();
      // Intentamos acceder a la tabla de usuarios para ver si existe
      await prisma.$queryRaw`SELECT 1 FROM "usuario" LIMIT 1`;
      await prisma.$disconnect();
      
      // Si llegamos aquí, la conexión fue exitosa y las tablas existen
      isConfigured = true;
      lastChecked = now;
      return true;
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
 * Marca el setup como completado creando un archivo marcador
 * @returns Promise<boolean> True si se pudo marcar, false en caso contrario
 */
export async function markSetupComplete(): Promise<boolean> {
  try {
    const rootDir = process.cwd();
    const markerPath = path.join(rootDir, SETUP_COMPLETE_MARKER);
    
    // Crear el archivo marcador
    fs.writeFileSync(markerPath, new Date().toISOString());
    
    // Reiniciar el caché
    isConfigured = null;
    
    console.log('Setup marcado como completado');
    return true;
  } catch (error) {
    console.error('Error al marcar setup como completado:', error);
    return false;
  }
}
