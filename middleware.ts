/**
 * Middleware COMPLETAMENTE DESHABILITADO para evitar redirecciones
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Verifica si Clerk está correctamente configurado
 * Esta función es exportada para uso en otros componentes
 */
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
 * Middleware deshabilitado para evitar cualquier redirección
 */
export function middleware(request: NextRequest) {
  // No hacer nada, simplemente permitir todas las solicitudes
  console.log('Middleware deshabilitado:', request.nextUrl.pathname);
  return NextResponse.next();
}

/**
 * Configurar el matcher para que NO afecte ninguna ruta
 */
export const config = {
  matcher: [
    // Esta ruta no existe, para que el middleware no afecte ninguna ruta
    "/middleware-disabled-do-not-use"
  ],
};
