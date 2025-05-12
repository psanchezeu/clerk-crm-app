"use client"

import { useState, useEffect } from "react"

interface Lead {
  id: number
  nombre: string
  email: string | null
  telefono: string | null
  empresa: string | null
  origen: string | null
  estado: string
  id_propietario: number
  propietario: {
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

interface LeadsResponse {
  data: Lead[]
  pagination: PaginationData
}

export function useLeads(page = 1, limit = 10, search = "") {
  const [leads, setLeads] = useState<Lead[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page,
    limit,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/leads?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
        )

        if (!response.ok) {
          throw new Error("Failed to fetch leads")
        }

        const data: LeadsResponse = await response.json()
        setLeads(data.data)
        setPagination(data.pagination)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [page, limit, search])

  return { leads, pagination, loading, error }
}