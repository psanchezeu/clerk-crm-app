/**
 * API endpoint para configurar las claves de Clerk
 */
import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Tipos
interface ClerkConfig {
  publishableKey: string;
  secretKey: string;
}

// Ruta al archivo .env
const ENV_FILE_PATH = path.join(process.cwd(), '.env');

/**
 * Valida el formato de las claves de Clerk
 */
function validateClerkKeys(config: ClerkConfig): boolean {
  const { publishableKey, secretKey } = config;
  
  if (!publishableKey || !secretKey) {
    return false;
  }
  
  if (!publishableKey.startsWith('pk_') || !secretKey.startsWith('sk_')) {
    return false;
  }
  
  return true;
}

/**
 * Guarda las claves en el archivo .env
 */
function saveKeysToEnvFile(config: ClerkConfig): boolean {
  try {
    const { publishableKey, secretKey } = config;
    
    // Leer el archivo .env existente si existe
    let envContent = '';
    if (fs.existsSync(ENV_FILE_PATH)) {
      envContent = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
    }
    
    // Separar el contenido en líneas
    const lines = envContent.split('\n').filter(line => 
      !line.startsWith('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=') && 
      !line.startsWith('CLERK_SECRET_KEY=')
    );
    
    // Añadir las nuevas claves
    lines.push(`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${publishableKey}`);
    lines.push(`CLERK_SECRET_KEY=${secretKey}`);
    
    // Guardar el archivo
    fs.writeFileSync(ENV_FILE_PATH, lines.join('\n'));
    
    // Asignar las variables de entorno en el proceso actual
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = publishableKey;
    process.env.CLERK_SECRET_KEY = secretKey;
    
    return true;
  } catch (error) {
    console.error('Error al guardar claves en el archivo .env:', error);
    return false;
  }
}

/**
 * Controlador POST para guardar la configuración de Clerk
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Obtener datos de la solicitud
    const data = await request.json() as ClerkConfig;
    
    // Validar las claves
    if (!validateClerkKeys(data)) {
      return NextResponse.json(
        { success: false, error: 'Formato de claves inválido' },
        { status: 400 }
      );
    }
    
    // Guardar las claves en el archivo .env
    const saved = saveKeysToEnvFile(data);
    
    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Error al guardar las claves' },
        { status: 500 }
      );
    }
    
    // Configurar la respuesta con cookies
    const response = NextResponse.json(
      { success: true, message: 'Configuración guardada correctamente' },
      { status: 200 }
    );
    
    // Añadir cookie para indicar que Clerk está configurado
    const maxAge = 30 * 24 * 60 * 60; // 30 días
    response.cookies.set('clerk_configured', 'true', { 
      path: '/',
      maxAge,
      sameSite: 'lax',
      httpOnly: true,
    });
    
    return response;
  } catch (error) {
    console.error('Error en el endpoint de configuración de Clerk:', error);
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
