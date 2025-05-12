"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  securityAlerts: z.boolean().default(true),
  clientUpdates: z.boolean().default(true),
  leadNotifications: z.boolean().default(true),
  opportunityUpdates: z.boolean().default(true),
  taskReminders: z.boolean().default(true),
})

type NotificationFormValues = z.infer<typeof notificationFormSchema>

export function NotificationSettings() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar configuraciones de notificación existentes
  useEffect(() => {
    async function loadNotificationSettings() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/settings/config?categoria=notificaciones')
        if (response.ok) {
          const data = await response.json()
          
          const configValues: Partial<NotificationFormValues> = {
            emailNotifications: data.emailNotifications !== undefined ? data.emailNotifications : true,
            pushNotifications: data.pushNotifications !== undefined ? data.pushNotifications : true,
            marketingEmails: data.marketingEmails !== undefined ? data.marketingEmails : false,
            securityAlerts: data.securityAlerts !== undefined ? data.securityAlerts : true,
            clientUpdates: data.clientUpdates !== undefined ? data.clientUpdates : true,
            leadNotifications: data.leadNotifications !== undefined ? data.leadNotifications : true,
            opportunityUpdates: data.opportunityUpdates !== undefined ? data.opportunityUpdates : true,
            taskReminders: data.taskReminders !== undefined ? data.taskReminders : true,
          }
          
          form.reset(configValues)
        }
      } catch (error) {
        console.error('Error al cargar las preferencias de notificación:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadNotificationSettings()
  }, [])
  
  const defaultValues: Partial<NotificationFormValues> = {
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
    clientUpdates: true,
    leadNotifications: true,
    opportunityUpdates: true,
    taskReminders: true,
  }

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues,
  })

  async function onSubmit(data: NotificationFormValues) {
    setIsSubmitting(true)
    
    try {
      // Guardar cada preferencia de notificación por separado
      const configPromises = Object.entries(data).map(([key, value]) => {
        return fetch('/api/settings/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clave: key,
            valor: value,
            categoria: 'notificaciones'
          })
        })
      })
      
      const results = await Promise.all(configPromises)
      
      // Verificar si hubo algún error
      for (const response of results) {
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al guardar preferencias de notificación')
        }
      }
      
      toast({
        title: "Preferencias actualizadas",
        description: "Tus preferencias de notificación han sido actualizadas correctamente.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron guardar las preferencias de notificación.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notificaciones</h3>
        <p className="text-sm text-muted-foreground">
          Configura qué notificaciones quieres recibir y cómo las recibirás.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Preferencias de notificación</CardTitle>
          <CardDescription>
            Configura cómo y cuándo serás notificado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Canales de notificación</h4>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Notificaciones por email
                          </FormLabel>
                          <FormDescription>
                            Recibir notificaciones por email.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pushNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Notificaciones push
                          </FormLabel>
                          <FormDescription>
                            Recibir notificaciones en el navegador.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Tipos de notificación</h4>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="securityAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Alertas de seguridad
                          </FormLabel>
                          <FormDescription>
                            Recibir alertas sobre actividad sospechosa y cambios en la seguridad.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Actualizaciones de clientes
                          </FormLabel>
                          <FormDescription>
                            Recibir notificaciones cuando se actualicen datos de clientes.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="leadNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Notificaciones de leads
                          </FormLabel>
                          <FormDescription>
                            Recibir notificaciones sobre nuevos leads y cambios de estado.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="opportunityUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Actualizaciones de oportunidades
                          </FormLabel>
                          <FormDescription>
                            Recibir notificaciones sobre cambios en oportunidades de venta.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taskReminders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Recordatorios de tareas
                          </FormLabel>
                          <FormDescription>
                            Recibir recordatorios para tareas próximas y con fecha de vencimiento.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="marketingEmails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Emails de marketing
                          </FormLabel>
                          <FormDescription>
                            Recibir emails sobre nuevas funciones y mejoras del servicio.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar preferencias
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
