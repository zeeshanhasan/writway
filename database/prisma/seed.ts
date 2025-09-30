import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Super Admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@writway.com' },
    update: {},
    create: {
      email: 'admin@writway.com',
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      tenantId: null, // Super admin is not tied to a tenant
    },
  });

  console.log('✅ Super Admin created:', superAdmin.email);

  // Create default tenant
  const defaultTenant = await prisma.tenant.upsert({
    where: { domain: 'demo.writway.com' },
    update: {},
    create: {
      name: 'WritWay Demo',
      domain: 'demo.writway.com',
    },
  });

  console.log('✅ Default tenant created:', defaultTenant.name);

  // Create Org Admin for default tenant
  const orgAdmin = await prisma.user.upsert({
    where: { email: 'admin@demo.writway.com' },
    update: {},
    create: {
      email: 'admin@demo.writway.com',
      firstName: 'Demo',
      lastName: 'Admin',
      role: UserRole.ORG_ADMIN,
      tenantId: defaultTenant.id,
    },
  });

  console.log('✅ Org Admin created:', orgAdmin.email);

  // Create sample staff user
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@demo.writway.com' },
    update: {},
    create: {
      email: 'staff@demo.writway.com',
      firstName: 'Demo',
      lastName: 'Staff',
      role: UserRole.STAFF,
      tenantId: defaultTenant.id,
    },
  });

  console.log('✅ Staff user created:', staffUser.email);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
