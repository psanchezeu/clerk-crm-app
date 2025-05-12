/**
 * API de bypass para autenticación en modo de emergencia
 * Esto permite acceder a la aplicación cuando Clerk no está configurado
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  // Obtener información del modo de emergencia
  return NextResponse.json({
    enabled: process.env.EMERGENCY_MODE === 'true',
    message: 'API de bypass para entorno sin Clerk configurado',
  });
}

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    
    // Este es un bypass simple - en producción deberías usar algo más seguro
    // La contraseña de emergencia por defecto es "setup123"
    const emergencyPassword = process.env.EMERGENCY_PASSWORD || 'setup123';
    
    if (password === emergencyPassword) {
      // Crear respuesta con cookie
      const response = NextResponse.json({ 
        success: true,
        message: 'Acceso de emergencia concedido',
      });
      
      // Establecer cookie de acceso de emergencia (24 horas)
      response.cookies.set('emergency_access', 'true', { 
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });
      
      return response;
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Contraseña incorrecta'
    }, { status: 401 });
  } catch (error) {
    console.error('Error en bypass de autenticación:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
