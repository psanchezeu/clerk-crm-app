"use client";

import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

// Verificar si las claves de Clerk están configuradas
function isClerkConfigured(): boolean {
  try {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;
    return !!(publishableKey && secretKey && publishableKey.startsWith('pk_') && secretKey.startsWith('sk_'));
  } catch (error) {
    console.error('Error al verificar la configuración de Clerk:', error);
    return false;
  }
}

export default function SignInPage() {
  const [isClient, setIsClient] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isClerkAvailable, setIsClerkAvailable] = useState<boolean | null>(null);
  
  const router = useRouter();
  
  useEffect(() => {
    // Indicar que estamos en el cliente
    setIsClient(true);
    
    // Comprobar si venimos de completar la configuración
    const setupCompleted = localStorage.getItem('setup_completed');
    console.log('[SignIn] Estado de setup_completed:', setupCompleted);
    
    // Verificar si Clerk está disponible
    const clerkConfigured = isClerkConfigured();
    setIsClerkAvailable(clerkConfigured);
    
    // Si Clerk no está configurado, redirigir al modo de emergencia
    if (!clerkConfigured) {
      console.warn("Clerk no está configurado, redirigiendo al modo de emergencia");
      router.push("/emergency-login");
      return;
    }
    
    // Verificar si la configuración está completa
    if (!setupCompleted && setupCompleted !== 'true') {
      console.warn("Configuración no completada, redirigiendo a setup");
      router.push("/setup");
      return;
    }
    
    // Capturar errores de Clerk
    const handleError = () => {
      setIsError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [router]);
  
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md text-center">
          <div className="animate-pulse">Cargando...</div>
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Error de inicialización</h1>
            <p className="mt-4 text-gray-600">
              Hubo un problema al cargar el sistema de autenticación. Es posible que necesites configurar las claves de Clerk correctamente.
            </p>
            <button
              onClick={() => window.location.href = "/setup"}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ir a la página de configuración
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Componente de inicio de sesión con carga dinámica
  const ClerkSignInComponent = () => {
    if (isClerkAvailable === false) {
      return (
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">Servicio de autenticación no disponible</h2>
          <p className="mt-2 text-gray-600">
            La autenticación con Clerk no está disponible actualmente.
          </p>
          <Link href="/emergency-login" className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Usar inicio de sesión de emergencia
          </Link>
        </div>
      );
    }
    
    if (isClerkAvailable === null) {
      return <div className="text-center p-4">Verificando disponibilidad de autenticación...</div>;
    }
    
    try {
      // Importación dinámica del componente SignIn de Clerk
      const { SignIn } = require("@clerk/nextjs");
      
      return (
        <>
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
          />
        </>
      );
    } catch (error) {
      console.error("Error al cargar el componente SignIn de Clerk:", error);
      return (
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">Error de inicialización</h2>
          <p className="mt-2 text-gray-600">
            No se pudo cargar el componente de inicio de sesión. Por favor, verifica la configuración.
          </p>
          <div className="mt-4 space-y-2">
            <Link href="/setup" className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Ir a configuración
            </Link>
            <Link href="/emergency-login" className="block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Usar modo de emergencia
            </Link>
          </div>
        </div>
      );
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* Script de ayuda para la redirección */}
      <Script src="/signin-helper.js" strategy="afterInteractive" />
      
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-gray-600">
            Accede a tu cuenta para continuar
          </p>
        </div>
        
        {isError ? (
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600">Error al cargar el inicio de sesión</h2>
            <p className="mt-2 text-gray-600">
              Ha ocurrido un error al cargar el componente de inicio de sesión. 
              Por favor, verifica la configuración de Clerk.
            </p>
            <div className="mt-4 space-y-2">
              <Link href="/setup" className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Ir a configuración
              </Link>
              <Link href="/emergency-login" className="block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Usar modo de emergencia
              </Link>
            </div>
          </div>
        ) : (
          <ClerkSignInComponent />
        )}
      </div>
    </div>
  );
}
