import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Función para ejecutar comandos de forma asíncrona
const execPromise = async (command: string, timeout = 30000): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log(`Ejecutando comando: ${command}`);
    const childProcess = exec(command, { env: { ...process.env } }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar ${command}:`, error);
        console.error('stderr:', stderr);
        reject(error);
        return;
      }
      console.log(`Comando completado: ${command}`);
      console.log('stdout:', stdout);
      resolve(stdout);
    });
    
    // Timeout para evitar que se quede bloqueado
    const timer = setTimeout(() => {
      childProcess.kill();
      reject(new Error(`Timeout al ejecutar el comando: ${command}`));
    }, timeout);
    
    childProcess.on('close', () => clearTimeout(timer));
  });
};

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
  console.log('POST /api/db/migrate - Iniciando...');
  let prisma: PrismaClient | null = null;
  
  try {
    const { dbUrl } = await request.json();
    let databaseUrl = dbUrl;
    
    // Si se proporciona una URL de base de datos en la solicitud, usarla
    // sino, intentar leer del archivo .env
    if (!databaseUrl) {
      console.log('No se proporcionó URL de base de datos en la solicitud, buscando en .env');
      
      // Verificar si el archivo .env existe y contiene DATABASE_URL
      const envFilePath = path.join(process.cwd(), '.env');
      
      if (fs.existsSync(envFilePath)) {
        const envContent = fs.readFileSync(envFilePath, 'utf8');
        const dbUrlMatch = envContent.match(/DATABASE_URL=\"([^\"]+)\"/); // Extraer el valor de DATABASE_URL
        
        if (dbUrlMatch && dbUrlMatch[1]) {
          databaseUrl = dbUrlMatch[1];
          console.log('URL de base de datos encontrada en .env');
        } else {
          return NextResponse.json({
            success: false,
            error: 'No se encontró DATABASE_URL en el archivo .env. Configura primero la URL de la base de datos.'
          }, { status: 400 });
        }
      } else {
        return NextResponse.json({
          success: false,
          error: 'No se encontró el archivo .env ni se proporcionó una URL de base de datos. Configura primero la URL de la base de datos.'
        }, { status: 400 });
      }
    }

    // Si tenemos una URL de base de datos, intentar configurar la variable de entorno temporalmente
    if (databaseUrl) {
      process.env.DATABASE_URL = databaseUrl;
      console.log('Variable de entorno DATABASE_URL configurada temporalmente');
    }

    // Verificar si podemos conectarnos a la base de datos antes de continuar
    try {
      console.log('Probando conexión a la base de datos...');
      prisma = new PrismaClient();
      await prisma.$connect();
      console.log('Conexión a la base de datos exitosa');
    } catch (connectionError) {
      console.error('Error al conectar con la base de datos:', connectionError);
      return NextResponse.json({
        success: false,
        error: `No se pudo conectar a la base de datos. Verifica la URL y asegúrate de que la base de datos esté accesible. Error: ${connectionError instanceof Error ? connectionError.message : 'Error desconocido'}`
      }, { status: 500 });
    }

    // Intentar ejecutar Prisma para generar el cliente y aplicar migraciones
    try {
      console.log('Ejecutando prisma generate...');
      await execPromise('npx prisma generate', 60000);
      
      console.log('Ejecutando prisma db push...');
      await execPromise('npx prisma db push --accept-data-loss', 120000);
      
      // Intentar ejecutar el script de seed para datos iniciales
      try {
        console.log('Ejecutando script de seed...');
        await execPromise('npx prisma db seed', 60000);
      } catch (seedError) {
        console.warn('Advertencia al ejecutar seed:', seedError);
        // Continuamos a pesar del error en seed
      }
      
      // Verificar la conexión a la base de datos nuevamente
      if (prisma) {
        // Intentar realizar una consulta simple
        const rolesCount = await prisma.rol.count();
        console.log(`Verificación final: Roles encontrados: ${rolesCount}`);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Migración completada exitosamente. Base de datos configurada y poblada.',
        details: {
          dbUrl: databaseUrl ? databaseUrl.replace(/:[^:]*@/, ':****@') : null // Ocultar contraseña en logs
        }
      });
    } catch (migrationError) {
      console.error('Error durante la migración:', migrationError);
      return NextResponse.json({
        success: false,
        error: `Error durante la migración: ${migrationError instanceof Error ? migrationError.message : 'Error desconocido'}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error general:', error);
    return NextResponse.json({
      success: false,
      error: `Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }, { status: 500 });
  } finally {
    // Asegurarse de cerrar la conexión a Prisma
    if (prisma) {
      try {
        await prisma.$disconnect();
        console.log('Conexión a Prisma cerrada correctamente');
      } catch (disconnectError) {
        console.error('Error al desconectar Prisma:', disconnectError);
      }
    }
  }
}
