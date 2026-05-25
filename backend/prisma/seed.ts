import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@nails.com' },
    update: {},
    create: { email: 'admin@nails.com', password },
  });
  console.log('Admin creado:', admin.email);

  const emp1 = await prisma.employee.upsert({
    where: { id: 'emp1' },
    update: {},
    create: { id: 'emp1', name: 'Laura García', phone: '1122334455', color: '#ec4899' },
  });
  const emp2 = await prisma.employee.upsert({
    where: { id: 'emp2' },
    update: {},
    create: { id: 'emp2', name: 'Sofía Martínez', phone: '1166778899', color: '#8b5cf6' },
  });

  await prisma.service.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Manicure tradicional', durationMinutes: 45, price: 2500, description: 'Esmaltado clásico con lima y cutículas' },
      { name: 'Manicure semipermanente', durationMinutes: 60, price: 3500, description: 'Duración hasta 3 semanas' },
      { name: 'Uñas gel', durationMinutes: 90, price: 5500, description: 'Esculpidas en gel UV' },
      { name: 'Nail art', durationMinutes: 30, price: 1500, description: 'Diseños a elección' },
      { name: 'Pedicure tradicional', durationMinutes: 60, price: 3000, description: 'Pedicure completo' },
    ],
  });

  console.log('Empleadas y servicios de ejemplo creados');
  console.log('Login: admin@nails.com / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
