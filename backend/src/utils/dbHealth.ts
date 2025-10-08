import { prisma } from '../config/prisma';

export async function checkDatabaseReady(): Promise<boolean> {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      return false;
    }

    // Simple query to check database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database readiness check failed:', error instanceof Error ? error.message : 'Unknown error');
    console.error('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    return false;
  }
}

