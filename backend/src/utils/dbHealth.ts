import { prisma } from '../config/prisma';

export async function checkDatabaseReady(): Promise<boolean> {
  try {
    // Simple query to check database connection
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database readiness check failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

