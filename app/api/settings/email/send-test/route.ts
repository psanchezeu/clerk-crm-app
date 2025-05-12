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
    const requiredFields = ["smtpServer", "smtpPort", "smtpUser", "emailFrom"];
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

    // Configurar correo de prueba
    const mailOptions = {
      from: data.emailFrom,
      to: user.email, // Enviar al correo del usuario actual
      subject: "Correo de prueba - CRM",
      replyTo: data.emailReplyTo || data.emailFrom,
      text: `Este es un correo de prueba enviado desde tu CRM.
      
Configuración utilizada:
- Servidor: ${data.smtpServer}
- Puerto: ${data.smtpPort}
- Usuario: ${data.smtpUser}
- Seguro: ${data.smtpSecure ? 'Sí' : 'No'}

Si estás recibiendo este correo, significa que tu configuración SMTP funciona correctamente.

Fecha y hora: ${new Date().toLocaleString()}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Correo de prueba - CRM</h2>
        <p>Este es un correo de prueba enviado desde tu CRM.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Configuración utilizada:</h3>
          <ul>
            <li><strong>Servidor:</strong> ${data.smtpServer}</li>
            <li><strong>Puerto:</strong> ${data.smtpPort}</li>
            <li><strong>Usuario:</strong> ${data.smtpUser}</li>
            <li><strong>Seguro:</strong> ${data.smtpSecure ? 'Sí' : 'No'}</li>
          </ul>
        </div>
        
        <p>Si estás recibiendo este correo, significa que tu configuración SMTP funciona correctamente.</p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Fecha y hora: ${new Date().toLocaleString()}
        </p>
      </div>
      `
    };

    // Enviar correo
    try {
      const info = await transporter.sendMail(mailOptions);
      return NextResponse.json({ 
        success: true, 
        message: "Correo de prueba enviado correctamente",
        messageId: info.messageId
      });
    } catch (error: any) {
      console.error("Error al enviar correo de prueba:", error);
      return NextResponse.json(
        { 
          error: `No se pudo enviar el correo de prueba: ${error.message || "Error desconocido"}`,
          details: error.message 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error al enviar correo de prueba:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
