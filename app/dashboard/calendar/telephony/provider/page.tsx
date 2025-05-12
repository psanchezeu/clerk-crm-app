"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Phone, Shield, Globe, Key, X, Save, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

// Esquema de validación para proveedores de telefonía
const providerSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  tipo: z.enum(["sip", "api_externa", "otro"]),
  api_url: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  api_key: z.string().optional(),
  api_secret: z.string().optional(),
  configuracion: z.string().optional(),
  activo: z.boolean().default(true),
});

type ProviderFormValues = z.infer<typeof providerSchema>;

export default function TelephonyProviderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const providerId = searchParams.get("id");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos del proveedor si estamos editando
  useEffect(() => {
    const fetchProvider = async () => {
      if (!providerId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/calendar/telephony/providers/${providerId}`);
        
        if (!response.ok) {
          throw new Error("Error al cargar los datos del proveedor");
        }
        
        const data = await response.json();
        setProvider(data);
      } catch (error) {
        console.error("Error:", error);
        toast.error("No se pudo cargar el proveedor");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProvider();
  }, [providerId]);

  // Preparar valores default para el formulario
  const getDefaultValues = (): ProviderFormValues => {
    if (provider) {
      return {
        nombre: provider.nombre || "",
        tipo: provider.tipo || "sip",
        api_url: provider.api_url || "",
        api_key: provider.api_key || "",
        api_secret: provider.api_secret || "",
        configuracion: provider.configuracion ? JSON.stringify(provider.configuracion, null, 2) : "",
        activo: provider.activo ?? true,
      };
    }

    // Valores por defecto para un nuevo proveedor
    return {
      nombre: "",
      tipo: "sip",
      api_url: "",
      api_key: "",
      api_secret: "",
      configuracion: "",
      activo: true,
    };
  };

  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: getDefaultValues(),
  });

  // Efecto para actualizar el formulario cuando se carga el proveedor
  useEffect(() => {
    if (provider) {
      form.reset(getDefaultValues());
    }
  }, [provider, form]);

  async function onSubmit(values: ProviderFormValues) {
    try {
      setIsSubmitting(true);
      
      // Procesar configuración JSON si existe
      let configuracion = undefined;
      if (values.configuracion) {
        try {
          configuracion = JSON.parse(values.configuracion);
        } catch (e) {
          form.setError("configuracion", { 
            type: "manual", 
            message: "La configuración debe ser un JSON válido" 
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      const providerData = {
        ...values,
        configuracion,
      };
      
      // Enviar datos al servidor
      const url = providerId 
        ? `/api/calendar/telephony/providers/${providerId}` 
        : "/api/calendar/telephony/providers";
      
      const method = providerId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(providerData),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success(providerId 
        ? "Proveedor actualizado correctamente" 
        : "Proveedor creado correctamente"
      );
      
      // Redirigir a la página de telefonía
      router.push("/dashboard/calendar/telephony");
    } catch (error) {
      console.error("Error al guardar el proveedor:", error);
      toast.error("Error al guardar el proveedor");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6 max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {providerId ? "Editar proveedor" : "Nuevo proveedor"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {providerId 
              ? "Actualiza la configuración del proveedor de telefonía" 
              : "Agrega un nuevo proveedor de telefonía al sistema"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del proveedor</CardTitle>
          <CardDescription>
            Configura los detalles del proveedor de telefonía
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del proveedor</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Phone className="h-4 w-4 mr-2 mt-3 opacity-50" />
                        <Input placeholder="Nombre del proveedor" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de proveedor</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sip">Servidor SIP</SelectItem>
                        <SelectItem value="api_externa">API Externa</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="api_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL del API</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Globe className="h-4 w-4 mr-2 mt-3 opacity-50" />
                        <Input type="url" placeholder="https://api.proveedor.com" {...field} value={field.value || ""} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      La URL base para conectarse a la API del proveedor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="api_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Key className="h-4 w-4 mr-2 mt-3 opacity-50" />
                          <Input type="password" placeholder="Clave API" {...field} value={field.value || ""} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="api_secret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Secret</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Shield className="h-4 w-4 mr-2 mt-3 opacity-50" />
                          <Input type="password" placeholder="Secreto API" {...field} value={field.value || ""} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="configuracion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuración adicional (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='{"parametro": "valor", "otro": 123}' 
                        className="font-mono h-32" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Configuración específica del proveedor en formato JSON válido
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Proveedor activo</FormLabel>
                      <FormDescription>
                        Determina si este proveedor está disponible para su uso
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
              
              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>Guardando...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {providerId ? "Actualizar" : "Crear"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
