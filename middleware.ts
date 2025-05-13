import { authMiddleware } from "@clerk/nextjs";
 
export default authMiddleware({
  // Permitir todas las rutas sin autenticación para pruebas
  publicRoutes: ["/(.*)"],
  
  // Ignorar rutas de archivos estáticos
  ignoredRoutes: ["/favicon.ico", "/_next"],
});
 
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
