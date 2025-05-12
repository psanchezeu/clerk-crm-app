import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Definimos un middleware personalizado para control de configuración
export async function middleware(request: NextRequest) {
  // Rutas que siempre deben ser accesibles
  const setupRoutes = [
    '/setup',
    '/api/config/check',
    '/api/config/save',
    '/api/config/save-db', 
    '/api/config/status',  // Añadido el nuevo endpoint
    '/api/db/migrate'
  ];
  
  // Rutas que debemos ignorar siempre
  const ignoreRoutes = [
    '/_next',
    '/favicon.ico',
    '/images',
    '/api/webhook'
  ];
  
  const { pathname } = request.nextUrl;
  
  // Ignorar rutas de recursos estáticos
  if (ignoreRoutes.some(route => pathname.startsWith(route)) || pathname.endsWith('.png')) {
    return NextResponse.next();
  }
  
  // Permitir rutas de setup siempre
  if (setupRoutes.some(route => pathname === route)) {
    return NextResponse.next();
  }
  
  try {
    // Verificar si la aplicación está configurada usando cookies en lugar de sistema de archivos
    // para ser compatible con Edge Runtime
    const cookies = request.cookies;
    const setupCompletedCookie = cookies.get('setup_completed');
    const isConfigured = setupCompletedCookie?.value === 'true';
    
    // Si no está configurada y no estamos en el setup, redirigir al setup
    if (!isConfigured && !pathname.startsWith('/setup')) {
      console.log(`App no configurada, redirigiendo a /setup desde ${pathname}`);
      return NextResponse.redirect(new URL('/setup', request.url));
    }
    
    // La aplicación está configurada, dejamos que el flujo normal continue
    return NextResponse.next();
  } catch (error) {
    console.error('Error en middleware de configuración:', error);
    
    // En caso de error, permitir acceso a rutas de setup
    if (setupRoutes.some(route => pathname === route)) {
      return NextResponse.next();
    }
    
    // Para otras rutas, redirigir al setup como precaución
    return NextResponse.redirect(new URL('/setup', request.url));
  }
}

// Exportamos el middleware de Clerk
export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/api/webhook",
    "/setup",
    "/api/config/check",
    "/api/config/save",
    "/api/config/save-db",
    "/api/config/status",  // Añadido el nuevo endpoint
    "/api/db/migrate",
    "/not-found"
  ],
});

export const config = {
  matcher: [
    // Todas las rutas excepto _next, api/webhook, etc.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"
  ],
};
