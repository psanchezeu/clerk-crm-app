import type React from "react"
import { auth } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { prisma } from "@/lib/prisma-client"
import { SidebarProvider } from "@/context/sidebar-context"
// Importación utilizando ruta relativa para evitar problemas de resolución
import { ClientLayoutWrapper } from "../../components/dashboard/client-layout-wrapper"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <SidebarProvider>
      <div className="h-full">
        {/* The ClientLayoutWrapper is a client component that will handle the layout adjustments */}
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </div>
    </SidebarProvider>
  )
}
