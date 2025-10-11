import serverless from 'serverless-http';

let handler: any = null;

async function getHandler() {
  if (!handler) {
    try {
      // Import from dist in production (compiled), src in dev
      const appModule = process.env.NODE_ENV === 'production' 
        ? await import('../../dist/app')
        : await import('../../src/app');
      
      handler = serverless(appModule.app, {
        binary: ['image/*', 'application/pdf']
      });
    } catch (error) {
      console.error('Failed to create handler:', error);
      throw error;
    }
  }
  return handler;
}

export default async (req: any, res: any) => {
  try {
    const serverlessHandler = await getHandler();
    return await serverlessHandler(req, res);
  } catch (error) {
    console.error('Health endpoint error:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
};

