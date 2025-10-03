import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

export const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: ["https://writway.com", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.json({ status: 'ok', db: 'disconnected' });
  }
});

export default app;

