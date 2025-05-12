import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"

// Función para verificar si Clerk está configurado
const isClerkConfigured = () => {
  try {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;
    return !!(publishableKey && secretKey && publishableKey.startsWith('pk_') && secretKey.startsWith('sk_'));
  } catch (error) {
    console.error('Error al verificar la configuración de Clerk:', error);
    return false;
  }
}

export default async function Home() {
  // Verificar si Clerk está configurado
  if (!isClerkConfigured()) {
    // Si Clerk no está configurado, mostrar mensaje para ir directamente a setup
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuración necesaria</h1>
          <p className="mb-4">La aplicación aún no está configurada correctamente. Las claves de Clerk no se han detectado.</p>
          <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded mb-4">
            <p className="font-bold">Configuración requerida</p>
            <p>Se requiere completar la configuración para poder utilizar la aplicación.</p>
          </div>
          <Link href="/setup">
            <Button className="w-full bg-blue-500 hover:bg-blue-600">
              Ir a la página de configuración
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Intentar obtener el usuario actual con manejo de errores
  try {
    // Importar dinámicamente para evitar errores si Clerk no está configurado
    const { currentUser } = await import("@clerk/nextjs");
    const user = await currentUser();
    
    if (user) {
      redirect("/dashboard");
    }
  } catch (error) {
    console.error('Error al obtener el usuario actual:', error);
    // Continuamos con la página principal en caso de error
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">CRM System</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Link href="/sign-in">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Sign Up</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Powerful CRM Solution for Your Business
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Manage your clients, leads, and opportunities with our comprehensive CRM system.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/sign-up">
                    <Button size="lg" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/sign-in">
                    <Button size="lg" variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src="/crm-dashboard-visualization.png"
                  alt="CRM Dashboard"
                  className="rounded-lg object-cover"
                  width={550}
                  height={550}
                />
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Features</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our CRM system provides all the tools you need to manage your business relationships.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Client Management",
                  description: "Manage your clients and their information in one place.",
                  icon: "👥",
                },
                {
                  title: "Lead Tracking",
                  description: "Track leads and convert them into opportunities.",
                  icon: "🎯",
                },
                {
                  title: "Opportunity Management",
                  description: "Manage sales opportunities and track their progress.",
                  icon: "💰",
                },
                {
                  title: "Task Management",
                  description: "Create and assign tasks to team members.",
                  icon: "✅",
                },
                {
                  title: "Analytics",
                  description: "Get insights into your sales and marketing performance.",
                  icon: "📊",
                },
                {
                  title: "Document Management",
                  description: "Store and manage documents related to clients and opportunities.",
                  icon: "📄",
                },
              ].map((feature, index) => (
                <div key={index} className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                  <div className="text-4xl">{feature.icon}</div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} CRM System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
