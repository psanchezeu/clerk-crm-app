"use client"

import { useState, useEffect } from "react"

interface Opportunity {
  id: number
  nombre: string
  valor: number | null
  etapa: string
  fecha_cierre: string | null
  id_cliente: number | null
  id_lead: number | null
  id_propietario: number
  propietario: {
    nombre: string
  }
  cliente?: {
    nombre_empresa: string
  }
  lead?: {
    nombre: string
  }
  es_privado: boolean
  created_at: string
  updated_at: string
}

interface PaginationData {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface OpportunitiesResponse {
  data: Opportunity[]
  pagination: PaginationData
}

export function useOpportunities(page = 1, limit = 10, search = "", status = "") {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page,
    limit,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoading(true)
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString()
        })
        
        if (search) queryParams.append('search', search)
        if (status) queryParams.append('status', status)
        
        const response = await fetch(`/api/opportunities?${queryParams.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to fetch opportunities")
        }

        const data: OpportunitiesResponse = await response.json()
        setOpportunities(data.data)
        setPagination(data.pagination)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchOpportunities()
  }, [page, limit, search, status])

  return { opportunities, pagination, loading, error }
}