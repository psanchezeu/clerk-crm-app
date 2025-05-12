/**
 * API endpoint para verificar si Clerk está configurado
 */
import { NextResponse } from 'next/server';

/**
 * Verifica si Clerk está configurado correctamente
 */
function isClerkConfigured(): boolean {
  try {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;
    return !!(publishableKey && secretKey && publishableKey.startsWith('pk_') && secretKey.startsWith('sk_'));
  } catch (error) {
    console.error('Error al verificar la configuración de Clerk:', error);
    return false;
  }
}

/**
 * Controlador GET para verificar el estado de configuración de Clerk
 */
export async function GET(): Promise<NextResponse> {
  try {
    const configured = isClerkConfigured();
    
    return NextResponse.json(
      { configured },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en el endpoint de verificación de Clerk:', error);
    
    return NextResponse.json(
      { configured: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
