import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Try to count email configurations
    const count = await prisma.emailConfiguration.count();
    console.log('Email configurations count:', count);

    // Try to list all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Database tables:', tables);

    return NextResponse.json({ 
      status: 'ok',
      emailConfigCount: count,
      tables 
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Database test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { 
      status: 500 
    });
  }
}
