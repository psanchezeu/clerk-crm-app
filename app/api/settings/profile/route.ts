import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserWithRole, hasPermission } from "@/lib/auth-utils"
import { headers } from "next/headers"

/**
 * Obtener el perfil del usuario actual
 */
export async function GET() {
  try {
    // Verificar autenticación
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Buscar el perfil existente
    const perfil = await prisma.perfilUsuario.findUnique({
      where: {
        id_usuario: user.id
      }
    });

    // Si no existe, retornamos un perfil vacío
    if (!perfil) {
      return NextResponse.json({
        id_usuario: user.id,
        apellidos: "",
        email_contacto: "",
        cargo: "",
        bio: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        codigo_postal: "",
        pais: "",
        avatar_url: ""
      });
    }

    return NextResponse.json(perfil);
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * Crear o actualizar el perfil del usuario
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

    // Buscar perfil existente
    const perfilExistente = await prisma.perfilUsuario.findUnique({
      where: {
        id_usuario: user.id
      }
    });

    let perfil;
    
    // Si existe, actualizar
    if (perfilExistente) {
      perfil = await prisma.perfilUsuario.update({
        where: {
          id: perfilExistente.id
        },
        data: {
          apellidos: data.apellidos,
          email_contacto: data.email_contacto,
          cargo: data.cargo,
          bio: data.bio,
          telefono: data.telefono,
          direccion: data.direccion,
          ciudad: data.ciudad,
          codigo_postal: data.codigo_postal,
          pais: data.pais,
          avatar_url: data.avatar_url,
          updated_at: new Date()
        }
      });
    } else {
      // Si no existe, crear nuevo
      perfil = await prisma.perfilUsuario.create({
        data: {
          id_usuario: user.id,
          apellidos: data.apellidos || "",
          email_contacto: data.email_contacto || "",
          cargo: data.cargo || "",
          bio: data.bio || "",
          telefono: data.telefono || "",
          direccion: data.direccion || "",
          ciudad: data.ciudad || "",
          codigo_postal: data.codigo_postal || "",
          pais: data.pais || "",
          avatar_url: data.avatar_url || ""
        }
      });
    }

    return NextResponse.json(perfil);
  } catch (error) {
    console.error("Error al guardar el perfil:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
