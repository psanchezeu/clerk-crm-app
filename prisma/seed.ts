import { PrismaClient } from '../node_modules/.prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Crear roles
  const adminRole = await prisma.rol.upsert({
    where: { nombre: 'Administrador' },
    update: {},
    create: {
      nombre: 'Administrador',
      permisos: {
        all: {
          lectura: true,
          escritura: true,
          eliminación: true
        }
      }
    },
  });

  const userRole = await prisma.rol.upsert({
    where: { nombre: 'Usuario' },
    update: {},
    create: {
      nombre: 'Usuario',
      permisos: {
        all: {
          lectura: true,
          escritura: true,
          eliminación: false
        }
      }
    },
  });

  console.log('Roles creados:', { adminRole, userRole });

  // Crear usuario administrador
  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@example.com',
      clerk_id: 'user_test_admin',
      id_rol: adminRole.id,
    },
  });

  console.log('Usuario administrador creado:', adminUser);

  // Crear clientes de ejemplo
  const clients = [
    {
      nombre_empresa: 'Acme Inc.',
      sector: 'Tecnología',
      telefono: '+34 912 345 678',
      email: 'info@acme.com',
      direccion: 'Calle Falsa 123, Madrid',
      tipo: 'B2B',
      id_propietario: adminUser.id,
      es_privado: false,
    },
    {
      nombre_empresa: 'Globex Corporation',
      sector: 'Manufactura',
      telefono: '+34 913 456 789',
      email: 'contact@globex.com',
      direccion: 'Avenida Principal 456, Barcelona',
      tipo: 'B2B',
      id_propietario: adminUser.id,
      es_privado: false,
    },
    {
      nombre_empresa: 'Initech',
      sector: 'Consultoría',
      telefono: '+34 914 567 890',
      email: 'hello@initech.com',
      direccion: 'Plaza Mayor 789, Valencia',
      tipo: 'B2B',
      id_propietario: adminUser.id,
      es_privado: true,
    },
    {
      nombre_empresa: 'Umbrella Corp',
      sector: 'Farmacéutica',
      telefono: '+34 915 678 901',
      email: 'info@umbrella.com',
      direccion: 'Calle Industria 234, Sevilla',
      tipo: 'B2B',
      id_propietario: adminUser.id,
      es_privado: false,
    },
    {
      nombre_empresa: 'Stark Industries',
      sector: 'Tecnología',
      telefono: '+34 916 789 012',
      email: 'contact@stark.com',
      direccion: 'Avenida Innovación 567, Bilbao',
      tipo: 'B2B',
      id_propietario: adminUser.id,
      es_privado: false,
    },
  ];

  for (const client of clients) {
    await prisma.cliente.create({
      data: client,
    });
  }

  console.log(`Creados ${clients.length} clientes de ejemplo`);

  // Crear leads de ejemplo
  const leads = [
    {
      nombre: 'Juan Pérez',
      email: 'juan.perez@example.com',
      telefono: '+34 612 345 678',
      empresa: 'Empresa Nueva S.L.',
      origen: 'Formulario Web',
      estado: 'Nuevo',
      id_propietario: adminUser.id,
      es_privado: false,
    },
    {
      nombre: 'María García',
      email: 'maria.garcia@example.com',
      telefono: '+34 623 456 789',
      empresa: 'Innovaciones Tech',
      origen: 'LinkedIn',
      estado: 'Contactado',
      id_propietario: adminUser.id,
      es_privado: false,
    },
    {
      nombre: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@example.com',
      telefono: '+34 634 567 890',
      empresa: 'Desarrollo Digital',
      origen: 'Referido',
      estado: 'Calificado',
      id_propietario: adminUser.id,
      es_privado: true,
    },
  ];

  for (const lead of leads) {
    await prisma.lead.create({
      data: lead,
    });
  }

  console.log(`Creados ${leads.length} leads de ejemplo`);

  // Crear oportunidades de ejemplo
  const opportunities = [
    {
      nombre: 'Proyecto de implementación CRM',
      valor: 15000,
      etapa: 'Propuesta',
      fecha_cierre: new Date('2025-06-30'),
      id_cliente: 1,
      id_propietario: adminUser.id,
      es_privado: false,
    },
    {
      nombre: 'Desarrollo de aplicación móvil',
      valor: 25000,
      etapa: 'Negociación',
      fecha_cierre: new Date('2025-07-15'),
      id_cliente: 2,
      id_propietario: adminUser.id,
      es_privado: false,
    },
    {
      nombre: 'Consultoría estratégica',
      valor: 8000,
      etapa: 'Prospección',
      fecha_cierre: new Date('2025-08-01'),
      id_lead: 1,
      id_propietario: adminUser.id,
      es_privado: false,
    },
  ];

  for (const opportunity of opportunities) {
    await prisma.oportunidad.create({
      data: opportunity,
    });
  }

  console.log(`Creadas ${opportunities.length} oportunidades de ejemplo`);

  // Crear tareas de ejemplo
  const tasks = [
    {
      titulo: 'Llamar a cliente Acme Inc.',
      descripcion: 'Llamar para discutir la propuesta de proyecto',
      estado: 'Pendiente',
      fecha_vencimiento: new Date('2025-05-15'),
      id_propietario: adminUser.id,
      id_cliente: 1,
    },
    {
      titulo: 'Enviar propuesta a Globex',
      descripcion: 'Finalizar y enviar la propuesta técnica',
      estado: 'En progreso',
      fecha_vencimiento: new Date('2025-05-20'),
      id_propietario: adminUser.id,
      id_cliente: 2,
      id_oportunidad: 2,
    },
    {
      titulo: 'Seguimiento con lead Juan Pérez',
      descripcion: 'Enviar información adicional sobre nuestros servicios',
      estado: 'Pendiente',
      fecha_vencimiento: new Date('2025-05-18'),
      id_propietario: adminUser.id,
      id_lead: 1,
    },
  ];

  for (const task of tasks) {
    await prisma.tarea.create({
      data: task,
    });
  }

  console.log(`Creadas ${tasks.length} tareas de ejemplo`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
