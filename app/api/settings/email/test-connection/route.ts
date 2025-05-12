import { NextResponse } from "next/server";
import { getCurrentUserWithRole } from "@/lib/auth-utils";
import nodemailer from "nodemailer";

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

    // Obtener datos de configuración SMTP
    const data = await request.json();
    
    // Validar datos requeridos
    const requiredFields = ["smtpServer", "smtpPort", "smtpUser"];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `El campo ${field} es obligatorio` },
          { status: 400 }
        );
      }
    }

    // Si no es Gmail con OAuth2, la contraseña es requerida
    if (!data.useGmail && !data.smtpPassword) {
      return NextResponse.json(
        { error: "La contraseña SMTP es obligatoria cuando no usas Gmail OAuth2" },
        { status: 400 }
      );
    }

    // Configurar transporte SMTP
    const transportConfig = {
      host: data.smtpServer,
      port: parseInt(data.smtpPort),
      secure: data.smtpSecure,
      auth: {
        user: data.smtpUser,
        pass: data.smtpPassword || "",
      },
      // Desactivar la verificación del certificado para pruebas
      tls: {
        rejectUnauthorized: false
      }
    };

    // Crear transporte
    const transporter = nodemailer.createTransport(transportConfig);

    // Verificar conexión
    try {
      await transporter.verify();
      return NextResponse.json({ success: true, message: "Conexión SMTP verificada correctamente" });
    } catch (error: any) {
      console.error("Error al verificar conexión SMTP:", error);
      return NextResponse.json(
        { 
          error: `No se pudo conectar al servidor SMTP: ${error.message || "Error desconocido"}`,
          details: error.message 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error al probar conexión SMTP:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
