"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { toast } from "sonner"

interface Event {
  id: number
  titulo: string
  descripcion?: string
  tipo: string
  fecha_inicio: Date
  fecha_fin: Date
  es_todo_el_dia: boolean
  ubicacion?: string
  url_videollamada?: string
  color?: string
  estado: string
  recordatorio?: number
  notas?: string
  id_propietario: number
  id_cliente?: number
  id_lead?: number
  id_oportunidad?: number
  id_proveedor?: number
  id_llamada?: number
  es_privado: boolean
  created_at: Date
  updated_at: Date
}

interface EventsContextType {
  events: Event[]
  isLoading: boolean
  isSubmitting: boolean
  addEvent: (eventData: any) => Promise<Event>
  updateEvent: (id: number, eventData: any) => Promise<Event>
  deleteEvent: (id: number) => Promise<boolean>
  refreshEvents: () => Promise<void>
}

const EventsContext = createContext<EventsContextType | undefined>(undefined)

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    refreshEvents()
  }, [])

  async function refreshEvents() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/calendar/events")
      
      // Si la respuesta es 404 o 500, probablemente la tabla no existe aún
      // Pero no queremos mostrar un error al usuario, simplemente mostrar una lista vacía
      if (response.status === 404 || response.status === 500) {
        console.warn("La API de eventos aún no está disponible o la tabla no existe")
        setEvents([])
        return
      }
      
      if (!response.ok) {
        throw new Error("Error al cargar eventos")
      }
      
      const data = await response.json()
      
      // Verificar si data es un array
      if (!Array.isArray(data)) {
        console.warn("La respuesta de la API no es un array:", data)
        setEvents([])
        return
      }
      
      // Convertir fechas de string a objetos Date
      const eventsWithDates = data.map((event: any) => ({
        ...event,
        fecha_inicio: new Date(event.fecha_inicio),
        fecha_fin: new Date(event.fecha_fin),
        created_at: new Date(event.created_at),
        updated_at: new Date(event.updated_at),
      }))
      
      setEvents(eventsWithDates)
    } catch (error) {
      console.error("Error al cargar eventos:", error)
      // No mostrar toast de error para no confundir al usuario
      // mientras las tablas están siendo creadas
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }

  async function addEvent(eventData: any): Promise<Event> {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        throw new Error("Error al crear el evento")
      }

      const newEvent = await response.json()
      
      // Convertir fechas de string a objetos Date
      const eventWithDates = {
        ...newEvent,
        fecha_inicio: new Date(newEvent.fecha_inicio),
        fecha_fin: new Date(newEvent.fecha_fin),
        created_at: new Date(newEvent.created_at),
        updated_at: new Date(newEvent.updated_at),
      }
      
      setEvents((prevEvents) => [...prevEvents, eventWithDates])
      toast.success("Evento creado correctamente")
      return eventWithDates
    } catch (error) {
      console.error("Error al crear evento:", error)
      toast.error("No se pudo crear el evento")
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function updateEvent(id: number, eventData: any): Promise<Event> {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/calendar/events/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar el evento")
      }

      const updatedEvent = await response.json()
      
      // Convertir fechas de string a objetos Date
      const eventWithDates = {
        ...updatedEvent,
        fecha_inicio: new Date(updatedEvent.fecha_inicio),
        fecha_fin: new Date(updatedEvent.fecha_fin),
        created_at: new Date(updatedEvent.created_at),
        updated_at: new Date(updatedEvent.updated_at),
      }
      
      setEvents((prevEvents) =>
        prevEvents.map((event) => (event.id === id ? eventWithDates : event))
      )
      
      toast.success("Evento actualizado correctamente")
      return eventWithDates
    } catch (error) {
      console.error("Error al actualizar evento:", error)
      toast.error("No se pudo actualizar el evento")
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteEvent(id: number): Promise<boolean> {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/calendar/events/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar el evento")
      }

      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== id))
      toast.success("Evento eliminado correctamente")
      return true
    } catch (error) {
      console.error("Error al eliminar evento:", error)
      toast.error("No se pudo eliminar el evento")
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <EventsContext.Provider
      value={{
        events,
        isLoading,
        isSubmitting,
        addEvent,
        updateEvent,
        deleteEvent,
        refreshEvents,
      }}
    >
      {children}
    </EventsContext.Provider>
  )
}

export function useEventsContext() {
  const context = useContext(EventsContext)
  if (context === undefined) {
    throw new Error("useEventsContext debe usarse dentro de un EventsProvider")
  }
  return context
}
