'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Página de inicio de sesión de emergencia
 * Esta página permite acceder a la aplicación cuando Clerk no está configurado
 */
export default function EmergencyLoginPage(): JSX.Element {
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  
  const router = useRouter();
  
  /**
   * Maneja el inicio de sesión de emergencia
   */
  const handleEmergencyLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/bypass-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        // Redirigir a setup o dashboard después de un inicio exitoso
        setTimeout(() => {
          router.push('/setup');
        }, 1500);
      } else {
        setError(data.error || 'Error al intentar iniciar sesión');
      }
    } catch (err) {
      console.error('Error en inicio de sesión de emergencia:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Modo de emergencia</h1>
          <p className="text-gray-600">
            Este modo permite acceder a la aplicación cuando Clerk no está configurado.
            Úsalo solo para configurar la aplicación.
          </p>
        </div>
        
        {success ? (
          <div className="p-4 mb-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <p className="font-bold">¡Inicio de sesión exitoso!</p>
            <p>Redirigiendo a la página de configuración...</p>
          </div>
        ) : (
          <form onSubmit={handleEmergencyLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña de emergencia
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingresa la contraseña de emergencia"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                La contraseña predeterminada es &quot;setup123&quot; a menos que se haya configurado otra.
              </p>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión de emergencia'}
            </Button>
            
            <div className="text-center mt-4">
              <Link 
                href="/setup"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Ir a la página de configuración
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}