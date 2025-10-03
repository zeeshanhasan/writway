import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: ["http://localhost:3000", "https://writway.com"],
  credentials: true,
}));
app.use(express.json());

app.get('/api/v1/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, data: { status: 'ok', db: 'connected' }, error: null });
  } catch (err) {
    res.json({ success: true, data: { status: 'ok', db: 'disconnected' }, error: null });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});

export default app;

