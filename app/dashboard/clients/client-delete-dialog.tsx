"use client"

import { useState } from "react"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { type Client } from "./clients-table"

interface ClientDeleteDialogProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ClientDeleteDialog({ 
  client, 
  open, 
  onOpenChange,
  onSuccess
}: ClientDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  if (!client) return null

  const handleDelete = async () => {
    if (!client) return
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Error al eliminar el cliente")
      }
      
      toast({
        title: "Cliente eliminado",
        description: `${client.nombre_empresa} ha sido eliminado correctamente.`,
      })
      
      if (onSuccess) {
        onSuccess()
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente el cliente <strong>{client.nombre_empresa}</strong> y 
            todos sus datos asociados. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
