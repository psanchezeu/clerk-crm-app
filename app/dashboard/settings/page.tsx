"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserProfileSettings } from "./components/user-profile-settings"
import { AppearanceSettings } from "./components/appearance-settings"
import { NotificationSettings } from "./components/notification-settings"
import { BillingSettings } from "./components/billing-settings"
import { EmailSettings } from "./components/email-settings"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("perfil")

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Administra tus preferencias y ajustes del sistema.
        </p>
      </div>

      <Tabs defaultValue="perfil" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="facturacion">Facturación</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>
        
        <TabsContent value="perfil" className="space-y-4">
          <UserProfileSettings />
        </TabsContent>
        
        <TabsContent value="apariencia" className="space-y-4">
          <AppearanceSettings />
        </TabsContent>
        
        <TabsContent value="notificaciones" className="space-y-4">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="facturacion" className="space-y-4">
          <BillingSettings />
        </TabsContent>
        
        <TabsContent value="email" className="space-y-4">
          <EmailSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
