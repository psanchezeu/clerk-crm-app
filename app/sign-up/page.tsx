"use client";

import { useEffect, useState } from "react";
import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function SignUpPage() {
  const [isClient, setIsClient] = useState(false);
  const [isError, setIsError] = useState(false);
  
  useEffect(() => {
    // Indicar que estamos en el cliente
    setIsClient(true);
    
    // Verificar si las claves de Clerk están configuradas
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (!publishableKey || publishableKey === "undefined") {
      console.warn("Clerk publishable key not found, redirecting to setup page");
      redirect("/setup");
    }
    
    // Capturar errores de Clerk
    const handleError = () => {
      setIsError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
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
  
  try {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
            <p className="mt-2 text-sm text-gray-600">
              Regístrate para comenzar a usar la aplicación
            </p>
          </div>
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering SignUp component:", error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md text-center">
          <div className="text-red-600">
            <h2 className="text-xl font-bold">Error al cargar el componente de registro</h2>
            <p className="mt-2">Por favor, asegúrate de que las claves de Clerk estén configuradas correctamente.</p>
            <button
              onClick={() => window.location.href = "/setup"}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Volver a la configuración
            </button>
          </div>
        </div>
      </div>
    );
  }
}
