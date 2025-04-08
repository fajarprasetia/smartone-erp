// Script to update the System Administrator and Administrator roles to have isAdmin=true
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdminRoles() {
  try {
    // Update System Administrator role
    const systemAdminRole = await prisma.role.update({
      where: {
        name: 'System Administrator',
      },
      data: {
        isAdmin: true,
      },
    });

    console.log('Updated System Administrator role:', systemAdminRole.name);

    // Update Administrator role
    const adminRole = await prisma.role.update({
      where: {
        name: 'Administrator',
      },
      data: {
        isAdmin: true,
      },
    });

    console.log('Updated Administrator role:', adminRole.name);

  } catch (error) {
    console.error('Error updating admin roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminRoles(); 