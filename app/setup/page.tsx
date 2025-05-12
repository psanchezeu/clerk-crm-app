'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  // Estado para las claves de Clerk
  const [publishableKey, setPublishableKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  
  // Estado para la configuración de la base de datos
  const [dbUrl, setDbUrl] = useState('postgresql://postgres:password@localhost:5432/crm');
  
  // Estado de carga y mensajes
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'warning'>('idle');
  const [message, setMessage] = useState('');
  
  // Estado para controlar el paso actual del wizard
  const [currentStep, setCurrentStep] = useState(1);
  const [stepsCompleted, setStepsCompleted] = useState<{[key: number]: boolean}>({});
  
  const router = useRouter();
  
  // Verificar si la configuración ya está completa al cargar la página
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        // Intentar obtener el estado de setup_completed de localStorage
        const setupCompleted = localStorage.getItem('setup_completed');
        
        // Si ya se completó la configuración, redirigir al dashboard o login
        if (setupCompleted === 'true') {
          // Redirigir al usuario a la página de inicio de sesión
          router.push('/sign-in?redirect_url=/dashboard');
        } else {
          // Verificar con el servidor si la configuración ya está completa
          const response = await fetch('/api/config/status', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Si el API indica que la configuración está completa
            if (data.configured) {
              localStorage.setItem('setup_completed', 'true');
              router.push('/sign-in?redirect_url=/dashboard');
            }
          }
        }
      } catch (error) {
        console.error('Error al verificar estado de configuración:', error);
      }
    };
    
    checkSetupStatus();
  }, [router]);
  
  // Función para manejar la configuración de Clerk
  const handleClerkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('loading');
    setMessage('Guardando claves de Clerk...');

    try {
      // Validar formato de las claves
      if (!publishableKey.startsWith('pk_') || !secretKey.startsWith('sk_')) {
        setStatus('error');
        setMessage('Las claves tienen un formato inválido. La Publishable Key debe empezar con pk_ y la Secret Key con sk_');
        setIsLoading(false);
        return;
      }

      // Llamar al endpoint unificado para guardar las claves
      const response = await fetch('/api/config/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publishableKey, secretKey }),
      });

      if (!response.ok) {
        throw new Error(`Error en la respuesta del servidor: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Marcar este paso como completado
        setStatus('success');
        setMessage('Claves de Clerk guardadas correctamente. Ahora vamos a configurar la base de datos.');
        
        // Marcar paso como completado
        setStepsCompleted({...stepsCompleted, 1: true});
        
        // Avanzar al siguiente paso
        setTimeout(() => {
          setCurrentStep(2);
          setStatus('idle');
          setMessage('');
        }, 2000);
      } else {
        throw new Error(data.error || 'Error desconocido al guardar las claves');
      }
    } catch (error) {
      console.error('Error al procesar la configuración de Clerk:', error);
      setStatus('error');
      setMessage(`Error al guardar las claves: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para guardar la configuración de la base de datos
  const handleDbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('loading');
    setMessage('Guardando configuración de la base de datos...');

    try {
      // Validar la URL de la base de datos
      if (!dbUrl.startsWith('postgresql://')) {
        throw new Error('La URL de conexión debe tener formato postgresql://usuario:contraseña@host:puerto/basededatos');
      }
      
      // Llamar al endpoint unificado para guardar la URL de la base de datos
      const response = await fetch('/api/config/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dbUrl }),
      });
      
      if (!response.ok) {
        throw new Error(`Error en la respuesta del servidor: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Como respaldo, también guardamos en localStorage
        try {
          localStorage.setItem('dbUrl', dbUrl);
          console.log('URL de base de datos guardada en localStorage como respaldo');
        } catch (storageError) {
          console.warn('No se pudo guardar en localStorage:', storageError);
        }
        
        setStatus('success');
        setMessage('URL de base de datos guardada correctamente. Ahora podemos configurar la base de datos.');
        
        // Marcar paso como completado
        setStepsCompleted({...stepsCompleted, 2: true});
        
        // Avanzar al siguiente paso
        setTimeout(() => {
          setCurrentStep(3);
        }, 2000);
      } else {
        throw new Error(data.error || 'Error desconocido al guardar la URL de la base de datos');
      }
    } catch (error) {
      console.error('Error al guardar la configuración de la base de datos:', error);
      
      // Incluso en caso de error, intentamos usar localStorage como último recurso
      try {
        localStorage.setItem('dbUrl', dbUrl);
        console.log('URL de base de datos guardada en localStorage como respaldo de emergencia');
        
        // Marcar paso como completado y continuar a pesar del error
        setStepsCompleted({...stepsCompleted, 2: true});
        setStatus('warning');
        setMessage('No se pudo guardar la URL en el servidor, pero se hará lo posible para continuar con la configuración.');
        
        // Avanzar al siguiente paso a pesar del error
        setTimeout(() => {
          setCurrentStep(3);
        }, 3000);
        
        return; // Salimos temprano para evitar mostrar el error
      } catch (storageError) {
        console.warn('También falló el guardado en localStorage:', storageError);
      }
      
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para realizar la migración de la base de datos
  const handleMigration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('loading');
    setMessage('Ejecutando migración de la base de datos. Esto puede tardar unos momentos...');

    try {
      // Recuperar la URL de la base de datos del localStorage si está disponible
      let dbUrlToUse = dbUrl;
      const storedDbUrl = localStorage.getItem('dbUrl');
      if (storedDbUrl) {
        console.log('Usando URL de base de datos desde localStorage');
        dbUrlToUse = storedDbUrl;
      }

      if (!dbUrlToUse) {
        throw new Error('URL de base de datos no disponible. Por favor, configura primero la URL de la base de datos.');
      }

      // Llamar al endpoint unificado para realizar la migración
      const response = await fetch('/api/config/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Enviamos la URL de la base de datos y activamos la migración
        body: JSON.stringify({ 
          dbUrl: dbUrlToUse,
          migrate: true 
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en la respuesta del servidor: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setMessage('¡Migración completada correctamente! La base de datos ha sido configurada y las tablas han sido creadas.');
        
        // Marcar paso como completado
        setStepsCompleted({...stepsCompleted, 3: true});
        
        // Esperar 3 segundos y avanzar al siguiente paso
        setTimeout(() => {
          setCurrentStep(4);
        }, 3000);
      } else {
        throw new Error(data.error || 'Error durante la migración');
      }
    } catch (error) {
      console.error('Error al procesar la migración:', error);
      
      // A pesar del error, intentamos avanzar para completar el flujo
      setStatus('warning');
      setMessage(`Hubo un problema con la migración: ${error instanceof Error ? error.message : 'Error desconocido'}. ` +
                 'Sin embargo, puedes continuar con la configuración e intentar hacer la migración manualmente más tarde.');
                 
      // Marcar paso como completado a pesar del error
      setStepsCompleted({...stepsCompleted, 3: true});
      
      // Esperar 5 segundos y avanzar al siguiente paso a pesar del error
      setTimeout(() => {
        setCurrentStep(4);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para ir al dashboard (redirigir a inicio de sesión primero)
  const goToDashboard = async () => {
    setIsLoading(true);
    setStatus('loading');
    setMessage('Finalizando configuración...');
    
    try {
      // Guardar el estado de configuración completa en el servidor usando GET con parámetro
      // Esto evita problemas con servidores que bloquean solicitudes POST
      const configResponse = await fetch('/api/config/status?complete=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!configResponse.ok) {
        throw new Error(`Error al guardar el estado de configuración: ${configResponse.status}`);
      }
      
      // Crear una variable en localStorage como marcador client-side
      localStorage.setItem('setup_completed', 'true');
      
      // Redirigir al usuario a la página de inicio de sesión primero
      router.push('/sign-in?redirect_url=/dashboard');
    } catch (error) {
      console.error('Error al finalizar configuración:', error);
      setStatus('warning');
      setMessage('Hubo un problema al finalizar la configuración, pero puedes continuar igualmente.');
      
      // Intentar redirigir de todos modos después de un tiempo
      setTimeout(() => {
        router.push('/sign-in?redirect_url=/dashboard');
      }, 3000);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        {/* Encabezado con indicador de pasos */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-center">Configuración inicial</h1>
          <div className="flex justify-between mt-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep === step ? 'bg-blue-500 text-white' : stepsCompleted[step] ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                >
                  {stepsCompleted[step] ? '✓' : step}
                </div>
                <div className="text-xs">{step === 1 ? 'Clerk' : step === 2 ? 'DB' : step === 3 ? 'Migración' : 'Dashboard'}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Mensajes de éxito o error */}
        {status === 'success' && (
          <div className="p-3 mb-4 bg-green-100 border border-green-400 text-green-800 rounded">
            <p className="font-bold">¡Configuración generada correctamente!</p>
            <p className="whitespace-pre-line">{message}</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-800 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{message}</p>
          </div>
        )}
        
        {status === 'warning' && (
          <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded mb-4">
            <p className="font-bold">Advertencia</p>
            <p>{message}</p>
          </div>
        )}
        
        {/* Paso 1: Configuración de Clerk */}
        {currentStep === 1 && (
          <div>
            <p className="mb-4">
              Paso 1: Configurar tus claves de Clerk.
              Puedes obtenerlas en el <a href="https://dashboard.clerk.com/last-active?path=api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Panel de Clerk</a>.
            </p>
            
            <form onSubmit={handleClerkSubmit} className="space-y-4">
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
                {isLoading ? 'Guardando...' : 'Continuar al siguiente paso'}
              </button>
            </form>
          </div>
        )}
        
        {/* Paso 2: Configuración de la base de datos */}
        {currentStep === 2 && (
          <div>
            <p className="mb-4">
              Paso 2: Configura la conexión a tu base de datos PostgreSQL.
            </p>
            
            <form onSubmit={handleDbSubmit} className="space-y-4">
              <div>
                <label htmlFor="dbUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  URL de conexión a PostgreSQL
                </label>
                <input
                  type="text"
                  id="dbUrl"
                  value={dbUrl}
                  onChange={(e) => setDbUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="postgresql://usuario:contraseña@host:puerto/basededatos"
                />
                <p className="text-sm text-gray-500 mt-1">Ejemplo: postgresql://postgres:password@localhost:5432/crm</p>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {isLoading ? 'Guardando...' : 'Continuar al siguiente paso'}
              </button>
            </form>
          </div>
        )}
        
        {/* Paso 3: Migración de la base de datos */}
        {currentStep === 3 && (
          <div>
            <p className="mb-4">
              Paso 3: Ejecuta la migración de la base de datos para crear las tablas necesarias.
            </p>
            
            <form onSubmit={handleMigration} className="space-y-4">
              <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded mb-4">
                <p className="font-bold">Importante</p>
                <p>Asegúrate de que PostgreSQL esté en ejecución y que la base de datos especificada en el paso anterior exista antes de continuar. La migración creará todas las tablas necesarias y cargará datos iniciales.</p>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {isLoading ? 'Procesando...' : 'Ejecutar migración'}
              </button>
            </form>
          </div>
        )}
        
        {/* Paso 4: Acceder al dashboard */}
        {currentStep === 4 && (
          <div>
            <p className="mb-4">
              Paso 4: Configuración completada. Ahora puedes acceder al dashboard.
            </p>
            
            <div className="p-3 bg-green-100 border border-green-400 text-green-800 rounded mb-4">
              <p className="font-bold">¡Felicidades!</p>
              <p>Has completado la configuración de tu CRM. Ahora puedes acceder al dashboard y comenzar a utilizarlo.</p>
            </div>
            
            <button
              onClick={goToDashboard}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Ir al Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}