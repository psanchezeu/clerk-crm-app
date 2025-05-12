import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserWithRole } from "@/lib/auth-utils"

/**
 * Obtener una configuración específica del usuario
 */
export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria') || 'general';
    const clave = searchParams.get('clave');

    let consulta: any = {
      where: {
        id_usuario: user.id,
        categoria: categoria
      }
    };

    // Si se proporciona una clave específica, filtrar por ella
    if (clave) {
      consulta.where.clave = clave;
    }

    // Buscar configuraciones
    const configuraciones = await prisma.configuracion.findMany(consulta);

    // Formatear la respuesta
    const resultado: Record<string, any> = {};
    configuraciones.forEach((config: { clave: string; valor: any }) => {
      resultado[config.clave] = config.valor;
    });

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error al obtener configuraciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * Guardar una configuración para el usuario
 */
export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener datos del cuerpo de la petición
    const data = await request.json();
    const { clave, valor, categoria = 'general' } = data;

    if (!clave || valor === undefined) {
      return NextResponse.json(
        { error: "La clave y el valor son obligatorios" },
        { status: 400 }
      );
    }

    // Buscar si la configuración ya existe
    const configuracionExistente = await prisma.configuracion.findFirst({
      where: {
        id_usuario: user.id,
        clave: clave
      }
    });

    let configuracion;

    // Si existe, actualizar
    if (configuracionExistente) {
      configuracion = await prisma.configuracion.update({
        where: {
          id: configuracionExistente.id
        },
        data: {
          valor: valor,
          categoria: categoria,
          updated_at: new Date()
        }
      });
    } else {
      // Si no existe, crear nuevo
      configuracion = await prisma.configuracion.create({
        data: {
          id_usuario: user.id,
          clave: clave,
          valor: valor,
          categoria: categoria
        }
      });
    }

    return NextResponse.json(configuracion);
  } catch (error) {
    console.error("Error al guardar configuración:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * Eliminar una configuración
 */
export async function DELETE(request: Request) {
  try {
    // Verificar autenticación
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const clave = searchParams.get('clave');

    if (!clave) {
      return NextResponse.json(
        { error: "La clave es obligatoria" },
        { status: 400 }
      );
    }

    // Eliminar la configuración
    await prisma.configuracion.deleteMany({
      where: {
        id_usuario: user.id,
        clave: clave
      }
    });

    return NextResponse.json({
      message: "Configuración eliminada correctamente"
    });
  } catch (error) {
    console.error("Error al eliminar configuración:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
