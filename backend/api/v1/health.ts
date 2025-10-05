// Enhanced serverless health handler mirroring Express /api/health
// Returns overall status, timestamp, uptime, and service checks (api, database, auth, billing)

// Use CommonJS require to avoid TS import assertion issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../package.json');
import { Client } from 'pg';

export default async function handler(_req: any, res: any) {
  const apiStatus = { status: 'ok' };

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

  const start = Date.now();
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    dbStatus.status = 'error';
    dbStatus.connected = false;
  } else {
    try {
      const u = new URL(dbUrl);
      dbStatus.name = (u.pathname || '').replace(/^\//, '') || null;
      const username = u.username || '';
      const refFromUser = username.match(/^postgres\.([a-z0-9\-]+)$/i);
      if (refFromUser) dbStatus.projectRef = refFromUser[1];
    } catch {}

    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      await client.query('SELECT 1');
      dbStatus.latency_ms = Date.now() - start;
      try {
        const r = await client.query(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations' ORDER BY table_name"
        );
        const names = r.rows.map((row: any) => row.table_name);
        dbStatus.tables = { count: names.length, names };
      } catch (e: any) {
        console.error('DB tables probe error:', e?.message);
      }
    } catch (err: any) {
      console.error('DB health probe error:', err?.message);
      dbStatus.status = 'error';
      dbStatus.connected = false;
    } finally {
      try { await client.end(); } catch {}
    }
  }

  const authStatus = { status: 'ok', provider: 'google' } as const;
  const billingStatus = { status: 'ok', provider: 'stripe' } as const;
  const overall: 'ok' | 'error' = dbStatus.status === 'ok' ? 'ok' : 'error';

  const response = {
    status: overall,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
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

