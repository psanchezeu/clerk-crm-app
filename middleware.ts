import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que siempre deben ser accesibles independientemente de la configuración
const setupRoutes = [
  '/setup',
  '/api/config/check',
  '/api/config/save',
  '/api/config/save-db', 
  '/api/config/status',
  '/api/db/migrate'
];

// Rutas públicas (para Clerk)
const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/webhook',
  '/setup',
  '/api/config/check',
  '/api/config/save',
  '/api/config/save-db',
  '/api/config/status',
  '/api/db/migrate',
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

// Función para verificar configuración de la aplicación a través de cookies
function isAppConfigured(request: NextRequest): boolean {
  try {
    const cookies = request.cookies;
    const setupCompletedCookie = cookies.get('setup_completed');
    return setupCompletedCookie?.value === 'true';
  } catch (error) {
    console.error('Error al verificar cookies de configuración:', error);
    return false;
  }
}

// Función para el middleware principal de configuración
function configMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Ignorar recursos estáticos
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon.ico') || 
      pathname.startsWith('/images') || 
      pathname.endsWith('.png')) {
    return NextResponse.next();
  }
  
  // Permitir rutas de setup siempre
  if (setupRoutes.some(route => pathname === route)) {
    return NextResponse.next();
  }
  
  // Si la app no está configurada, redirigir a setup
  if (!isAppConfigured(request) && !pathname.startsWith('/setup') && pathname !== '/') {
    console.log(`App no configurada, redirigiendo a /setup desde ${pathname}`);
    return NextResponse.redirect(new URL('/setup', request.url));
  }
  
  // Continuar con el siguiente middleware
  return NextResponse.next();
}

// Usado authMiddleware para mantener la compatibilidad con Clerk
export default authMiddleware({
  publicRoutes,
  beforeAuth: (req) => {
    // Verificar configuración primero
    return configMiddleware(req);
  },
  // Solo hacer la verificación de autenticación si Clerk está configurado
  afterAuth: (auth, req) => {
    if (!isClerkConfigured()) {
      return NextResponse.next();
    }
    
    // Si no hay usuario y no es una ruta pública, redirigir a sign-in
    const { userId } = auth;
    const { pathname } = req.nextUrl;
    
    if (!userId && !publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
    
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Todas las rutas excepto _next, api/webhook, etc.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"
  ],
};
