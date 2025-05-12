import { NextRequest, NextResponse } from 'next/server';
import { isAppConfigured, markSetupComplete } from '../../../../lib/config-check';

/**
 * Manejador para solicitudes OPTIONS (CORS)
 */
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

/**
 * GET - Obtener el estado actual de configuración o marcarlo como completado
 * Si se proporciona ?complete=true, marca la configuración como completada
 * Si no, retorna si la aplicación está correctamente configurada
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const complete = searchParams.get('complete') === 'true';
    
    // Si se solicita marcar como completado
    if (complete) {
      const success = await markSetupComplete();
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'La configuración ha sido marcada como completa',
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No se pudo marcar la configuración como completa');
      }
    }
    
    // Si no hay parámetros, simplemente verificar el estado
    const isConfigured = await isAppConfigured(true);
    
    return NextResponse.json({
      configured: isConfigured,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al procesar la solicitud de configuración:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al procesar la configuración',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST - Actualizar el estado de configuración
 * Permite marcar explícitamente que la configuración está completa
 * 
 * NOTA: Este método se mantiene como alternativa, pero es preferible
 * usar GET con parámetro ?complete=true si hay problemas con POST
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configured } = body;
    
    if (configured === true) {
      const success = await markSetupComplete();
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'La configuración ha sido marcada como completa',
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No se pudo marcar la configuración como completa');
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Parámetro de configuración no válido',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  } catch (error) {
    console.error('Error al actualizar estado de configuración:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar la configuración',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
