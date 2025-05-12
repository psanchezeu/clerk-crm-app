import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Rutas públicas que no requieren autenticación
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/api/webhook",
    "/setup",
    "/api/config/check",
    "/api/config/save",
    "/api/config/save-db",
    "/api/db/migrate"
  ],
});

export const config = {
  matcher: [
    // Rutas que requieren autenticación
    "/dashboard/:path*",
    "/api/:path*",
    
    // Excluir archivos estáticos, rutas de API específicas y la ruta de setup
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|setup|api/config/.*).*)"
  ],
};
