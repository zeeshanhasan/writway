// Enhanced serverless health handler mirroring Express /api/health
// Returns overall status, timestamp, uptime, and service checks (api, database, auth, billing)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import pkg from '../../package.json' assert { type: 'json' };

const prisma = new PrismaClient();

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const startedAt = process.hrtime.bigint();

  const apiStatus = { status: 'ok' };

  // Database probe
  const dbStatus: {
    status: 'ok' | 'error';
    connected: boolean;
    name: string | null;
    projectRef: string | null;
    latency_ms: number | null;
    tables: { count: number | null; names: string[] };
  } = {
    status: 'ok',
    connected: true,
    name: null,
    projectRef: null,
    latency_ms: null,
    tables: { count: null, names: [] },
  };

  try {
    const dbStart = process.hrtime.bigint();
    await prisma.$connect();
    const dbEnd = process.hrtime.bigint();
    dbStatus.latency_ms = Number(dbEnd - dbStart) / 1_000_000; // ns -> ms

    // Derive DB name and project ref from DATABASE_URL/SUPABASE_URL
    try {
      const url = process.env.DATABASE_URL;
      if (url) {
        const u = new URL(url);
        dbStatus.name = (u.pathname || '').replace(/^\//, '') || null;
        const username = u.username || '';
        const refFromUser = username.match(/^postgres\.([a-z0-9\-]+)$/i);
        if (refFromUser) {
          dbStatus.projectRef = refFromUser[1];
        } else if (process.env.SUPABASE_URL) {
          try {
            const su = new URL(process.env.SUPABASE_URL);
            const host = su.hostname;
            const m = host.match(/^([a-z0-9]{20,})\.supabase\.co$/);
            if (m) dbStatus.projectRef = m[1];
          } catch {}
        }
      }
    } catch {}

    // List application tables (filter to public, exclude prisma migrations)
    try {
      const rows = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations' ORDER BY table_name"
      );
      const names = Array.isArray(rows) ? rows.map((r) => r.table_name) : [];
      dbStatus.tables = { count: names.length, names };
    } catch (err: any) {
      console.error('DB tables probe error:', err?.message);
    }
  } catch (error: any) {
    console.error('DB health probe error:', error?.message);
    dbStatus.status = 'error';
    dbStatus.connected = false;
  } finally {
    try {
      await prisma.$disconnect();
    } catch {}
  }

  const authStatus = { status: 'ok', provider: 'google' } as const;
  const billingStatus = { status: 'ok', provider: 'stripe' } as const;

  const overall: 'ok' | 'error' = dbStatus.status === 'ok' ? 'ok' : 'error';
  const now = new Date();
  const uptimeSeconds = Math.floor(process.uptime());

  const response = {
    status: overall,
    timestamp: now.toISOString(),
    uptime: `${uptimeSeconds}s`,
    services: {
      api: apiStatus,
      database: dbStatus,
      auth: authStatus,
      billing: billingStatus,
    },
    version: (pkg as any)?.version ?? '1.0.0',
  };

  res.status(overall === 'ok' ? 200 : 503).json(response);
}

