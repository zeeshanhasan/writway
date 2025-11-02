// Generate documents endpoint
export default async function handler(req: any, res: any) {
  // Load modules at runtime
  const { documentService } = require('../../../dist/services/document.service.js');
  const { generateDocumentsRequestSchema } = require('../../../dist/schemas/claim.schemas.js');

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

  console.log('[GENERATE] Request received');
  console.log('[GENERATE] Method:', req.method);
  console.log('[GENERATE] Request body keys:', Object.keys(req.body || {}));
  
  try {
    console.log('[GENERATE] Validating request body...');
    // Validate request body
    const validationResult = generateDocumentsRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.error('[GENERATE] Validation failed:', validationResult.error.errors);
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

    console.log('[GENERATE] Validation passed');
    const { claimData, initialDescription } = validationResult.data;
    console.log('[GENERATE] Has claimData:', !!claimData);
    console.log('[GENERATE] Has initialDescription:', !!initialDescription);

    console.log('[GENERATE] Calling documentService.generateDocuments...');
    const startTime = Date.now();
    
    // Generate documents (text only from OpenAI)
    const documents = await documentService.generateDocuments(claimData, initialDescription);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[GENERATE] Document generation completed in ${duration}s`);
    console.log('[GENERATE] Has claimType:', !!documents.claimType);
    console.log('[GENERATE] Form 7A length:', documents.form7AText?.length || 0);
    console.log('[GENERATE] Schedule A length:', documents.scheduleAText?.length || 0);

    console.log('[GENERATE] Sending response...');
    return res.status(200).json({
      success: true,
      data: {
        claimType: documents.claimType,
        legalBases: documents.legalBases,
        form7AText: documents.form7AText,
        scheduleAText: documents.scheduleAText,
        warnings: documents.warnings,
      },
      error: null
    });
  } catch (error) {
    console.error('[GENERATE] Document generation error:', error);
    console.error('[GENERATE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
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

