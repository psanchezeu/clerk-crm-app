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
    const status = searchParams.get("status") || ""

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
    
    // Verificar si hay datos en la tabla oportunidades
    const opportunityCount = await prisma.oportunidad.count();
    console.log('Total de oportunidades en la base de datos:', opportunityCount);
    
    // Si no hay datos, crear algunos de prueba
    if (opportunityCount === 0) {
      try {
        console.log('Creando oportunidad de prueba...');
        await prisma.oportunidad.create({
          data: {
            nombre: 'Proyecto de implementación CRM',
            valor: 15000,
            etapa: 'Propuesta',
            fecha_cierre: new Date('2025-06-30'),
            id_propietario: user.id,
            es_privado: false,
          }
        });
        console.log('Oportunidad de prueba creada con éxito');
      } catch (createError) {
        console.error('Error al crear oportunidad de prueba:', createError);
      }
    }

    // Añadir búsqueda si existe
    if (search) {
      whereClause.OR.push(
        { nombre: { contains: search, mode: 'insensitive' } }
      )
    }

    // Añadir filtro por estado si existe
    if (status) {
      whereClause.etapa = status
    }

    // Obtener el total de oportunidades
    const total = await prisma.oportunidad.count({
      where: whereClause
    })

    // Obtener las oportunidades con paginación
    const opportunities = await prisma.oportunidad.findMany({
      where: whereClause,
      include: {
        propietario: {
          select: {
            nombre: true
          }
        },
        cliente: {
          select: {
            nombre_empresa: true
          }
        },
        lead: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        fecha_cierre: 'asc'
      },
      skip: offset,
      take: limit
    })

    return NextResponse.json({
      data: opportunities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching opportunities:", error)
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

    const {
      nombre,
      etapa = "Prospección",
      valor,
      fecha_cierre,
      id_cliente,
      id_lead,
      es_privado = false,
    } = body

    if (!nombre) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const newOpportunity = await prisma.oportunidad.create({
      data: {
        nombre,
        etapa,
        valor: valor || null,
        fecha_cierre: fecha_cierre ? new Date(fecha_cierre) : null,
        id_cliente: id_cliente || null,
        id_lead: id_lead || null,
        id_propietario: user.id,
        es_privado
      }
    })

    return NextResponse.json(newOpportunity, { status: 201 })
  } catch (error) {
    console.error("Error creating opportunity:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}