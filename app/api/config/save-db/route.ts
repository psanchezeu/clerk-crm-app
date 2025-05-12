import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
  console.log('POST /api/config/save-db - Iniciando...');
  try {
    // Asegurarnos de que el body sea JSON válido
    let dbUrl;
    try {
      const body = await request.json();
      dbUrl = body.dbUrl;
      console.log('Datos recibidos:', { dbUrlLength: dbUrl ? dbUrl.length : 0 });
    } catch (jsonError) {
      console.error('Error al parsear JSON del request:', jsonError);
      const response = NextResponse.json({ 
        success: false, 
        error: 'Error al leer los datos enviados. Formato JSON inválido.'
      }, { status: 400 });
      
      // Configurar CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }

    if (!dbUrl) {
      console.warn('URL de base de datos no proporcionada');
      const response = NextResponse.json({ 
        success: false, 
        error: 'La URL de la base de datos es requerida' 
      }, { status: 400 });
      
      // Configurar CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }

    // Validar formato básico de URL de PostgreSQL
    if (!dbUrl.startsWith('postgresql://')) {
      console.warn('Formato de URL incorrecto:', dbUrl.substring(0, 15) + '...');
      const response = NextResponse.json({ 
        success: false, 
        error: 'La URL de conexión debe tener formato postgresql://usuario:contraseña@host:puerto/basededatos' 
      }, { status: 400 });
      
      // Configurar CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }

    console.log('Guardando URL de base de datos:', dbUrl.substring(0, 25) + '...');

    // Ruta del archivo .env
    const envFilePath = path.join(process.cwd(), '.env');
    console.log('Ruta del archivo .env:', envFilePath);
    
    let envContent = '';
    
    // Si el archivo existe, leer su contenido
    if (fs.existsSync(envFilePath)) {
      console.log('Archivo .env encontrado, actualizando...');
      try {
        envContent = fs.readFileSync(envFilePath, 'utf8');
      } catch (readError) {
        console.error('Error al leer el archivo .env:', readError);
        const response = NextResponse.json({ 
          success: false, 
          error: 'Error al leer el archivo .env. Verifica los permisos.'
        }, { status: 500 });
        
        // Configurar CORS
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }
      
      // Buscar la línea de DATABASE_URL y reemplazarla o agregar si no existe
      const dbUrlRegex = /^DATABASE_URL=.*/m;
      if (dbUrlRegex.test(envContent)) {
        envContent = envContent.replace(dbUrlRegex, `DATABASE_URL="${dbUrl}"`);
      } else {
        envContent += `\nDATABASE_URL="${dbUrl}"`;
      }
    } else {
      // Si el archivo no existe, crear uno nuevo con la URL de la base de datos
      console.log('Archivo .env no encontrado, creando uno nuevo...');
      envContent = `DATABASE_URL="${dbUrl}"`;
    }
    
    // Escribir el archivo .env actualizado
    try {
      fs.writeFileSync(envFilePath, envContent);
      console.log('Archivo .env actualizado correctamente con la URL de la base de datos');
    } catch (writeError) {
      console.error('Error al escribir en el archivo .env:', writeError);
      const response = NextResponse.json({ 
        success: false, 
        error: 'Error al escribir en el archivo .env. Verifica los permisos del directorio.'
      }, { status: 500 });
      
      // Configurar CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }
    
    // Respuesta exitosa
    const response = NextResponse.json({ success: true });
    
    // Configurar CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('Error al guardar la configuración de la base de datos:', error);
    
    const response = NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al guardar la configuración'
    }, { status: 500 });
    
    // Configurar CORS incluso en caso de error
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  }
}
