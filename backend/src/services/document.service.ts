/**
 * Document Generation Service
 * Generates PDF and Word documents for legal claims
 */

import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { ClaimFormData } from '../schemas/claim.schemas';
import { getOpenAIClient } from '../integrations/openai/openai.client';

export interface GeneratedDocuments {
  claimType: string;
  legalBases?: string;
  form7AText: string;
  scheduleAText: string;
  warnings?: string;
  pdf: Buffer;
  word: Buffer;
}

export class DocumentService {
  /**
   * Generate PDF document from OpenAI-generated text
   */
  async generatePDFFromText(form7AText: string, scheduleAText: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const buffers: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Split Form 7A text by lines and add to PDF
        const form7ALines = form7AText.split('\n');
        form7ALines.forEach((line, index) => {
          // Handle headers (uppercase text)
          if (line.trim().toUpperCase() === line.trim() && line.trim().length > 0 && !line.trim().startsWith(' ')) {
            doc.fontSize(14).text(line.trim(), { align: 'left' });
            doc.moveDown(0.5);
          } else {
            doc.fontSize(11).text(line, { align: 'left' });
            if (index < form7ALines.length - 1) {
              doc.moveDown(0.3);
            }
          }
        });

        // Add Schedule A on a new page
        doc.addPage();
        doc.fontSize(16).text('SCHEDULE "A"', { align: 'center' });
        doc.fontSize(14).text('STATEMENT OF FACTS', { align: 'center' });
        doc.moveDown(2);

        // Split Schedule A text by lines and add to PDF
        const scheduleALines = scheduleAText.split('\n');
        scheduleALines.forEach((line) => {
          if (line.trim().length > 0) {
            doc.fontSize(11).text(line, { align: 'left' });
            doc.moveDown(0.4);
          }
        });

        // Footer
        doc.fontSize(10).text(
          `Generated on ${new Date().toLocaleDateString('en-CA', { timeZone: 'UTC' })} by WritWay`,
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Word document from OpenAI-generated text
   */
  async generateWordFromText(form7AText: string, scheduleAText: string): Promise<Buffer> {
    const paragraphs: Paragraph[] = [];

    // Add Form 7A text
    const form7ALines = form7AText.split('\n');
    form7ALines.forEach((line) => {
      if (line.trim().length > 0) {
        // Check if line is a header (uppercase and no leading space)
        if (line.trim().toUpperCase() === line.trim() && !line.trim().startsWith(' ') && line.trim().length > 5) {
          paragraphs.push(
            new Paragraph({
              text: line.trim(),
              heading: HeadingLevel.HEADING_3,
            })
          );
        } else {
          paragraphs.push(new Paragraph({ text: line }));
        }
      } else {
        paragraphs.push(new Paragraph({ text: '' }));
      }
    });

    // Add page break before Schedule A
    paragraphs.push(
      new Paragraph({
        text: '',
        pageBreakBefore: true,
      })
    );

    // Add Schedule A header
    paragraphs.push(
      new Paragraph({
        text: 'SCHEDULE "A"',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      })
    );
    paragraphs.push(
      new Paragraph({
        text: 'STATEMENT OF FACTS',
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
      })
    );
    paragraphs.push(new Paragraph({ text: '' }));

    // Add Schedule A text
    const scheduleALines = scheduleAText.split('\n');
    scheduleALines.forEach((line) => {
      if (line.trim().length > 0) {
        paragraphs.push(new Paragraph({ text: line }));
      } else {
        paragraphs.push(new Paragraph({ text: '' }));
      }
    });

    // Footer
    paragraphs.push(new Paragraph({ text: '' }));
    paragraphs.push(
      new Paragraph({
        text: `Generated on ${new Date().toLocaleDateString('en-CA', { timeZone: 'UTC' })} by WritWay`,
        alignment: AlignmentType.CENTER,
      })
    );

    const doc = new Document({
      sections: [
        {
          children: paragraphs,
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  /**
   * Generate documents using OpenAI (text only, no PDF/Word generation)
   */
  async generateDocuments(
    claimData: ClaimFormData,
    initialDescription?: string
  ): Promise<GeneratedDocuments> {
    // Use OpenAI to generate Form 7A and Schedule A
    const openAIClient = getOpenAIClient();
    const { claimType, legalBases, form7A, scheduleA, warnings } = await openAIClient.generateForm7AAndScheduleA(claimData);

    // Return empty buffers for PDF and Word (not generating them anymore)
    const emptyPdfBuffer = Buffer.from('');
    const emptyWordBuffer = Buffer.from('');

    return {
      claimType,
      legalBases,
      form7AText: form7A,
      scheduleAText: scheduleA,
      warnings,
      pdf: emptyPdfBuffer,
      word: emptyWordBuffer,
    };
  }
}

export const documentService = new DocumentService();

