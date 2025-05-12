import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una fecha en formato ISO a un formato legible
 * @param dateString Fecha en formato ISO
 * @param formatStr Formato de fecha (opcional)
 * @returns Fecha formateada
 */
export function formatDate(dateString: string, formatStr = "dd 'de' MMMM 'de' yyyy"): string {
  if (!dateString) return "";
  
  try {
    const date = parseISO(dateString);
    return format(date, formatStr, { locale: es });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}
