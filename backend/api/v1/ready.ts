// Direct serverless handler for readiness to avoid Express path prefix issues
export default async function handler(_req: any, res: any) {
  const timeoutMs = 3000;
  const timeoutPromise = new Promise((_resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error('DB readiness check timed out'));
    }, timeoutMs);
  });
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);
    res.status(200).json({ success: true, data: { db: 'connected' }, error: null });
  } catch (err) {
    res.status(200).json({ success: true, data: { db: 'disconnected' }, error: null });
  }
}

