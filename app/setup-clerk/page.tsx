'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface ConfigFormData {
  publishableKey: string;
  secretKey: string;
}

/**
 * Página de configuración inicial de Clerk
 * Esta página permite al usuario configurar las claves de Clerk necesarias para la autenticación
 */
export default function SetupClerk() {
  const [formData, setFormData] = useState<ConfigFormData>({
    publishableKey: '',
    secretKey: '',
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  
  /**
   * Actualiza el estado del formulario
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  /**
   * Crea el endpoint API para guardar las claves de Clerk
   */
  const saveClerkConfig = async (config: ConfigFormData): Promise<boolean> => {
    try {
      // Crear cookies client-side como primer paso
      document.cookie = `clerk_configured=true;path=/;max-age=${30 * 24 * 60 * 60}`;
      
      // Intentar guardar vía API
      const response = await fetch('/api/clerk-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      if (response.ok) {
        return true;
      }
      
      const data = await response.json();
      throw new Error(data.error || 'Error al guardar la configuración');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      return false;
    }
  };
  
  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('idle');
    setMessage('');
    
    try {
      // Validar formato de claves
      if (!formData.publishableKey.startsWith('pk_')) {
        setStatus('error');
        setMessage('La Publishable Key debe comenzar con "pk_"');
        setIsLoading(false);
        return;
      }
      
      if (!formData.secretKey.startsWith('sk_')) {
        setStatus('error');
        setMessage('La Secret Key debe comenzar con "sk_"');
        setIsLoading(false);
        return;
      }
      
      // Guardar configuración
      const saved = await saveClerkConfig(formData);
      
      if (saved) {
        setStatus('success');
        setMessage('Configuración guardada correctamente. Redirigiendo...');
        
        // Establecer variables locales para esta sesión
        if (typeof window !== 'undefined') {
          // Configurar localStorage y cookies para asegurar persistencia
          localStorage.setItem('clerk_keys_configured', 'true');
          document.cookie = `clerk_configured=true;path=/;max-age=${30 * 24 * 60 * 60};samesite=lax`;
          // También almacenar las claves para desarrollo
          localStorage.setItem('clerk_publishable_key', formData.publishableKey);
          
          // Forzar recarga completa para reiniciar la aplicación
          setTimeout(() => {
            // Usar una URL que evite el cache y fuerce la carga completa
            window.location.href = '/?t=' + new Date().getTime();
          }, 2000);
        }
      } else {
        setStatus('error');
        setMessage('No se pudo guardar la configuración. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error en el proceso de configuración:', error);
      setStatus('error');
      setMessage('Error inesperado. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configuración de Clerk</CardTitle>
          <CardDescription>
            Introduce tus claves de API de Clerk para configurar la autenticación.
            Este paso es necesario para acceder a la aplicación.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publishableKey">Publishable Key</Label>
              <Input
                id="publishableKey"
                name="publishableKey"
                value={formData.publishableKey}
                onChange={handleChange}
                placeholder="pk_test_..."
                required
              />
              <p className="text-xs text-gray-500">
                Comienza con pk_test_ o pk_live_
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                name="secretKey"
                value={formData.secretKey}
                onChange={handleChange}
                placeholder="sk_test_..."
                type="password"
                required
              />
              <p className="text-xs text-gray-500">
                Comienza con sk_test_ o sk_live_
              </p>
            </div>
            
            {status === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            
            {status === 'success' && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>¡Configuración exitosa!</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando configuración...
                </>
              ) : (
                'Guardar configuración'
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter>
          <div className="text-sm text-gray-500 w-full">
            <p className="mb-2">
              Puedes obtener tus claves de API de Clerk en:
              <a href="https://dashboard.clerk.dev" className="text-blue-600 ml-1 hover:underline" target="_blank" rel="noopener noreferrer">
                dashboard.clerk.dev
              </a>
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Ve a tu proyecto</li>
              <li>Selecciona API Keys en el menú</li>
              <li>Copia las claves Publishable Key y Secret Key</li>
            </ol>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
