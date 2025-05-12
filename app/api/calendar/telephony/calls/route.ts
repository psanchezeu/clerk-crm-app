import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUserWithRole, hasPermission } from "@/lib/auth-utils"

// Obtener todas las llamadas telefónicas
export async function GET(request: Request) {
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
      // Comprobar si la tabla 'llamada_telefonica' existe
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'llamada_telefonica'
        ) as exists
      ` as { exists: boolean }[]
      
      // Si la tabla no existe, retornar un array vacío para evitar errores en el cliente
      if (tableCheck.length === 0 || !tableCheck[0]?.exists) {
        console.warn("La tabla 'llamada_telefonica' no existe aún en la base de datos")
        return NextResponse.json([])
      }

      // Obtener parámetros de filtrado de la URL
      const { searchParams } = new URL(request.url)
      const startDate = searchParams.get("start_date")
      const endDate = searchParams.get("end_date")
      const providerId = searchParams.get("provider_id")
      const clientId = searchParams.get("client_id")
      const leadId = searchParams.get("lead_id")
      const opportunityId = searchParams.get("opportunity_id")
      const status = searchParams.get("status")
      const type = searchParams.get("type")
      
      // Construir la consulta SQL con filtros opcionales
      let filterConditions: string[] = []
      let filterParams: any[] = []
      
      if (startDate) {
        filterConditions.push(`lt.fecha_inicio >= $${filterParams.length + 1}`)
        filterParams.push(new Date(startDate))
      }
      
      if (endDate) {
        filterConditions.push(`lt.fecha_inicio <= $${filterParams.length + 1}`)
        filterParams.push(new Date(endDate))
      }
      
      if (providerId) {
        filterConditions.push(`lt.id_proveedor = $${filterParams.length + 1}`)
        filterParams.push(parseInt(providerId))
      }
      
      if (clientId) {
        filterConditions.push(`lt.id_cliente = $${filterParams.length + 1}`)
        filterParams.push(parseInt(clientId))
      }
      
      if (leadId) {
        filterConditions.push(`lt.id_lead = $${filterParams.length + 1}`)
        filterParams.push(parseInt(leadId))
      }
      
      if (opportunityId) {
        filterConditions.push(`lt.id_oportunidad = $${filterParams.length + 1}`)
        filterParams.push(parseInt(opportunityId))
      }
      
      if (status) {
        filterConditions.push(`lt.estado = $${filterParams.length + 1}`)
        filterParams.push(status)
      }
      
      if (type) {
        filterConditions.push(`lt.tipo = $${filterParams.length + 1}`)
        filterParams.push(type)
      }
      
      // Siempre filtrar por usuario autenticado (a menos que sea administrador)
      const isAdmin = user.rol_nombre === "administrador"
      if (!isAdmin) {
        filterConditions.push(`lt.id_usuario = ${user.id}`)
      }
      
      // Crear la consulta combinando los filtros
      const filterSQL = filterConditions.length 
        ? `WHERE ${filterConditions.join(" AND ")}`
        : ""
      
      // Ejecutar la consulta con el filtro adecuado
      let calls: any[] = [];
      
      if (filterConditions.length > 0) {
        // Para consultas con condiciones WHERE personalizadas
        // debemos construir la consulta de manera diferente
        const query = `
          SELECT lt.*,
                 p.nombre as proveedor_nombre,
                 u.nombre as usuario_nombre,
                 c.nombre_empresa as cliente_nombre,
                 l.nombre as lead_nombre,
                 o.nombre as oportunidad_nombre
          FROM llamada_telefonica lt
          LEFT JOIN proveedor_telefonia p ON lt.id_proveedor = p.id
          LEFT JOIN usuario u ON lt.id_usuario = u.id
          LEFT JOIN cliente c ON lt.id_cliente = c.id
          LEFT JOIN lead l ON lt.id_lead = l.id
          LEFT JOIN oportunidad o ON lt.id_oportunidad = o.id
          ${filterSQL}
          ORDER BY lt.fecha_inicio DESC
          LIMIT 100
        `;
        calls = await sql.query(query);
      } else {
        // Sin condiciones WHERE personalizadas podemos usar template strings
        calls = await sql`
          SELECT lt.*,
                 p.nombre as proveedor_nombre,
                 u.nombre as usuario_nombre,
                 c.nombre_empresa as cliente_nombre,
                 l.nombre as lead_nombre,
                 o.nombre as oportunidad_nombre
          FROM llamada_telefonica lt
          LEFT JOIN proveedor_telefonia p ON lt.id_proveedor = p.id
          LEFT JOIN usuario u ON lt.id_usuario = u.id
          LEFT JOIN cliente c ON lt.id_cliente = c.id
          LEFT JOIN lead l ON lt.id_lead = l.id
          LEFT JOIN oportunidad o ON lt.id_oportunidad = o.id
          ORDER BY lt.fecha_inicio DESC
          LIMIT 100
        `;
      }

      return NextResponse.json(calls)
    } catch (dbError) {
      // Si hay un error específico de la base de datos (como tabla no encontrada)
      console.error("Error de base de datos:", dbError)
      return NextResponse.json([])
    }
  } catch (error) {
    console.error("Error fetching calls:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Registrar una nueva llamada telefónica
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

    const callData = await request.json()

    // Validar datos mínimos
    if (!callData.id_proveedor || !callData.numero_origen || !callData.numero_destino || !callData.fecha_inicio || !callData.tipo || !callData.estado) {
      return NextResponse.json(
        { error: "Missing required fields: provider_id, origin_number, destination_number, start_date, type, status" },
        { status: 400 }
      )
    }

    // Crear el registro de llamada
    const [newCall] = await sql`
      INSERT INTO llamada_telefonica (
        id_proveedor,
        id_usuario,
        numero_origen,
        numero_destino,
        fecha_inicio,
        fecha_fin,
        duracion_segundos,
        estado,
        tipo,
        id_cliente,
        id_lead,
        id_oportunidad,
        grabacion_url,
        notas,
        metadatos
      ) VALUES (
        ${callData.id_proveedor},
        ${user.id},
        ${callData.numero_origen},
        ${callData.numero_destino},
        ${callData.fecha_inicio},
        ${callData.fecha_fin || null},
        ${callData.duracion_segundos || null},
        ${callData.estado},
        ${callData.tipo},
        ${callData.id_cliente || null},
        ${callData.id_lead || null},
        ${callData.id_oportunidad || null},
        ${callData.grabacion_url || null},
        ${callData.notas || null},
        ${callData.metadatos ? JSON.stringify(callData.metadatos) : null}
      )
      RETURNING *
    `

    // Si es una llamada completada, crear automáticamente un evento en el calendario
    if (callData.estado === 'completada' && callData.duracion_segundos) {
      const fechaInicio = new Date(callData.fecha_inicio)
      const fechaFin = callData.fecha_fin 
        ? new Date(callData.fecha_fin) 
        : new Date(fechaInicio.getTime() + (callData.duracion_segundos * 1000))
      
      // Crear evento asociado a la llamada
      await sql`
        INSERT INTO evento (
          titulo,
          descripcion,
          tipo,
          fecha_inicio,
          fecha_fin,
          es_todo_el_dia,
          estado,
          id_propietario,
          id_cliente,
          id_lead,
          id_oportunidad,
          id_proveedor,
          id_llamada,
          es_privado
        ) VALUES (
          ${`Llamada ${callData.tipo === 'entrante' ? 'recibida de' : 'realizada a'} ${callData.numero_destino}`},
          ${callData.notas || null},
          'llamada',
          ${fechaInicio},
          ${fechaFin},
          false,
          'completado',
          ${user.id},
          ${callData.id_cliente || null},
          ${callData.id_lead || null},
          ${callData.id_oportunidad || null},
          ${callData.id_proveedor},
          ${newCall.id},
          false
        )
      `
    }

    return NextResponse.json(newCall)
  } catch (error) {
    console.error("Error creating call record:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
