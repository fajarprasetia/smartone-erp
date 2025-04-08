// Script to list all users in the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
      },
    });

    console.log('Users in the database:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}), Role: ${user.role.name}`);
    });
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers(); 