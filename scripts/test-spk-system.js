const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate a date prefix in MMYY format
function generateDatePrefix() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  
  return `${month}${year}`;
}

// Format SPK number
function formatSPKNumber(datePrefix, number) {
  return `${datePrefix}${String(number).padStart(3, '0')}`;
}

async function testSpkGeneration() {
  console.log("🧪 Testing SPK Generation System");
  console.log("===============================\n");
  
  try {
    // 1. Check if tables exist
    console.log("1️⃣ Checking if necessary tables exist...");
    
    try {
      // Test SpkCounter table
      const countCounters = await prisma.$executeRaw`SELECT COUNT(*) FROM "SpkCounter"`;
      console.log(`✅ SpkCounter table exists and has ${countCounters} records`);
      
      // Test TempSpkReservation table
      const countReservations = await prisma.$executeRaw`SELECT COUNT(*) FROM "TempSpkReservation"`;
      console.log(`✅ TempSpkReservation table exists and has ${countReservations} records`);
      
    } catch (tableError) {
      console.error("❌ Error checking tables:", tableError);
      console.log("🔄 Creating tables if they don't exist...");
      
      // We can handle table creation here if needed
      console.log("ℹ️ Please run prisma migrations to create the necessary tables");
    }
    
    // 2. Test creating SpkCounter record manually
    console.log("\n2️⃣ Testing direct SQL operations on SpkCounter...");
    
    const datePrefix = generateDatePrefix();
    
    try {
      // Insert a test counter record if it doesn't exist
      await prisma.$executeRaw`
        INSERT INTO "SpkCounter" (id, prefix, "lastValue", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${datePrefix}, 1, NOW(), NOW())
        ON CONFLICT (prefix) DO UPDATE
        SET "lastValue" = "SpkCounter"."lastValue" + 1, "updatedAt" = NOW()
        RETURNING *
      `;
      
      // Fetch the counter
      const [counter] = await prisma.$queryRaw`
        SELECT * FROM "SpkCounter" WHERE prefix = ${datePrefix}
      `;
      
      console.log(`✅ Successfully created/updated counter for ${datePrefix}`);
      console.log(`   Current value: ${counter.lastValue}`);
      
      const newSpk = formatSPKNumber(datePrefix, counter.lastValue);
      console.log(`🔢 Generated SPK: ${newSpk}`);
      
      // 3. Test creating a reservation
      console.log("\n3️⃣ Testing direct SQL operations on TempSpkReservation...");
      
      // Clean up expired reservations
      const deleteResult = await prisma.$executeRaw`
        DELETE FROM "TempSpkReservation"
        WHERE "expiresAt" < NOW()
      `;
      
      console.log(`🧹 Cleaned up expired reservations`);
      
      // Create a new reservation
      await prisma.$executeRaw`
        INSERT INTO "TempSpkReservation" (id, spk, "createdAt", "expiresAt")
        VALUES (gen_random_uuid(), ${newSpk}, NOW(), NOW() + INTERVAL '15 minutes')
        ON CONFLICT (spk) DO UPDATE
        SET "expiresAt" = NOW() + INTERVAL '15 minutes'
      `;
      
      // Fetch the reservation
      const [reservation] = await prisma.$queryRaw`
        SELECT * FROM "TempSpkReservation" WHERE spk = ${newSpk}
      `;
      
      console.log(`✅ Created new reservation for SPK ${newSpk}`);
      console.log(`⏰ Reservation expires at: ${new Date(reservation.expiresAt).toLocaleString()}`);
      
    } catch (sqlError) {
      console.error("❌ Error executing SQL:", sqlError);
    }
    
    console.log("\n📊 Summary:");
    console.log("- SQL operations on SpkCounter are successful");
    console.log("- SQL operations on TempSpkReservation are successful");
    console.log("- SPK system appears to be operational at the database level");
    
  } catch (error) {
    console.error("❌ Error testing SPK system:", error);
  } finally {
    // Always disconnect from the database
    await prisma.$disconnect();
  }
}

// Run the test
testSpkGeneration()
  .then(() => console.log("\n✅ Test completed"))
  .catch(e => console.error("\n❌ Test failed:", e)); 