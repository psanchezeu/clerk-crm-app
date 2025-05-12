"use client"

import { useState, useEffect, useCallback } from "react"

interface Client {
  id: number
  nombre_empresa: string
  sector: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  tipo: "B2B" | "B2C"
  id_propietario: number
  propietario_nombre: string
  fecha_creacion: string
  ultima_actualizacion: string
  es_privado: boolean
}

interface PaginationData {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface ClientsResponse {
  data: Client[]
  pagination: PaginationData
}

export function useClients(page = 1, limit = 10, search = "") {
  const [clients, setClients] = useState<Client[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page,
    limit,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  // Función para forzar una recarga de los datos
  const refreshData = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  // Función para obtener los clientes
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/clients?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
      )

      if (!response.ok) {
        throw new Error("Error al obtener los clientes")
      }

      const data: ClientsResponse = await response.json()
      setClients(data.data)
      setPagination(data.pagination)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Se produjo un error")
    } finally {
      setLoading(false)
    }
  }, [page, limit, search]);

  // Efecto para cargar los clientes cuando cambian los parámetros o se solicita una recarga
  useEffect(() => {
    fetchClients()
  }, [fetchClients, refreshCounter])

  return { clients, pagination, loading, error, refreshData }
}
