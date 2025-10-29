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
 * Generate PDF and Word documents
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = generateDocumentsRequestSchema.safeParse(req.body);
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

    const { claimData, initialDescription } = validationResult.data;

    // Generate documents
    const documents = await documentService.generateDocuments(claimData, initialDescription);

    // Convert buffers to base64 for JSON response
    const pdfBase64 = documents.pdf.toString('base64');
    const wordBase64 = documents.word.toString('base64');

    return res.status(200).json({
      success: true,
      data: {
        pdf: {
          content: pdfBase64,
          filename: 'statement-of-claim.pdf',
          mimeType: 'application/pdf'
        },
        word: {
          content: wordBase64,
          filename: 'statement-of-claim.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      },
      error: null
    });
  } catch (error) {
    console.error('Document generation error:', error);
    
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

