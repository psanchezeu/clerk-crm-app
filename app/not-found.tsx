'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Página no encontrada</h1>
        <p className="mb-6 text-center text-gray-600">
          La página que estás buscando no existe o no está disponible.
        </p>
        <div className="flex justify-center">
          <Link href="/setup" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Ir a la configuración
          </Link>
        </div>
      </div>
    </div>
  );
}
