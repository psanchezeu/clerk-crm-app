"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Loader2, Mail, AlarmClock, Globe, Send, CheckCircle2, AlertTriangle } from "lucide-react"

/**
 * Esquema de validación para la configuración de SMTP
 */
const smtpConfigSchema = z.object({
  smtpServer: z.string().min(1, {
    message: "El servidor SMTP es obligatorio.",
  }),
  smtpPort: z.string().min(1, {
    message: "El puerto SMTP es obligatorio.",
  }),
  smtpUser: z.string().min(1, {
    message: "El usuario SMTP es obligatorio.",
  }),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean().default(true),
  emailFrom: z.string().email({
    message: "Por favor introduce un email válido.",
  }),
  emailReplyTo: z.string().email({
    message: "Por favor introduce un email válido.",
  }).optional(),
})

/**
 * Esquema de validación para las plantillas de email
 */
const emailTemplatesSchema = z.object({
  welcomeEmailSubject: z.string().min(1, {
    message: "El asunto es obligatorio.",
  }),
  welcomeEmailTemplate: z.string().min(1, {
    message: "La plantilla es obligatoria.",
  }),
  invoiceEmailSubject: z.string().min(1, {
    message: "El asunto es obligatorio.",
  }),
  invoiceEmailTemplate: z.string().min(1, {
    message: "La plantilla es obligatoria.",
  }),
  notificationEmailSubject: z.string().min(1, {
    message: "El asunto es obligatorio.",
  }),
  notificationEmailTemplate: z.string().min(1, {
    message: "La plantilla es obligatoria.",
  }),
})

/**
 * Esquema de validación para la configuración de recordatorios de email
 */
const emailRemindersSchema = z.object({
  taskReminderEnabled: z.boolean().default(true),
  taskReminderTime: z.enum(["1hour", "3hours", "6hours", "12hours", "1day"], {
    required_error: "Por favor selecciona un tiempo.",
  }),
  opportunityReminderEnabled: z.boolean().default(true),
  opportunityReminderTime: z.enum(["1day", "2days", "3days", "1week", "2weeks"], {
    required_error: "Por favor selecciona un tiempo.",
  }),
  clientFollowupEnabled: z.boolean().default(true),
  clientFollowupTime: z.enum(["7days", "14days", "30days", "60days", "90days"], {
    required_error: "Por favor selecciona un tiempo.",
  }),
})

type SmtpConfigValues = z.infer<typeof smtpConfigSchema>
type EmailTemplatesValues = z.infer<typeof emailTemplatesSchema>
type EmailRemindersValues = z.infer<typeof emailRemindersSchema>

/**
 * Componente de configuración de email
 */
