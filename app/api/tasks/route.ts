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
    const assignedTo = searchParams.get("assignedTo") || ""

    const offset = (page - 1) * limit

    // Construir la consulta con Prisma
    let whereClause: any = {}
    
    // Si el usuario no es administrador, solo mostramos sus tareas 
    if (user.rol_nombre !== "Administrador") {
      whereClause.id_propietario = user.id
    }

    // Añadir filtros adicionales solo si existen
    if (status) {
      whereClause.estado = status
    }

    // Añadir filtro por usuario asignado si existe
    if (assignedTo) {
      whereClause.id_propietario = parseInt(assignedTo)
    }

    // Añadir búsqueda de texto si existe
    if (search && search.trim() !== "") {
      whereClause = {
        ...whereClause,
        OR: [
          { titulo: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    console.log('DEBUG - Query Prisma:', JSON.stringify(whereClause));

    try {
      // Test de conexión a la base de datos
      console.log('DEBUG - Probando conexión a la base de datos...');
      const allTasksCount = await prisma.tarea.count();
      console.log('DEBUG - Total de tareas en la base de datos:', allTasksCount);
      
      if (allTasksCount === 0) {
        // Si no hay tareas, crear algunas de prueba
        console.log('DEBUG - No hay tareas, creando datos de prueba...');
        try {
          await prisma.tarea.create({
            data: {
              titulo: 'Tarea de prueba 1',
              descripcion: 'Esta es una tarea de prueba',
              estado: 'Pendiente',
              id_propietario: user.id,
            }
          });
          console.log('DEBUG - Tarea de prueba creada con éxito');
        } catch (createError) {
          console.error('DEBUG - Error al crear tarea de prueba:', createError);
        }
      }
      
      // Obtener todas las tareas sin filtro para depuración
      const simpleTasks = await prisma.tarea.findMany({ take: 5 });
      console.log('DEBUG - Muestra de tareas:', JSON.stringify(simpleTasks, null, 2));
      
      // Obtener el total de tareas con filtros
      const totalFiltered = await prisma.tarea.count({
        where: whereClause
      });
      console.log('DEBUG - Total de tareas filtradas:', totalFiltered);
      
      // Obtener las tareas con paginación
      const tasks = await prisma.tarea.findMany({
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
          },
          oportunidad: {
            select: {
              nombre: true
            }
          }
        },
        orderBy: [
          {
            fecha_vencimiento: 'asc'
          },
          {
            created_at: 'desc'
          }
        ],
        skip: offset,
        take: limit
      });
      
      console.log(`DEBUG - Se encontraron ${tasks.length} tareas filtradas de un total de ${totalFiltered}`);
      
      return NextResponse.json({
        data: tasks,
        pagination: {
          total: totalFiltered,
          page,
          limit,
          totalPages: Math.ceil(totalFiltered / limit),
        },
      });
    } catch (dbError) {
      console.error('DEBUG - Error en consulta de base de datos:', dbError);
      
      // Handle different error types safely
      const errorMessage = dbError instanceof Error 
        ? dbError.message 
        : 'Unknown database error';
      
      return NextResponse.json({ 
        error: "Database Error", 
        details: errorMessage,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error general en GET tasks:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      }
    }, { status: 500 });
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
      titulo,
      descripcion,
      estado = "Pendiente",
      prioridad = "media",
      fecha_vencimiento,
      id_oportunidad,
      id_cliente,
      id_lead
    } = body

    if (!titulo) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const newTask = await prisma.tarea.create({
      data: {
        titulo,
        descripcion: descripcion || null,
        estado,
        fecha_vencimiento: fecha_vencimiento ? new Date(fecha_vencimiento) : null,
        id_propietario: user.id,
        id_oportunidad: id_oportunidad || null,
        id_cliente: id_cliente || null,
        id_lead: id_lead || null
      }
    })

    return NextResponse.json(newTask, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
