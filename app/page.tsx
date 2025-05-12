'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clerkConfigured, setClerkConfigured] = useState(false);
  const router = useRouter();
  
  // Verificar si Clerk está configurado
  useEffect(() => {
    setIsClient(true);
    
    const checkClerkConfiguration = async () => {
      try {
        // Comprobar el estado de la configuración
        const response = await fetch('/api/config/status');
        const data = await response.json();
        
        if (data.clerkPublishableKey && data.clerkSecretKey) {
          setClerkConfigured(true);
          router.push('/sign-in');
        } else {
          setClerkConfigured(false);
        }
      } catch (error) {
        console.error('Error al verificar configuración:', error);
        setClerkConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isClient) {
      checkClerkConfiguration();
    }
  }, [isClient, router]);
  
  // Si estamos en el servidor o cargando, mostrar un estado de carga
  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Cargando...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  // Si Clerk no está configurado, mostrar opciones
  if (!clerkConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Bienvenido a tu CRM</CardTitle>
            <CardDescription>
              Para comenzar a usar la aplicación, necesitas configurar la autenticación de Clerk.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <p className="text-gray-600 mb-4">
              No se detectaron claves de configuración para Clerk. Para utilizar esta aplicación,
              primero debes configurar la autenticación.  
            </p>
            
            <div className="flex justify-center">
              <Button 
                onClick={() => router.push('/initial-setup')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ir a la configuración inicial
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col items-start text-sm text-gray-500 border-t pt-4">
            <p className="font-medium mb-1">¿Qué es Clerk?</p>
            <p>
              Clerk es una plataforma de autenticación que proporciona inicio de sesión seguro 
              y gestión de usuarios para tu aplicación.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Por defecto, simplemente mostrar un mensaje de carga mientras se realiza la redirección
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Redirigiendo...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}
