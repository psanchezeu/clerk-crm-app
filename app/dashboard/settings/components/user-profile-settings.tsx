"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useUser } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const profileFormSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  apellidos: z.string().min(2, {
    message: "Los apellidos deben tener al menos 2 caracteres.",
  }),
  email_contacto: z.string().email({
    message: "Por favor introduce un email válido.",
  }).optional(),
  cargo: z.string().optional(),
  bio: z.string().max(500, {
    message: "La bio no puede exceder los 500 caracteres.",
  }).optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  codigo_postal: z.string().optional(),
  pais: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function UserProfileSettings() {
  const { user, isLoaded } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Cargar datos del perfil desde la API
  const [profileData, setProfileData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Trigger para actualizar datos
  
  /**
   * Tipo para los datos del perfil del usuario
   */
  interface ProfileData {
    apellidos?: string;
    email_contacto?: string;
    cargo?: string;
    bio?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    codigo_postal?: string;
    pais?: string;
    avatar_url?: string;
  }

  // Función para cargar datos del perfil
  const loadProfileData = async (): Promise<void> => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/settings/profile');
      
      if (response.ok) {
        const data = await response.json() as ProfileData;
        console.log("Datos cargados del perfil:", data);
        setProfileData(data);
        
        // Actualizar el formulario con los datos cargados
        form.reset({
          nombre: user?.firstName || "",
          apellidos: data?.apellidos || user?.lastName || "",
          email_contacto: data?.email_contacto || "",
          cargo: data?.cargo || "",
          bio: data?.bio || "",
          telefono: data?.telefono || user?.phoneNumbers?.[0]?.phoneNumber || "",
          direccion: data?.direccion || "",
          ciudad: data?.ciudad || "",
          codigo_postal: data?.codigo_postal || "",
          pais: data?.pais || "",
        });
      }
    } catch (error) {
      console.error("Error al cargar datos del perfil:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus datos de perfil.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    loadProfileData()
  }, [user, refreshTrigger])
  
  // Valores por defecto del formulario iniciales
  const defaultValues: Partial<ProfileFormValues> = {
    nombre: "",
    apellidos: "",
    email_contacto: "",
    cargo: "",
    bio: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    codigo_postal: "",
    pais: "",
  }

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  })

  /**
   * Maneja el envío del formulario del perfil
   */
  const onSubmit = async (data: ProfileFormValues): Promise<void> => {
    setIsSubmitting(true);
    
    try {
      // Mostrar indicador de carga
      toast({
        title: "Guardando datos...",
        description: "Estamos actualizando tu información de perfil.",
      });
      
      // Guardar el perfil en la base de datos
      const response = await fetch('/api/settings/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apellidos: data.apellidos,
          email_contacto: data.email_contacto,
          cargo: data.cargo,
          bio: data.bio,
          telefono: data.telefono,
          direccion: data.direccion,
          ciudad: data.ciudad,
          codigo_postal: data.codigo_postal,
          pais: data.pais
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el perfil');
      }
      
      // Obtener los datos actualizados
      const updatedProfile = await response.json();
      console.log("Datos actualizados correctamente:", updatedProfile);
      setProfileData(updatedProfile);
      
      // Si se proporciona el firstName y lastName, actualizar en Clerk
      if (user) {
        try {
          await user.update({
            firstName: data.nombre,
            lastName: data.apellidos,
          });
        } catch (clerkError) {
          console.error("Error al actualizar datos en Clerk:", clerkError);
          // Continuamos incluso si falla Clerk
        }
      }
      
      // Mostrar notificación de éxito
      toast({
        title: "¡Perfil actualizado correctamente!",
        description: "Tus datos personales se han guardado en la base de datos.",
        variant: "default",
        className: "bg-green-600 text-white font-bold",
      });
      
      // Actualizar los datos mostrados en la interfaz
      await loadProfileData();
    } catch (error) {
      console.error("Error al guardar el perfil:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el perfil.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center w-full p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Perfil</h3>
        <p className="text-sm text-muted-foreground">
          Actualiza tu información personal y de contacto.
        </p>
      </div>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
            <CardDescription>
              Tu foto o avatar del perfil.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
              <AvatarFallback>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="mt-4">
              <Button variant="outline" size="sm">
                Cambiar avatar
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <CardTitle>Información personal</CardTitle>
            <CardDescription>
              Actualiza tu información personal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="apellidos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellidos</FormLabel>
                        <FormControl>
                          <Input placeholder="Tus apellidos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email_contacto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de contacto profesional</FormLabel>
                        <FormControl>
                          <Input placeholder="tu@empresa.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Este es tu email de contacto profesional (puede ser diferente al de login).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="+34 612 345 678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo / Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Director de Ventas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Escribe un poco sobre ti..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Puedes introducir hasta 500 caracteres.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar cambios
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
