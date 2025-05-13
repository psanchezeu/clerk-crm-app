'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>CRM con Clerk</CardTitle>
          <CardDescription>
            Bienvenido al sistema CRM. Usa las variables de entorno para configurar la aplicación.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <Button 
              onClick={() => router.push('/sign-in')}
              className="bg-blue-600 hover:bg-blue-700 w-full"
            >
              Iniciar sesión
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="text-sm text-gray-500 border-t pt-4">
          <p>
            CRM con autenticación Clerk - Tu solución empresarial completa
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
