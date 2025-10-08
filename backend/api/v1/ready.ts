import { checkDatabaseReady } from '../../src/utils/dbHealth';

export default async function handler(_req: any, res: any) {
  try {
    const dbReady = await checkDatabaseReady();
    
    if (!dbReady) {
      return res.status(503).json({ 
        success: false, 
        data: { db: 'disconnected' }, 
        error: { 
          code: 'DB_UNAVAILABLE', 
          message: 'Database not ready' 
        }
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: { db: 'connected' }, 
      error: null 
    });
  } catch (error) {
    console.error('Ready endpoint error:', error);
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

