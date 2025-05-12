import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma-client"
import { getCurrentUserWithRole, hasPermission } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    // Usar getCurrentUserWithRole con await para evitar errores con headers()
    const user = await getCurrentUserWithRole()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasViewPermission = await hasPermission("lectura")

    if (!hasViewPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    const offset = (page - 1) * limit

    // Construir la consulta con Prisma
    let whereClause: any = {}
    
    // Si el usuario no es administrador, aplicamos filtros adicionales
    if (user.rol_nombre !== "Administrador") {
      whereClause.OR = [
        { es_privado: false },
        { id_propietario: user.id }
      ]
    }
    
    // Verificar si hay datos en la tabla leads
    const leadCount = await prisma.lead.count();
    console.log('Total de leads en la base de datos:', leadCount);
    
    // Si no hay datos, crear algunos de prueba
    if (leadCount === 0) {
      try {
        console.log('Creando leads de prueba...');
        await prisma.lead.create({
          data: {
            nombre: 'Juan Pérez',
            email: 'juan.perez@example.com',
            telefono: '+34 612 345 678',
            empresa: 'Empresa Nueva S.L.',
            origen: 'Formulario Web',
            estado: 'Nuevo',
            id_propietario: user.id,
            es_privado: false,
          }
        });
        console.log('Lead de prueba creado con éxito');
      } catch (createError) {
        console.error('Error al crear lead de prueba:', createError);
      }
    }

    // Añadir búsqueda si existe
    if (search) {
      whereClause.OR.push(
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { origen: { contains: search, mode: 'insensitive' } }
      )
    }

    // Obtener el total de leads
    const total = await prisma.lead.count({
      where: whereClause
    })

    // Obtener los leads con paginación
    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        propietario: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip: offset,
      take: limit
    })

    return NextResponse.json({
      data: leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching leads:", error)
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

    const body = await request.json()

    const { nombre, email, telefono, origen, id_campaña, es_privado = false } = body

    if (!nombre) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const newLead = await prisma.lead.create({
      data: {
        nombre,
        email: email || null,
        telefono: telefono || null,
        origen: origen || null,
        empresa: null,
        estado: "Nuevo",
        id_propietario: user.id,
        es_privado
      }
    })

    return NextResponse.json(newLead, { status: 201 })
  } catch (error) {
    console.error("Error creating lead:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
