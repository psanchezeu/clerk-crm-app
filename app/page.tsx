'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [clerkConfigured, setClerkConfigured] = useState(false);
  const router = useRouter();
  
  // Verificar si Clerk está configurado
  useEffect(() => {
    const checkClerkConfiguration = async () => {
      try {
        // Verificar si hay cookies que indican que Clerk está configurado
        const hasClerkCookie = document.cookie.includes('clerk_configured=true');
        
        if (hasClerkCookie) {
          setClerkConfigured(true);
        } else {
          // Intentar verificar también si las variables de entorno están establecidas
          const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
          if (publishableKey && publishableKey.startsWith('pk_')) {
            setClerkConfigured(true);
          } else {
            setClerkConfigured(false);
            // Redireccionar a la página de configuración directamente
            router.push('/setup-clerk');
          }
        }
      } catch (error) {
        console.error('Error al verificar configuración:', error);
        setClerkConfigured(false);
        router.push('/setup-clerk');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkClerkConfiguration();
  }, [router]);
  
  // Si estamos cargando, mostrar un estado de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Cargando...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  // Si Clerk está configurado, mostrar opciones para continuar
  if (clerkConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>¡Bienvenido a tu CRM!</CardTitle>
            <CardDescription>
              Clerk está configurado correctamente. ¿Qué deseas hacer a continuación?
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => router.push('/setup')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Configurar base de datos
              </Button>
              
              <Button 
                onClick={() => router.push('/sign-in')}
                variant="outline"
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
  
  // En caso de que no esté configurado y no se haya redireccionado todavía
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configuración requerida</CardTitle>
          <CardDescription>
            Para continuar, necesitas configurar Clerk.  
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Button 
            onClick={() => router.push('/setup-clerk')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Ir a la página de configuración
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
