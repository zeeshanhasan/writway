import serverless from 'serverless-http';

// Lazy load the app to avoid initialization issues
let app: any = null;
let handler: any = null;

async function getApp() {
  if (!app) {
    try {
      console.log('Loading app...');
      const appModule = await import('../src/app');
      app = appModule.app;
      console.log('App loaded successfully');
    } catch (error) {
      console.error('Failed to load app:', error);
      throw error;
    }
  }
  return app;
}

async function getHandler() {
  if (!handler) {
    try {
      const appInstance = await getApp();
      handler = serverless(appInstance, {
        binary: ['image/*', 'application/pdf']
      });
      console.log('Handler created successfully');
    } catch (error) {
      console.error('Failed to create handler:', error);
      throw error;
    }
  }
  return handler;
}

export default async (req: any, res: any) => {
  try {
    console.log('Serverless function called - VERSION 1.0.2:', req.method, req.url);
    console.log('Environment check:', {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      version: '1.0.2-vercel-ts-direct'
    });
    
    const serverlessHandler = await getHandler();
    return await serverlessHandler(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return a proper HTTP response
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Serverless function failed to execute',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      }
    }));
  }
};

