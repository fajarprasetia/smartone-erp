import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdminRoles() {
  try {
    // Update System Administrator role
    const sysAdminRole = await prisma.role.upsert({
      where: { name: 'System Administrator' },
      update: {
        isSystem: true,
        isAdmin: true,
      },
      create: {
        name: 'System Administrator',
        description: 'Full access to all features',
        isSystem: true,
        isAdmin: true,
      },
    });

    console.log('System Administrator role:', sysAdminRole);

    // Update Administrator role
    const adminRole = await prisma.role.upsert({
      where: { name: 'Administrator' },
      update: {
        isSystem: true,
        isAdmin: true,
      },
      create: {
        name: 'Administrator',
        description: 'Administrative access to most features',
        isSystem: true,
        isAdmin: true,
      },
    });

    console.log('Administrator role:', adminRole);

    // List all roles
    const allRoles = await prisma.role.findMany({
      include: {
        users: true,
      },
    });

    console.log('\nAll roles:');
    allRoles.forEach(role => {
      console.log(`- ${role.name} (isAdmin: ${role.isAdmin}, users: ${role.users.length})`);
    });

  } catch (error) {
    console.error('Error fixing admin roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRoles(); 