import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create default permissions
    const permissions = [
      // Dashboard permissions
      { name: 'dashboard.view', description: 'Can view dashboard' },
      { name: 'dashboard.edit', description: 'Can edit dashboard' },
      
      // Manager permissions
      { name: 'manager.view', description: 'Can view manager section' },
      { name: 'manager.edit', description: 'Can edit manager section' },
      
      // Marketing permissions
      { name: 'marketing.view', description: 'Can view marketing section' },
      { name: 'marketing.edit', description: 'Can edit marketing section' },
      { name: 'marketing.customer.view', description: 'Can view customers' },
      { name: 'marketing.customer.edit', description: 'Can edit customers' },
      { name: 'marketing.whatsapp.view', description: 'Can view WhatsApp' },
      { name: 'marketing.whatsapp.edit', description: 'Can edit WhatsApp' },
      { name: 'marketing.whatsapp_chat.view', description: 'Can view WhatsApp Chat' },
      { name: 'marketing.whatsapp_chat.edit', description: 'Can edit WhatsApp Chat' },
      
      // Inventory permissions
      { name: 'inventory.view', description: 'Can view inventory section' },
      { name: 'inventory.edit', description: 'Can edit inventory section' },
      { name: 'inventory.inbound.view', description: 'Can view inbound' },
      { name: 'inventory.inbound.edit', description: 'Can edit inbound' },
      { name: 'inventory.outbound.view', description: 'Can view outbound' },
      { name: 'inventory.outbound.edit', description: 'Can edit outbound' },
      { name: 'inventory.consumables.view', description: 'Can view consumables' },
      { name: 'inventory.consumables.edit', description: 'Can edit consumables' },
      { name: 'inventory.assets.view', description: 'Can view assets' },
      { name: 'inventory.assets.edit', description: 'Can edit assets' },
      
      // Order permissions
      { name: 'order.view', description: 'Can view orders' },
      { name: 'order.edit', description: 'Can edit orders' },
      
      // Design permissions
      { name: 'design.view', description: 'Can view design section' },
      { name: 'design.edit', description: 'Can edit design section' },
      
      // Production permissions
      { name: 'production.view', description: 'Can view production section' },
      { name: 'production.edit', description: 'Can edit production section' },
      { name: 'production.list.view', description: 'Can view production list' },
      { name: 'production.list.edit', description: 'Can edit production list' },
      { name: 'production.print.view', description: 'Can view print section' },
      { name: 'production.print.edit', description: 'Can edit print section' },
      { name: 'production.press.view', description: 'Can view press section' },
      { name: 'production.press.edit', description: 'Can edit press section' },
      { name: 'production.cutting.view', description: 'Can view cutting section' },
      { name: 'production.cutting.edit', description: 'Can edit cutting section' },
      { name: 'production.dtf.view', description: 'Can view DTF section' },
      { name: 'production.dtf.edit', description: 'Can edit DTF section' },
      
      // Finance permissions
      { name: 'finance.view', description: 'Can view finance section' },
      { name: 'finance.edit', description: 'Can edit finance section' },
      { name: 'finance.overview.view', description: 'Can view finance overview' },
      { name: 'finance.overview.edit', description: 'Can edit finance overview' },
      { name: 'finance.receivable.view', description: 'Can view accounts receivable' },
      { name: 'finance.receivable.edit', description: 'Can edit accounts receivable' },
      { name: 'finance.payable.view', description: 'Can view accounts payable' },
      { name: 'finance.payable.edit', description: 'Can edit accounts payable' },
      { name: 'finance.cash.view', description: 'Can view cash management' },
      { name: 'finance.cash.edit', description: 'Can edit cash management' },
      { name: 'finance.ledger.view', description: 'Can view general ledger' },
      { name: 'finance.ledger.edit', description: 'Can edit general ledger' },
      { name: 'finance.budgets.view', description: 'Can view budgets' },
      { name: 'finance.budgets.edit', description: 'Can edit budgets' },
      { name: 'finance.tax.view', description: 'Can view tax management' },
      { name: 'finance.tax.edit', description: 'Can edit tax management' },
      { name: 'finance.reports.view', description: 'Can view reports' },
      { name: 'finance.reports.edit', description: 'Can edit reports' },
      
      // Settings permissions
      { name: 'settings.view', description: 'Can view settings section' },
      { name: 'settings.edit', description: 'Can edit settings section' },
      { name: 'settings.dashboard.view', description: 'Can view dashboard settings' },
      { name: 'settings.dashboard.edit', description: 'Can edit dashboard settings' },
      { name: 'settings.users.view', description: 'Can view users' },
      { name: 'settings.users.edit', description: 'Can edit users' },
      { name: 'settings.roles.view', description: 'Can view roles' },
      { name: 'settings.roles.edit', description: 'Can edit roles' },
      { name: 'settings.products.view', description: 'Can view products' },
      { name: 'settings.products.edit', description: 'Can edit products' }
    ];

    // First, try to delete existing permissions to avoid conflicts
    await prisma.permission.deleteMany({});
    
    // Create permissions with proper timestamps
    const createdPermissions = await Promise.all(
      permissions.map(async (permission) => {
        return prisma.permission.create({
          data: {
            ...permission,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      })
    );

    console.log('Created permissions:', createdPermissions.length);

    // Create System Administrator role if it doesn't exist
    const systemAdminRole = await prisma.role.upsert({
      where: { name: 'System Administrator' },
      update: {
        description: 'Full access to all features and settings',
        isSystem: true,
        isAdmin: true,
        updatedAt: new Date(),
        permissions: {
          set: createdPermissions.map((p) => ({ id: p.id })),
        },
      },
      create: {
        name: 'System Administrator',
        description: 'Full access to all features and settings',
        isSystem: true,
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: {
          connect: createdPermissions.map((p) => ({ id: p.id })),
        },
      },
    });

    // Create Administrator role if it doesn't exist
    const adminRole = await prisma.role.upsert({
      where: { name: 'Administrator' },
      update: {
        description: 'Administrative access to most features',
        isSystem: true,
        isAdmin: true,
        updatedAt: new Date(),
        permissions: {
          set: createdPermissions.map((p) => ({ id: p.id })),
        },
      },
      create: {
        name: 'Administrator',
        description: 'Administrative access to most features',
        isSystem: true,
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: {
          connect: createdPermissions.map((p) => ({ id: p.id })),
        },
      },
    });

    // Create Manager role if it doesn't exist
    const managerRole = await prisma.role.upsert({
      where: { name: 'Manager' },
      update: {
        description: 'Managerial access to operational features',
        isSystem: true,
        isAdmin: false,
        updatedAt: new Date(),
        permissions: {
          set: createdPermissions
            .filter(p => !p.name.includes('settings') && !p.name.includes('finance'))
            .map((p) => ({ id: p.id })),
        },
      },
      create: {
        name: 'Manager',
        description: 'Managerial access to operational features',
        isSystem: true,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: {
          connect: createdPermissions
            .filter(p => !p.name.includes('settings') && !p.name.includes('finance'))
            .map((p) => ({ id: p.id })),
        },
      },
    });

    // Create Operation Manager role if it doesn't exist
    const opManagerRole = await prisma.role.upsert({
      where: { name: 'Operation Manager' },
      update: {
        description: 'Access to production and inventory management',
        isSystem: true,
        isAdmin: false,
        updatedAt: new Date(),
        permissions: {
          set: createdPermissions
            .filter(p => p.name.includes('production') || p.name.includes('inventory'))
            .map((p) => ({ id: p.id })),
        },
      },
      create: {
        name: 'Operation Manager',
        description: 'Access to production and inventory management',
        isSystem: true,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: {
          connect: createdPermissions
            .filter(p => p.name.includes('production') || p.name.includes('inventory'))
            .map((p) => ({ id: p.id })),
        },
      },
    });

    // Create Marketing role if it doesn't exist
    const marketingRole = await prisma.role.upsert({
      where: { name: 'Marketing' },
      update: {
        description: 'Access to marketing and customer management',
        isSystem: true,
        isAdmin: false,
        updatedAt: new Date(),
        permissions: {
          set: createdPermissions
            .filter(p => p.name.includes('marketing') || p.name.includes('customer'))
            .map((p) => ({ id: p.id })),
        },
      },
      create: {
        name: 'Marketing',
        description: 'Access to marketing and customer management',
        isSystem: true,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: {
          connect: createdPermissions
            .filter(p => p.name.includes('marketing') || p.name.includes('customer'))
            .map((p) => ({ id: p.id })),
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
    console.log(`- Manager Role: ${managerRole.id}`);
    console.log(`- Operation Manager Role: ${opManagerRole.id}`);
    console.log(`- Marketing Role: ${marketingRole.id}`);
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