import type React from "react"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "CRM System",
  description: "Modern CRM application with Clerk authentication",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar si las claves de Clerk están configuradas
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  const hasClerkKeys = publishableKey && secretKey && 
                      !publishableKey.startsWith('//') && 
                      !secretKey.startsWith('//');
  
  // Solo usamos ClerkProvider si tenemos claves válidas
  const content = (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
  
  // Si no tenemos claves configuradas, no usamos ClerkProvider
  if (!hasClerkKeys) {
    return content;
  }
  
  // De lo contrario, envolvemos el contenido con ClerkProvider
  return <ClerkProvider>{content}</ClerkProvider>;
}
