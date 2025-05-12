import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { prisma } from "@/lib/prisma"
import { getCurrentUserWithRole, hasPermission } from "@/lib/auth-utils"
import { Cliente, Tarea, Oportunidad } from "@prisma/client"

interface ClienteWithPropietario extends Cliente {
  propietario: {
    id: number;
    nombre: string;
    email: string;
  };
}

interface TareaWithPropietario extends Tarea {
  propietario: {
    nombre: string;
  };
}

interface OportunidadWithPropietario extends Oportunidad {
  propietario: {
    nombre: string;
  };
}

interface FormattedCliente extends Cliente {
  propietario_nombre: string;
}

interface FormattedTarea extends Tarea {
  usuario_nombre: string;
}

interface FormattedOportunidad extends Oportunidad {
  usuario_nombre: string;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasViewPermission = await hasPermission("lectura")

    if (!hasViewPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const id = Number.parseInt(params.id)

    // Obtener cliente con Prisma
    const client = await prisma.cliente.findFirst({
      where: {
        id: id,
        OR: [
          { es_privado: false },
          { id_propietario: user.id }
        ]
      },
      include: {
        propietario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    // Formatear la respuesta para mantener compatibilidad con el cliente
    const formattedClient: FormattedCliente = {
      ...client,
      propietario_nombre: client.propietario.nombre
    }

    // Obtener tareas relacionadas con este cliente
    const tasks = await prisma.tarea.findMany({
      where: {
        id_cliente: id,
        OR: [
          { es_privado: false },
          { id_propietario: user.id }
        ]
      },
      include: {
        propietario: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        fecha_vencimiento: 'asc'
      }
    })

    // Formatear tareas
    const formattedTasks = tasks.map((task: TareaWithPropietario): FormattedTarea => ({
      ...task,
      usuario_nombre: task.propietario.nombre
    }))

    // Obtener oportunidades relacionadas con este cliente
    const opportunities = await prisma.oportunidad.findMany({
      where: {
        id_cliente: id,
        OR: [
          { es_privado: false },
          { id_propietario: user.id }
        ]
      },
      include: {
        propietario: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        fecha_cierre: 'asc'
      }
    })

    // Formatear oportunidades
    const formattedOpportunities = opportunities.map((opp: OportunidadWithPropietario): FormattedOportunidad => ({
      ...opp,
      usuario_nombre: opp.propietario.nombre
    }))

    return NextResponse.json({
      ...formattedClient,
      tasks: formattedTasks,
      opportunities: formattedOpportunities,
      contacts: [], // Implementar cuando exista el modelo Contacto en Prisma
      notes: [] // Implementar cuando exista el modelo Nota en Prisma
    })
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasUpdatePermission = await hasPermission("escritura")

    if (!hasUpdatePermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const id = Number.parseInt(params.id)
    const body = await request.json()

    const { nombre_empresa, sector, telefono, email, direccion, tipo, es_privado } = body

    // Verificar si el cliente existe y si el usuario tiene permiso para actualizarlo
    const existingClient = await prisma.cliente.findFirst({
      where: {
        id: id,
        OR: [
          { id_propietario: user.id },
          { id_propietario: user.id, ...(user.rol_nombre === "Administrador" ? {} : {}) }
        ]
      }
    })

    if (!existingClient) {
      return NextResponse.json({ error: "Cliente no encontrado o no tienes permiso para actualizarlo" }, { status: 404 })
    }

    // Actualizar el cliente usando Prisma
    const updatedClient = await prisma.cliente.update({
      where: { id },
      data: {
        nombre_empresa: nombre_empresa || undefined,
        sector: sector || undefined,
        telefono: telefono || undefined,
        email: email || undefined,
        direccion: direccion || undefined,
        tipo: tipo || undefined,
        es_privado: typeof es_privado === 'boolean' ? es_privado : undefined,
        updated_at: new Date()
      }
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasDeletePermission = await hasPermission("eliminación")

    if (!hasDeletePermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const id = Number.parseInt(params.id)

    // Verificar si el cliente existe y si el usuario tiene permiso para eliminarlo
    const existingClient = await prisma.cliente.findFirst({
      where: {
        id: id,
        OR: [
          { id_propietario: user.id },
          { id_propietario: user.id, ...(user.rol_nombre === "Administrador" ? {} : {}) }
        ]
      }
    })

    if (!existingClient) {
      return NextResponse.json({ error: "Cliente no encontrado o no tienes permiso para eliminarlo" }, { status: 404 })
    }

    // Eliminar el cliente usando Prisma
    await prisma.cliente.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Cliente eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
