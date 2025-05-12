import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { auth } from "@clerk/nextjs";

// GET /api/email-config - Get current email configuration
export async function GET() {
  try {
    console.log('Fetching email configuration...');
    const config = await prisma.emailConfiguration.findFirst({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
    });
    console.log('Found configuration:', config);

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching email configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email configuration' },
      { status: 500 }
    );
  }
}

// POST /api/email-config - Create or update email configuration
export async function POST(req: Request) {
  try {
    console.log('Received POST request to save email configuration');
    const body = await req.json();
    console.log('Request body:', body);

    const { smtp_host, smtp_port, user_email, app_password } = body;

    // Validate required fields
    if (!smtp_host || !smtp_port || !user_email || !app_password) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Deactivating existing configurations...');
    // Deactivate any existing configurations
    await prisma.emailConfiguration.updateMany({
      where: { is_active: true },
      data: { is_active: false },
    });

    console.log('Creating new configuration...');
    // Create new configuration
    const config = await prisma.emailConfiguration.create({
      data: {
        smtp_host,
        smtp_port,
        user_email,
        app_password,
        is_active: true,
      },
    });
    console.log('Created configuration:', config);

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error saving email configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save email configuration' },
      { status: 500 }
    );
  }
}
