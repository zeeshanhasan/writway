// Lightweight health check - no Express app loading
export default async function handler(_req: any, res: any) {
  try {
    return res.status(200).json({ 
      success: true, 
      data: { 
        status: 'ok', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: 'v1.0.2-standalone-health'  // Version marker
      }, 
      error: null 
    });
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
}

