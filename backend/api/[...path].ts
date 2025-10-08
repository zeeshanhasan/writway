import serverless from 'serverless-http';
import app from '../src/app';

// Wrap the serverless function with error handling
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf']
});

export default async (req: any, res: any) => {
  try {
    return await handler(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Serverless function failed to execute'
        }
      })
    };
  }
};

