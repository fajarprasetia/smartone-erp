import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create default permissions
    const permissions = [
      { name: 'view_dashboard', description: 'Can view dashboard' },
      { name: 'view_manager', description: 'Can view manager section' },
      { name: 'view_marketing', description: 'Can view marketing section' },
      { name: 'view_inventory', description: 'Can view inventory section' },
      { name: 'view_order', description: 'Can view order section' },
      { name: 'view_design', description: 'Can view design section' },
      { name: 'view_production', description: 'Can view production section' },
      { name: 'view_finance', description: 'Can view finance section' },
      { name: 'view_settings', description: 'Can view settings section' },
    ];

    const createdPermissions = await Promise.all(
      permissions.map(async (permission) => {
        return prisma.permission.upsert({
          where: { name: permission.name },
          update: {},
          create: permission,
        });
      })
    );

    console.log('Created permissions:', createdPermissions.length);

    // Create System Administrator role if it doesn't exist
    const systemAdminRole = await prisma.role.upsert({
      where: { name: 'System Administrator' },
      update: {
        permissions: {
          connect: createdPermissions.map((p) => ({ id: p.id })),
        },
      },
      create: {
        name: 'System Administrator',
        description: 'Full access to all features and settings',
        isSystem: true,
        isAdmin: true,
        permissions: {
          connect: createdPermissions.map((p) => ({ id: p.id })),
        },
      },
    });

    // Create Administrator role if it doesn't exist
    const adminRole = await prisma.role.upsert({
      where: { name: 'Administrator' },
      update: {
        permissions: {
          connect: createdPermissions.map((p) => ({ id: p.id })),
        },
      },
      create: {
        name: 'Administrator',
        description: 'Administrative access to most features',
        isSystem: true,
        isAdmin: true,
        permissions: {
          connect: createdPermissions.map((p) => ({ id: p.id })),
        },
      },
    });

    // Create System Administrator user if it doesn't exist
    const hashedPassword = await bcrypt.hash('smartone#2025', 10);
    
    const systemAdminUser = await prisma.user.upsert({
      where: { email: 'systemadministrator@smartone.id' },
      update: {},
      create: {
        name: 'System Administrator',
        email: 'systemadministrator@smartone.id',
        password: hashedPassword,
        roleId: systemAdminRole.id,
        isActive: true,
      },
    });

    console.log('Seed data created:');
    console.log(`- System Administrator Role: ${systemAdminRole.id}`);
    console.log(`- Administrator Role: ${adminRole.id}`);
    console.log(`- System Administrator User: ${systemAdminUser.id}`);
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 