"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2, CreditCard, Receipt, AlertTriangle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

/**
 * Esquema de validación para el formulario de facturación
 */
const billingFormSchema = z.object({
  nombreFacturacion: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  cifNif: z.string().min(1, {
    message: "El CIF/NIF es obligatorio.",
  }),
  direccionFacturacion: z.string().min(1, {
    message: "La dirección de facturación es obligatoria.",
  }),
  ciudadFacturacion: z.string().min(1, {
    message: "La ciudad es obligatoria.",
  }),
  codigoPostalFacturacion: z.string().min(1, {
    message: "El código postal es obligatorio.",
  }),
  paisFacturacion: z.string().min(1, {
    message: "El país es obligatorio.",
  }),
  emailFacturacion: z.string().email({
    message: "Por favor introduce un email válido.",
  }),
  metodoPago: z.enum(["tarjeta", "transferencia", "domiciliacion", "otro"], {
    required_error: "Por favor selecciona un método de pago.",
  }),
})

type BillingFormValues = z.infer<typeof billingFormSchema>

/**
 * Componente de configuración de facturación
 */
export function BillingSettings() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar datos de facturación existentes
  const [billingData, setBillingData] = useState<any>(null)
  
  useEffect(() => {
    async function loadBillingData() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/settings/billing')
        if (response.ok) {
          const data = await response.json()
          setBillingData(data)
          form.reset({
            nombreFacturacion: data.nombre_facturacion || "",
            cifNif: data.cif_nif || "",
            direccionFacturacion: data.direccion_facturacion || "",
            ciudadFacturacion: data.ciudad_facturacion || "",
            codigoPostalFacturacion: data.cp_facturacion || "",
            paisFacturacion: data.pais_facturacion || "España",
            emailFacturacion: data.email_facturacion || "",
            metodoPago: data.metodo_pago || "tarjeta",
          })
        }
      } catch (error) {
        console.error('Error al cargar los datos de facturación:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadBillingData()
  }, [])
  
  // Valores por defecto del formulario
  const defaultValues: Partial<BillingFormValues> = {
    nombreFacturacion: "",
    cifNif: "",
    direccionFacturacion: "",
    ciudadFacturacion: "",
    codigoPostalFacturacion: "",
    paisFacturacion: "España",
    emailFacturacion: "",
    metodoPago: "tarjeta",
  }

  const form = useForm<BillingFormValues>({
    resolver: zodResolver(billingFormSchema),
    defaultValues,
  })

  async function onSubmit(data: BillingFormValues) {
    setIsSubmitting(true)
    
    try {
      console.log('Enviando datos de facturación:', data);
      
      // Preparar los datos para la API
      const billingData = {
        nombre_facturacion: data.nombreFacturacion.trim(),
        cif_nif: data.cifNif.trim(),
        direccion_facturacion: data.direccionFacturacion.trim(),
        ciudad_facturacion: data.ciudadFacturacion.trim(),
        cp_facturacion: data.codigoPostalFacturacion.trim(),
        pais_facturacion: data.paisFacturacion.trim(),
        email_facturacion: data.emailFacturacion.trim(),
        metodo_pago: data.metodoPago,
      };
      
      console.log('Datos formateados para la API:', billingData);
      
      // Guardar información de facturación en la base de datos
      const response = await fetch('/api/settings/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billingData),
      });
      
      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);
      
      if (!response.ok) {
        throw new Error(
          responseData.error || 
          `Error al guardar la información de facturación: ${response.status} ${response.statusText}`
        );
      }
      
      // Actualizar datos locales
      setBillingData(responseData);
      
      toast({
        title: "✅ Información actualizada",
        description: "Tu información de facturación ha sido guardada correctamente.",
      });
    } catch (error) {
      console.error('Error en onSubmit:', error);
      
      let errorMessage = 'No se pudo guardar la información de facturación.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Facturación</h3>
        <p className="text-sm text-muted-foreground">
          Gestiona tu información de facturación y métodos de pago.
        </p>
      </div>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información de facturación</CardTitle>
            <CardDescription>
              Esta información se utilizará para generar tus facturas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="nombreFacturacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre o Razón Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Empresa S.A." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cifNif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CIF/NIF</FormLabel>
                      <FormControl>
                        <Input placeholder="B12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="direccionFacturacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Calle Principal 123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ciudadFacturacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad</FormLabel>
                        <FormControl>
                          <Input placeholder="Madrid" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="codigoPostalFacturacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Postal</FormLabel>
                        <FormControl>
                          <Input placeholder="28001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paisFacturacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País</FormLabel>
                        <FormControl>
                          <Input placeholder="España" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emailFacturacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de facturación</FormLabel>
                        <FormControl>
                          <Input placeholder="facturacion@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="metodoPago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de pago preferido</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un método de pago" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tarjeta">Tarjeta de crédito</SelectItem>
                          <SelectItem value="transferencia">Transferencia bancaria</SelectItem>
                          <SelectItem value="domiciliacion">Domiciliación bancaria</SelectItem>
                          <SelectItem value="otro">Otro método</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar información
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                Métodos de pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border p-4 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-gray-100 p-2">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-xs text-muted-foreground">Expira: 12/2025</p>
                  </div>
                </div>
                <Badge>Predeterminada</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Añadir método de pago
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className="mr-2 h-4 w-4" />
                Historial de facturas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Factura #INV-001</p>
                    <p className="text-xs text-muted-foreground">Abril 2025</p>
                  </div>
                  <Badge variant="outline">Pagada</Badge>
                </div>
                <p className="mt-1 text-sm">99,00 €</p>
                <Button variant="link" size="sm" className="h-auto p-0 mt-1">
                  Descargar PDF
                </Button>
              </div>
              
              <div className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Factura #INV-002</p>
                    <p className="text-xs text-muted-foreground">Mayo 2025</p>
                  </div>
                  <Badge variant="outline">Pagada</Badge>
                </div>
                <p className="mt-1 text-sm">99,00 €</p>
                <Button variant="link" size="sm" className="h-auto p-0 mt-1">
                  Descargar PDF
                </Button>
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                Ver todas las facturas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
