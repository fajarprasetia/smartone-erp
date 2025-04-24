import { PrismaClient } from "../../prisma/generated/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Function to create a Prisma client with error handling
function createPrismaClient() {
  try {
    const client = new PrismaClient({
      log: ["error"],
    });
    
    // Add error handler for connection issues
    client.$on('error', (e) => {
      console.error('Prisma Client error:', e);
    });
    
    return client;
  } catch (error) {
    console.error('Failed to create Prisma client:', error);
    
    // Return a minimal client that won't throw errors when accessed
    return new Proxy({} as PrismaClient, {
      get: (target, prop) => {
        // For any property access, return a function that logs the error
        if (prop !== 'then' && prop !== 'catch') {
          return () => {
            console.error(`Database operation failed: ${String(prop)} is not available`);
            return Promise.resolve([]);
          };
        }
        return undefined;
      }
    });
  }
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Export the PrismaClient instance directly as well
export const prisma = db;

// Verify database connection on startup
try {
  db.$connect()
    .then(() => console.log('Database connection established'))
    .catch((err) => console.error('Failed to connect to database:', err));
} catch (error) {
  console.error('Error connecting to database:', error);
}