import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando cuentas de ejemplo...');

  // 1. Crear un usuario de prueba
  const user = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      email: 'user@test.com',
      password: 'hashed_password_here',
      name: 'Usuario de Prueba',
      role: 'USER',
    },
  });

  console.log(`✅ Usuario creado: ${user.email} (ID: ${user.id})`);

  // 2. Crear cuentas asociadas al usuario
  await prisma.account.upsert({
    where: { accountNumber: 'ACC-001' },
    update: {},
    create: {
      accountNumber: 'ACC-001',
      balance: 5000,
      userId: user.id,
    },
  });

  await prisma.account.upsert({
    where: { accountNumber: 'ACC-002' },
    update: {},
    create: {
      accountNumber: 'ACC-002',
      balance: 1000,
      userId: user.id,
    },
  });

  await prisma.account.upsert({
    where: { accountNumber: 'ACC-003' },
    update: {},
    create: {
      accountNumber: 'ACC-003',
      balance: 2000,
      userId: user.id,
    },
  });

  console.log('✅ Cuentas creadas:');
  console.log('   ACC-001: $5000');
  console.log('   ACC-002: $1000');
  console.log('   ACC-003: $2000');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    // process existe en Node.js, solo es un error de TypeScript
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });