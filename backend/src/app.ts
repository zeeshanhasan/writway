import express from 'express';
import cors from 'cors';

export const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "https://writway.com"],
  credentials: true,
}));
app.use(express.json());

// basic request logging for debugging on Vercel
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[req] ${req.method} ${req.url}`);
  res.on('finish', () => {
    console.log(`[res] ${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// Liveness: fast, no external calls
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' }, error: null });
});

// Readiness: checks DB connectivity with a short timeout (lazy Prisma init)
app.get('/api/v1/ready', async (_req, res) => {
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
    res.json({ success: true, data: { db: 'connected' }, error: null });
  } catch (err) {
    res.status(200).json({ success: true, data: { db: 'disconnected' }, error: null });
  }
});

export default app;
