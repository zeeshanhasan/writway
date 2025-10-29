/**
 * Document Generation Service
 * Generates PDF and Word documents for legal claims
 */

import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { ClaimFormData } from '../schemas/claim.schemas';
import { getOpenAIClient } from '../integrations/openai/openai.client';

export interface GeneratedDocuments {
  pdf: Buffer;
  word: Buffer;
}

export class DocumentService {
  /**
   * Generate PDF document
   */
  async generatePDF(claimData: ClaimFormData, initialDescription?: string): Promise<Buffer> {
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

        // Header
        doc.fontSize(20).text('ONTARIO SMALL CLAIMS COURT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('PLAINTIFF\'S CLAIM (Form 7A)', { align: 'center' });
        doc.moveDown(2);

        // Plaintiff Information
        if (claimData.plaintiff) {
          doc.fontSize(14).text('PLAINTIFF INFORMATION', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          
          if (claimData.plaintiff.fullName) {
            doc.text(`Name: ${claimData.plaintiff.fullName}`);
          }
          if (claimData.plaintiff.filingType) {
            doc.text(`Filing as: ${claimData.plaintiff.filingType}`);
          }
          if (claimData.plaintiff.address && claimData.plaintiff.city) {
            doc.text(`Address: ${claimData.plaintiff.address}, ${claimData.plaintiff.city}, ${claimData.plaintiff.province || ''} ${claimData.plaintiff.postalCode || ''}`);
          }
          if (claimData.plaintiff.phone) {
            doc.text(`Phone: ${claimData.plaintiff.phone}`);
          }
          if (claimData.plaintiff.email) {
            doc.text(`Email: ${claimData.plaintiff.email}`);
          }
          doc.moveDown();
        }

        // Defendant Information
        if (claimData.defendants && claimData.defendants.defendants) {
          doc.fontSize(14).text('DEFENDANT INFORMATION', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          
          claimData.defendants.defendants.forEach((defendant, index) => {
            doc.text(`Defendant ${index + 1}:`);
            doc.text(`  Name: ${defendant.fullName}`);
            doc.text(`  Type: ${defendant.type}`);
            if (defendant.address) {
              doc.text(`  Address: ${defendant.address}`);
            }
            doc.moveDown(0.5);
          });
          doc.moveDown();
        }

        // Statement of Claim
        doc.fontSize(14).text('STATEMENT OF CLAIM', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        
        if (initialDescription) {
          doc.text(initialDescription);
        } else if (claimData.claimDetails?.description) {
          doc.text(claimData.claimDetails.description);
        } else {
          doc.text('[Statement of claim will be generated here]');
        }
        doc.moveDown();

        // Amount Claimed
        if (claimData.amount) {
          doc.fontSize(14).text('AMOUNT CLAIMED', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          
          if (claimData.amount.principalAmount) {
            doc.text(`Principal Amount: $${claimData.amount.principalAmount}`);
          }
          if (claimData.amount.totalAmount) {
            doc.fontSize(14).text(`TOTAL: $${claimData.amount.totalAmount}`, { align: 'right' });
          }
          doc.moveDown();
        }

        // Remedy Sought
        if (claimData.remedy) {
          doc.fontSize(14).text('REMEDY SOUGHT', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          
          const remedies: string[] = [];
          if (claimData.remedy.payMoney) remedies.push('Payment of money');
          if (claimData.remedy.returnProperty) remedies.push('Return of property');
          if (claimData.remedy.performObligation) remedies.push('Performance of obligation');
          
          if (remedies.length > 0) {
            doc.text(remedies.join(', '));
          }
        }

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
   * Generate Word document
   */
  async generateWord(claimData: ClaimFormData, initialDescription?: string): Promise<Buffer> {
    const paragraphs: Paragraph[] = [];

    // Title
    paragraphs.push(
      new Paragraph({
        text: 'ONTARIO SMALL CLAIMS COURT',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      })
    );
    paragraphs.push(
      new Paragraph({
        text: 'PLAINTIFF\'S CLAIM (Form 7A)',
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
      })
    );
    paragraphs.push(new Paragraph({ text: '' }));

    // Plaintiff Information
    if (claimData.plaintiff) {
      paragraphs.push(
        new Paragraph({
          text: 'PLAINTIFF INFORMATION',
          heading: HeadingLevel.HEADING_3,
        })
      );
      
      const plaintiffDetails: string[] = [];
      if (claimData.plaintiff.fullName) {
        plaintiffDetails.push(`Name: ${claimData.plaintiff.fullName}`);
      }
      if (claimData.plaintiff.filingType) {
        plaintiffDetails.push(`Filing as: ${claimData.plaintiff.filingType}`);
      }
      if (claimData.plaintiff.address && claimData.plaintiff.city) {
        plaintiffDetails.push(`Address: ${claimData.plaintiff.address}, ${claimData.plaintiff.city}, ${claimData.plaintiff.province || ''} ${claimData.plaintiff.postalCode || ''}`);
      }
      if (claimData.plaintiff.phone) {
        plaintiffDetails.push(`Phone: ${claimData.plaintiff.phone}`);
      }
      if (claimData.plaintiff.email) {
        plaintiffDetails.push(`Email: ${claimData.plaintiff.email}`);
      }
      
      plaintiffDetails.forEach(detail => {
        paragraphs.push(new Paragraph({ text: detail }));
      });
      paragraphs.push(new Paragraph({ text: '' }));
    }

    // Defendant Information
    if (claimData.defendants && claimData.defendants.defendants) {
      paragraphs.push(
        new Paragraph({
          text: 'DEFENDANT INFORMATION',
          heading: HeadingLevel.HEADING_3,
        })
      );
      
      claimData.defendants.defendants.forEach((defendant, index) => {
        paragraphs.push(new Paragraph({ text: `Defendant ${index + 1}:` }));
        paragraphs.push(new Paragraph({ text: `  Name: ${defendant.fullName}` }));
        paragraphs.push(new Paragraph({ text: `  Type: ${defendant.type}` }));
        if (defendant.address) {
          paragraphs.push(new Paragraph({ text: `  Address: ${defendant.address}` }));
        }
        paragraphs.push(new Paragraph({ text: '' }));
      });
    }

    // Statement of Claim
    paragraphs.push(
      new Paragraph({
        text: 'STATEMENT OF CLAIM',
        heading: HeadingLevel.HEADING_3,
      })
    );
    
    const statementText = initialDescription || claimData.claimDetails?.description || '[Statement of claim will be generated here]';
    paragraphs.push(new Paragraph({ text: statementText }));
    paragraphs.push(new Paragraph({ text: '' }));

    // Amount Claimed
    if (claimData.amount) {
      paragraphs.push(
        new Paragraph({
          text: 'AMOUNT CLAIMED',
          heading: HeadingLevel.HEADING_3,
        })
      );
      
      if (claimData.amount.principalAmount) {
        paragraphs.push(new Paragraph({ text: `Principal Amount: $${claimData.amount.principalAmount}` }));
      }
      if (claimData.amount.totalAmount) {
        paragraphs.push(
          new Paragraph({
            text: `TOTAL: $${claimData.amount.totalAmount}`,
            alignment: AlignmentType.RIGHT,
          })
        );
      }
      paragraphs.push(new Paragraph({ text: '' }));
    }

    // Remedy Sought
    if (claimData.remedy) {
      paragraphs.push(
        new Paragraph({
          text: 'REMEDY SOUGHT',
          heading: HeadingLevel.HEADING_3,
        })
      );
      
      const remedies: string[] = [];
      if (claimData.remedy.payMoney) remedies.push('Payment of money');
      if (claimData.remedy.returnProperty) remedies.push('Return of property');
      if (claimData.remedy.performObligation) remedies.push('Performance of obligation');
      
      if (remedies.length > 0) {
        paragraphs.push(new Paragraph({ text: remedies.join(', ') }));
      }
    }

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
   * Generate both PDF and Word documents
   */
  async generateDocuments(
    claimData: ClaimFormData,
    initialDescription?: string
  ): Promise<GeneratedDocuments> {
    const [pdf, word] = await Promise.all([
      this.generatePDF(claimData, initialDescription),
      this.generateWord(claimData, initialDescription),
    ]);

    return { pdf, word };
  }
}

export const documentService = new DocumentService();

