/**
 * OpenAI Integration Client
 * Follows backend.mdc patterns for third-party integrations
 */

import OpenAI from 'openai';
import { OpenAIExtractionResponse } from './openai.types';

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

class OpenAIClient {
  private client: OpenAI | null = null;
  private isEnabled: boolean;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.isEnabled = !!apiKey;

    if (!this.isEnabled) {
      console.warn('OpenAI API key not found. OpenAI features will be disabled.');
      return;
    }

    this.client = new OpenAI({
      apiKey,
      timeout: DEFAULT_TIMEOUT,
      maxRetries: MAX_RETRIES,
    });
  }

  /**
   * Extract structured data from claim description
   */
  async extractClaimData(description: string): Promise<OpenAIExtractionResponse> {
    if (!this.isEnabled || !this.client) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini', // Using cheaper model for extraction
        messages: [
          {
            role: 'system',
            content: `You are a legal assistant extracting structured data from claim descriptions for Ontario Small Claims Court.

Extract ALL information you can find from the description. Look carefully for:

ELIGIBILITY:
- totalAmount: The total dollar amount being claimed (look for "$X", "X dollars", etc.)
- isAmountUnder35000: true if amount is $35,000 or less (calculate this if you found amount)
- isBasedInOntario: true if location mentioned is in Ontario, or if transaction happened in Ontario
- issueDate: Date when the problem/issue occurred (any date format is fine, convert to YYYY-MM-DD)
- claimType: "money" if claiming payment owed, "property" if returning property, "damages" if claiming losses/damages

PLAINTIFF (the person making the claim):
- plaintiffName: Name of the person/entity making the claim (may be implied as "I")
- filingType: "individual" (one person), "business", or "organization"
- plaintiffAddress: Street address if mentioned
- plaintiffCity: City if mentioned (e.g., "Toronto")
- plaintiffProvince: Province if mentioned (e.g., "Ontario")
- plaintiffPostalCode: Postal code if mentioned
- plaintiffPhone: Phone number if mentioned
- plaintiffEmail: Email if mentioned

DEFENDANT (the person/entity being sued):
- defendantCount: Number of defendants (usually 1)
- defendants: Array with:
  - fullName: Name of defendant (e.g., "John Smith", "JS Home Renovations")
  - type: "individual", "business", or "corporation"
  - registeredBusinessName: Business name if operating under a business name

CLAIM DETAILS:
- issueStartDate: When the problem started (convert to YYYY-MM-DD format)
- location: Where the incident happened (e.g., "Toronto, Ontario", "my home in Toronto")
- agreement: Description of any contract/agreement (e.g., "written agreement on May 15, 2024 for $12,000")
- defendantAction: What the defendant did wrong (e.g., "stopped showing up", "failed to complete work")
- askedToResolve: true if plaintiff tried to resolve before suing (look for "contacted", "asked for", "requested")
- response: What defendant said/did in response (or "no response" if ignored)
- partialPayments: true if defendant made partial payments
- partialPaymentDetails: Details about partial payments

AMOUNT:
- principalAmount: The main amount being claimed (deposit, payment owed, etc.)
- totalAmount: Total of principal + damages + costs (look for phrases like "total of $X", "claiming $X")
- claimingInterest: true if text mentions "interest"
- claimingCosts: true if text mentions "costs", "filing fees", etc.
- claimingDamages: true if claiming additional damages beyond principal (e.g., "lost $600 in damaged materials")
- damagesAmount: Amount of damages if specified separately

REMEDY:
- payMoney: true if seeking money payment (usually true for money claims)
- returnProperty: true if seeking return of property
- performObligation: true if seeking performance of an obligation

EVIDENCE:
- documents: List of documents mentioned (contracts, receipts, emails, etc.)
- hasWitnesses: true if witnesses mentioned
- witnessDetails: Details about witnesses if mentioned

Return a JSON object with:
- "extracted": object with all fields you found (include ALL fields you can identify, even if partially complete)
- "missing": array of field names that are COMPLETELY absent (not just incomplete)
- "ambiguous": array of {field, reason, question} for fields that need clarification

Be VERY thorough - extract everything you can find. For dates, convert to YYYY-MM-DD format. For amounts, extract numbers. For locations, extract city and province.`,
          },
          {
            role: 'user',
            content: `Extract ALL data from this claim description. Be thorough and extract every detail you can find:\n\n${description}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2, // Lower temperature for more precise extraction
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      const parsed = JSON.parse(content) as OpenAIExtractionResponse;
      
      // Log usage for cost tracking
      const usage = response.usage;
      if (usage) {
        console.log(`OpenAI usage - tokens: ${usage.total_tokens}, cost estimate: ~$${((usage.prompt_tokens * 0.15 + usage.completion_tokens * 0.6) / 1000000).toFixed(4)}`);
      }

      return parsed;
    } catch (error) {
      console.error('OpenAI extraction error:', error);
      
      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
          throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
        }
        if (error.status === 401) {
          throw new Error('OpenAI API key invalid');
        }
      }
      
      throw new Error(`Failed to extract claim data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a question for a specific field
   */
  async generateQuestion(
    field: string,
    context: string,
    description: string
  ): Promise<{ question: string; type: string; options?: string[] }> {
    if (!this.isEnabled || !this.client) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a legal assistant creating clear, concise questions for claim forms.
            Generate a single question to clarify the missing field. Return JSON with:
            - "question": the question text
            - "type": "text" | "number" | "date" | "select" | "boolean" | "textarea"
            - "options": array if type is "select"
            Keep questions simple and user-friendly.`,
          },
          {
            role: 'user',
            content: `Generate a question for field: ${field}
            Context: ${context}
            Original description: ${description}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      return JSON.parse(content) as { question: string; type: string; options?: string[] };
    } catch (error) {
      console.error('OpenAI question generation error:', error);
      throw new Error(`Failed to generate question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Statement of Claim paragraph
   */
  async generateStatementOfClaim(claimData: Record<string, any>): Promise<string> {
    if (!this.isEnabled || !this.client) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a legal assistant drafting Statement of Claim paragraphs for Ontario Small Claims Court.
            Write a clear, professional statement in legal language that summarizes the claim based on the provided information.
            Keep it concise but complete, following standard legal document formatting.`,
          },
          {
            role: 'user',
            content: `Generate a Statement of Claim paragraph based on this data:\n\n${JSON.stringify(claimData, null, 2)}`,
          },
        ],
        temperature: 0.5,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI statement generation error:', error);
      throw new Error(`Failed to generate statement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Form 7A and Schedule A documents using OpenAI
   */
  async generateForm7AAndScheduleA(claimData: Record<string, any>): Promise<{
    claimType: string;
    legalBases?: string;
    form7A: string;
    scheduleA: string;
    warnings?: string;
  }> {
    if (!this.isEnabled || !this.client) {
      console.error('OpenAI API key check: FAILED - Key not configured');
      throw new Error('OpenAI API key not configured');
    }

    console.log('OpenAI API key check: PASSED - Key found');
    console.log('Starting OpenAI document generation...');

    try {
      // Test OpenAI connection first
      console.log('Testing OpenAI API connection...');
      try {
        const testResponse = await this.client.models.list();
        console.log('OpenAI connection test: SUCCESS');
      } catch (testError) {
        console.error('OpenAI connection test: FAILED', testError);
        if (testError instanceof OpenAI.APIError) {
          if (testError.status === 401) {
            throw new Error('OpenAI API key is invalid or expired');
          }
        }
        throw testError;
      }
      // Format user data for the prompt
      const formatClaimData = (data: Record<string, any>) => {
        let formatted = '';
        
        // Step 1 - Eligibility Check
        if (data.eligibility) {
          formatted += 'Step 1 – Eligibility Check:\n';
          formatted += `- Total Amount: ${data.eligibility.totalAmount || 'Not provided'}\n`;
          formatted += `- Amount under $35,000: ${data.eligibility.isAmountUnder35000 ? 'Yes' : 'No'}\n`;
          formatted += `- Based in Ontario: ${data.eligibility.isBasedInOntario ? 'Yes' : 'No'}\n`;
          formatted += `- Issue Date: ${data.eligibility.issueDate || 'Not provided'}\n`;
          formatted += `- Claim Type: ${data.eligibility.claimType || 'Not provided'}\n\n`;
        }

        // Step 2 – Plaintiff Information
        if (data.plaintiff) {
          formatted += 'Step 2 – Plaintiff Information:\n';
          formatted += `- Full Name: ${data.plaintiff.fullName || 'Not provided'}\n`;
          formatted += `- Filing Type: ${data.plaintiff.filingType || 'Not provided'}\n`;
          formatted += `- Address: ${data.plaintiff.address || 'Not provided'}\n`;
          formatted += `- City: ${data.plaintiff.city || 'Not provided'}\n`;
          formatted += `- Province: ${data.plaintiff.province || 'Not provided'}\n`;
          formatted += `- Postal Code: ${data.plaintiff.postalCode || 'Not provided'}\n`;
          formatted += `- Phone: ${data.plaintiff.phone || 'Not provided'}\n`;
          formatted += `- Email: ${data.plaintiff.email || 'Not provided'}\n`;
          if (data.plaintiff.hasRepresentative && data.plaintiff.representative) {
            formatted += `- Representative: ${JSON.stringify(data.plaintiff.representative)}\n`;
          }
          formatted += '\n';
        }

        // Step 3 – Defendant Information
        if (data.defendants) {
          formatted += 'Step 3 – Defendant Information:\n';
          formatted += `- Number of Defendants: ${data.defendants.count || 0}\n`;
          if (data.defendants.defendants && Array.isArray(data.defendants.defendants)) {
            data.defendants.defendants.forEach((def: any, idx: number) => {
              formatted += `- Defendant ${idx + 1}: ${JSON.stringify(def)}\n`;
            });
          }
          formatted += '\n';
        }

        // Step 4 – Details of the Claim
        if (data.claimDetails) {
          formatted += 'Step 4 – Details of the Claim:\n';
          formatted += `- Description: ${data.claimDetails.description || 'Not provided'}\n`;
          formatted += `- Issue Start Date: ${data.claimDetails.issueStartDate || 'Not provided'}\n`;
          formatted += `- Location: ${data.claimDetails.location || 'Not provided'}\n`;
          formatted += `- Agreement: ${data.claimDetails.agreement || 'Not provided'}\n`;
          formatted += `- Defendant Action: ${data.claimDetails.defendantAction || 'Not provided'}\n`;
          formatted += `- Asked to Resolve: ${data.claimDetails.askedToResolve ? 'Yes' : 'No'}\n`;
          if (data.claimDetails.response) {
            formatted += `- Response: ${data.claimDetails.response}\n`;
          }
          formatted += `- Partial Payments: ${data.claimDetails.partialPayments ? 'Yes' : 'No'}\n`;
          if (data.claimDetails.partialPaymentDetails) {
            formatted += `- Partial Payment Details: ${data.claimDetails.partialPaymentDetails}\n`;
          }
          formatted += '\n';
        }

        // Step 5 – Amount of Claim
        if (data.amount) {
          formatted += 'Step 5 – Amount of Claim:\n';
          formatted += `- Principal Amount: ${data.amount.principalAmount || '0.00'}\n`;
          formatted += `- Claiming Interest: ${data.amount.claimingInterest ? 'Yes' : 'No'}\n`;
          if (data.amount.interestRate) {
            formatted += `- Interest Rate: ${data.amount.interestRate}%\n`;
          }
          if (data.amount.interestDate) {
            formatted += `- Interest Date: ${data.amount.interestDate}\n`;
          }
          formatted += `- Claiming Costs: ${data.amount.claimingCosts ? 'Yes' : 'No'}\n`;
          if (data.amount.costsAmount) {
            formatted += `- Costs Amount: ${data.amount.costsAmount}\n`;
          }
          formatted += `- Claiming Damages: ${data.amount.claimingDamages ? 'Yes' : 'No'}\n`;
          if (data.amount.damagesDetails) {
            formatted += `- Damages Amount: ${data.amount.damagesDetails}\n`;
          }
          formatted += `- Total Amount: ${data.amount.totalAmount || '0.00'}\n\n`;
        }

        // Step 6 – Remedy Requested
        if (data.remedy) {
          formatted += 'Step 6 – Remedy Requested:\n';
          formatted += `- Pay Money: ${data.remedy.payMoney ? 'Yes' : 'No'}\n`;
          formatted += `- Return Property: ${data.remedy.returnProperty ? 'Yes' : 'No'}\n`;
          formatted += `- Perform Obligation: ${data.remedy.performObligation ? 'Yes' : 'No'}\n`;
          formatted += `- Interest and Costs: ${data.remedy.interestAndCosts ? 'Yes' : 'No'}\n\n`;
        }

        // Step 7 – Supporting Facts & Evidence
        if (data.evidence) {
          formatted += 'Step 7 – Supporting Facts & Evidence:\n';
          formatted += `- Documents: ${data.evidence.documents || 'Not provided'}\n`;
          formatted += `- Has Witnesses: ${data.evidence.hasWitnesses ? 'Yes' : 'No'}\n`;
          if (data.evidence.witnessDetails) {
            formatted += `- Witness Details: ${data.evidence.witnessDetails}\n`;
          }
          if (data.evidence.evidenceDescription) {
            formatted += `- Evidence Description: ${data.evidence.evidenceDescription}\n`;
          }
          if (data.evidence.timeline) {
            formatted += `- Timeline: ${data.evidence.timeline}\n`;
          }
        }

        return formatted;
      };

      const userContent = `Below are the user's answers to the Ontario Small Claims Intake Steps 1–7.\n\n${formatClaimData(claimData)}\n\nGenerate the following:\n1. Identified Claim Type and Legal Basis\n2. Completed draft of Form 7A following Ontario Small Claims layout and phrasing conventions.\n3. Detailed Schedule "A" in numbered paragraphs.\n4. Warnings, if the case might not qualify.`;

      console.log('Sending request to OpenAI API (gpt-4o-mini)...');
      const startTime = Date.now();
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a legal assistant specialized in preparing Ontario Small Claims Court filings. Your task is to:
1. Identify the type of claim based on the user's responses (e.g., breach of contract, unpaid invoice, property damage, negligence).
2. Generate a fully structured and formatted draft of Form 7A (Plaintiff's Claim) using the user's data.
3. Generate a detailed attachment called Schedule "A" (Statement of Facts), written in numbered paragraphs suitable for filing.
4. Follow the exact structural and stylistic conventions of the Ontario Small Claims Court sample Form 7A and Schedule A (SCR 7.01-7A, August 1, 2022).
5. Write in plain, factual, professional English suitable for legal filing — avoid emotional or speculative language.
6. Include placeholders where information is missing.

When generating the output, strictly follow this structure:

✅ Identified Claim Type and Legal Basis
Claim Type: [Type of claim, e.g., "Breach of Contract" or "Unpaid Invoice"]
Legal Basis: [Provide a brief explanation of the legal basis, e.g., "The Plaintiff provided consulting services under a verbal agreement with the Defendant. The Defendant failed to pay for the services rendered, amounting to a breach of contract and an unpaid account under Ontario law."]

IMPORTANT: Format the Claim Type and Legal Basis section EXACTLY as shown above, with "Claim Type:" on its own line followed by the type, then "Legal Basis:" on the next line followed by the explanation.

📄 Draft of Form 7A (replicating Ontario format)
📑 Schedule "A" (Statement of Facts, numbered paragraphs)
⚠️ Warnings (if any eligibility issues are detected)

---

### FORMATTING RULES
- Maintain uppercase headings (ONTARIO, Superior Court of Justice, Small Claims Court, etc.)
- Preserve form labels such as "Plaintiff No. 1", "Defendant No. 1", and "Prepared on:"
- Reference Schedule A in the Form 7A 'Reasons for Claim' section (e.g., "Please view attached Schedule A").
- Use placeholder values when fields are missing (e.g., [Insert date], [Insert city]).
- Automatically calculate and display the total claim amount if multiple amounts are given.

### VALIDATION
If:
- The claim exceeds $35,000, OR
- The claim does not arise in Ontario, OR
- The issue is older than 2 years,
Then include a final section:
⚠️ "This case may not qualify for Ontario Small Claims Court. Would you like to explore other options?"

### SCHEDULE "A" GUIDELINES
The Schedule A must be written in clear, numbered paragraphs, following legal style similar to this:

1. The Plaintiff, [Name], claims against the Defendant(s) for damages arising from [summary of issue].
2. The Defendant, [Name], was at all material times [role/relationship].
3. [Chronological background facts.]
4. [Breach or wrongful act.]
5. [Evidence and loss details.]
6. [Damages claimed, with amounts.]
7. [Relief sought and references to law.]

Ensure that Schedule A uses legal conventions (e.g., 'the Plaintiff pleads that…', 'at all material times…', 'the Defendant failed to…').`,
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
        temperature: 0.3, // Lower temperature for consistent legal formatting
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`OpenAI API response received in ${duration}s`);
      
      const content = response.choices[0]?.message?.content || '';
      console.log(`Response content length: ${content.length} characters`);
      console.log('Full OpenAI response (first 500 chars):', content.substring(0, 500));
      console.log('Full OpenAI response (last 500 chars):', content.substring(Math.max(0, content.length - 500)));
      
      // Parse the response to extract claim type, Form 7A, Schedule A, and warnings
      console.log('Parsing response content...');
      
      // More flexible parsing - try multiple patterns
      // Try to extract from the ✅ section which should have both claim type and legal basis
      const claimTypeSection = content.match(/✅\s*Identified Claim Type and Legal Basis[:\s]*\n\n?([\s\S]+?)(?=\n\n📄|📑|Form 7A|Schedule|⚠️|$)/is)
        || content.match(/✅\s*Identified Claim Type[:\s]*\n\n?([\s\S]+?)(?=\n\n📄|📑|Form 7A|Schedule|⚠️|$)/is);
      
      let claimType = 'Unknown';
      let legalBases: string | undefined = undefined;
      
      if (claimTypeSection) {
        const sectionText = claimTypeSection[1].trim();
        console.log('[PARSE] Claim type section found:', sectionText.substring(0, 300));
        
        // Handle different formats:
        // Format 1: "Claim Type: X\nLegal Basis: Y"
        // Format 2: "Claim Type: X Legal Basis: Y" (on same line)
        // Format 3: Just "Claim Type: X" followed by text
        
        // First, try to extract claim type (stop at "Legal Basis" if present)
        const claimTypeMatch = sectionText.match(/Claim Type[:\s]+([^\n]+?)(?=\s*Legal Basis|\n|$)/i);
        
        if (claimTypeMatch) {
          claimType = claimTypeMatch[1].trim();
          console.log('[PARSE] Extracted claim type:', claimType);
          
          // Now extract legal basis - remove the claim type part first
          const afterClaimType = sectionText.replace(/Claim Type[:\s]+[^\n]+/i, '').trim();
          
          // Try to find "Legal Basis:" label
          const legalBasisMatch = afterClaimType.match(/Legal Basis[:\s]+([\s\S]+?)(?=\n\n📄|📑|Form 7A|Schedule|⚠️|$)/is)
            || afterClaimType.match(/Legal Basis[:\s]+([^\n]+)/i);
          
          if (legalBasisMatch) {
            legalBases = legalBasisMatch[1].trim();
            console.log('[PARSE] Extracted legal bases:', legalBases.substring(0, 100));
          } else if (afterClaimType && afterClaimType.length > 20) {
            // If no "Legal Basis:" label but there's remaining text, use it
            legalBases = afterClaimType.split(/\n\n/)[0].trim();
            console.log('[PARSE] Extracted legal bases from remaining text:', legalBases.substring(0, 100));
          }
        } else {
          // Try format where both are on same line: "Claim Type: X Legal Basis: Y"
          const combinedMatch = sectionText.match(/Claim Type[:\s]+([^\n]+?)\s+Legal Basis[:\s]+([\s\S]+?)(?=\n\n📄|📑|Form 7A|Schedule|⚠️|$)/is);
          if (combinedMatch) {
            claimType = combinedMatch[1].trim();
            legalBases = combinedMatch[2].trim();
            console.log('[PARSE] Extracted both from combined format');
          }
        }
      } else {
        // Fallback: try separate matches in full content
        const claimTypeMatch = content.match(/Claim Type[:\s]+([^\n]+?)(?=\s+Legal Basis|📄|Form 7A|\n\n|$)/i);
        const legalBasisMatch = content.match(/Legal Basis[:\s]+([\s\S]+?)(?=\n\n📄|📑|Form 7A|Schedule|⚠️|$)/is);
        
        if (claimTypeMatch) {
          claimType = claimTypeMatch[1].trim();
        }
        if (legalBasisMatch) {
          legalBases = legalBasisMatch[1].trim();
        }
      }
      
      // Form 7A - try multiple patterns
      const form7AMatch = content.match(/📄\s*Draft of Form 7A[:\s]*\n\n([\s\S]+?)(?=\n\n📑|⚠️|Schedule|$)/is)
        || content.match(/Form 7A[:\s]*\n\n([\s\S]+?)(?=\n\n📑|Schedule|⚠️|$)/is)
        || content.match(/📄[:\s]*\n\n([\s\S]+?)(?=\n\n📑|Schedule|⚠️|$)/is);
      
      // Schedule A - try multiple patterns
      const scheduleAMatch = content.match(/📑\s*Schedule[:\s]*["']?A["']?[:\s]*\n\n([\s\S]+?)(?=\n\n⚠️|Warnings|$)/is)
        || content.match(/Schedule\s*["']?A["']?[:\s]*\n\n([\s\S]+?)(?=\n\n⚠️|Warnings|$)/is)
        || content.match(/📑[:\s]*\n\n([\s\S]+?)(?=\n\n⚠️|Warnings|$)/is);
      
      // Warnings - try multiple patterns
      const warningsMatch = content.match(/⚠️\s*Warnings?[:\s]*\n\n([\s\S]+?)$/is)
        || content.match(/Warnings?[:\s]*\n\n([\s\S]+?)$/is);

      // Log usage for cost tracking
      const usage = response.usage;
      if (usage) {
        const costEstimate = ((usage.prompt_tokens * 0.15 + usage.completion_tokens * 0.6) / 1000000).toFixed(4);
        console.log(`OpenAI usage - tokens: ${usage.total_tokens} (prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens}), cost estimate: ~$${costEstimate}`);
      }

      console.log('Document generation completed successfully');
      console.log(`Claim type: ${claimType}`);
      console.log(`Legal basis extracted: ${legalBases ? 'Yes (' + legalBases.length + ' chars)' : 'No'}`);
      console.log(`Form 7A extracted: ${form7AMatch ? 'Yes (' + form7AMatch[1].trim().length + ' chars)' : 'No'}`);
      console.log(`Schedule A extracted: ${scheduleAMatch ? 'Yes (' + scheduleAMatch[1].trim().length + ' chars)' : 'No'}`);
      console.log(`Warnings present: ${warningsMatch ? 'Yes' : 'No'}`);
      
      // If parsing failed, log the raw content structure for debugging
      if (!form7AMatch || !scheduleAMatch) {
        console.warn('⚠️ Parsing may have failed. Raw content structure:');
        console.warn('Content contains "Form 7A":', content.includes('Form 7A'));
        console.warn('Content contains "Schedule A":', content.includes('Schedule A') || content.includes('Schedule "A"'));
        console.warn('Content contains emoji 📄:', content.includes('📄'));
        console.warn('Content contains emoji 📑:', content.includes('📑'));
      }

      const result = {
        claimType,
        legalBases,
        form7A: form7AMatch ? form7AMatch[1].trim() : (content.includes('Form 7A') ? content : ''), // Fallback to full content if it mentions Form 7A
        scheduleA: scheduleAMatch ? scheduleAMatch[1].trim() : (content.includes('Schedule') ? content.split('Schedule')[1]?.split('⚠️')[0]?.trim() || '' : ''),
        warnings: warningsMatch ? warningsMatch[1].trim() : undefined,
      };
      
      console.log('Returning parsed result:', {
        claimType: result.claimType,
        legalBasesLength: result.legalBases?.length || 0,
        form7ALength: result.form7A.length,
        scheduleALength: result.scheduleA.length,
        hasWarnings: !!result.warnings,
      });

      return result;
    } catch (error) {
      console.error('OpenAI document generation error:', error);
      
      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
          throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
        }
        if (error.status === 401) {
          throw new Error('OpenAI API key invalid');
        }
      }
      
      throw new Error(`Failed to generate documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
let clientInstance: OpenAIClient | null = null;

export function getOpenAIClient(): OpenAIClient {
  if (!clientInstance) {
    clientInstance = new OpenAIClient();
  }
  return clientInstance;
}

