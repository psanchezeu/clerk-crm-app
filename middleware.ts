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

// Verificar si el usuario tiene acceso de emergencia
function hasEmergencyAccess(request: NextRequest): boolean {
  try {
    // Verificar desde múltiples fuentes para mayor robustez
    const cookies = request.cookies;
    const emergencyAccessCookie = cookies.get('emergency_access');
    const setupCompletedCookie = cookies.get('setup_completed');
    
    // Verificar token en los headers para API calls
    const authHeader = request.headers.get('x-emergency-token');
    
    // Verificar query param para casos extremos
    const { searchParams } = new URL(request.url);
    const emergencyToken = searchParams.get('emergency_token');
    
    // Si cualquiera de estas fuentes indica acceso de emergencia, permitirlo
    return (
      emergencyAccessCookie?.value === 'true' ||
      setupCompletedCookie?.value === 'true' ||
      authHeader === (process.env.EMERGENCY_PASSWORD || 'setup123') ||
      emergencyToken === (process.env.EMERGENCY_PASSWORD || 'setup123')
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

// Middleware principal que implementa todas las verificaciones necesarias
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Permitir recursos estáticos y rutas públicas siempre
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // 2. Si la app no está configurada, redirigir a setup
  if (!isAppConfigured(request)) {
    console.log(`App no configurada, redirigiendo a /setup desde ${pathname}`);
    return NextResponse.redirect(new URL('/setup', request.url));
  }
  
  // 3. Si Clerk no está configurado pero hay acceso de emergencia, permitir acceso
  if (!isClerkConfigured() && hasEmergencyAccess(request)) {
    console.log(`Acceso de emergencia concedido para ${pathname}`);
    return NextResponse.next();
  }
  
  // 4. Si Clerk no está configurado y no hay acceso de emergencia, redirigir a login de emergencia
  if (!isClerkConfigured()) {
    console.log(`Clerk no configurado, redirigiendo a login de emergencia desde ${pathname}`);
    return NextResponse.redirect(new URL('/emergency-login', request.url));
  }
  
  // 5. Si Clerk está configurado, usar auth() para verificar autenticación
  try {
    // Importación dinámica para mayor robustez
    const { auth } = await import('@clerk/nextjs/server');
    const { userId } = auth();
    
    // Si no hay usuario autenticado y la ruta requiere autenticación, redirigir a sign-in
    if (!userId && !isPublicRoute(pathname)) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  } catch (error) {
    console.error('Error al verificar autenticación con Clerk:', error);
    // En caso de error, redirigir a login de emergencia
    return NextResponse.redirect(new URL('/emergency-login', request.url));
  }
  
  // Permitir la solicitud si todas las verificaciones pasan o ya se manejaron
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todas las rutas excepto _next, api/webhook, etc.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"
  ],
};
