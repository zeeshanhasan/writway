import { Router, Request, Response } from 'express';
import { claimService } from '../services/claim.service';
import { documentService } from '../services/document.service';
import { 
  analyzeRequestSchema, 
  nextQuestionRequestSchema, 
  generateDocumentsRequestSchema 
} from '../schemas/claim.schemas';

export const router = Router();

/**
 * POST /api/v1/claim/analyze
 * Analyze claim description and extract structured data
 */
router.post('/analyze', async (req: Request, res: Response) => {
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
});

/**
 * POST /api/v1/claim/questions/next
 * Get next question based on current claim data
 */
router.post('/questions/next', async (req: Request, res: Response) => {
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
});

/**
 * POST /api/v1/claim/generate
 * Generate Form 7A and Schedule A text documents using OpenAI
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    console.log('[ROUTE] /generate request received');
    console.log('[ROUTE] Request body keys:', Object.keys(req.body || {}));
    
    // Validate request body
    const validationResult = generateDocumentsRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.error('[ROUTE] Validation failed:', validationResult.error.errors);
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

    const { claimData, initialDescription } = validationResult.data;
    console.log('[ROUTE] Has claimData:', !!claimData);
    console.log('[ROUTE] Has initialDescription:', !!initialDescription);

    // Generate documents (text only from OpenAI)
    console.log('[ROUTE] Calling documentService.generateDocuments...');
    const startTime = Date.now();
    const documents = await documentService.generateDocuments(claimData, initialDescription);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`[ROUTE] Document generation completed in ${duration}s`);
    console.log('[ROUTE] Has claimType:', !!documents.claimType);
    console.log('[ROUTE] Form 7A length:', documents.form7AText?.length || 0);
    console.log('[ROUTE] Schedule A length:', documents.scheduleAText?.length || 0);

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
    console.error('[ROUTE] Document generation error:', error);
    console.error('[ROUTE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

