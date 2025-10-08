export default async function handler(_req: any, res: any) {
  try {
    return res.status(200).json({ 
      success: true, 
      data: { 
        status: 'ok', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
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

