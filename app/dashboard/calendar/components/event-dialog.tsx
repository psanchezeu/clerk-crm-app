"use client"

import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Phone, Video, Users, MapPin, Clock, X, Calendar as CalendarIcon, Trash } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEventsContext } from "../providers/events-provider"

// Esquema de validación usando Zod
const eventSchema = z.object({
  titulo: z.string().min(1, "El título es obligatorio"),
  descripcion: z.string().optional(),
  tipo: z.enum(["reunion", "llamada", "videollamada", "otro"]),
  fecha_inicio: z.date(),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  fecha_fin: z.date(),
  hora_fin: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  es_todo_el_dia: z.boolean().default(false),
  ubicacion: z.string().optional(),
  url_videollamada: z.string().optional(),
  recordatorio: z.number().optional(),
  id_cliente: z.number().optional(),
  id_lead: z.number().optional(),
  id_oportunidad: z.number().optional(),
  id_proveedor: z.number().optional(),
  notas: z.string().optional(),
  participantes: z.array(
    z.object({
      nombre: z.string(),
      email: z.string().email("Email inválido"),
      telefono: z.string().optional(),
    })
  ).optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: any;
  eventType?: string | null;
}

export function EventDialog({ open, onOpenChange, event, eventType }: EventDialogProps) {
  const [selectedTab, setSelectedTab] = useState("detalles")
  const { addEvent, updateEvent, deleteEvent, isSubmitting } = useEventsContext()

  // Preparar valores default para el formulario
  const getDefaultValues = (): EventFormValues => {
    if (event) {
      return {
        titulo: event.titulo || "",
        descripcion: event.descripcion || "",
        tipo: event.tipo || "reunion",
        fecha_inicio: event.fecha_inicio ? new Date(event.fecha_inicio) : new Date(),
        hora_inicio: event.fecha_inicio 
          ? format(new Date(event.fecha_inicio), "HH:mm") 
          : format(new Date(), "HH:mm"),
        fecha_fin: event.fecha_fin ? new Date(event.fecha_fin) : new Date(),
        hora_fin: event.fecha_fin 
          ? format(new Date(event.fecha_fin), "HH:mm")
          : format(addHours(new Date(), 1), "HH:mm"),
        es_todo_el_dia: event.es_todo_el_dia || false,
        ubicacion: event.ubicacion || "",
        url_videollamada: event.url_videollamada || "",
        recordatorio: event.recordatorio || 15,
        id_cliente: event.id_cliente || undefined,
        id_lead: event.id_lead || undefined,
        id_oportunidad: event.id_oportunidad || undefined,
        id_proveedor: event.id_proveedor || undefined,
        notas: event.notas || "",
      };
    }

    // Valores por defecto para un nuevo evento
    const now = new Date();
    const inOneHour = addHours(now, 1);
    
    return {
      titulo: "",
      descripcion: "",
      tipo: eventType || "reunion",
      fecha_inicio: now,
      hora_inicio: format(now, "HH:mm"),
      fecha_fin: inOneHour,
      hora_fin: format(inOneHour, "HH:mm"),
      es_todo_el_dia: false,
      ubicacion: "",
      url_videollamada: "",
      recordatorio: 15,
    };
  };

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: getDefaultValues(),
  });

  function addHours(date: Date, hours: number): Date {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  }

  function combineDateAndTime(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(":").map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  async function onSubmit(values: EventFormValues) {
    try {
      // Combinar fecha y hora
      const fechaInicio = combineDateAndTime(values.fecha_inicio, values.hora_inicio);
      const fechaFin = combineDateAndTime(values.fecha_fin, values.hora_fin);
      
      const eventData = {
        ...values,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      };
      
      if (event?.id) {
        await updateEvent(event.id, eventData);
      } else {
        await addEvent(eventData);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error al guardar el evento:', error);
    }
  }

  async function handleDelete() {
    if (event?.id && confirm("¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.")) {
      await deleteEvent(event.id);
      onOpenChange(false);
    }
  }

  // Efecto para reiniciar el formulario cuando se abre el diálogo
  if (open) {
    form.reset(getDefaultValues());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {event?.id ? "Editar evento" : "Nuevo evento"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="detalles">Detalles</TabsTrigger>
                <TabsTrigger value="participantes">Participantes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="detalles" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del evento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de evento</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="reunion">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                Reunión
                              </div>
                            </SelectItem>
                            <SelectItem value="llamada">
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2" />
                                Llamada
                              </div>
                            </SelectItem>
                            <SelectItem value="videollamada">
                              <div className="flex items-center">
                                <Video className="h-4 w-4 mr-2" />
                                Videollamada
                              </div>
                            </SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="es_todo_el_dia"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-end space-x-3 space-y-0 rounded-md p-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="mt-1">Todo el día</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fecha_inicio"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha inicio</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: es })
                                  ) : (
                                    <span>Seleccionar fecha</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date("1900-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {!form.watch("es_todo_el_dia") && (
                      <FormField
                        control={form.control}
                        name="hora_inicio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hora inicio</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fecha_fin"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha fin</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: es })
                                  ) : (
                                    <span>Seleccionar fecha</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date("1900-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {!form.watch("es_todo_el_dia") && (
                      <FormField
                        control={form.control}
                        name="hora_fin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hora fin</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
                
                {form.watch("tipo") === "reunion" && (
                  <FormField
                    control={form.control}
                    name="ubicacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <MapPin className="h-4 w-4 mr-2 mt-3 opacity-50" />
                            <Input placeholder="Ubicación de la reunión" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {form.watch("tipo") === "videollamada" && (
                  <FormField
                    control={form.control}
                    name="url_videollamada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de la videollamada</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Video className="h-4 w-4 mr-2 mt-3 opacity-50" />
                            <Input placeholder="https://meet.google.com/..." {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción del evento" 
                          className="resize-none" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="recordatorio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recordatorio</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona cuando enviar recordatorio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Sin recordatorio</SelectItem>
                          <SelectItem value="5">5 minutos antes</SelectItem>
                          <SelectItem value="10">10 minutos antes</SelectItem>
                          <SelectItem value="15">15 minutos antes</SelectItem>
                          <SelectItem value="30">30 minutos antes</SelectItem>
                          <SelectItem value="60">1 hora antes</SelectItem>
                          <SelectItem value="120">2 horas antes</SelectItem>
                          <SelectItem value="1440">1 día antes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="participantes" className="space-y-4 pt-4">
                <div className="text-center p-4 border rounded-md text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>La gestión de participantes estará disponible próximamente</p>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="gap-2 sm:gap-0">
              {event?.id && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="mr-auto"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              )}
              
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </DialogClose>
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>Guardando...</>
                ) : (
                  <>{event?.id ? "Actualizar" : "Crear"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
