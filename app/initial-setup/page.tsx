'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function InitialSetupPage() {
  // Estado para las claves de Clerk
  const [publishableKey, setPublishableKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  
  // Estado para mensajes y carga
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('idle');
    setMessage('');
    
    try {
      // Validar formato de las claves
      if (!publishableKey.startsWith('pk_') || !secretKey.startsWith('sk_')) {
        setStatus('error');
        setMessage('Las claves tienen un formato inválido. La Publishable Key debe empezar con pk_ y la Secret Key con sk_');
        setIsLoading(false);
        return;
      }
      
      // Guardar las claves en el servidor
      const response = await fetch('/api/config/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkPublishableKey: publishableKey,
          clerkSecretKey: secretKey,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setMessage('¡Claves guardadas correctamente! Redirigiendo...');
        
        // Guardar localmente para evitar llamadas adicionales
        localStorage.setItem('setup_completed', 'true');
        
        // Redireccionar a la página de configuración normal
        setTimeout(() => {
          window.location.href = '/setup';
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Error al guardar las claves');
      }
    } catch (error) {
      console.error('Error al guardar claves de Clerk:', error);
      setStatus('error');
      setMessage('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configuración inicial de Clerk</CardTitle>
          <CardDescription>
            Para comenzar, necesitas configurar las claves de autenticación de Clerk.
            Esto es requerido antes de acceder a cualquier funcionalidad.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publishableKey">Clerk Publishable Key</Label>
              <Input
                id="publishableKey"
                placeholder="pk_test_..."
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500">Comienza con pk_test_ o pk_live_</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secretKey">Clerk Secret Key</Label>
              <Input
                id="secretKey"
                placeholder="sk_test_..."
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500">Comienza con sk_test_ o sk_live_</p>
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
                <AlertTitle>¡Éxito!</AlertTitle>
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
                  Guardando...
                </>
              ) : (
                'Guardar claves y continuar'
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col items-start text-sm text-gray-500">
          <p>Si no tienes tus claves de Clerk:</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Ve a <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">dashboard.clerk.com</a></li>
            <li>Crea un nuevo proyecto o selecciona uno existente</li>
            <li>Ve a API Keys en el menú lateral</li>
            <li>Copia ambas claves y pégalas aquí</li>
          </ol>
        </CardFooter>
      </Card>
    </div>
  );
}
