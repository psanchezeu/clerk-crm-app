// Implementación de middleware compatible con modo de emergencia
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que siempre deben ser accesibles, independientemente de la autenticación o configuración
const publicRoutes = [
  '/api/bypass-auth',
  '/emergency-login', 
  '/setup',
  '/api/config/check',
  '/api/config/save',
  '/api/config/save-db', 
  '/api/config/status',
  '/api/db/migrate',
  '/',
  '/sign-in',
  '/sign-up',
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

// Comprobar si la aplicación está configurada (usando cookies)
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

// Token radical de emergencia que siempre tendrá prioridad
const EMERGENCY_AUTH_TOKEN = 'emergency_auth_active';

// Verificar si el usuario tiene acceso de emergencia
function hasEmergencyAccess(request: NextRequest): boolean {
  try {
    // SIEMPRE verificar primero el token radical
    const cookies = request.cookies;
    const radicalBypassCookie = cookies.get(EMERGENCY_AUTH_TOKEN);
    if (radicalBypassCookie?.value === 'true') {
      console.log('[Middleware] Token radical de emergencia detectado');
      return true;
    }
    
    // Verificar desde múltiples fuentes para mayor robustez
    const emergencyAccessCookie = cookies.get('emergency_access');
    const setupCompletedCookie = cookies.get('setup_completed');
    
    // Verificar token en los headers para API calls
    const authHeader = request.headers.get('x-emergency-token');
    
    // Verificar query param para casos extremos
    const { searchParams } = new URL(request.url);
    const emergencyToken = searchParams.get('emergency_token');
    const tokenParam = searchParams.get('token');
    
    // Si cualquiera de estas fuentes indica acceso de emergencia, permitirlo
    return (
      emergencyAccessCookie?.value === 'true' ||
      setupCompletedCookie?.value === 'true' ||
      authHeader === (process.env.EMERGENCY_PASSWORD || 'setup123') ||
      emergencyToken === (process.env.EMERGENCY_PASSWORD || 'setup123') ||
      tokenParam === 'emergency'
    );
  } catch (error) {
    console.error('Error al verificar acceso de emergencia:', error);
    return false;
  }
}

// Comprobar si la ruta debe ser accesible públicamente
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith(route + '/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images') ||
    pathname.endsWith('.png')
  );
}

// Middleware principal simplificado y robusto para evitar bucles de redirección
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Procesando: ${pathname}`);
  
  // PASO 1: SIEMPRE permitir recursos estáticos y rutas públicas
  if (isPublicRoute(pathname)) {
    console.log(`[Middleware] Ruta pública permitida: ${pathname}`);
    return NextResponse.next();
  }
  
  // PASO 2: SIEMPRE permitir acceso a setup
  if (pathname === '/setup' || pathname.startsWith('/setup/')) {
    console.log('[Middleware] Acceso a setup permitido siempre');
    return NextResponse.next();
  }
  
  // PASO 3: Si hay acceso de emergencia, SIEMPRE permitir el paso
  // Esto tiene prioridad sobre todas las demás reglas
  if (hasEmergencyAccess(request)) {
    console.log(`[Middleware] Acceso de emergencia permitido para: ${pathname}`);
    return NextResponse.next();
  }
  
  // PASO 4: Si la app no está configurada, redirigir a setup
  if (!isAppConfigured(request)) {
    console.log(`[Middleware] App no configurada, redirigiendo a /setup`);
    return NextResponse.redirect(new URL('/setup', request.url));
  }
  
  // PASO 5: Si Clerk no está configurado, redirigir a login de emergencia
  if (!isClerkConfigured()) {
    console.log(`[Middleware] Clerk no configurado, redirigiendo a emergency-login`);
    // Para evitar bucles, verificamos que no estamos ya en emergency-login
    if (pathname !== '/emergency-login') {
      return NextResponse.redirect(new URL('/emergency-login', request.url));
    } else {
      // Si ya estamos en emergency-login, permitir el acceso
      return NextResponse.next();
    }
  }
  
  // PASO 6: Si Clerk está configurado, usar su autenticación
  try {
    // Importación dinámica para mayor robustez
    const { auth } = await import('@clerk/nextjs/server');
    const { userId } = auth();
    
    // Si no hay usuario autenticado y la ruta requiere autenticación, redirigir a sign-in
    if (!userId && !isPublicRoute(pathname)) {
      // Evitar bucles verificando que no estamos ya en sign-in
      if (pathname !== '/sign-in') {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  } catch (error) {
    console.error('[Middleware] Error al verificar autenticación con Clerk:', error);
    // En caso de error, redirigir a login de emergencia
    if (pathname !== '/emergency-login') {
      return NextResponse.redirect(new URL('/emergency-login', request.url));
    }
  }
  
  // Permitir la solicitud por defecto
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todas las rutas excepto _next, api/webhook, etc.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"
  ],
};
