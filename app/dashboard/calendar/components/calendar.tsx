"use client"

import { useState, useMemo, useCallback } from "react"
import { Calendar as BigCalendar, Views, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "moment/locale/es"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { useEventsContext } from "../providers/events-provider"
import { EventDialog } from "./event-dialog"
import { Phone, Video, Users, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Configurar moment en español
moment.locale("es")

// Configurar el localizador de react-big-calendar
const localizer = momentLocalizer(moment)

export function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)

  const { events } = useEventsContext()

  // Transformar los eventos al formato requerido por react-big-calendar
  const calendarEvents = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: event.titulo,
      start: new Date(event.fecha_inicio),
      end: new Date(event.fecha_fin),
      allDay: event.es_todo_el_dia,
      resource: event, // Información completa del evento
    }))
  }, [events])

  // Manejar click en un día (para crear nuevo evento)
  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      // Crear un evento temporal
      const newEvent = {
        fecha_inicio: start,
        fecha_fin: end,
        es_todo_el_dia: false,
      }
      setSelectedEvent(newEvent)
      setIsEventDialogOpen(true)
    },
    []
  )

  // Manejar click en un evento existente
  const handleSelectEvent = useCallback((event: any) => {
    setSelectedEvent(event.resource)
    setIsEventDialogOpen(true)
  }, [])

  // Personalizar la apariencia de los eventos en el calendario
  const eventPropGetter = useCallback((event: any) => {
    const eventType = event.resource?.tipo || "otro"
    let backgroundColor = ""
    
    switch (eventType) {
      case "reunion":
        backgroundColor = "var(--blue-600)"
        break
      case "llamada":
        backgroundColor = "var(--amber-600)"
        break
      case "videollamada":
        backgroundColor = "var(--green-600)"
        break
      default:
        backgroundColor = "var(--slate-600)"
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
      },
    }
  }, [])

  // Componente personalizado para eventos
  const EventComponent = ({ event }: { event: any }) => {
    const resource = event.resource
    const tipo = resource?.tipo || "otro"
    
    let Icon = User
    switch (tipo) {
      case "reunion":
        Icon = Users
        break
      case "llamada":
        Icon = Phone
        break
      case "videollamada":
        Icon = Video
        break
    }
    
    return (
      <div className="flex items-center gap-1 px-1 w-full overflow-hidden text-white">
        <Icon className="h-3 w-3 flex-shrink-0" />
        <span className="truncate text-xs">{event.title}</span>
      </div>
    )
  }

  // Mensajes personalizados en español
  const messages = {
    allDay: "Todo el día",
    previous: "Anterior",
    next: "Siguiente",
    today: "Hoy",
    month: "Mes",
    week: "Semana",
    day: "Día",
    agenda: "Agenda",
    date: "Fecha",
    time: "Hora",
    event: "Evento",
    noEventsInRange: "No hay eventos en este rango",
  }

  return (
    <div className="h-[700px] p-4">
      <BigCalendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 650 }}
        selectable
        resizable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventPropGetter}
        components={{
          event: EventComponent,
        }}
        messages={messages}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        defaultView={Views.MONTH}
        defaultDate={selectedDate}
        onNavigate={date => setSelectedDate(date)}
      />
      
      <EventDialog 
        open={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        event={selectedEvent}
      />
    </div>
  )
}
