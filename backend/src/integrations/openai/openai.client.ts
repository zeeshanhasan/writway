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
}

// Singleton instance
let clientInstance: OpenAIClient | null = null;

export function getOpenAIClient(): OpenAIClient {
  if (!clientInstance) {
    clientInstance = new OpenAIClient();
  }
  return clientInstance;
}

