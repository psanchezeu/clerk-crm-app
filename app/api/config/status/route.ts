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
 * GET - Obtener el estado actual de configuración
 * Retorna si la aplicación está correctamente configurada
 */
export async function GET(request: NextRequest) {
  try {
    // Forzar una verificación fresca ignorando la caché
    const isConfigured = await isAppConfigured(true);
    
    return NextResponse.json({
      configured: isConfigured,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al verificar el estado de configuración:', error);
    return NextResponse.json({ 
      configured: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al verificar la configuración',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST - Actualizar el estado de configuración
 * Permite marcar explícitamente que la configuración está completa
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
