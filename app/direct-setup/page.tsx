'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function DirectSetupPage() {
  const [publishableKey, setPublishableKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const router = useRouter();
  
  /**
   * Configuración directa de claves de Clerk
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('idle');
    setMessage('');
    
    try {
      // Validar formato de claves
      if (!publishableKey.startsWith('pk_') || !secretKey.startsWith('sk_')) {
        setStatus('error');
        setMessage('Las claves tienen un formato inválido. La Publishable Key debe empezar con pk_ y la Secret Key con sk_');
        setIsLoading(false);
        return;
      }
      
      // Enviar claves al nuevo endpoint que las establece directamente
      const response = await fetch('/api/set-clerk-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publishableKey,
          secretKey,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setMessage('¡Claves configuradas correctamente! Actualizando aplicación...');
        
        // Establecer indicador en localStorage
        localStorage.setItem('clerk_keys_configured', 'true');
        localStorage.setItem('setup_completed', 'true');
        
        // Establecer también directamente en cookies desde el cliente (respaldo adicional)
        document.cookie = `clerk_keys_configured=true;path=/;max-age=${30 * 24 * 60 * 60};samesite=lax`;
        document.cookie = `setup_completed=true;path=/;max-age=${30 * 24 * 60 * 60};samesite=lax`;
        
        // Recargar la página completamente para reiniciar la aplicación
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Error al configurar las claves');
      }
    } catch (error) {
      console.error('Error en configuración:', error);
      setStatus('error');
      setMessage('Error de comunicación con el servidor');
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
            Introduce las claves de API de Clerk para configurar la autenticación.
            Este paso es necesario para acceder a la aplicación.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publishableKey">Publishable Key</Label>
              <Input
                id="publishableKey"
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
                placeholder="pk_test_..."
                required
              />
              <p className="text-xs text-gray-500">Debe comenzar con pk_test_ o pk_live_</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_test_..."
                required
                type="password"
              />
              <p className="text-xs text-gray-500">Debe comenzar con sk_test_ o sk_live_</p>
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
                  Configurando...
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
