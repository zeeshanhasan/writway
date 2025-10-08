import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler';
import { requestIdMiddleware } from './middlewares/requestId';
import { checkDatabaseReady } from './utils/dbHealth';

export const app = express();

// Security & parsing
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(requestIdMiddleware);

// Health & readiness (lightweight, no auth)
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ 
    success: true, 
    data: { 
      status: 'ok', 
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }, 
    error: null 
  });
});

app.get('/api/v1/ready', async (_req: Request, res: Response) => {
  const dbReady = await checkDatabaseReady();
  
  if (!dbReady) {
    return res.status(503).json({ 
      success: false, 
      data: null, 
      error: { 
        code: 'DB_UNAVAILABLE', 
        message: 'Database not ready' 
      }
    });
  }
  
  res.json({ 
    success: true, 
    data: { 
      db: 'connected',
      timestamp: new Date().toISOString()
    }, 
    error: null 
  });
});

// Import routers
import { router as authRouter } from './routes/auth';
import { router as tenantRouter } from './routes/tenant';
import { router as planRouter } from './routes/plan';
import { router as billingRouter } from './routes/billing';
import { authMiddleware } from './middlewares/auth';

// Mount versioned API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/tenant', authMiddleware, tenantRouter);
app.use('/api/v1/plan', planRouter);
app.use('/api/v1/billing', authMiddleware, billingRouter);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
