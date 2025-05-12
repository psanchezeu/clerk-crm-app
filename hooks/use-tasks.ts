"use client"

import { useState, useEffect } from "react"

interface Task {
  id: number
  titulo: string
  descripcion: string | null
  estado: string
  fecha_vencimiento: string | null
  id_propietario: number
  id_cliente: number | null
  id_lead: number | null
  id_oportunidad: number | null
  propietario: {
    nombre: string
  }
  cliente?: {
    nombre_empresa: string
  }
  lead?: {
    nombre: string
  }
  oportunidad?: {
    nombre: string
  }
  created_at: string
  updated_at: string
}

interface PaginationData {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface TasksResponse {
  data: Task[]
  pagination: PaginationData
}

export function useTasks(page = 1, limit = 10, search = "", status = "") {
  const [tasks, setTasks] = useState<Task[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page,
    limit,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('Iniciando carga de tareas, página:', page, 'limit:', limit)
        
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString()
        })
        
        if (search) queryParams.append('search', search)
        if (status) queryParams.append('status', status)
        
        const url = `/api/tasks?${queryParams.toString()}`
        console.log('Consultando URL:', url)
        
        const response = await fetch(url)

        if (!response.ok) {
          // Si la respuesta no es exitosa, intentamos obtener mensaje de error del servidor
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData?.error || `Error al cargar tareas (${response.status})`;
          console.error('Error de respuesta:', response.status, errorMessage);
          throw new Error(errorMessage);
        }

        const data: TasksResponse = await response.json();
        console.log('Tareas cargadas:', data.data.length, 'Total:', data.pagination.total);
        setTasks(data.data);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Error en fetchTasks:', err);
        setError(err instanceof Error ? err.message : "Error al cargar las tareas");
        // En caso de error, establecemos un arreglo vacío para evitar errores en el renderizado
        setTasks([]);
        setPagination({
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchTasks()
  }, [page, limit, search, status])

  return { tasks, pagination, loading, error }
}