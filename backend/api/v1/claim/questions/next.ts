// Get next question endpoint
export default async function handler(req: any, res: any) {
  // CORS headers for cross-origin requests
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((o: string) => o.trim()) || ['http://localhost:3000'];
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Load modules at runtime
  const { claimService } = require('../../../../dist/services/claim.service.js');
  const { nextQuestionRequestSchema } = require('../../../../dist/schemas/claim.schemas.js');

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      data: null,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed'
      }
    });
  }

  try {
    // Validate request body
    const validationResult = nextQuestionRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validationResult.error.errors
        }
      });
    }

    const { claimData, answeredQuestions = [] } = validationResult.data;

    // Get next question
    const result = await claimService.getNextQuestion(claimData, answeredQuestions);

    return res.status(200).json({
      success: true,
      data: result,
      error: null
    });
  } catch (error) {
    console.error('Get next question error:', error);
    
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

