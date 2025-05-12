"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Target,
  DollarSign,
  Calendar,
  CheckSquare,
  FileText,
  BarChart,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSidebar } from "@/context/sidebar-context"
import { useUser } from "@clerk/nextjs"

const routes = [
  {
    label: "Inicio",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Clientes",
    icon: Users,
    href: "/dashboard/clients",
    color: "text-violet-500",
  },
  {
    label: "Leads",
    icon: Target,
    href: "/dashboard/leads",
    color: "text-orange-500",
  },
  {
    label: "Oportunidades",
    icon: DollarSign,
    href: "/dashboard/opportunities",
    color: "text-emerald-500",
  },
  {
    label: "Tareas",
    icon: CheckSquare,
    href: "/dashboard/tasks",
    color: "text-yellow-500",
  },
  {
    label: "Calendario",
    icon: Calendar,
    href: "/dashboard/calendar",
    color: "text-blue-500",
  },
  {
    label: "Telefonía",
    icon: Phone,
    href: "/dashboard/calendar/telephony",
    color: "text-pink-500",
  },
  {
    label: "Configuración",
    icon: Settings,
    href: "/dashboard/settings",
    color: "text-gray-500",
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { isCollapsed, toggleCollapsed } = useSidebar()
  const { user } = useUser()

  return (
    <>
      {/* Barra superior móvil */}
      <div className="md:hidden flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
        <div className="flex flex-col items-center">
          <span className="font-bold">CRM</span>
          <span className="text-xs text-muted-foreground">{user?.firstName} {user?.lastName}</span>
        </div>
        <div className="w-6" />
      </div>
      
      {/* Barra lateral */}
      <div
        className={cn(
          "h-full flex-col bg-gray-50 dark:bg-gray-900 border-r transition-all duration-300",
          isOpen ? "flex fixed inset-0 z-50" : "hidden md:flex",
          isCollapsed ? "w-20" : "w-[250px]"
        )}
      >
        <div className="space-y-4 py-4 flex flex-col h-full">
          <div className="px-3 py-2 flex-1">
            {/* Encabezado con título y botón de colapsar */}
            <div className="flex items-center justify-between mb-6">
              <Link 
                href="/dashboard" 
                className={cn(
                  "flex flex-col",
                  isCollapsed && "items-center"
                )}
              >
                <h1 className="text-2xl font-bold">CRM</h1>
                {!isCollapsed && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {user?.firstName} {user?.lastName}
                  </p>
                )}
              </Link>
              
              {/* Botón para colapsar/expandir (solo en escritorio) */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden md:flex" 
                onClick={toggleCollapsed}
              >
                {isCollapsed ? 
                  <ChevronRight className="h-4 w-4" /> : 
                  <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="space-y-1">
              <TooltipProvider delayDuration={0}>
                {routes.map((route) => (
                  <Tooltip key={route.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={route.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "text-sm group flex p-3 w-full font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition",
                          pathname === route.href ? "text-primary bg-primary/10" : "text-muted-foreground",
                          isCollapsed ? "justify-center" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "flex items-center",
                          isCollapsed ? "flex-col space-y-1" : "flex-row"
                        )}>
                          <route.icon className={cn(
                            "h-5 w-5", 
                            route.color,
                            isCollapsed ? "mr-0" : "mr-3"
                          )} />
                          {!isCollapsed && route.label}
                        </div>
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        {route.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
