import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUserWithRole, hasPermission } from "@/lib/auth-utils"

// Obtener todos los proveedores de telefonía
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
      // Comprobar si la tabla 'proveedor_telefonia' existe
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'proveedor_telefonia'
        ) as exists
      ` as { exists: boolean }[]
      
      // Si la tabla no existe, devolver un array vacío para evitar errores en el cliente
      if (tableCheck.length === 0 || !tableCheck[0]?.exists) {
        console.warn("La tabla 'proveedor_telefonia' no existe aún en la base de datos")
        return NextResponse.json([])
      }

      // Verificar si el usuario es administrador o tiene permisos especiales
      const isAdmin = user.rol_nombre === "administrador"
      let providerResults;
      
      if (isAdmin) {
        // Los administradores pueden ver todos los proveedores
        providerResults = await sql`
          SELECT id, nombre, tipo, api_url, activo, created_at, updated_at
          FROM proveedor_telefonia
          ORDER BY nombre
        `;
      } else {
        // Los usuarios normales solo ven los proveedores activos
        providerResults = await sql`
          SELECT id, nombre, tipo, api_url, activo, created_at, updated_at
          FROM proveedor_telefonia
          WHERE activo = true
          ORDER BY nombre
        `;
      }

      return NextResponse.json(providerResults);
    } catch (dbError) {
      console.error("Error de base de datos:", dbError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Error fetching telephony providers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Crear un nuevo proveedor de telefonía
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

    try {
      // Comprobar si la tabla 'proveedor_telefonia' existe
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'proveedor_telefonia'
        ) as exists
      ` as { exists: boolean }[]
      
      // Si la tabla no existe, devolver un error para que el cliente lo maneje
      if (tableCheck.length === 0 || !tableCheck[0]?.exists) {
        console.warn("La tabla 'proveedor_telefonia' no existe aún en la base de datos")
        return NextResponse.json({ error: "Tabla no encontrada" }, { status: 404 })
      }

      const { nombre, tipo, api_url, api_key, api_secret, activo } = await request.json()

      // Validar datos requeridos
      if (!nombre || !tipo || !api_url) {
        return NextResponse.json(
          { error: "Nombre, tipo y URL de API son obligatorios" },
          { status: 400 }
        )
      }

      // Crear nuevo proveedor
      const result = await sql`
        INSERT INTO proveedor_telefonia (
          nombre, tipo, api_url, api_key, api_secret, activo, id_usuario
        ) VALUES (
          ${nombre}, ${tipo}, ${api_url}, ${api_key || null}, ${api_secret || null}, ${activo || false}, ${user.id}
        )
        RETURNING id, nombre, tipo, api_url, activo, created_at, updated_at
      `

      return NextResponse.json(result[0])
    } catch (dbError) {
      console.error("Error de base de datos:", dbError);
      return NextResponse.json({ error: "Error de base de datos" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error creating telephony provider:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
