import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.json({ status: 'ok', db: 'disconnected' });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const host = '0.0.0.0';
app.listen(port, host, () => {
  console.log(`Backend running on http://${host}:${port}`);
});
