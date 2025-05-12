/**
 * API endpoint para configurar claves de Clerk en las variables de entorno en tiempo de ejecución
 */

import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Ruta al archivo .env en el servidor
const ENV_FILE_PATH = path.join(process.cwd(), '.env');

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // Extraer las claves del cuerpo de la solicitud
    const { publishableKey, secretKey } = await req.json();
    
    // Validar las claves recibidas
    if (!publishableKey?.startsWith('pk_') || !secretKey?.startsWith('sk_')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Formato de claves incorrecto. Deben comenzar con pk_ y sk_'
      }, { status: 400 });
    }
    
    // Establecer las variables de entorno en tiempo de ejecución
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = publishableKey;
    process.env.CLERK_SECRET_KEY = secretKey;
    
    // Intentar guardar las claves en el archivo .env para persistencia
    try {
      let envContent = '';
      
      // Leer el archivo .env si existe
      if (fs.existsSync(ENV_FILE_PATH)) {
        envContent = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
      }
      
      // Reemplazar o agregar las variables
      const lines = envContent.split('\n').filter(line => 
        !line.startsWith('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=') && 
        !line.startsWith('CLERK_SECRET_KEY=')
      );
      
      lines.push(`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${publishableKey}`);
      lines.push(`CLERK_SECRET_KEY=${secretKey}`);
      
      // Escribir el archivo actualizado
      fs.writeFileSync(ENV_FILE_PATH, lines.join('\n'));
      
      console.log('Claves de Clerk guardadas en .env y variables de entorno');
    } catch (fileError) {
      console.error('Error al guardar claves en archivo .env:', fileError);
      // Esto no es un error crítico, continuamos
    }
    
    // Guardar también en la base de datos (reutilizando la API existente)
    try {
      const dbResponse = await fetch(new URL('/api/config/save', req.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkPublishableKey: publishableKey,
          clerkSecretKey: secretKey,
        }),
      });
      
      if (!dbResponse.ok) {
        console.warn('No se pudo guardar en BD, pero las variables de entorno se actualizaron');
      }
    } catch (dbError) {
      console.error('Error al guardar claves en BD:', dbError);
      // Esto no es un error crítico, continuamos si las variables de entorno se actualizaron
    }
    
    // Establecer una cookie para indicar que las claves están configuradas
    const response = NextResponse.json({ 
      success: true,
      message: 'Claves de Clerk configuradas correctamente en variables de entorno'
    });
    
    // Establecer cookies con una duración de 30 días
    response.cookies.set('clerk_keys_configured', 'true', { 
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      httpOnly: false,
    });
    
    response.cookies.set('setup_completed', 'true', {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      httpOnly: false,
    });
    
    return response;
  } catch (error) {
    console.error('Error al configurar claves de Clerk:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
