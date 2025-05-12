"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"], {
    required_error: "Por favor selecciona un tema.",
  }),
  fontSize: z.enum(["sm", "md", "lg", "xl"], {
    required_error: "Por favor selecciona un tamaño de fuente.",
  }),
  colorScheme: z.enum(["default", "blue", "green", "purple", "orange"], {
    required_error: "Por favor selecciona un esquema de color.",
  }),
})

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar configuración existente
  const [savedConfig, setSavedConfig] = useState<Partial<AppearanceFormValues>>({
    theme: (theme as "light" | "dark" | "system") || "system",
    fontSize: "md",
    colorScheme: "default",
  })
  
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/settings/config?categoria=apariencia')
        if (response.ok) {
          const data = await response.json()
          const config: Partial<AppearanceFormValues> = {
            theme: (theme as "light" | "dark" | "system") || "system",
            fontSize: data.fontSize || "md",
            colorScheme: data.colorScheme || "default",
          }
          setSavedConfig(config)
          form.reset(config)
        }
      } catch (error) {
        console.error("Error al cargar la configuración de apariencia:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadConfig()
  }, [theme])
  
  const defaultValues: Partial<AppearanceFormValues> = {
    theme: (theme as "light" | "dark" | "system") || "system",
    fontSize: "md",
    colorScheme: "default",
  }

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues,
  })

  async function onSubmit(data: AppearanceFormValues) {
    setIsSubmitting(true)
    
    try {
      // Aplicar el tema inmediatamente
      setTheme(data.theme)
      
      // Guardar cada configuración en la base de datos
      const configPromises = [
        // No guardamos el tema, ya que se maneja con next-themes
        fetch('/api/settings/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clave: 'fontSize',
            valor: data.fontSize,
            categoria: 'apariencia'
          })
        }),
        fetch('/api/settings/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clave: 'colorScheme',
            valor: data.colorScheme,
            categoria: 'apariencia'
          })
        }),
      ]
      
      // Esperar a que todas las configuraciones se guarden
      const results = await Promise.all(configPromises)
      
      // Verificar si hubo algún error
      for (const response of results) {
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al guardar la configuración')
        }
      }
      
      toast({
        title: "Apariencia actualizada",
        description: "Tus preferencias de apariencia han sido actualizadas correctamente.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron guardar los cambios de apariencia.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Apariencia</h3>
        <p className="text-sm text-muted-foreground">
          Personaliza la apariencia de la aplicación según tus preferencias.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Preferencias de apariencia</CardTitle>
          <CardDescription>
            Personaliza cómo se ve y se comporta la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Tema</FormLabel>
                    <FormDescription>
                      Selecciona el tema de la aplicación.
                    </FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-3 gap-4"
                      >
                        <FormItem>
                          <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                            <FormControl>
                              <RadioGroupItem value="light" className="sr-only" />
                            </FormControl>
                            <div className="items-center rounded-md border-2 border-muted p-4 hover:border-accent flex flex-col space-y-2">
                              <SunIcon className="h-6 w-6" />
                              <span className="text-center text-sm font-medium">Claro</span>
                            </div>
                          </FormLabel>
                        </FormItem>
                        <FormItem>
                          <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                            <FormControl>
                              <RadioGroupItem value="dark" className="sr-only" />
                            </FormControl>
                            <div className="items-center rounded-md border-2 border-muted p-4 hover:border-accent flex flex-col space-y-2">
                              <MoonIcon className="h-6 w-6" />
                              <span className="text-center text-sm font-medium">Oscuro</span>
                            </div>
                          </FormLabel>
                        </FormItem>
                        <FormItem>
                          <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                            <FormControl>
                              <RadioGroupItem value="system" className="sr-only" />
                            </FormControl>
                            <div className="items-center rounded-md border-2 border-muted p-4 hover:border-accent flex flex-col space-y-2">
                              <MonitorIcon className="h-6 w-6" />
                              <span className="text-center text-sm font-medium">Sistema</span>
                            </div>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fontSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamaño de fuente</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tamaño de fuente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sm">Pequeño</SelectItem>
                          <SelectItem value="md">Mediano</SelectItem>
                          <SelectItem value="lg">Grande</SelectItem>
                          <SelectItem value="xl">Extra grande</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        El tamaño de fuente afecta a todos los textos de la aplicación.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="colorScheme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Esquema de color</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un esquema de color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="default">Por defecto</SelectItem>
                          <SelectItem value="blue">Azul</SelectItem>
                          <SelectItem value="green">Verde</SelectItem>
                          <SelectItem value="purple">Púrpura</SelectItem>
                          <SelectItem value="orange">Naranja</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Cambia el color principal de la aplicación.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
