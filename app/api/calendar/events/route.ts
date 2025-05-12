import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUserWithRole, hasPermission } from "@/lib/auth-utils"

export async function GET() {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasViewPermission = await hasPermission("lectura")

    if (!hasViewPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
      // Comprobar si la tabla 'evento' existe
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'evento'
        ) as exists
      ` as { exists: boolean }[]
      
      // Si la tabla no existe, retornar un array vacío para evitar errores en el cliente
      if (tableCheck.length === 0 || !tableCheck[0]?.exists) {
        console.warn("La tabla 'evento' no existe aún en la base de datos")
        return NextResponse.json([])
      }
      
      // Obtener eventos del usuario
      // En este punto, simplemente retornaremos un array vacío
      // hasta que las tablas estén correctamente creadas
      // Esto evitará errores en la interfaz de usuario
      const eventos: any[] = [];

      return NextResponse.json(eventos)
    } catch (dbError) {
      // Si hay un error específico de la base de datos (como tabla no encontrada)
      console.error("Error de base de datos:", dbError)
      return NextResponse.json([])
    }
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasCreatePermission = await hasPermission("escritura")

    if (!hasCreatePermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const eventData = await request.json()

    // Validar datos mínimos
    if (!eventData.titulo || !eventData.tipo || !eventData.fecha_inicio || !eventData.fecha_fin) {
      return NextResponse.json(
        { error: "Missing required fields: title, type, start date, end date" },
        { status: 400 }
      )
    }

    // Crear el evento
    const [newEvent] = await sql`
      INSERT INTO evento (
        titulo, 
        descripcion, 
        tipo, 
        fecha_inicio, 
        fecha_fin, 
        es_todo_el_dia, 
        ubicacion, 
        url_videollamada, 
        color,
        estado, 
        recordatorio, 
        notas, 
        id_propietario, 
        id_cliente, 
        id_lead, 
        id_oportunidad, 
        id_proveedor,
        es_privado
      ) VALUES (
        ${eventData.titulo}, 
        ${eventData.descripcion || null}, 
        ${eventData.tipo}, 
        ${eventData.fecha_inicio}, 
        ${eventData.fecha_fin}, 
        ${eventData.es_todo_el_dia || false}, 
        ${eventData.ubicacion || null}, 
        ${eventData.url_videollamada || null}, 
        ${eventData.color || null},
        ${eventData.estado || 'programado'}, 
        ${eventData.recordatorio || null}, 
        ${eventData.notas || null}, 
        ${user.id}, 
        ${eventData.id_cliente || null}, 
        ${eventData.id_lead || null}, 
        ${eventData.id_oportunidad || null}, 
        ${eventData.id_proveedor || null},
        ${eventData.es_privado || false}
      )
      RETURNING *
    `

    return NextResponse.json(newEvent)
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
