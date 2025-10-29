// Generate documents endpoint
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
    // In production, you might want to upload to S3 and return URLs instead
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
}

