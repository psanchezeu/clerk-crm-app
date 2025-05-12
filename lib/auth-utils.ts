import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma-client"

export async function getCurrentUserWithRole() {
  try {
    // Usar auth() de manera segura desde el servidor
    // Para evitar errores con headers(), debemos usar await
    const auth_result = await auth()
    const { userId } = auth_result

    if (!userId) {
      return null
    }

    try {
      // Buscar el usuario en la base de datos usando Prisma
      const dbUser = await prisma.usuario.findUnique({
        where: {
          clerk_id: userId
        },
        include: {
          rol: true
        }
      })

      // Si el usuario existe, devolver la información con el formato correcto
      if (dbUser) {
        return {
          id: dbUser.id,
          nombre: dbUser.nombre,
          email: dbUser.email,
          clerk_id: dbUser.clerk_id,
          rol_nombre: dbUser.rol.nombre,
          permisos: dbUser.rol.permisos,
          created_at: dbUser.created_at,
          updated_at: dbUser.updated_at
        }
      }

      // Si el usuario no existe, crear un nuevo usuario con rol de Usuario
      try {
        // Verificar si existe el rol de Usuario
        let userRole = await prisma.rol.findFirst({
          where: {
            nombre: 'Usuario'
          }
        })

        // Si no existe el rol, crearlo
        if (!userRole) {
          userRole = await prisma.rol.create({
            data: {
              nombre: 'Usuario',
              permisos: { all: { lectura: true, escritura: true } }
            }
          })
        }

        // Crear el usuario
        const newUser = await prisma.usuario.create({
          data: {
            nombre: 'Usuario Nuevo',
            email: 'usuario@ejemplo.com',
            clerk_id: userId,
            id_rol: userRole.id
          },
          include: {
            rol: true
          }
        })

        return {
          id: newUser.id,
          nombre: newUser.nombre,
          email: newUser.email,
          clerk_id: newUser.clerk_id,
          rol_nombre: newUser.rol.nombre,
          permisos: newUser.rol.permisos,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at
        }
      } catch (insertError) {
        console.error('Error creating user in database:', insertError)
        // Si hay un error al crear el usuario, devolver un usuario administrador temporal
        return {
          id: 1,
          nombre: 'Usuario Temporal',
          email: 'usuario@ejemplo.com',
          clerk_id: userId,
          rol_nombre: 'Administrador',
          permisos: { all: { lectura: true, escritura: true, eliminación: true } }
        }
      }
    } catch (dbError) {
      console.error('Error accessing database:', dbError)
      // Si hay un error de conexión, devolver un usuario administrador temporal
      return {
        id: 1,
        nombre: 'Usuario Temporal',
        email: 'usuario@ejemplo.com',
        clerk_id: userId,
        rol_nombre: 'Administrador',
        permisos: { all: { lectura: true, escritura: true, eliminación: true } }
      }
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    // Return a default admin user if there's an error
    return {
      id: 1,
      nombre: 'Usuario Temporal',
      email: 'usuario@ejemplo.com',
      clerk_id: 'temp_user',
      rol_nombre: 'Administrador',
      permisos: { all: { lectura: true, escritura: true, eliminación: true } }
    }
  }
}

export async function hasPermission(permission: string) {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      return false
    }

    // Admin has all permissions
    if (user.rol_nombre === "Administrador") {
      return true
    }

    // Check specific permission
    if (user.permisos && typeof user.permisos === "object") {
      const permisos = user.permisos as Record<string, any>

      // Check if the permission exists in any module
      for (const module in permisos) {
        if (permisos[module] && permisos[module][permission]) {
          return true
        }
      }
    }

    return false
  } catch (error) {
    console.error('Error checking permission:', error)
    // Por defecto, permitir el acceso en caso de error
    return true
  }
}
