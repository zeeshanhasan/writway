import express from 'express';

const app = express();

app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    error: null
  });
});

app.get('/api/v1/debug/env', (req, res) => {
  res.json({
    success: true,
    data: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0
    },
    error: null
  });
});

export default app;
