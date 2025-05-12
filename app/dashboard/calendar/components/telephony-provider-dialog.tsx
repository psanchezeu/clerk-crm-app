"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Phone, Shield, Globe, Key, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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

interface TelephonyProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: any;
}

export function TelephonyProviderDialog({ open, onOpenChange, provider }: TelephonyProviderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const url = provider?.id 
        ? `/api/calendar/telephony/providers/${provider.id}` 
        : "/api/calendar/telephony/providers";
      
      const method = provider?.id ? "PUT" : "POST";
      
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

      toast.success(provider?.id 
        ? "Proveedor actualizado correctamente" 
        : "Proveedor creado correctamente"
      );
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error al guardar el proveedor:", error);
      toast.error("Error al guardar el proveedor");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Efecto para reiniciar el formulario cuando se abre el diálogo o cambia el proveedor
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues());
    }
  }, [open, provider, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {provider?.id ? "Editar proveedor de telefonía" : "Nuevo proveedor de telefonía"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del proveedor" {...field} />
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
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sip">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          Servidor SIP
                        </div>
                      </SelectItem>
                      <SelectItem value="api_externa">
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2" />
                          API Externa
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
              name="api_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL del API</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Globe className="h-4 w-4 mr-2 mt-3 opacity-50" />
                      <Input placeholder="https://api.proveedor.com" {...field} value={field.value || ""} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    La URL base para conectarse a la API del proveedor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
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
            
            <DialogFooter className="gap-2 sm:gap-0">
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
                  <>{provider?.id ? "Actualizar" : "Crear"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
