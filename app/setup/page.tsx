'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const [publishableKey, setPublishableKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar si las claves ya están configuradas
    const checkConfiguration = async () => {
      try {
        const response = await fetch('/api/config/check');
        const data = await response.json();
        setIsConfigured(data.configured);
      } catch (error) {
        console.error('Error checking configuration:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConfiguration();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/config/save', {
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
        alert('Configuración guardada correctamente. La aplicación se reiniciará.');
        // Redireccionar a la página principal o recargar la aplicación
        window.location.href = '/';
      } else {
        alert('Error al guardar la configuración: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error al guardar la configuración.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Cargando...</h1>
      </div>
    );
  }

  if (isConfigured) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">La aplicación ya está configurada</h1>
        <button 
          onClick={() => router.push('/')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Ir a la página principal
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Configuración inicial</h1>
        
        <p className="mb-4">
          Para utilizar esta aplicación, necesitas configurar tus claves de Clerk.
          Puedes obtenerlas en el <a href="https://dashboard.clerk.com/last-active?path=api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Panel de Clerk</a>.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="publishableKey" className="block text-sm font-medium text-gray-700 mb-1">
              Publishable Key
            </label>
            <input
              type="text"
              id="publishableKey"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="pk_test_..."
            />
          </div>
          
          <div>
            <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700 mb-1">
              Secret Key
            </label>
            <input
              type="password"
              id="secretKey"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="sk_test_..."
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {isLoading ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </form>
      </div>
    </div>
  );
}
