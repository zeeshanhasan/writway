// Analyze claim description endpoint
export default async function handler(req: any, res: any) {
  // Load modules at runtime
  const { claimService } = require('../../../dist/services/claim.service.js');
  const { analyzeRequestSchema } = require('../../../dist/schemas/claim.schemas.js');

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
    const validationResult = analyzeRequestSchema.safeParse(req.body);
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

    const { description } = validationResult.data;

    // Analyze description
    const result = await claimService.analyzeDescription(description);

    return res.status(200).json({
      success: true,
      data: result,
      error: null
    });
  } catch (error) {
    console.error('Claim analyze error:', error);
    
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

