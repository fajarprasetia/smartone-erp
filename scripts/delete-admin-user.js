// Script to delete the admin@smartone-erp.com user
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAdminUser() {
  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: {
        email: 'admin@smartone-erp.com',
      },
    });

    if (!user) {
      console.log('User admin@smartone-erp.com not found');
      return;
    }

    // Delete the user
    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    console.log('User admin@smartone-erp.com deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAdminUser(); 