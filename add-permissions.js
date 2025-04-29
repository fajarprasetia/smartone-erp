const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Create the new permissions
    const newPermissions = [
      { name: 'inventory.consumables.view', description: 'Can view consumables' },
      { name: 'inventory.consumables.edit', description: 'Can edit consumables' },
      { name: 'inventory.assets.view', description: 'Can view assets' },
      { name: 'inventory.assets.edit', description: 'Can edit assets' },
      { name: 'marketing.whatsapp_chat.view', description: 'Can view WhatsApp chat' },
      { name: 'marketing.whatsapp_chat.edit', description: 'Can edit WhatsApp chat' }
    ];
    
    // Create each permission
    for (const permission of newPermissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: { description: permission.description },
        create: {
          ...permission,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`Created/updated permission: ${permission.name}`);
    }
    
    // Get all system roles (System Administrator & Administrator)
    const adminRoles = await prisma.role.findMany({
      where: {
        isAdmin: true
      },
      include: {
        permissions: true
      }
    });
    
    // Get the newly created permissions
    const allPermissions = await prisma.permission.findMany();
    
    // Add all permissions to admin roles
    for (const role of adminRoles) {
      await prisma.role.update({
        where: { id: role.id },
        data: {
          permissions: {
            set: allPermissions.map(p => ({ id: p.id }))
          }
        }
      });
      console.log(`Updated role ${role.name} with all permissions`);
    }
    
    console.log('Permissions added successfully!');
  } catch (error) {
    console.error('Error adding permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 