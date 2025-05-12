import { neon } from "@neondatabase/serverless"
import type { NeonQueryFunction as QueryFunction } from "@neondatabase/serverless"

// Usar la URL de la base de datos directamente desde el esquema de Prisma
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@hostybee.com:53998/clerkcrm"

// Crear un cliente SQL con la cadena de conexión y manejo de errores
let sql: QueryFunction<any, any>

try {
  console.log("Conectando a la base de datos con URL:", DATABASE_URL.replace(/:[^:]*@/, ':****@')) // Ocultar la contraseña en los logs
  sql = neon(DATABASE_URL)
} catch (error) {
  console.error("Error al configurar la conexión a la base de datos:", error)
  
  // Crear un proxy seguro que implementa la interfaz QueryFunction
  const fallbackHandler: any = () => Promise.resolve([]) as Promise<any[]>
  fallbackHandler.transaction = () => {
    return {
      query: () => Promise.resolve([]),
      execute: () => Promise.resolve({})
    }
  }
  
  sql = fallbackHandler as unknown as QueryFunction<any, any>
}

export { sql }

// Helper function to format dates for SQL queries
export function formatDateForSQL(date: Date | null | undefined): string | null {
  if (!date) return null
  return date.toISOString().split("T")[0]
}

// Helper function to handle null values in SQL queries
export function sqlValue(value: any): any {
  if (value === undefined || value === null) {
    return null
  }
  return value
}
