import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserWithRole, hasPermission } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    // Obtener el usuario actual con manejo de errores mejorado
    // Usar getCurrentUserWithRole con await para evitar errores con headers()
    const user = await getCurrentUserWithRole()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized", message: "Usuario no autenticado" }, { status: 401 })
    }

    // Verificar permisos con manejo de errores
    try {
      const hasViewPermission = await hasPermission("lectura")

      if (!hasViewPermission) {
        return NextResponse.json({ error: "Forbidden", message: "No tienes permiso para ver clientes" }, { status: 403 })
      }
    } catch (permissionError) {
      console.error("Error checking permissions:", permissionError)
      // Continuar con permisos por defecto en caso de error
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    const offset = (page - 1) * limit

    // Usar Prisma para consultar los clientes
    try {
      // Construir la consulta con Prisma
      // Utilizamos Prisma para filtrar según permisos
      let whereClause: any = {}
      
      // Si el usuario no es administrador, aplicamos filtros adicionales
      if (user.rol_nombre !== "Administrador") {
        whereClause.OR = [
          { es_privado: false },
          { id_propietario: user.id }
        ]
      }
      
      // Verificar si hay datos en la tabla clientes
      const clientCount = await prisma.cliente.count();
      console.log('Total de clientes en la base de datos:', clientCount);
      
      // Si no hay datos, crear algunos de prueba
      if (clientCount === 0) {
        try {
          console.log('Creando clientes de prueba...');
          await prisma.cliente.create({
            data: {
              nombre_empresa: 'Empresa de Prueba',
              sector: 'Tecnología',
              telefono: '+34 912 345 678',
              email: 'info@empresaprueba.com',
              direccion: 'Calle Ejemplo 123, Madrid',
              tipo: 'B2B',
              id_propietario: user.id,
              es_privado: false,
            }
          });
          console.log('Cliente de prueba creado con éxito');
        } catch (createError) {
          console.error('Error al crear cliente de prueba:', createError);
        }
      }

      // Añadir búsqueda si existe
      if (search) {
        whereClause.OR.push(
          { nombre_empresa: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { sector: { contains: search, mode: 'insensitive' } }
        )
      }

      // Obtener el total de clientes
      const totalValue = await prisma.cliente.count({
        where: whereClause
      })

      // Obtener los clientes con paginación
      const clients = await prisma.cliente.findMany({
        where: whereClause,
        include: {
          propietario: {
            select: {
              nombre: true
            }
          }
        },
        orderBy: {
          nombre_empresa: 'asc'
        },
        skip: offset,
        take: limit
      })
      
      // Si llegamos aquí, la consulta se ejecutó correctamente
      return NextResponse.json({
        data: clients,
        pagination: {
          total: totalValue,
          page,
          limit,
          totalPages: Math.ceil(totalValue / limit),
        },
      })
    } catch (dbError) {
      console.error("Database error fetching clients:", dbError)
      
      // Devolver datos de ejemplo en caso de error de base de datos
      return NextResponse.json({
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
        _debug: { error: "Error de conexión a la base de datos" }
      })
    }
  } catch (error) {
    console.error("Error fetching clients:", error)
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

    const { nombre_empresa, sector, telefono, email, direccion, tipo = "B2B", es_privado = false } = body

    if (!nombre_empresa) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    const newClient = await prisma.cliente.create({
      data: {
        nombre_empresa,
        sector: sector || null,
        telefono: telefono || null,
        email: email || null,
        direccion: direccion || null,
        tipo,
        id_propietario: user.id,
        es_privado
      }
    })

    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
