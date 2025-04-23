const { db } = require('./src/lib/db');

async function main() {
  // Execute raw query to get all table names
  const result = await db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  console.log('Tables in database:');
  result.forEach(row => console.log(row.tablename));
  await db.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 