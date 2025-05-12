import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUserWithRole, hasPermission } from "@/lib/auth-utils"

interface Params {
  params: {
    id: string
  }
}

// Obtener un evento específico
export async function GET(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasViewPermission = await hasPermission("lectura")

    if (!hasViewPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    // Verificar que el evento existe y que el usuario tiene permiso para verlo
    const [evento] = await sql`
      SELECT e.*, 
             c.nombre_empresa as cliente_nombre,
             l.nombre as lead_nombre,
             o.nombre as oportunidad_nombre,
             p.nombre as proveedor_nombre
      FROM evento e
      LEFT JOIN cliente c ON e.id_cliente = c.id
      LEFT JOIN lead l ON e.id_lead = l.id
      LEFT JOIN oportunidad o ON e.id_oportunidad = o.id
      LEFT JOIN proveedor_telefonia p ON e.id_proveedor = p.id
      WHERE e.id = ${id}
        AND (
          e.id_propietario = ${user.id}
          OR e.id IN (
            SELECT ep.id_evento 
            FROM evento_participante ep 
            WHERE ep.id_usuario = ${user.id}
          )
          OR (e.es_privado = false)
        )
    `

    if (!evento) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(evento)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Actualizar un evento
export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasUpdatePermission = await hasPermission("escritura")

    if (!hasUpdatePermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    // Verificar que el evento existe y que el usuario es el propietario
    const [eventoExistente] = await sql`
      SELECT id, id_propietario FROM evento WHERE id = ${id}
    `

    if (!eventoExistente) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Verificar permiso para actualizar (solo el propietario o un administrador)
    if (eventoExistente.id_propietario !== user.id) {
      const isAdmin = user.rol?.nombre === "administrador"

      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const eventData = await request.json()

    // Actualizar el evento
    const [updatedEvent] = await sql`
      UPDATE evento
      SET 
        titulo = COALESCE(${eventData.titulo}, titulo),
        descripcion = ${eventData.descripcion || null},
        tipo = COALESCE(${eventData.tipo}, tipo),
        fecha_inicio = COALESCE(${eventData.fecha_inicio}, fecha_inicio),
        fecha_fin = COALESCE(${eventData.fecha_fin}, fecha_fin),
        es_todo_el_dia = COALESCE(${eventData.es_todo_el_dia}, es_todo_el_dia),
        ubicacion = ${eventData.ubicacion || null},
        url_videollamada = ${eventData.url_videollamada || null},
        color = ${eventData.color || null},
        estado = COALESCE(${eventData.estado}, estado),
        recordatorio = ${eventData.recordatorio || null},
        notas = ${eventData.notas || null},
        id_cliente = ${eventData.id_cliente || null},
        id_lead = ${eventData.id_lead || null},
        id_oportunidad = ${eventData.id_oportunidad || null},
        id_proveedor = ${eventData.id_proveedor || null},
        id_llamada = ${eventData.id_llamada || null},
        es_privado = COALESCE(${eventData.es_privado}, es_privado),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Eliminar un evento
export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasDeletePermission = await hasPermission("escritura")

    if (!hasDeletePermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    // Verificar que el evento existe y que el usuario es el propietario
    const [eventoExistente] = await sql`
      SELECT id, id_propietario FROM evento WHERE id = ${id}
    `

    if (!eventoExistente) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Verificar permiso para eliminar (solo el propietario o un administrador)
    if (eventoExistente.id_propietario !== user.id) {
      const isAdmin = user.rol?.nombre === "administrador"

      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Eliminar los participantes del evento primero (debido a la restricción de clave externa)
    await sql`
      DELETE FROM evento_participante
      WHERE id_evento = ${id}
    `

    // Eliminar el evento
    await sql`
      DELETE FROM evento
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
