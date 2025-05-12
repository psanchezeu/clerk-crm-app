"use client"

import React from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { useSidebar } from "@/context/sidebar-context"
import { cn } from "@/lib/utils"

interface ClientLayoutWrapperProps {
  children: React.ReactNode
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar a toda altura y ancho fijo */}
      <div className="hidden md:block h-screen">
        <Sidebar />
      </div>
      {/* Contenedor principal para header y contenido */}
      <div className={cn(
        "flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300"
      )}>
        <Header />
        {/* Área de contenido principal con scroll */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
