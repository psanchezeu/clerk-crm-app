import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que siempre deben ser accesibles
const setupRoutes = [
  '/setup',
  '/api/config/check',
  '/api/config/save',
  '/api/config/save-db', 
  '/api/config/status',  // Añadido el nuevo endpoint
  '/api/db/migrate'
];

// Rutas para autenticación de Clerk que deben ser públicas
const publicRoutes = [
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
];

// Función para verificar configuración a través de cookies
function isConfigured(request: NextRequest): boolean {
  try {
    const cookies = request.cookies;
    const setupCompletedCookie = cookies.get('setup_completed');
    return setupCompletedCookie?.value === 'true';
  } catch (error) {
    console.error('Error al verificar cookies de configuración:', error);
    return false;
  }
}

// Middleware combinado: integramos nuestra lógica con authMiddleware de Clerk
export default authMiddleware({
  publicRoutes,
  beforeAuth: (req) => {
    const { pathname } = req.nextUrl;
    
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
    
    // Si no está configurada y no estamos en el setup, redirigir al setup
    if (!isConfigured(req) && !pathname.startsWith('/setup')) {
      console.log(`App no configurada, redirigiendo a /setup desde ${pathname}`);
      return NextResponse.redirect(new URL('/setup', req.url));
    }
    
    // Si está configurada, continuar con el flujo normal
    return NextResponse.next();
  },
});

export const config = {
  matcher: [
    // Todas las rutas excepto _next, api/webhook, etc.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"
  ],
};
