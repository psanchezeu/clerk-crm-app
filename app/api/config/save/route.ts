import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { publishableKey, secretKey } = await request.json();
    
    // Validar que se hayan proporcionado ambas claves
    if (!publishableKey || !secretKey) {
      return NextResponse.json(
        { success: false, error: 'Ambas claves son requeridas' },
        { status: 400 }
      );
    }
    
    // Validar formato de las claves
    if (!publishableKey.startsWith('pk_') || !secretKey.startsWith('sk_')) {
      return NextResponse.json(
        { success: false, error: 'Formato de claves inválido' },
        { status: 400 }
      );
    }
    
    const envFilePath = path.resolve(process.cwd(), '.env');
    const envContent = `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${publishableKey}\nCLERK_SECRET_KEY=${secretKey}`;
    
    // Escribir el archivo .env con las nuevas claves
    fs.writeFileSync(envFilePath, envContent, 'utf8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Error al guardar la configuración' },
      { status: 500 }
    );
  }
}
