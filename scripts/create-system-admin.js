// Script to create the system administrator user if it doesn't exist
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createSystemAdmin() {
  try {
    // Check if the System Administrator role exists
    let systemAdminRole = await prisma.role.findFirst({
      where: {
        name: 'System Administrator',
      },
    });

    // If the role doesn't exist, create it
    if (!systemAdminRole) {
      systemAdminRole = await prisma.role.create({
        data: {
          name: 'System Administrator',
          description: 'Full access to all features',
          isAdmin: true,
        },
      });
      console.log('System Administrator role created');
    }

    // Check if the system administrator user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: 'systemadministrator@smartone.id',
      },
    });

    if (existingUser) {
      console.log('System Administrator user already exists');
      return;
    }

    // Create the system administrator user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'System Administrator',
        email: 'systemadministrator@smartone.id',
        password: hashedPassword,
        roleId: systemAdminRole.id,
      },
    });

    console.log('System Administrator user created successfully');
  } catch (error) {
    console.error('Error creating system administrator:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSystemAdmin(); 