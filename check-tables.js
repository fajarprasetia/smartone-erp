const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check if SpkCounter table exists
    console.log('Checking SpkCounter table...');
    try {
      const spkCounters = await prisma.spkCounter.findMany({ take: 1 });
      console.log('SpkCounter exists with', spkCounters.length, 'records');
    } catch (e) {
      console.log('Error accessing SpkCounter:', e.message);
    }

    // Check if TempSpkReservation table exists
    console.log('\nChecking TempSpkReservation table...');
    try {
      const tempSpkReservations = await prisma.tempSpkReservation.findMany({ take: 1 });
      console.log('TempSpkReservation exists with', tempSpkReservations.length, 'records');
    } catch (e) {
      console.log('Error accessing TempSpkReservation:', e.message);
    }

    // Create a new SpkCounter record
    console.log('\nAttempting to create a SpkCounter record...');
    try {
      const datePrefix = new Date().getMonth() + 1 + String(new Date().getFullYear()).slice(-2);
      const newCounter = await prisma.spkCounter.upsert({
        where: { prefix: datePrefix },
        update: {},
        create: {
          prefix: datePrefix,
          lastValue: 1
        }
      });
      console.log('Created/updated SpkCounter:', newCounter);
    } catch (e) {
      console.log('Error creating SpkCounter:', e.message);
    }
  } catch (e) {
    console.error('General error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 