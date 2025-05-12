/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuración para despliegue
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // No intentar resolver módulos del lado del servidor en el cliente
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
  // Ignorar errores de conexión durante el build
  onDemandEntries: {
    // Periodo en ms donde la página compilada se mantiene en memoria
    maxInactiveAge: 25 * 1000,
    // Número de páginas que se mantienen en memoria
    pagesBufferLength: 5,
  }
};

export default nextConfig;
