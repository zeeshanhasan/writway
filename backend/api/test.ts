export default async function handler(req: any, res: any) {
  try {
    console.log('Test function called');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        data: {
          message: 'Minimal serverless function is working!',
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.path
        },
        error: null
      })
    };
  } catch (error) {
    console.error('Test function error:', error);
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
          message: 'Test function failed'
        }
      })
    };
  }
}
