"use client"

import { useState } from "react"
import { Calendar as CalendarIcon, Phone, Video, Users, Plus, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/app/dashboard/calendar/components/calendar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventDialog } from "@/app/dashboard/calendar/components/event-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEventsContext } from "@/app/dashboard/calendar/providers/events-provider"
import { Skeleton } from "@/components/ui/skeleton"

export default function CalendarPage() {
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null)
  const { isLoading } = useEventsContext()

  const handleNewEvent = (type: string) => {
    setSelectedEventType(type)
    setIsEventDialogOpen(true)
  }

  return (
    <div className="flex-1 space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendario</h2>
          <p className="text-muted-foreground mt-1">
            Gestiona tus citas, reuniones y llamadas desde un solo lugar
          </p>
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Mostrar todo</DropdownMenuItem>
              <DropdownMenuItem>Solo reuniones</DropdownMenuItem>
              <DropdownMenuItem>Solo llamadas</DropdownMenuItem>
              <DropdownMenuItem>Solo videollamadas</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo evento
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => handleNewEvent("reunion")}>
                <Users className="mr-2 h-4 w-4" />
                Reunión
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleNewEvent("llamada")}>
                <Phone className="mr-2 h-4 w-4" />
                Llamada
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleNewEvent("videollamada")}>
                <Video className="mr-2 h-4 w-4" />
                Videollamada
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="telephony" className="gap-2">
            <Phone className="h-4 w-4" />
            Registro llamadas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="h-[600px] flex items-center justify-center">
                  <Skeleton className="h-[550px] w-full" />
                </div>
              ) : (
                <Calendar />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="telephony" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro de llamadas</CardTitle>
              <CardDescription>
                Historial de llamadas realizadas y recibidas a través de los proveedores conectados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Phone className="mx-auto h-12 w-12 mb-4 opacity-20" />
                    <h3 className="text-lg font-medium">No hay llamadas registradas</h3>
                    <p className="mt-1">
                      Configura un proveedor de telefonía para comenzar a registrar llamadas
                    </p>
                    <Button variant="outline" className="mt-4">
                      Configurar proveedor
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EventDialog 
        open={isEventDialogOpen} 
        onOpenChange={setIsEventDialogOpen}
        eventType={selectedEventType}
      />
    </div>
  )
}
