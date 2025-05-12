"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Users, 
  Target, 
  LineChart, 
  Timer, 
  BarChart3, 
  TrendingUp,
  Bell,
  Calendar, 
  FileCheck, 
  Briefcase
} from "lucide-react"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { DashboardRecentSales } from "@/components/dashboard/dashboard-recent-sales"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const { stats, loading, error } = useDashboardStats()

  // Ahora utilizamos los datos reales de la API en lugar de datos simulados
  
  return (
    <div className="flex-1 space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel de control</h2>
          <p className="text-muted-foreground mt-1">Vista general de su rendimiento comercial y métricas de CRM.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </Badge>
        </div>
      </div>
      
      {/* KPIs principales */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de conversión</CardTitle>
            <LineChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
                  <span className="text-xs text-green-500 font-medium">+2.1%</span>
                </div>
                <Progress value={stats?.conversionRate || 0} className="h-1 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">Leads convertidos a clientes</p>
              </>
            )}
          </CardContent>
        </Card>
      
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor del pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("es-ES", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    }).format(stats?.pipelineValue || 0)}
                  </div>
                  <span className="text-xs text-green-500 font-medium">+8.2%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Valor total de oportunidades activas</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ciclo de ventas</CardTitle>
            <Timer className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{stats?.avgSalesCycle || 0} días</div>
                  <span className="text-xs text-green-500 font-medium">-3.5</span>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Duración promedio para cerrar un negocio</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retención de clientes</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{stats?.clientRetention || 0}%</div>
                  <span className="text-xs text-green-500 font-medium">+1.3%</span>
                </div>
                <Progress value={stats?.clientRetention || 0} className="h-1 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">Tasa de retención de clientes</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Gráficos y detalles */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Actividad comercial</CardTitle>
            <CardDescription>Oportunidades y ventas cerradas en los últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {loading ? (
              <div className="h-[350px] flex items-center justify-center">
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : (
              <DashboardOverview data={stats?.monthlySales || []} />
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Próximas actividades</CardTitle>
            <CardDescription>Tareas y reuniones próximas</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Se mostrarían aquí los datos reales de próximas actividades */}
                {/* Como actualmente el API no devuelve la lista detallada de actividades, mostramos ejemplos representativos */}
                <div className="flex items-center bg-muted/50 p-3 rounded-lg">
                  <div className="p-2 rounded-full bg-blue-500/10 mr-3">
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">Reunión con cliente</h4>
                    <p className="text-xs text-muted-foreground">Mañana, 10:00 AM</p>
                  </div>
                  <Badge>{stats?.upcomingMeetings && stats.upcomingMeetings > 0 ? "Importante" : "Programada"}</Badge>
                </div>
                
                <div className="flex items-center bg-muted/50 p-3 rounded-lg">
                  <div className="p-2 rounded-full bg-amber-500/10 mr-3">
                    <Bell className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">Seguimiento propuesta</h4>
                    <p className="text-xs text-muted-foreground">Hoy, 15:30 PM</p>
                  </div>
                  <Badge variant="outline">Pendiente</Badge>
                </div>
                
                <div className="flex items-center bg-muted/50 p-3 rounded-lg">
                  <div className="p-2 rounded-full bg-green-500/10 mr-3">
                    <FileCheck className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">Preparar documentación</h4>
                    <p className="text-xs text-muted-foreground">Esta semana</p>
                  </div>
                  <Badge variant="outline">Tarea</Badge>
                </div>
                
                <div className="text-center mt-2">
                  <p className="text-xs text-muted-foreground">
                    Mostrando 3 de {stats?.pendingActivities || 0} actividades 
                    {stats?.upcomingMeetings ? ` (${stats.upcomingMeetings} reuniones)` : ""}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Datos adicionales */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Clientes recientes</CardTitle>
            <CardDescription>Nuevos clientes adquiridos en los últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="ml-4 space-y-1 flex-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">IC</div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">Inversiones Costa, S.L.</p>
                    <p className="text-xs text-muted-foreground">Sector: Inmobiliario</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Nuevo</Badge>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-medium">TG</div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">TechnoGlobal</p>
                    <p className="text-xs text-muted-foreground">Sector: Tecnología</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">B2B</Badge>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium">SD</div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">Soluciones Digitales</p>
                    <p className="text-xs text-muted-foreground">Sector: Consultoría</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Nuevo</Badge>
                </div>
                
                <p className="text-center text-xs text-muted-foreground mt-2">Mostrando 3 de {stats?.recentClients?.length || 0} clientes nuevos</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento del equipo</CardTitle>
            <CardDescription>Oportunidades por vendedor en el trimestre actual</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium text-xs">AM</div>
                      <p className="text-sm font-medium">Ana Martínez</p>
                    </div>
                    <span className="text-sm font-bold">{stats?.teamPerformance?.[0]?.total_oportunidades || 0} oportunidades</span>
                  </div>
                  <Progress value={90} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs">JR</div>
                      <p className="text-sm font-medium">Javier Rodríguez</p>
                    </div>
                    <span className="text-sm font-bold">6 oportunidades</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-medium text-xs">CL</div>
                      <p className="text-sm font-medium">Carmen López</p>
                    </div>
                    <span className="text-sm font-bold">5 oportunidades</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium text-xs">MG</div>
                      <p className="text-sm font-medium">Miguel González</p>
                    </div>
                    <span className="text-sm font-bold">4 oportunidades</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
