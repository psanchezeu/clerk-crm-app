import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserWithRole } from "@/lib/auth-utils"

/**
 * Obtener los datos de facturación del usuario actual
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

    // Buscar los datos de facturación existentes
    const datosFacturacion = await prisma.datoFacturacion.findFirst({
      where: {
        id_usuario: user.id
      }
    });

    // Si no existen, retornamos un objeto vacío
    if (!datosFacturacion) {
      return NextResponse.json({
        id_usuario: user.id,
        nombre_facturacion: "",
        cif_nif: "",
        direccion_facturacion: "",
        ciudad_facturacion: "",
        cp_facturacion: "",
        pais_facturacion: "España",
        email_facturacion: "",
        metodo_pago: "tarjeta"
      });
    }

    return NextResponse.json(datosFacturacion);
  } catch (error) {
    console.error("Error al obtener datos de facturación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * Crear o actualizar los datos de facturación del usuario
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

    // Validar campos obligatorios
    const camposObligatorios = [
      'nombre_facturacion',
      'cif_nif',
      'direccion_facturacion',
      'ciudad_facturacion',
      'cp_facturacion',
      'pais_facturacion'
    ];

    for (const campo of camposObligatorios) {
      if (!data[campo]) {
        return NextResponse.json(
          { error: `El campo ${campo} es obligatorio` },
          { status: 400 }
        );
      }
    }

    // Buscar datos de facturación existentes
    const datosExistentes = await prisma.datoFacturacion.findFirst({
      where: {
        id_usuario: user.id
      }
    });

    let datoFacturacion;
    
    // Si existen, actualizar
    if (datosExistentes) {
      datoFacturacion = await prisma.datoFacturacion.update({
        where: {
          id: datosExistentes.id
        },
        data: {
          nombre_facturacion: data.nombre_facturacion,
          cif_nif: data.cif_nif,
          direccion_facturacion: data.direccion_facturacion,
          ciudad_facturacion: data.ciudad_facturacion,
          cp_facturacion: data.cp_facturacion,
          pais_facturacion: data.pais_facturacion,
          email_facturacion: data.email_facturacion,
          metodo_pago: data.metodo_pago || "tarjeta",
          updated_at: new Date()
        }
      });
    } else {
      // Si no existen, crear nuevos
      datoFacturacion = await prisma.datoFacturacion.create({
        data: {
          id_usuario: user.id,
          nombre_facturacion: data.nombre_facturacion,
          cif_nif: data.cif_nif,
          direccion_facturacion: data.direccion_facturacion,
          ciudad_facturacion: data.ciudad_facturacion,
          cp_facturacion: data.cp_facturacion,
          pais_facturacion: data.pais_facturacion,
          email_facturacion: data.email_facturacion || "",
          metodo_pago: data.metodo_pago || "tarjeta"
        }
      });
    }

    return NextResponse.json(datoFacturacion);
  } catch (error) {
    console.error("Error al guardar datos de facturación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
