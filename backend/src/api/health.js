const express = require('express');
const prisma = require('../config/prisma');
const pkg = require('../../package.json');

const router = express.Router();

router.get('/', async (req, res) => {
  const startedAt = process.hrtime.bigint();

  // API server status (route responded if we are here)
  const apiStatus = { status: 'ok' };

  // Database probe
  let dbStatus = { status: 'ok', connected: true, name: null, projectRef: null, latency_ms: null, tables: { count: null, names: [] } };
  try {
    const dbStart = process.hrtime.bigint();
    // Prefer a connectivity check without queries to avoid prepared statements under PgBouncer
    await prisma.$connect();
    const dbEnd = process.hrtime.bigint();
    dbStatus.latency_ms = Number(dbEnd - dbStart) / 1_000_000; // ns -> ms
    try {
      // Derive DB name from connection string to avoid executing queries in PgBouncer
      const url = process.env.DATABASE_URL;
      if (url) {
        const u = new URL(url);
        // Path begins with '/'
        dbStatus.name = (u.pathname || '').replace(/^\//, '') || null;
        // Try to extract Supabase project ref from username (postgres.<ref>) or SUPABASE_URL
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
          } catch (_) {}
        }
      }
    } catch (_) {
      // ignore parsing errors; name stays null
    }

    // Fetch tables list (non-prepared; safe under PgBouncer with prepared statements disabled)
    try {
      const rows = await prisma.$queryRawUnsafe(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations' ORDER BY table_name"
      );
      const names = Array.isArray(rows) ? rows.map(r => r.table_name) : [];
      dbStatus.tables = { count: names.length, names };
    } catch (err) {
      // If querying tables fails, keep connectivity status but omit names
      console.error('DB tables probe error:', err?.message);
    }
  } catch (error) {
    console.error('DB health probe error:', error?.message);
    dbStatus.status = 'error';
    dbStatus.connected = false;
  } finally {
    try { await prisma.$disconnect(); } catch (_) {}
  }

  // Optional placeholders for auth and billing
  const authStatus = { status: 'ok', provider: 'google' };
  const billingStatus = { status: 'ok', provider: 'stripe' };

  // Overall status
  const overall = dbStatus.status === 'ok' ? 'ok' : 'error';

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
      billing: billingStatus
    },
    version: pkg.version
  };

  res.status(overall === 'ok' ? 200 : 503).json(response);
});

module.exports = router;


