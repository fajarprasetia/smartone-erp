const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check if TempSpkReservation table exists
    console.log('Checking TempSpkReservation table...');
    try {
      const tempSpkReservations = await prisma.tempSpkReservation.findMany({ take: 10 });
      console.log('TempSpkReservation exists with', tempSpkReservations.length, 'records');
      if (tempSpkReservations.length > 0) {
        console.log('Example records:', tempSpkReservations);
      }
    } catch (e) {
      console.log('Error accessing TempSpkReservation:', e.message);
    }

    // Create a new TempSpkReservation record
    console.log('\nAttempting to create a TempSpkReservation record...');
    try {
      const result = await prisma.tempSpkReservation.create({
        data: {
          spk: 'TEST123',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
        }
      });
      console.log('Created TempSpkReservation:', result);
    } catch (e) {
      console.log('Error creating TempSpkReservation:', e.message);
    }
  } catch (e) {
    console.error('General error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 