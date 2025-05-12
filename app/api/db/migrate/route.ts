import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// Función para ejecutar comandos de forma asíncrona
const execPromise = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log(`Ejecutando comando: ${command}`);
    exec(command, { encoding: 'utf8', cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error ejecutando comando: ${error.message}`);
        console.error(`Stderr: ${stderr}`);
        reject(error);
        return;
      }
      console.log(`Comando completado: ${command}`);
      console.log(`Stdout: ${stdout.substring(0, 200)}${stdout.length > 200 ? '...' : ''}`);
      resolve(stdout);
    });
  });
};

// Manejador para solicitudes OPTIONS (CORS)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  console.log('Iniciando proceso de migración de la base de datos...');
  
  try {
    // Intentamos recuperar la URL de la base de datos enviada en el cuerpo de la solicitud
    let dbUrlFromRequest = null;
    try {
      const requestBody = await request.json();
      dbUrlFromRequest = requestBody.dbUrl;
      if (dbUrlFromRequest) {
        console.log('URL de base de datos recibida en la solicitud:', dbUrlFromRequest.substring(0, 20) + '...');
      }
    } catch (jsonError) {
      console.log('No se pudo extraer dbUrl del cuerpo de la solicitud (esto es normal si no se envió):', jsonError);
    }
    
    // Verificar si el archivo .env existe y contiene DATABASE_URL
    let dbUrlFromEnv = null;
    const envFilePath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envFilePath)) {
      const envContent = fs.readFileSync(envFilePath, 'utf8');
      const dbUrlMatch = envContent.match(/DATABASE_URL=\"([^\"]+)\"/); // Extraer el valor de DATABASE_URL
      if (dbUrlMatch && dbUrlMatch[1]) {
        dbUrlFromEnv = dbUrlMatch[1];
        console.log('URL de base de datos encontrada en .env:', dbUrlFromEnv.substring(0, 20) + '...');
      }
    }
    
    // Determinar qué URL de base de datos usar
    const dbUrl = dbUrlFromRequest || dbUrlFromEnv;
    
    // Si no hay URL de base de datos disponible, devolver error
    if (!dbUrl) {
      console.error('No se encontró URL de base de datos ni en la solicitud ni en .env');
      return NextResponse.json({
        success: false,
        error: 'No se encontró DATABASE_URL en el archivo .env ni en la solicitud. Configura primero la URL de la base de datos.'
      }, { status: 400 });
    }
    
    // Intentar ejecutar la migración con prisma db push (más seguro que migrate dev en producción)
    try {
      await execPromise('npx prisma db push --accept-data-loss');
    } catch (migrationError) {
      console.error('Error durante db push:', migrationError);
      return NextResponse.json({
        success: false,
        error: `Error durante la migración: ${migrationError instanceof Error ? migrationError.message : 'Error desconocido'}`
      }, { status: 500 });
    }
    
    // Generar el cliente Prisma
    try {
      await execPromise('npx prisma generate');
    } catch (generateError) {
      console.warn('Advertencia al generar el cliente Prisma:', generateError);
      // Continuamos aunque falle la generación del cliente
    }
    
    // Respuesta exitosa
    const response = NextResponse.json({
      success: true,
      message: 'Base de datos migrada correctamente. Las tablas han sido creadas en la base de datos.'
    });
    
    // Configurar cabeceras CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('Error durante el proceso de migración:', error);
    
    const response = NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido durante la migración'
    }, { status: 500 });
    
    // Configurar cabeceras CORS incluso en caso de error
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  }
}
