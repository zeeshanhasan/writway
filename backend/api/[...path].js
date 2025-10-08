const serverless = require('serverless-http');

// Lazy load the app to avoid initialization issues
let app = null;
let handler = null;

async function getApp() {
  if (!app) {
    try {
      console.log('Loading app...');
      const appModule = await import('../dist/app.js');
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

module.exports = async (req, res) => {
  try {
    console.log('Serverless function called:', req.method, req.path);
    const serverlessHandler = await getHandler();
    return await serverlessHandler(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Serverless function failed to execute',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    };
  }
};
