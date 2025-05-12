import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Rutas públicas que no requieren autenticación
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/api/webhook"
  ],
});

export const config = {
  matcher: [
    // Rutas que requieren autenticación
    "/dashboard/:path*",
    "/api/:path*",
    
    // Excluir archivos estáticos y rutas de API específicas
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)" 
  ],
};
