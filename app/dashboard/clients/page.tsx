"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, Loader2 } from "lucide-react"
import { ClientsTable } from "./clients-table"
import { useClients } from "@/hooks/use-clients"
import { ClientFormDialog } from "./client-form-dialog"

export default function ClientsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { clients, pagination, loading, error, refreshData } = useClients(page, 10, search)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  return (
    <div className="flex-1 space-y-4 p-6 max-w-full">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Cliente
          </Button>
        </div>
      </div>

      {/* Eliminamos el campo de búsqueda de aquí, ya que ahora está integrado en la tabla */}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-destructive">Error: {error}</p>
        </div>
      ) : (
        <ClientsTable 
          clients={clients} 
          pagination={pagination} 
          onPageChange={handlePageChange}
          refreshData={refreshData} 
        />
      )}

      <ClientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false)
          // Refrescar la lista de clientes utilizando la nueva función
          refreshData()
        }}
      />
    </div>
  )
}
