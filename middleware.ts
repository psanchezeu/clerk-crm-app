// Middleware simplificado con enfoque en configuración inicial
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que siempre serán accesibles sin autenticación
const publicRoutes = [
  // Rutas principales públicas
  '/',
  '/initial-setup',
  '/setup',
  '/sign-in',
  '/sign-up',
  
  // APIs de configuración
  '/api/config/check',
  '/api/config/save',
  '/api/config/save-db',
  '/api/config/status',
  '/api/db/migrate',
  
  // Otros recursos públicos
  '/api/webhook',
  '/not-found'
];

// Verificar si tenemos claves de Clerk configuradas
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

// Comprobar si es una ruta pública que no requiere autenticación
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith(route + '/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.js')
  );
}

/**
 * Middleware simplificado que solo verifica las rutas públicas y redirige a configuración inicial
 * si Clerk no está configurado
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Ruta: ${pathname}`);
  
  // 1. Siempre permitir recursos estáticos y rutas públicas
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // 2. Si Clerk no está configurado, redirigir a configuración directa
  if (!isClerkConfigured()) {
    console.log(`[Middleware] Clerk no configurado, redirigiendo a configuración directa`);
    return NextResponse.redirect(new URL('/direct-setup', request.url));
  }
  
  // 3. Si Clerk está configurado, usar autenticación estándar
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const { userId } = auth();
    
    // Si no hay usuario autenticado, redirigir a sign-in
    if (!userId) {
      console.log(`[Middleware] Usuario no autenticado, redirigiendo a sign-in`);
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  } catch (error) {
    console.error('[Middleware] Error con Clerk, redirigiendo a configuración inicial:', error);
    return NextResponse.redirect(new URL('/initial-setup', request.url));
  }
  
  // 4. Si todo está bien, permitir la solicitud
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todas las rutas excepto _next, api/webhook, etc.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"
  ],
};
