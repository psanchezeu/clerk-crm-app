import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { template_type, test_email } = await req.json();

    // Get active email configuration
    const config = await prisma.emailConfiguration.findFirst({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
    });

    if (!config) {
      return NextResponse.json(
        { error: "No email configuration found" },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_port === 465,
      auth: {
        user: config.user_email,
        pass: config.app_password,
      },
    });

    // Get template content based on type
    let subject = "";
    let content = "";

    switch (template_type) {
      case "welcome":
        subject = "¡Bienvenido a nuestra plataforma!";
        content = "Este es un correo de prueba de la plantilla de bienvenida.";
        break;
      case "invoice":
        subject = "Nueva factura disponible";
        content = "Este es un correo de prueba de la plantilla de facturación.";
        break;
      case "notification":
        subject = "Nueva notificación";
        content = "Este es un correo de prueba de la plantilla de notificación.";
        break;
      default:
        return NextResponse.json(
          { error: "Invalid template type" },
          { status: 400 }
        );
    }

    // Send test email
    await transporter.sendMail({
      from: config.user_email,
      to: test_email,
      subject: subject,
      html: content,
    });

    return NextResponse.json({ 
      success: true,
      message: `Test email sent using ${template_type} template` 
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}
