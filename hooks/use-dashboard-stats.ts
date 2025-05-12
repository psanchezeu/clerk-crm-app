"use client"

import { useState, useEffect } from "react"

interface MonthlySales {
  month: string
  total: number
}

interface RecentSale {
  id: number
  nombre: string
  valor_estimado: number
  cliente_nombre: string
  usuario_nombre: string
}

interface TeamPerformance {
  nombre: string
  total_oportunidades: number
  iniciales: string
}

interface RecentClient {
  id: number
  nombre_empresa: string
  sector: string
  created_at: string
}

interface DashboardStats {
  // Métricas básicas
  clientCount: number
  opportunityCount: number
  totalSales: number
  taskCount: number
  
  // Métricas avanzadas de CRM
  conversionRate: number
  avgSalesCycle: number
  avgDealSize: number
  pipelineValue: number
  clientRetention: number
  pendingActivities: number
  upcomingMeetings: number
  
  // Datos para gráficos y visualizaciones
  monthlySales: MonthlySales[]
  recentSales: RecentSale[]
  teamPerformance: TeamPerformance[]
  recentClients: RecentClient[]
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/dashboard/stats")

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard stats")
        }

        const data = await response.json()
        setStats(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
}
