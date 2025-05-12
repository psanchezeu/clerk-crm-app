import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const envFilePath = path.resolve(process.cwd(), '.env');
    
    // Comprobar si el archivo .env existe
    if (!fs.existsSync(envFilePath)) {
      return NextResponse.json({ configured: false });
    }
    
    // Leer el contenido del archivo .env
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    
    // Verificar si las claves de Clerk están presentes, activas (no comentadas) y con valores
    const hasPublishableKey = /^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=(.+)/m.test(envContent);
    const hasSecretKey = /^CLERK_SECRET_KEY=(.+)/m.test(envContent);
    
    return NextResponse.json({ 
      configured: hasPublishableKey && hasSecretKey 
    });
  } catch (error) {
    console.error('Error checking configuration:', error);
    return NextResponse.json(
      { error: 'Error al verificar la configuración' },
      { status: 500 }
    );
  }
}
