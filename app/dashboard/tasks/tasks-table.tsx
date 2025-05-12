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
import { useTasks } from "@/hooks/use-tasks"
import { formatDate } from "@/lib/utils"

export type Task = {
  id: number
  titulo: string
  descripcion: string | null
  estado: string
  fecha_vencimiento: string | null
  id_propietario: number
  id_cliente: number | null
  id_lead: number | null
  id_oportunidad: number | null
  propietario: {
    nombre: string
  }
  cliente?: {
    nombre_empresa: string
  }
  lead?: {
    nombre: string
  }
  oportunidad?: {
    nombre: string
  }
  created_at: string
  updated_at: string
}

export const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "titulo",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Título
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("titulo")}</div>,
  },
  {
    accessorKey: "cliente",
    header: "Cliente/Lead",
    cell: ({ row }) => {
      const task = row.original
      const clientName = task.cliente?.nombre_empresa
      const leadName = task.lead?.nombre
      const opportunityName = task.oportunidad?.nombre
      
      if (clientName) return <div>{clientName}</div>
      if (leadName) return <div>{leadName}</div>
      if (opportunityName) return <div>{opportunityName}</div>
      return <div className="text-muted-foreground">-</div>
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string
      let variant: "default" | "secondary" | "outline" = "outline"

      switch (estado.toLowerCase()) {
        case "pendiente":
          variant = "outline"
          break
        case "en progreso":
          variant = "secondary"
          break
        case "completada":
          variant = "default"
          break
      }

      return (
        <Badge variant={variant} className="capitalize">
          {estado}
        </Badge>
      )
    },
  },
  {
    accessorKey: "fecha_vencimiento",
    header: "Fecha de Vencimiento",
    cell: ({ row }) => {
      const fechaVencimiento = row.getValue("fecha_vencimiento")
      if (!fechaVencimiento) return <div className="text-muted-foreground">-</div>
      
      const date = new Date(fechaVencimiento as string)
      const now = new Date()
      const isPastDue = date < now && (row.getValue("estado") as string).toLowerCase() !== "completada"
      
      return <div className={isPastDue ? "text-red-500" : ""}>{formatDate(fechaVencimiento as string)}</div>
    },
  },
  {
    accessorKey: "propietario",
    header: "Asignada A",
    cell: ({ row }) => {
      const task = row.original
      return <div>{task.propietario?.nombre || '-'}</div>
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
      const task = row.original

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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(task.id)}>Copy task ID</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View task</DropdownMenuItem>
            <DropdownMenuItem>Mark as completed</DropdownMenuItem>
            <DropdownMenuItem>Edit task</DropdownMenuItem>
            <DropdownMenuItem>Delete task</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function TasksTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState("")
  
  // Usar el hook useTasks para obtener los datos reales
  const { tasks, pagination, loading, error } = useTasks(page, 10, search, status)

  const table = useReactTable({
    data: tasks,
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
          placeholder="Buscar tareas..."
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
            <>Mostrando {tasks.length} de {pagination?.total || 0} tareas</>  
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
