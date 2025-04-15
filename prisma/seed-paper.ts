import { PrismaClient } from '@prisma/client';

// Initialize the Prisma client
const prisma = new PrismaClient();

async function main() {
  console.log('Starting paper stock seed...');

  // Get the system admin user (should exist from the main seed)
  const systemAdmin = await prisma.user.findFirst({
    where: {
      email: 'admin@smartone.id',
    },
  });

  if (!systemAdmin) {
    throw new Error('System admin user not found. Please run the main seed first.');
  }

  console.log(`Found system admin with ID: ${systemAdmin.id}`);

  // Create a test paper stock with a known barcode
  const testPaperStock = await prisma.paperStock.create({
    data: {
      name: 'Test Paper Stock',
      type: 'Sublimation Paper',
      manufacturer: 'Test Manufacturer',
      width: 120.0,
      height: 100.0,
      length: 1000.0,
      gsm: 100,
      thickness: 0.1,
      remainingLength: 1000.0,
      addedByUserId: systemAdmin.id,
      approved: true,
      notes: 'Test paper stock for barcode scanning',
      qrCode: 'JX3706535895',  // Use the barcode from your error logs
    },
  });

  console.log(`Created test paper stock with ID: ${testPaperStock.id}`);
  console.log('Paper stock seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during paper stock seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the Prisma client connection
    await prisma.$disconnect();
  }); 