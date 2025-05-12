"use client"

import * as React from "react"
import { type ColumnDef, type VisibilityState, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { ClientDetailDialog } from "./client-detail-dialog"
import { ClientEditDialog } from "./client-edit-dialog"
import { ClientDeleteDialog } from "./client-delete-dialog"

export type Client = {
  id: number
  nombre_empresa: string
  sector: string | null
  telefono: string | null
  email: string | null
  tipo: "B2B" | "B2C"
  fecha_creacion: string
  propietario_nombre: string
  direccion: string | null
  es_privado: boolean | null
}

interface PaginationData {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface ClientsTableProps {
  clients: Client[]
  pagination: PaginationData
  onPageChange: (page: number) => void
  refreshData?: () => void
}

export function ClientsTable({ clients, pagination, onPageChange, refreshData }: ClientsTableProps) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "nombre_empresa",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Nombre
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("nombre_empresa")}</div>,
    },
    {
      accessorKey: "sector",
      header: "Sector",
      cell: ({ row }) => <div>{row.getValue("sector") || "-"}</div>,
    },
    {
      accessorKey: "email",
      header: "Correo",
      cell: ({ row }) => <div>{row.getValue("email") || "-"}</div>,
    },
    {
      accessorKey: "telefono",
      header: "Teléfono",
      cell: ({ row }) => <div>{row.getValue("telefono") || "-"}</div>,
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant={row.getValue("tipo") === "B2B" ? "default" : "secondary"}>{row.getValue("tipo")}</Badge>
      ),
    },
    {
      accessorKey: "propietario_nombre",
      header: "Propietario",
      cell: ({ row }) => <div>{row.getValue("propietario_nombre")}</div>,
    },
    {
      accessorKey: "fecha_creacion",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Fecha Creación
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("fecha_creacion"))
        return <div>{date.toLocaleDateString()}</div>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const client = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedClient(client)
                  setViewDialogOpen(true)
                }}
              >
                <Eye className="mr-2 h-4 w-4" /> Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedClient(client)
                  setEditDialogOpen(true)
                }}
              >
                <Edit className="mr-2 h-4 w-4" /> Editar cliente
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedClient(client)
                  setDeleteDialogOpen(true)
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar cliente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: clients,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  })

  return (
    <div className="w-full rounded-md">
      <div className="flex items-center">
        <Input
          placeholder="Buscar clientes..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            // Aquí podrías implementar la búsqueda en tiempo real si lo deseas
          }}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columnas <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border w-full overflow-hidden">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Mostrando {clients.length} de {pagination.total || 0} clientes
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page > 1 ? pagination.page - 1 : 1)}
            disabled={pagination.page <= 1}
          >
            Anterior
          </Button>
          <span className="mx-2">
            Página {pagination.page} de {pagination.totalPages || 1}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange(pagination.page + 1)} 
            disabled={pagination.page >= (pagination.totalPages || 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
      
      {/* Diálogos para ver, editar y eliminar clientes */}
      <ClientDetailDialog 
        client={selectedClient} 
        open={viewDialogOpen} 
        onOpenChange={setViewDialogOpen} 
      />
      
      <ClientEditDialog 
        client={selectedClient} 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        onSuccess={() => {
          // Si tenemos la función refreshData disponible, la usamos
          if (refreshData) {
            refreshData();
          } else {
            // De lo contrario, usamos la paginación
            onPageChange(pagination.page);
          }
        }} 
      />
      
      <ClientDeleteDialog 
        client={selectedClient} 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
        onSuccess={() => {
          // Si tenemos la función refreshData disponible, la usamos
          if (refreshData) {
            refreshData();
          } else {
            // De lo contrario, usamos la paginación
            onPageChange(pagination.page);
          }
        }} 
      />
    </div>
  )
}
