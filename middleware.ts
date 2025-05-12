/**
 * Middleware simplificado para configuración inicial de Clerk
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que no requieren autenticación
const publicRoutes = [
  // Página de configuración y recursos estáticos
  '/',
  '/setup-clerk',
  '/_next',
  '/favicon.ico',
  
  // Rutas de API necesarias para la configuración
  '/api/clerk-config',
];

/**
 * Verifica si Clerk está correctamente configurado
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
 * Verifica si una ruta es pública o requiere autenticación
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith(route + '/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  );
}

/**
 * Middleware principal
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Permitir siempre recursos estáticos y rutas públicas
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Si Clerk no está configurado, redirigir a la página de configuración
  if (!isClerkConfigured()) {
    return NextResponse.redirect(new URL('/setup-clerk', request.url));
  }
  
  // Permitir todas las solicitudes si Clerk está configurado
  // (implementaremos la autenticación más adelante)
  return NextResponse.next();
}

/**
 * Configurar el matcher para que afecte todas las rutas excepto recursos estáticos
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ],
};
