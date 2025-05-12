/**
 * Este script desactiva el middleware durante el despliegue
 * para evitar problemas de redirecciones infinitas.
 */
const fs = require('fs');
const path = require('path');

try {
  // Ruta al archivo middleware.ts
  const middlewarePath = path.join(process.cwd(), 'middleware.ts');
  
  // Verificar si existe
  if (fs.existsSync(middlewarePath)) {
    // Crear un respaldo del middleware
    fs.copyFileSync(middlewarePath, middlewarePath + '.bak');
    
    // Crear un middleware simple que no hace nada
    const disabledMiddleware = `
// Middleware desactivado temporalmente para evitar bucles de redirección
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Permitir todas las solicitudes sin hacer nada
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Sin patrones de coincidencia (no afecta a ninguna ruta)
    "/disabled-middleware"
  ],
};
`;
    
    // Sobrescribir el middleware con la versión deshabilitada
    fs.writeFileSync(middlewarePath, disabledMiddleware);
    
    console.log('Middleware desactivado con éxito para evitar bucles de redirección');
  } else {
    console.error('No se pudo encontrar el archivo middleware.ts');
  }
} catch (error) {
  console.error('Error al desactivar el middleware:', error);
}
