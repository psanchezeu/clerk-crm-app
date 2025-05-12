import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { markSetupComplete } from '../../../../lib/config-check';

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

// Función para reiniciar el servidor Next.js
const restartServer = async (): Promise<void> => {
  try {
    console.log('Intentando reiniciar el servidor Next.js...');
    // En un entorno real, esto podría hacerse mediante comandos del sistema
    // Como estamos en desarrollo, solo registramos el intento
  } catch (error) {
    console.error('Error al intentar reiniciar el servidor:', error);
  }
};

export async function POST(request: NextRequest) {
  console.log('POST /api/config/save - Iniciando...');
  
  try {
    // Extraer los datos de la solicitud
    const body = await request.json();
    const { publishableKey, secretKey, dbUrl, migrate, setupComplete } = body;
    
    // Si se solicita marcar el setup como completado
    if (setupComplete) {
      try {
        await markSetupComplete();
        console.log('Setup marcado como completado desde API');
      } catch (setupError) {
        console.error('Error al marcar setup como completado:', setupError);
      }
    }
    
    console.log('Datos recibidos:', { 
      hasPublishableKey: !!publishableKey, 
      hasSecretKey: !!secretKey, 
      hasDbUrl: !!dbUrl,
      migrate: !!migrate
    });

    // Validar formato de las claves si se proporcionan
    if (publishableKey && secretKey) {
      if (!publishableKey.startsWith('pk_') || !secretKey.startsWith('sk_')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Las claves tienen un formato inválido. La Publishable Key debe empezar con pk_ y la Secret Key con sk_' 
        });
      }
    } else if ((publishableKey && !secretKey) || (!publishableKey && secretKey)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ambas claves de Clerk son requeridas' 
      });
    }
    
    // Validar formato de la URL de base de datos si se proporciona
    if (dbUrl && !dbUrl.startsWith('postgresql://')) {
      return NextResponse.json({ 
        success: false, 
        error: 'La URL de conexión debe tener formato postgresql://usuario:contraseña@host:puerto/basededatos' 
      });
    }

    // Ruta del archivo .env
    const envFilePath = path.join(process.cwd(), '.env');
    console.log('Ruta del archivo .env:', envFilePath);
    
    let envContent = '';
    let envExists = false;
    
    // Si el archivo existe, leer su contenido
    if (fs.existsSync(envFilePath)) {
      console.log('Archivo .env encontrado, actualizando...');
      try {
        envContent = fs.readFileSync(envFilePath, 'utf8');
        envExists = true;
      } catch (readError) {
        console.error('Error al leer el archivo .env:', readError);
        return NextResponse.json({ 
          success: false, 
          error: 'Error al leer el archivo .env. Verifica los permisos.'
        }, { status: 500 });
      }
    } else {
      console.log('Archivo .env no encontrado, creando uno nuevo...');
      envContent = '';
    }
    
    // Actualizar o agregar las claves de Clerk si se proporcionan
    if (publishableKey && secretKey) {
      // Para Publishable Key
      const pkRegex = /^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=.*/m;
      if (envExists && pkRegex.test(envContent)) {
        envContent = envContent.replace(pkRegex, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${publishableKey}`);
      } else {
        if (envContent && !envContent.endsWith('\n')) envContent += '\n';
        envContent += `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${publishableKey}`;
      }
      
      // Para Secret Key
      const skRegex = /^CLERK_SECRET_KEY=.*/m;
      if (envExists && skRegex.test(envContent)) {
        envContent = envContent.replace(skRegex, `CLERK_SECRET_KEY=${secretKey}`);
      } else {
        if (envContent && !envContent.endsWith('\n')) envContent += '\n';
        envContent += `CLERK_SECRET_KEY=${secretKey}`;
      }
    }
    
    // Actualizar o agregar la URL de la base de datos si se proporciona
    if (dbUrl) {
      const dbUrlRegex = /^DATABASE_URL=.*/m;
      if (envExists && dbUrlRegex.test(envContent)) {
        envContent = envContent.replace(dbUrlRegex, `DATABASE_URL="${dbUrl}"`);
      } else {
        if (envContent && !envContent.endsWith('\n')) envContent += '\n';
        envContent += `DATABASE_URL="${dbUrl}"`;
      }
    }
    
    // Guardar el archivo .env
    try {
      fs.writeFileSync(envFilePath, envContent);
      console.log('Archivo .env actualizado correctamente con los nuevos valores');
      
      // Si se solicita migración, intentar ejecutarla
      if (migrate && dbUrl) {
        try {
          console.log('Ejecutando migración de la base de datos...');
          
          // Intentar ejecutar db push (más seguro que migrate dev)
          try {
            const pushPromise = new Promise((resolve, reject) => {
              exec('npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
                if (error) {
                  console.error(`Error durante db push: ${error.message}`);
                  console.error(`stderr: ${stderr}`);
                  reject(error);
                  return;
                }
                console.log(`stdout: ${stdout}`);
                resolve(stdout);
              });
            });
            
            // Esperar hasta 30 segundos para que se complete
            const pushResult = await Promise.race([
              pushPromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
            ]);
            
            console.log('Migración completada correctamente:', pushResult);
          } catch (migrationError) {
            console.error('Error durante la migración:', migrationError);
          }
          
          // Generar el cliente Prisma
          try {
            await new Promise((resolve, reject) => {
              exec('npx prisma generate', (error, stdout, stderr) => {
                if (error) {
                  console.warn(`Advertencia al generar el cliente: ${error.message}`);
                  console.warn(`stderr: ${stderr}`);
                  // No rechazamos la promesa para continuar con el flujo
                  resolve(null);
                  return;
                }
                console.log(`stdout: ${stdout}`);
                resolve(stdout);
              });
            });
          } catch (generateError) {
            console.warn('Advertencia al generar el cliente Prisma:', generateError);
          }
        } catch (migrationError) {
          console.error('Error general durante la migración:', migrationError);
        }
      }
      
      // Reiniciar el servidor para aplicar los cambios
      setTimeout(() => {
        restartServer();
      }, 2000);
      
      return NextResponse.json({
        success: true,
        message: 'Configuración guardada correctamente' + (migrate ? ' y migración iniciada' : '')
      });
    } catch (writeError) {
      console.error('Error al escribir en el archivo .env:', writeError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error al escribir en el archivo .env. Verifica los permisos del directorio.'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error general al procesar la solicitud:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al guardar la configuración'
    }, { status: 500 });
  }
}
