/**
 * MIDDLEWARE DESHABILITADO PARA EVITAR BUCLES DE REDIRECCIÓN
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Esta función se mantiene en caso de que se necesite verificar el estado de Clerk
export function isClerkConfigured(): boolean {
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
 * Middleware deshabilitado temporalmente para resolver el problema
 * de bucles de redirección. Simplemente permite todas las solicitudes.
 */
export function middleware(request: NextRequest) {
  console.log(`[Middleware-DISABLED] Ruta: ${request.nextUrl.pathname}`);
  // Permitir todas las solicitudes sin redirigir
  return NextResponse.next();
}

/**
 * Configurar el matcher para que no afecte ninguna ruta.
 * Esto es equivalente a deshabilitar el middleware por completo.
 */
export const config = {
  matcher: [
    // Ruta inexistente para que no afecte ninguna URL
    "/middleware-disabled-path-does-not-exist"
  ],
};
