import { PrismaClient } from '@prisma/client';

declare global {
  var db: PrismaClient | undefined;
}

// Configure Prisma with connection pooling
export const db = globalThis.db || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Connection pool configuration is handled via DATABASE_URL connection string
  // Example: postgresql://user:password@host:port/database?connection_limit=10&pool_timeout=20
});

if (process.env.NODE_ENV !== 'production') globalThis.db = db;

// Export prisma as an alias for db for backward compatibility
export const prisma = db;
