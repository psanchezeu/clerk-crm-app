"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useOpportunities } from "@/hooks/use-opportunities"
import { formatDate } from "@/lib/utils"

export type Opportunity = {
  id: number
  nombre: string
  valor: number | null
  etapa: string
  fecha_cierre: string | null
  id_cliente: number | null
  id_lead: number | null
  id_propietario: number
  propietario: {
    nombre: string
  }
  cliente?: {
    nombre_empresa: string
  }
  lead?: {
    nombre: string
  }
  es_privado: boolean
  created_at: string
  updated_at: string
}

export const columns: ColumnDef<Opportunity>[] = [
  {
    accessorKey: "nombre",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("nombre")}</div>,
  },
  {
    accessorKey: "cliente",
    header: "Cliente",
    cell: ({ row }) => {
      const opportunity = row.original
      return <div>{opportunity.cliente?.nombre_empresa || (opportunity.lead?.nombre || "-")}</div>
    },
  },
  {
    accessorKey: "valor",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Valor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = row.getValue("valor") as number | null
      if (!amount) return <div className="text-muted-foreground">-</div>
      
      const formatted = new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
      }).format(amount)
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "etapa",
    header: "Estado",
    cell: ({ row }) => {
      const etapa = row.getValue("etapa") as string
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline"

      switch (etapa) {
        case "Prospección":
          variant = "outline"
          break
        case "Calificación":
          variant = "secondary"
          break
        case "Propuesta":
          variant = "default"
          break
        case "Ganada":
          variant = "default"
          break
        case "Perdida":
          variant = "destructive"
          break
      }

      return (
        <Badge variant={variant} className="capitalize">
          {etapa}
        </Badge>
      )
    },
  },
  {
    accessorKey: "fecha_cierre",
    header: "Fecha de Cierre",
    cell: ({ row }) => {
      const fechaCierre = row.getValue("fecha_cierre")
      return fechaCierre ? <div>{formatDate(fechaCierre as string)}</div> : <div className="text-muted-foreground">-</div>
    },
  },
  {
    accessorKey: "created_at",
    header: "Creada",
    cell: ({ row }) => {
      return <div>{formatDate(row.getValue("created_at"))}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const opportunity = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(opportunity.id)}>
              Copy opportunity ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View opportunity</DropdownMenuItem>
            <DropdownMenuItem>Create quote</DropdownMenuItem>
            <DropdownMenuItem>Edit opportunity</DropdownMenuItem>
            <DropdownMenuItem>Delete opportunity</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function OpportunitiesTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState("")
  
  // Usar el hook useOpportunities para obtener los datos reales
  const { opportunities, pagination, loading, error } = useOpportunities(page, 10, search, status)

  const table = useReactTable({
    data: opportunities,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    // No es necesario usar la paginación interna de la tabla ya que usamos la paginación del servidor
    manualPagination: true,
    pageCount: pagination?.totalPages || 1,
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Buscar oportunidades..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            // Resetear página al cambiar búsqueda
            setPage(1)
          }}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {loading ? "Cargando..." : (
            <>Mostrando {opportunities.length} de {pagination?.total || 0} oportunidades</>  
          )}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page > 1 ? page - 1 : 1)}
            disabled={page <= 1 || loading}
          >
            Anterior
          </Button>
          <span className="mx-2">
            Página {page} de {pagination?.totalPages || 1}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(page + 1)} 
            disabled={page >= (pagination?.totalPages || 1) || loading}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
