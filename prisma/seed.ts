import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando cuentas de ejemplo...');

  // Crear cuenta 1
  await prisma.account.upsert({
    where: { accountNumber: 'ACC-001' },
    update: {},
    create: {
      accountNumber: 'ACC-001',
      balance: 5000,
    },
  });

  // Crear cuenta 2
  await prisma.account.upsert({
    where: { accountNumber: 'ACC-002' },
    update: {},
    create: {
      accountNumber: 'ACC-002',
      balance: 1000,
    },
  });

  // Crear cuenta 3 (opcional)
  await prisma.account.upsert({
    where: { accountNumber: 'ACC-003' },
    update: {},
    create: {
      accountNumber: 'ACC-003',
      balance: 2000,
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
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });