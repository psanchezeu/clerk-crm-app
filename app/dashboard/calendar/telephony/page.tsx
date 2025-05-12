"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Phone, 
  Plus, 
  Settings, 
  Upload, 
  Download,
  Calendar, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
// Ya no necesitamos el dialog porque usamos una página dedicada
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function TelephonyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true)
  const [providers, setProviders] = useState<any[]>([])
  const [calls, setCalls] = useState<any[]>([])
  const [isCallsLoading, setIsCallsLoading] = useState(true)

  // Cargar proveedores de telefonía al cargar la página
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/calendar/telephony/providers")
        
        // Si la respuesta es 404 o 500, probablemente la tabla no existe aún
        if (response.status === 404 || response.status === 500) {
          console.warn("La API de proveedores aún no está disponible o la tabla no existe")
          setProviders([])
          return
        }
        
        if (!response.ok) {
          throw new Error("Error al cargar proveedores")
        }
        
        const data = await response.json()
        
        // Verificar si data es un array
        if (!Array.isArray(data)) {
          console.warn("La respuesta de la API no es un array:", data)
          setProviders([])
          return
        }
        
        setProviders(data)
      } catch (error) {
        console.error("Error:", error)
        // No mostrar toast para evitar confundir al usuario mientras se configuran las tablas
        setProviders([])
      } finally {
        setIsLoading(false)
      }
    }

    const fetchCalls = async () => {
      try {
        setIsCallsLoading(true)
        const response = await fetch("/api/calendar/telephony/calls")
        
        // Si la respuesta es 404 o 500, probablemente la tabla no existe aún
        if (response.status === 404 || response.status === 500) {
          console.warn("La API de llamadas aún no está disponible o la tabla no existe")
          setCalls([])
          return
        }
        
        if (!response.ok) {
          throw new Error("Error al cargar llamadas")
        }
        
        const data = await response.json()
        
        // Verificar si data es un array
        if (!Array.isArray(data)) {
          console.warn("La respuesta de la API no es un array:", data)
          setCalls([])
          return
        }
        
        setCalls(data)
      } catch (error) {
        console.error("Error:", error)
        // No mostrar toast para evitar confundir al usuario mientras se configuran las tablas
        setCalls([])
      } finally {
        setIsCallsLoading(false)
      }
    }

    fetchProviders()
    fetchCalls()
  }, [])

  const handleNewProvider = () => {
    router.push('/dashboard/calendar/telephony/provider')
  }

  const handleEditProvider = (provider: any) => {
    router.push(`/dashboard/calendar/telephony/provider?id=${provider.id}`)
  }

  // Formatear la duración de la llamada en formato legible
  const formatCallDuration = (seconds: number | null) => {
    if (!seconds) return "N/A"
    
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Formatear la fecha en formato legible
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return format(date, "dd MMM yyyy, HH:mm", { locale: es })
  }

  // Obtener el color de la badge según el estado de la llamada
  const getCallStatusColor = (status: string) => {
    switch (status) {
      case "completada":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "en_progreso":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "perdida":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "fallida":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      default:
        return ""
    }
  }

  // Obtener el ícono según el tipo de llamada
  const getCallTypeIcon = (type: string) => {
    switch (type) {
      case "entrante":
        return <ArrowDown className="h-4 w-4 text-green-600" />
      case "saliente":
        return <ArrowUp className="h-4 w-4 text-blue-600" />
      default:
        return <ArrowUpDown className="h-4 w-4" />
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Telefonía</h2>
          <p className="text-muted-foreground mt-1">
            Gestión de proveedores de telefonía y registro de llamadas
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button className="gap-2" onClick={handleNewProvider}>
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calls" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calls" className="gap-2">
            <Phone className="h-4 w-4" />
            Registro de llamadas
          </TabsTrigger>
          <TabsTrigger value="providers" className="gap-2">
            <Settings className="h-4 w-4" />
            Proveedores
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calls" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Registro de llamadas</CardTitle>
                <CardDescription>
                  Historial de llamadas realizadas y recibidas
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Buscar llamadas..." 
                  className="w-64"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isCallsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : calls.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fecha y hora</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calls.map((call) => (
                      <TableRow key={call.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {getCallTypeIcon(call.tipo)}
                            <span className="ml-2">
                              {call.tipo === 'entrante' ? 'Entrante' : 'Saliente'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(call.fecha_inicio)}</TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {call.tipo === 'entrante' ? call.numero_origen : call.numero_destino}
                          </span>
                        </TableCell>
                        <TableCell>{formatCallDuration(call.duracion_segundos)}</TableCell>
                        <TableCell>
                          <Badge className={getCallStatusColor(call.estado)}>
                            {call.estado.charAt(0).toUpperCase() + call.estado.slice(1).replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {call.cliente_nombre || call.lead_nombre || call.oportunidad_nombre || "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Calendar className="h-4 w-4 mr-2" />
                                Ver en calendario
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Phone className="h-4 w-4 mr-2" />
                                Llamar de nuevo
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                Ver detalles
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Phone className="mx-auto h-12 w-12 mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">No hay llamadas registradas</h3>
                  <p className="mt-1">
                    Las llamadas realizadas a través de los proveedores de telefonía se mostrarán aquí
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proveedores de telefonía</CardTitle>
              <CardDescription>
                Gestiona los proveedores de telefonía para integrar llamadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : providers.length > 0 ? (
                <div className="space-y-4">
                  {providers.map((provider) => (
                    <Card key={provider.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                              <Phone className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{provider.nombre}</h3>
                              <p className="text-sm text-muted-foreground">
                                {provider.tipo === 'sip' ? 'Servidor SIP' : 
                                 provider.tipo === 'api_externa' ? 'API Externa' : 'Otro'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={provider.activo ? "default" : "outline"}>
                              {provider.activo ? "Activo" : "Inactivo"}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={() => handleEditProvider(provider)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Configurar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="mx-auto h-12 w-12 mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">No hay proveedores configurados</h3>
                  <p className="mt-1">
                    Añade un proveedor de telefonía para comenzar a registrar llamadas
                  </p>
                  <Button className="mt-4" onClick={handleNewProvider}>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir proveedor
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* El diálogo ha sido reemplazado por una página dedicada */}
    </div>
  )
}
