import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
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
app.use(cookieParser());
app.use(requestIdMiddleware);

// Initialize Passport middleware globally
// TEMPORARILY DISABLED FOR DEBUGGING
console.log('Skipping passport initialization for now');
// app.use(passport.initialize());

// Health & readiness (lightweight, no auth)
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ 
    success: true, 
    data: { 
      status: 'ok', 
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: 'v1.0.1-cookie-fix-deployed'  // Version marker
    }, 
    error: null 
  });
});

// Debug endpoint to check environment variables
app.get('/api/v1/debug/env', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasJwtRefreshSecret: !!process.env.JWT_REFRESH_SECRET,
      hasCorsOrigin: !!process.env.CORS_ORIGIN,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasGoogleCallbackUrl: !!process.env.GOOGLE_CALLBACK_URL,
      hasPrismaDisablePreparedStatements: !!process.env.PRISMA_DISABLE_PREPARED_STATEMENTS,
      nodeEnv: process.env.NODE_ENV,
      // Don't expose actual values for security
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
      corsOrigin: process.env.CORS_ORIGIN
    },
    error: null
  });
});

// Simple test endpoint that doesn't require database
app.get('/api/v1/test', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Serverless function is working!',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
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
import { router as claimRouter } from './routes/claim';
import { authMiddleware } from './middlewares/auth';

// Mount versioned API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/tenant', authMiddleware, tenantRouter);
app.use('/api/v1/plan', planRouter);
app.use('/api/v1/billing', authMiddleware, billingRouter);
app.use('/api/v1/claim', claimRouter); // Claim routes (no auth required for public claim form)

// Global error handler (must be last)
app.use(errorHandler);

export default app;