export function EmailSettings() {
  const [activeTab, setActiveTab] = useState("smtp")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [useGmail, setUseGmail] = useState(false)
  const [isGmailAuthorized, setIsGmailAuthorized] = useState(false)
  const [isTestingTemplate, setIsTestingTemplate] = useState(false)
  const [testTemplateType, setTestTemplateType] = useState<'welcome' | 'invoice' | 'notification' | null>(null)

  // Load saved email configuration
  useEffect(() => {
    async function loadEmailConfig() {
      try {
        const response = await fetch('/api/email-config')
        if (response.ok) {
          const config = await response.json()
          if (config) {
            smtpForm.reset({
              smtpServer: config.smtp_host,
              smtpPort: config.smtp_port.toString(),
              smtpUser: config.user_email,
              smtpPassword: config.app_password,
              smtpSecure: true,
              emailFrom: config.user_email,
              emailReplyTo: config.user_email
            })
            setUseGmail(config.smtp_host === 'smtp.gmail.com')
            setIsGmailAuthorized(true)
          }
        }
      } catch (error) {
        console.error('Error loading email configuration:', error)
      }
    }
    loadEmailConfig()
  }, [])
  
  // Formulario de configuración SMTP
  const smtpForm = useForm<SmtpConfigValues>({
    resolver: zodResolver(smtpConfigSchema),
    defaultValues: {
      smtpServer: "smtp.ejemplo.com",
      smtpPort: "587",
      smtpUser: "usuario@ejemplo.com",
      smtpPassword: "",
      smtpSecure: true,
      emailFrom: "crm@miempresa.com",
      emailReplyTo: "soporte@miempresa.com",
    },
  })
  
  // Formulario de plantillas de email
  const templatesForm = useForm<EmailTemplatesValues>({
    resolver: zodResolver(emailTemplatesSchema),
    defaultValues: {
      welcomeEmailSubject: "Bienvenido a [Nombre de la empresa]",
      welcomeEmailTemplate: "Hola {nombre},\n\nGracias por registrarte en nuestro sistema CRM...",
      invoiceEmailSubject: "Factura #{invoice_number}",
      invoiceEmailTemplate: "Estimado {nombre},\n\nAdjunto encontrarás la factura #{invoice_number}...",
      notificationEmailSubject: "Notificación: {notification_title}",
      notificationEmailTemplate: "Hola {nombre},\n\nTe informamos que {notification_message}...",
    },
  })
  
  // Formulario de recordatorios de email
  const remindersForm = useForm<EmailRemindersValues>({
    resolver: zodResolver(emailRemindersSchema),
    defaultValues: {
      taskReminderEnabled: true,
      taskReminderTime: "1day",
      opportunityReminderEnabled: true,
      opportunityReminderTime: "3days",
      clientFollowupEnabled: true,
      clientFollowupTime: "30days",
    },
  })

  /**
   * Probar la conexión SMTP
   */
  async function testConnection() {
    setIsTesting(true)
    setTestStatus('idle')
    setTestMessage('')
    
    try {
      // Validar formulario antes de probar
      const isValid = await smtpForm.trigger()
      if (!isValid) {
        setTestStatus('error')
        setTestMessage('Por favor completa todos los campos requeridos antes de probar la conexión.')
        return
      }
      
      // Obtener valores del formulario
      const data = smtpForm.getValues()
      
      // Verificar contraseña para configuración manual
      if (!useGmail && !isGmailAuthorized && !data.smtpPassword) {
        setTestStatus('error')
        setTestMessage('La contraseña SMTP es obligatoria cuando no usas Gmail OAuth2.')
        return
      }
      
      // Hacer petición al servidor para probar conexión
      const response = await fetch('/api/settings/email/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          smtpServer: data.smtpServer,
          smtpPort: data.smtpPort,
          smtpUser: data.smtpUser,
          smtpPassword: data.smtpPassword,
          smtpSecure: data.smtpSecure,
          useGmail: useGmail && isGmailAuthorized
        }),
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setTestStatus('success')
        setTestMessage('Conexión exitosa. Tu configuración SMTP funciona correctamente.')
      } else {
        setTestStatus('error')
        setTestMessage(result.error || 'No se pudo establecer conexión con el servidor SMTP.')
      }
    } catch (error) {
      console.error('Error al probar conexión:', error)
      setTestStatus('error')
      setTestMessage('Error de conexión. Verifica tu configuración e inténtalo de nuevo.')
    } finally {
      setIsTesting(false)
    }
  }
  
  /**
   * Enviar correo de prueba
   */
  async function sendTestEmail() {
    setIsSendingTest(true)
    
    try {
      // Validar formulario antes de enviar
      const isValid = await smtpForm.trigger(['smtpServer', 'smtpPort', 'smtpUser', 'emailFrom'])
      if (!isValid) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos antes de enviar un correo de prueba.",
          variant: "destructive",
        })
        return
      }
      
      // Obtener valores del formulario
      const data = smtpForm.getValues()
      
      // Verificar contraseña para configuración manual
      if (!data.smtpPassword && !useGmail) {
        toast({
          title: "Error",
          description: "La contraseña SMTP es obligatoria cuando no usas Gmail OAuth2.",
          variant: "destructive",
        })
        return
      }
      
      // Hacer petición al servidor para enviar correo de prueba
      const response = await fetch('/api/settings/email/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          smtpServer: data.smtpServer,
          smtpPort: data.smtpPort,
          smtpUser: data.smtpUser,
          smtpPassword: data.smtpPassword,
          smtpSecure: data.smtpSecure,
          emailFrom: data.emailFrom,
          emailReplyTo: data.emailReplyTo,
          useGmail: useGmail && isGmailAuthorized
        }),
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast({
          title: "Correo enviado",
          description: "El correo de prueba ha sido enviado correctamente. Revisa tu bandeja de entrada.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo enviar el correo de prueba.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error al enviar correo de prueba:', error)
      toast({
        title: "Error",
        description: "Error de conexión. Verifica tu configuración e inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSendingTest(false)
    }
  }
  
  /**
   * Guardar configuración SMTP
   */
  const onSubmitSmtp = async (data: SmtpConfigValues) => {
    if (!data.smtpPassword && !useGmail) {
      toast({
        title: "Error",
        description: "La contraseña SMTP es obligatoria cuando no usas Gmail OAuth2.",
        variant: "destructive",
      })
      return
    }
    setIsSubmitting(true)
    try {
      console.log('Saving SMTP configuration...');
      const configData = {
        smtp_host: data.smtpServer,
        smtp_port: parseInt(data.smtpPort),
        user_email: data.smtpUser,
        app_password: data.smtpPassword
      };
      console.log('Configuration data:', configData);

      const response = await fetch('/api/email-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      })

      const result = await response.json();
      console.log('API Response:', result);

      if (!response.ok) {
        throw new Error('Failed to save configuration')
      }

      toast({
        title: "Configuración guardada",
        description: "La configuración SMTP se ha guardado correctamente.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración SMTP.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  /**
   * Guardar plantillas de email
   */
  /**
   * Enviar correo de prueba usando una plantilla específica
   */
  const sendTemplateTest = async (templateType: 'welcome' | 'invoice' | 'notification') => {
    setTestTemplateType(templateType)
    setIsTestingTemplate(true)
    try {
      const response = await fetch('/api/email-test-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_type: templateType,
          test_email: smtpForm.getValues('emailFrom')
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error sending test email')
      }

      toast({
        title: "Correo enviado",
        description: `Se ha enviado el correo de prueba usando la plantilla ${templateType}`,
      })
    } catch (error) {
      console.error("Error sending test email:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar el correo de prueba.",
        variant: "destructive",
      })
    } finally {
      setIsTestingTemplate(false)
      setTestTemplateType(null)
    }
  }

  async function onSubmitTemplates(data: EmailTemplatesValues) {
    setIsSubmitting(true)
    
    try {
      // Simular guardado de plantillas
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // TODO: Implementar guardado real de plantillas
      console.log("Plantillas de email:", data)
      
      toast({
        title: "Plantillas guardadas",
        description: "Las plantillas de email han sido guardadas correctamente.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las plantillas de email.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  /**
   * Guardar configuración de recordatorios
   */
  async function onSubmitReminders(data: EmailRemindersValues) {
    setIsSubmitting(true)
    
    try {
      // Simular guardado de configuración
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // TODO: Implementar guardado real de configuración
      console.log("Configuración de recordatorios:", data)
      
      toast({
        title: "Configuración guardada",
        description: "La configuración de recordatorios ha sido guardada correctamente.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración de recordatorios.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configuración de Email</h3>
        <p className="text-sm text-muted-foreground">
          Configura las opciones de email, plantillas y recordatorios.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="smtp" className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            SMTP
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center">
            <AlarmClock className="mr-2 h-4 w-4" />
            Recordatorios
          </TabsTrigger>
        </TabsList>
        
        {/* Configuración SMTP */}
        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de SMTP</CardTitle>
              <CardDescription>
                Configura el servidor SMTP para enviar emails desde el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...smtpForm}>
                <form onSubmit={smtpForm.handleSubmit(onSubmitSmtp)} className="space-y-6">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="mb-6 flex flex-col space-y-4">
                      <div className="flex space-x-4">
                        <Button 
                          type="button" 
                          variant={!useGmail ? "default" : "outline"}
                          className="flex-1 py-6"
                          onClick={() => {
                            setUseGmail(false);
                            smtpForm.setValue("smtpServer", "smtp.ejemplo.com");
                            smtpForm.setValue("smtpPort", "587");
                          }}
                        >
                          <Globe className="mr-2 h-5 w-5" />
                          Configuración SMTP Manual
                        </Button>
                        <Button 
                          type="button" 
                          variant={useGmail ? "default" : "outline"}
                          className="flex-1 py-6"
                          onClick={() => {
                            setUseGmail(true);
                            if (!isGmailAuthorized) {
                              smtpForm.setValue("smtpServer", "smtp.gmail.com");
                              smtpForm.setValue("smtpPort", "465");
                              smtpForm.setValue("smtpSecure", true);
                            }
                          }}
                        >
                          <Mail className="mr-2 h-5 w-5 text-red-500" />
                          Usar Gmail
                        </Button>
                      </div>
                      
                      {useGmail && (
                        <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                          <CardContent className="pt-6">
                            {!isGmailAuthorized ? (
                              <div className="space-y-4">
                                <div className="bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 p-4 rounded-md">
                                  <h4 className="font-medium text-amber-900 dark:text-amber-400 flex items-center text-sm">
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Configuración de Gmail
                                  </h4>
                                  <p className="text-sm mt-1 text-amber-800 dark:text-amber-300">
                                    Para usar Gmail, necesitas una "contraseña de aplicación". Tu contraseña normal no funcionará.
                                  </p>
                                  <ol className="text-xs mt-2 space-y-1 list-decimal list-inside text-amber-700 dark:text-amber-300">
                                    <li>Activa la verificación en dos pasos en tu cuenta de Google</li>
                                    <li>Ve a la <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline">configuración de contraseñas de aplicación</a></li>
                                    <li>Genera una nueva contraseña para "CRM"</li>
                                    <li>Copia la contraseña generada y úsala aquí</li>
                                  </ol>
                                </div>
                                
                                <div className="grid gap-3 grid-cols-1">
                                  <FormField
                                    control={smtpForm.control}
                                    name="emailFrom"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Tu correo de Gmail</FormLabel>
                                        <FormControl>
                                          <Input placeholder="tucorreo@gmail.com" {...field} onChange={(e) => {
                                            field.onChange(e);
                                            smtpForm.setValue("smtpUser", e.target.value);
                                          }} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={smtpForm.control}
                                    name="smtpPassword"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Contraseña de aplicación</FormLabel>
                                        <FormControl>
                                          <Input type="password" placeholder="xxxx xxxx xxxx xxxx" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                          Usa la contraseña de aplicación generada por Google, no tu contraseña normal.
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <Button 
                                    type="button" 
                                    variant="outline"
                                    className="w-full mt-2"
                                    onClick={async () => {
                                      try {
                                        console.log('Saving Gmail configuration...');
                                        const configData = {
                                          smtp_host: 'smtp.gmail.com',
                                          smtp_port: 587,
                                          user_email: smtpForm.getValues('smtpUser'),
                                          app_password: smtpForm.getValues('smtpPassword')
                                        };
                                        console.log('Configuration data:', configData);

                                        const response = await fetch('/api/email-config', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify(configData),
                                        });

                                        const result = await response.json();
                                        console.log('API Response:', result);

                                        if (!response.ok) {
                                          throw new Error('Failed to save configuration');
                                        }

                                        setIsGmailAuthorized(true);
                                        toast({
                                          title: "Configuración guardada",
                                          description: "Gmail configurado correctamente. Ahora puedes probar la conexión.",
                                        });
                                      } catch (error) {
                                        console.error('Error saving Gmail configuration:', error);
                                        toast({
                                          title: "Error",
                                          description: "No se pudo guardar la configuración de Gmail.",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Aplicar configuración
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center space-y-2">
                                <p className="text-green-600 dark:text-green-400 font-medium">✅ Conectado con Gmail</p>
                                <p className="text-sm">Tu cuenta está conectada y lista para enviar correos.</p>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => {
                                    setIsGmailAuthorized(false);
                                  }}
                                >
                                  Desconectar
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    
                    {/* Solo mostramos la configuración SMTP si no está usando Gmail o si está usando Gmail pero no está autorizado */}
                    {(!useGmail || (useGmail && !isGmailAuthorized)) && (
                      <FormField
                        control={smtpForm.control}
                        name="smtpServer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Servidor SMTP</FormLabel>
                            <FormControl>
                              <Input placeholder="smtp.ejemplo.com" {...field} disabled={useGmail} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {(!useGmail || (useGmail && !isGmailAuthorized)) && (
                      <FormField
                        control={smtpForm.control}
                        name="smtpPort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Puerto SMTP</FormLabel>
                            <FormControl>
                              <Input placeholder="587" {...field} disabled={useGmail} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {(!useGmail || (useGmail && !isGmailAuthorized)) && (
                      <FormField
                        control={smtpForm.control}
                        name="smtpUser"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usuario SMTP</FormLabel>
                            <FormControl>
                              <Input placeholder="usuario@ejemplo.com" {...field} disabled={useGmail} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {(!useGmail || (useGmail && !isGmailAuthorized)) && (
                      <FormField
                        control={smtpForm.control}
                        name="smtpPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña SMTP</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} disabled={useGmail} />
                            </FormControl>
                            {useGmail && (
                              <FormDescription>
                                No necesitas introducir contraseña cuando usas la autenticación de Gmail con OAuth2.
                              </FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <FormField
                    control={smtpForm.control}
                    name="smtpSecure"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Conexión segura</FormLabel>
                          <FormDescription>
                            Usar SSL/TLS para la conexión SMTP
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
                  
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <FormField
                      control={smtpForm.control}
                      name="emailFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email remitente</FormLabel>
                          <FormControl>
                            <Input placeholder="holapsanchez@gmail.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={smtpForm.control}
                      name="emailReplyTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email de respuesta</FormLabel>
                          <FormControl>
                            <Input placeholder="holapsanchez@gmail.com" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Contenedor para mostrar el resultado de la prueba de conexión */}
                  {testStatus !== 'idle' && (
                    <div className={`p-4 rounded-md mt-2 ${testStatus === 'success' ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                      <div className="flex items-start">
                        {testStatus === 'success' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2 flex-shrink-0" />
                        )}
                        <p className={`text-sm ${testStatus === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          {testMessage}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={testConnection}
                      disabled={isTesting || isSubmitting}
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Probando conexión...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Probar conexión
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={sendTestEmail}
                      disabled={isSendingTest || isSubmitting}
                    >
                      {isSendingTest ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando correo...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar correo de prueba
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar configuración SMTP
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Plantillas de email */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Email</CardTitle>
              <CardDescription>
                Personaliza las plantillas de email que se envían a los usuarios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...templatesForm}>
                <form onSubmit={templatesForm.handleSubmit(onSubmitTemplates)} className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Email de bienvenida</h4>
                    <FormField
                      control={templatesForm.control}
                      name="welcomeEmailSubject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asunto</FormLabel>
                          <FormControl>
                            <Input placeholder="Bienvenido a [Nombre de la empresa]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={templatesForm.control}
                      name="welcomeEmailTemplate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plantilla</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Escribe la plantilla de email..."
                                className="min-h-32"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => sendTemplateTest('welcome')}
                                disabled={isTestingTemplate}
                                className="w-full sm:w-auto"
                              >
                                {isTestingTemplate && testTemplateType === 'welcome' ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="mr-2 h-4 w-4" />
                                )}
                                Enviar prueba
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Usa {'{{nombre}}'} para insertar el nombre del usuario.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Email de factura</h4>
                    <FormField
                      control={templatesForm.control}
                      name="invoiceEmailSubject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asunto</FormLabel>
                          <FormControl>
                            <Input placeholder="Factura #{{invoice_number}}" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={templatesForm.control}
                      name="invoiceEmailTemplate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plantilla</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Escribe la plantilla de email..."
                                className="min-h-32"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => sendTemplateTest('invoice')}
                                disabled={isTestingTemplate}
                                className="w-full sm:w-auto"
                              >
                                {isTestingTemplate && testTemplateType === 'invoice' ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="mr-2 h-4 w-4" />
                                )}
                                Enviar prueba
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Usa {'{nombre}'} y {'{invoice_number}'} como variables.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Email de notificación</h4>
                    <FormField
                      control={templatesForm.control}
                      name="notificationEmailSubject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asunto</FormLabel>
                          <FormControl>
                            <Input placeholder="Notificación: {{notification_title}}" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={templatesForm.control}
                      name="notificationEmailTemplate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plantilla</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Escribe la plantilla de email..."
                                className="min-h-32"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => sendTemplateTest('notification')}
                                disabled={isTestingTemplate}
                                className="w-full sm:w-auto"
                              >
                                {isTestingTemplate && testTemplateType === 'notification' ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="mr-2 h-4 w-4" />
                                )}
                                Enviar prueba
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Usa {'{nombre}'}, {'{notification_title}'} y {'{notification_message}'} como variables.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar plantillas
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Configuración de recordatorios */}
        <TabsContent value="reminders">
          <Card>
            <CardHeader>
              <CardTitle>Recordatorios por Email</CardTitle>
              <CardDescription>
                Configura cuándo y cómo se envían los recordatorios por email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...remindersForm}>
                <form onSubmit={remindersForm.handleSubmit(onSubmitReminders)} className="space-y-6">
                  <FormField
                    control={remindersForm.control}
                    name="taskReminderEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Recordatorios de tareas
                          </FormLabel>
                          <FormDescription>
                            Enviar recordatorios por email para tareas próximas a vencer.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {remindersForm.watch("taskReminderEnabled") && (
                    <FormField
                      control={remindersForm.control}
                      name="taskReminderTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiempo de recordatorio</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona cuándo enviar el recordatorio" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1hour">1 hora antes</SelectItem>
                              <SelectItem value="3hours">3 horas antes</SelectItem>
                              <SelectItem value="6hours">6 horas antes</SelectItem>
                              <SelectItem value="12hours">12 horas antes</SelectItem>
                              <SelectItem value="1day">1 día antes</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Tiempo antes del vencimiento para enviar el recordatorio.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={remindersForm.control}
                    name="opportunityReminderEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Recordatorios de oportunidades
                          </FormLabel>
                          <FormDescription>
                            Enviar recordatorios por email para oportunidades próximas a cerrar.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {remindersForm.watch("opportunityReminderEnabled") && (
                    <FormField
                      control={remindersForm.control}
                      name="opportunityReminderTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiempo de recordatorio</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona cuándo enviar el recordatorio" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1day">1 día antes</SelectItem>
                              <SelectItem value="2days">2 días antes</SelectItem>
                              <SelectItem value="3days">3 días antes</SelectItem>
                              <SelectItem value="1week">1 semana antes</SelectItem>
                              <SelectItem value="2weeks">2 semanas antes</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Tiempo antes de la fecha estimada de cierre para enviar el recordatorio.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={remindersForm.control}
                    name="clientFollowupEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Seguimiento de clientes
                          </FormLabel>
                          <FormDescription>
                            Enviar recordatorios para hacer seguimiento a clientes sin actividad reciente.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {remindersForm.watch("clientFollowupEnabled") && (
                    <FormField
                      control={remindersForm.control}
                      name="clientFollowupTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Periodo de inactividad</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona el periodo de inactividad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="7days">7 días</SelectItem>
                              <SelectItem value="14days">14 días</SelectItem>
                              <SelectItem value="30days">30 días</SelectItem>
                              <SelectItem value="60days">60 días</SelectItem>
                              <SelectItem value="90days">90 días</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Tiempo de inactividad del cliente antes de enviar recordatorio de seguimiento.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar configuración
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
