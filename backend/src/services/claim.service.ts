/**
 * Claim Service
 * Handles claim analysis and dynamic question generation
 */

import { getOpenAIClient } from '../integrations/openai/openai.client';
import { OpenAIExtractionResponse, NextQuestionResponse } from '../integrations/openai/openai.types';
import { ClaimFormData } from '../schemas/claim.schemas';

interface FieldMapping {
  field: string;
  questionId: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea';
  label: string;
  description?: string;
  options?: Array<{ label: string; value: string }>;
  required: boolean;
}

// Field to question mapping
const FIELD_QUESTIONS: Record<string, FieldMapping> = {
  // Eligibility questions
  'eligibility.totalAmount': {
    field: 'eligibility.totalAmount',
    questionId: 'q-eligibility-amount',
    type: 'number',
    label: 'What is the total amount you are claiming (including any interest or costs)?',
    required: true,
  },
  'eligibility.isAmountUnder35000': {
    field: 'eligibility.isAmountUnder35000',
    questionId: 'q-eligibility-under-35k',
    type: 'boolean',
    label: 'Is the amount $35,000 or less?',
    required: true,
  },
  'eligibility.isBasedInOntario': {
    field: 'eligibility.isBasedInOntario',
    questionId: 'q-eligibility-ontario',
    type: 'boolean',
    label: 'Is your claim based in Ontario?',
    description: 'The transaction or event happened here or the Defendant is located here',
    required: true,
  },
  'eligibility.issueDate': {
    field: 'eligibility.issueDate',
    questionId: 'q-eligibility-date',
    type: 'date',
    label: 'When did the issue happen?',
    required: true,
  },
  'eligibility.claimType': {
    field: 'eligibility.claimType',
    questionId: 'q-eligibility-type',
    type: 'select',
    label: 'Is this about money owed, property returned, or damages for a loss?',
    options: [
      { label: 'Money owed', value: 'money' },
      { label: 'Property returned', value: 'property' },
      { label: 'Damages for a loss', value: 'damages' },
    ],
    required: true,
  },
  
  // Plaintiff questions
  'plaintiff.fullName': {
    field: 'plaintiff.fullName',
    questionId: 'q-plaintiff-name',
    type: 'text',
    label: 'Please enter your full legal name',
    required: true,
  },
  'plaintiff.filingType': {
    field: 'plaintiff.filingType',
    questionId: 'q-plaintiff-type',
    type: 'select',
    label: 'Are you filing as an individual, business, or organization?',
    options: [
      { label: 'Individual', value: 'individual' },
      { label: 'Business', value: 'business' },
      { label: 'Organization', value: 'organization' },
    ],
    required: true,
  },
  'plaintiff.address': {
    field: 'plaintiff.address',
    questionId: 'q-plaintiff-address',
    type: 'text',
    label: 'Street address',
    required: true,
  },
  'plaintiff.city': {
    field: 'plaintiff.city',
    questionId: 'q-plaintiff-city',
    type: 'text',
    label: 'City',
    required: true,
  },
  'plaintiff.province': {
    field: 'plaintiff.province',
    questionId: 'q-plaintiff-province',
    type: 'text',
    label: 'Province',
    required: true,
  },
  'plaintiff.postalCode': {
    field: 'plaintiff.postalCode',
    questionId: 'q-plaintiff-postal',
    type: 'text',
    label: 'Postal code',
    required: true,
  },
  'plaintiff.phone': {
    field: 'plaintiff.phone',
    questionId: 'q-plaintiff-phone',
    type: 'text',
    label: 'Phone number',
    required: true,
  },
  'plaintiff.email': {
    field: 'plaintiff.email',
    questionId: 'q-plaintiff-email',
    type: 'text',
    label: 'Email',
    required: true,
  },
  'plaintiff.hasRepresentative': {
    field: 'plaintiff.hasRepresentative',
    questionId: 'q-plaintiff-rep',
    type: 'boolean',
    label: 'Do you have a representative (paralegal, lawyer, or agent)?',
    required: true,
  },
  
  // Defendant questions
  'defendants.count': {
    field: 'defendants.count',
    questionId: 'q-defendant-count',
    type: 'number',
    label: 'How many defendants are there?',
    required: true,
  },
  
  // Amount questions
  'amount.principalAmount': {
    field: 'amount.principalAmount',
    questionId: 'q-amount-principal',
    type: 'number',
    label: 'What is the principal amount you are claiming?',
    required: true,
  },
  'amount.claimingInterest': {
    field: 'amount.claimingInterest',
    questionId: 'q-amount-interest',
    type: 'boolean',
    label: 'Are you claiming interest?',
    required: true,
  },
  'amount.claimingCosts': {
    field: 'amount.claimingCosts',
    questionId: 'q-amount-costs',
    type: 'boolean',
    label: 'Are you claiming court filing costs or service fees?',
    required: true,
  },
  'amount.claimingDamages': {
    field: 'amount.claimingDamages',
    questionId: 'q-amount-damages',
    type: 'boolean',
    label: 'Are you claiming any additional damages?',
    description: 'e.g., inconvenience, property damage, or lost income',
    required: true,
  },
  
  // Remedy questions
  'remedy.payMoney': {
    field: 'remedy.payMoney',
    questionId: 'q-remedy-pay',
    type: 'boolean',
    label: 'Are you asking the court to order payment of money?',
    required: false,
  },
  'remedy.returnProperty': {
    field: 'remedy.returnProperty',
    questionId: 'q-remedy-property',
    type: 'boolean',
    label: 'Are you asking the court to order return of property?',
    required: false,
  },
  'remedy.performObligation': {
    field: 'remedy.performObligation',
    questionId: 'q-remedy-obligation',
    type: 'boolean',
    label: 'Are you asking the court to order performance of an obligation?',
    required: false,
  },
};

export class ClaimService {
  /**
   * Analyze description and extract structured data
   */
  async analyzeDescription(description: string): Promise<{
    extracted: Partial<ClaimFormData>;
    missing: string[];
    ambiguous: Array<{ field: string; reason: string; question: string }>;
  }> {
    const openai = getOpenAIClient();
    
    // Check if OpenAI is enabled
    if (!process.env.OPENAI_API_KEY) {
      // Fallback: return empty extraction with all fields as missing
      return {
        extracted: {},
        missing: Object.keys(FIELD_QUESTIONS),
        ambiguous: [],
      };
    }

    try {
      const response = await openai.extractClaimData(description);
      
      // Convert OpenAI response to ClaimFormData structure
      const extracted: Partial<ClaimFormData> = {
        eligibility: {},
        plaintiff: {},
        defendants: {},
        claimDetails: {},
        amount: {},
        remedy: {},
        evidence: {},
      };

      // Log raw response for debugging
      console.log('OpenAI raw extraction response:', JSON.stringify(response, null, 2));
      console.log('Extracted fields:', Object.keys(response.extracted).join(', '));
      
      // Normalize OpenAI response - it might return nested objects (ELIGIBILITY, PLAINTIFF) or flat structure
      const extractedAny = response.extracted as any;
      let normalizedExtracted: any = {};
      
      // If OpenAI returned nested structure (ELIGIBILITY, PLAINTIFF, etc.), flatten it
      if (extractedAny.ELIGIBILITY || extractedAny.PLAINTIFF || extractedAny.DEFENDANT) {
        normalizedExtracted = {
          ...(extractedAny.ELIGIBILITY || {}),
          ...(extractedAny.PLAINTIFF || {}),
          ...(extractedAny.DEFENDANT || {}),
          ...(extractedAny['CLAIM DETAILS'] || {}),
          ...(extractedAny.AMOUNT || {}),
          ...(extractedAny.REMEDY || {}),
          ...(extractedAny.EVIDENCE || {}),
          // Also include any flat fields that might be there
          ...Object.keys(extractedAny).reduce((acc: any, key) => {
            if (!['ELIGIBILITY', 'PLAINTIFF', 'DEFENDANT', 'CLAIM DETAILS', 'AMOUNT', 'REMEDY', 'EVIDENCE'].includes(key)) {
              acc[key] = extractedAny[key];
            }
            return acc;
          }, {}),
        };
      } else {
        normalizedExtracted = response.extracted;
      }
      
      console.log('Normalized extracted data:', JSON.stringify(normalizedExtracted, null, 2));
      
      // Map extracted fields
      
      // ELIGIBILITY
      if (normalizedExtracted.totalAmount !== undefined) {
        const totalAmount = normalizedExtracted.totalAmount;
        extracted.eligibility!.totalAmount = typeof totalAmount === 'string' ? totalAmount : totalAmount.toString();
        
        // Calculate if under 35k based on extracted amount
        if (normalizedExtracted.isAmountUnder35000 === undefined) {
          const amountNum = typeof totalAmount === 'number' 
            ? totalAmount 
            : parseFloat(String(totalAmount));
          if (!isNaN(amountNum)) {
            extracted.eligibility!.isAmountUnder35000 = amountNum <= 35000;
          }
        } else {
          extracted.eligibility!.isAmountUnder35000 = normalizedExtracted.isAmountUnder35000;
        }
      }
      
      // If isBasedInOntario not explicitly extracted, infer from location
      if (normalizedExtracted.isBasedInOntario !== undefined) {
        extracted.eligibility!.isBasedInOntario = normalizedExtracted.isBasedInOntario;
      } else if (normalizedExtracted.location || normalizedExtracted.plaintiffProvince) {
        // If location mentions Ontario or plaintiff is in Ontario, likely true
        const locationStr = (normalizedExtracted.location || '') + ' ' + (normalizedExtracted.plaintiffProvince || '');
        if (locationStr.toLowerCase().includes('ontario')) {
          extracted.eligibility!.isBasedInOntario = true;
        }
      }
      
      if (normalizedExtracted.issueDate) {
        extracted.eligibility!.issueDate = normalizedExtracted.issueDate;
      } else if (normalizedExtracted.issueStartDate) {
        // Use issueStartDate as fallback for issueDate
        extracted.eligibility!.issueDate = normalizedExtracted.issueStartDate;
      }
      
      if (normalizedExtracted.claimType) {
        extracted.eligibility!.claimType = normalizedExtracted.claimType;
      } else {
        // Infer claim type - if it mentions money/payment, it's likely "money"
        const descriptionLower = description.toLowerCase();
        if (descriptionLower.includes('money') || descriptionLower.includes('paid') || descriptionLower.includes('deposit') || descriptionLower.includes('refund')) {
          extracted.eligibility!.claimType = 'money';
        } else if (descriptionLower.includes('property')) {
          extracted.eligibility!.claimType = 'property';
        } else if (descriptionLower.includes('damage') || descriptionLower.includes('loss')) {
          extracted.eligibility!.claimType = 'damages';
        }
      }
      
      // AMOUNT
      if (normalizedExtracted.totalAmount !== undefined) {
        const totalAmount = normalizedExtracted.totalAmount;
        // Also map to amount.principalAmount if totalAmount was extracted and principalAmount wasn't
        if (normalizedExtracted.principalAmount === undefined) {
          extracted.amount!.principalAmount = typeof totalAmount === 'string' ? totalAmount : totalAmount.toString();
        }
        extracted.amount!.totalAmount = typeof totalAmount === 'string' ? totalAmount : totalAmount.toString();
      }
      if (normalizedExtracted.principalAmount !== undefined) {
        const principalAmount = normalizedExtracted.principalAmount;
        extracted.amount!.principalAmount = typeof principalAmount === 'string' ? principalAmount : principalAmount.toString();
      }
      
      if (normalizedExtracted.damagesAmount !== undefined) {
        extracted.amount!.damagesDetails = typeof normalizedExtracted.damagesAmount === 'string' 
          ? normalizedExtracted.damagesAmount 
          : normalizedExtracted.damagesAmount.toString();
      }

      // PLAINTIFF
      if (normalizedExtracted.plaintiffName) {
        extracted.plaintiff!.fullName = normalizedExtracted.plaintiffName;
      }
      if (normalizedExtracted.filingType) {
        extracted.plaintiff!.filingType = normalizedExtracted.filingType;
      } else {
        // Default to individual if not specified
        extracted.plaintiff!.filingType = 'individual';
      }
      if (normalizedExtracted.plaintiffAddress) {
        extracted.plaintiff!.address = normalizedExtracted.plaintiffAddress;
      }
      if (normalizedExtracted.plaintiffCity) {
        extracted.plaintiff!.city = normalizedExtracted.plaintiffCity;
      }
      if (normalizedExtracted.plaintiffProvince) {
        extracted.plaintiff!.province = normalizedExtracted.plaintiffProvince;
      }
      if (normalizedExtracted.plaintiffPostalCode) {
        extracted.plaintiff!.postalCode = normalizedExtracted.plaintiffPostalCode;
      }
      if (normalizedExtracted.plaintiffPhone) {
        extracted.plaintiff!.phone = normalizedExtracted.plaintiffPhone;
      }
      if (normalizedExtracted.plaintiffEmail) {
        extracted.plaintiff!.email = normalizedExtracted.plaintiffEmail;
      }
      if (normalizedExtracted.hasRepresentative !== undefined) {
        extracted.plaintiff!.hasRepresentative = normalizedExtracted.hasRepresentative;
      }
      if (normalizedExtracted.representativeName) {
        extracted.plaintiff!.representative = {
          name: normalizedExtracted.representativeName,
          businessName: normalizedExtracted.representativeBusinessName || '',
          address: normalizedExtracted.representativeAddress || '',
          contact: normalizedExtracted.representativeContact || '',
        };
      }

      // DEFENDANTS
      if (normalizedExtracted.defendants && Array.isArray(normalizedExtracted.defendants) && normalizedExtracted.defendants.length > 0) {
        extracted.defendants!.defendants = normalizedExtracted.defendants;
        extracted.defendants!.count = normalizedExtracted.defendants.length;
      } else {
        // Try to extract defendant from description if not extracted by AI
        const descLower = description.toLowerCase();
        // Look for patterns like "named X", "contractor X", "X operating as Y"
        const namePatterns = [
          /(?:named|called|contractor|hired|hired a|employed)\s+([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
          /(?:by|to)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/,
        ];
        
        let foundDefendant: string | null = null;
        let foundBusiness: string | null = null;
        
        for (const pattern of namePatterns) {
          const match = description.match(pattern);
          if (match) {
            foundDefendant = match[1];
            break;
          }
        }
        
        // Look for business name pattern: "operating as X" or "X Company"
        const businessPattern = /operating\s+as\s+([A-Z][A-Za-z\s]+)/;
        const businessMatch = description.match(businessPattern);
        if (businessMatch) {
          foundBusiness = businessMatch[1].trim();
        }
        
        if (foundDefendant) {
          extracted.defendants!.defendants = [{
            fullName: foundDefendant,
            type: foundBusiness ? 'business' : 'individual',
            registeredBusinessName: foundBusiness || undefined,
          }];
          extracted.defendants!.count = 1;
        } else if (response.extracted.defendantCount) {
          extracted.defendants!.count = response.extracted.defendantCount;
        }
      }

      // CLAIM DETAILS
      if (normalizedExtracted.issueStartDate) {
        extracted.claimDetails!.issueStartDate = normalizedExtracted.issueStartDate;
      } else if (normalizedExtracted.issueDate) {
        // Use issueDate as fallback
        extracted.claimDetails!.issueStartDate = normalizedExtracted.issueDate;
      }
      
      if (normalizedExtracted.location) {
        extracted.claimDetails!.location = normalizedExtracted.location;
      }
      
      if (normalizedExtracted.agreement) {
        extracted.claimDetails!.agreement = normalizedExtracted.agreement;
      }
      
      if (normalizedExtracted.defendantAction) {
        extracted.claimDetails!.defendantAction = normalizedExtracted.defendantAction;
      }
      
      if (normalizedExtracted.askedToResolve !== undefined) {
        extracted.claimDetails!.askedToResolve = normalizedExtracted.askedToResolve;
      } else {
        // Infer from description - if mentions "contacted", "asked", "requested", likely true
        const descLower = description.toLowerCase();
        if (descLower.includes('contacted') || descLower.includes('asked') || descLower.includes('requested') || descLower.includes('sent')) {
          extracted.claimDetails!.askedToResolve = true;
        }
      }
      
      if (normalizedExtracted.response) {
        extracted.claimDetails!.response = typeof normalizedExtracted.response === 'string' 
          ? normalizedExtracted.response 
          : 'No response';
      } else {
        // Infer from description - if mentions "no response", "didn't respond", etc.
        const descLower = description.toLowerCase();
        if (descLower.includes('no response') || descLower.includes("didn't respond") || descLower.includes('never responded')) {
          extracted.claimDetails!.response = 'No response';
        }
      }
      
      if (normalizedExtracted.partialPayments !== undefined) {
        extracted.claimDetails!.partialPayments = normalizedExtracted.partialPayments;
      }
      
      if (normalizedExtracted.partialPaymentDetails) {
        extracted.claimDetails!.partialPaymentDetails = normalizedExtracted.partialPaymentDetails;
      }

      if (normalizedExtracted.claimingInterest !== undefined) {
        extracted.amount!.claimingInterest = normalizedExtracted.claimingInterest;
      } else {
        // Infer from description - if mentions "interest", likely true
        const descLower = description.toLowerCase();
        if (descLower.includes('interest')) {
          extracted.amount!.claimingInterest = true;
        }
      }
      
      if (normalizedExtracted.interestRate !== undefined) {
        extracted.amount!.interestRate = normalizedExtracted.interestRate.toString();
      }
      if (normalizedExtracted.interestDate) {
        extracted.amount!.interestDate = normalizedExtracted.interestDate;
      }
      
      if (normalizedExtracted.claimingCosts !== undefined) {
        extracted.amount!.claimingCosts = normalizedExtracted.claimingCosts;
      } else {
        // Infer from description - if mentions "costs", likely true
        const descLower = description.toLowerCase();
        if (descLower.includes('costs') || descLower.includes('filing fees')) {
          extracted.amount!.claimingCosts = true;
        }
      }
      
      if (normalizedExtracted.costsAmount !== undefined) {
        extracted.amount!.costsAmount = normalizedExtracted.costsAmount.toString();
      }
      
      if (normalizedExtracted.claimingDamages !== undefined) {
        extracted.amount!.claimingDamages = normalizedExtracted.claimingDamages;
      } else {
        // Infer from description - if mentions "damage", "lost", etc., likely true
        const descLower = description.toLowerCase();
        if (descLower.includes('damage') || descLower.includes('lost') || descLower.includes('replaced')) {
          extracted.amount!.claimingDamages = true;
        }
      }

      // REMEDY
      if (normalizedExtracted.payMoney !== undefined) {
        extracted.remedy!.payMoney = normalizedExtracted.payMoney;
      } else {
        // Infer from description - if money claim, likely seeking payment
        const descLower = description.toLowerCase();
        if (descLower.includes('claim') && (descLower.includes('$') || descLower.includes('amount') || descLower.includes('paid'))) {
          extracted.remedy!.payMoney = true;
        }
      }
      
      if (normalizedExtracted.returnProperty !== undefined) {
        extracted.remedy!.returnProperty = normalizedExtracted.returnProperty;
      }
      if (normalizedExtracted.performObligation !== undefined) {
        extracted.remedy!.performObligation = normalizedExtracted.performObligation;
      }
      if (normalizedExtracted.interestAndCosts !== undefined) {
        extracted.remedy!.interestAndCosts = normalizedExtracted.interestAndCosts;
      }

      // EVIDENCE
      if (normalizedExtracted.documents) {
        // Handle both string and array formats
        if (Array.isArray(normalizedExtracted.documents)) {
          extracted.evidence!.documents = normalizedExtracted.documents.join(', ');
        } else {
          extracted.evidence!.documents = normalizedExtracted.documents;
        }
      } else {
        // Infer documents from description
        const descLower = description.toLowerCase();
        const docList: string[] = [];
        if (descLower.includes('contract') || descLower.includes('agreement')) docList.push('Contract/Agreement');
        if (descLower.includes('receipt') || descLower.includes('invoice')) docList.push('Receipts/Invoices');
        if (descLower.includes('email')) docList.push('Emails');
        if (descLower.includes('text')) docList.push('Text messages');
        if (descLower.includes('payment') || descLower.includes('e-transfer')) docList.push('Payment records');
        if (docList.length > 0) {
          extracted.evidence!.documents = docList.join(', ');
        }
      }
      
      if (normalizedExtracted.hasWitnesses !== undefined) {
        extracted.evidence!.hasWitnesses = normalizedExtracted.hasWitnesses;
      }
      if (normalizedExtracted.witnessDetails) {
        extracted.evidence!.witnessDetails = normalizedExtracted.witnessDetails;
      }
      if (normalizedExtracted.evidenceDescription) {
        extracted.evidence!.evidenceDescription = normalizedExtracted.evidenceDescription;
      }
      if (normalizedExtracted.timeline) {
        extracted.evidence!.timeline = normalizedExtracted.timeline;
      }

      // Log final extracted data for debugging
      console.log('Final extracted data structure:', JSON.stringify(extracted, null, 2));
      
      return {
        extracted,
        missing: response.missing || [],
        ambiguous: response.ambiguous || [],
      };
    } catch (error) {
      console.error('Claim analysis error:', error);
      throw error;
    }
  }

  /**
   * Get next question based on current claim data and answered questions
   */
  async getNextQuestion(
    claimData: Partial<ClaimFormData>,
    answeredQuestions: string[] = []
  ): Promise<NextQuestionResponse> {
    // Build list of all required fields
    const requiredFields = Object.keys(FIELD_QUESTIONS).filter(
      key => FIELD_QUESTIONS[key].required
    );

    // Check which fields are missing or incomplete
    const missingFields: string[] = [];

    for (const fieldKey of requiredFields) {
      if (answeredQuestions.includes(fieldKey)) {
        continue; // Already answered
      }

      const [section, field] = fieldKey.split('.');
      const sectionData = (claimData as any)[section];
      
      // Check if field has a value (handle strings, numbers, booleans properly)
      const fieldValue = sectionData?.[field];
      const hasValue = fieldValue !== undefined && 
                      fieldValue !== null && 
                      fieldValue !== '' &&
                      !(typeof fieldValue === 'string' && fieldValue.trim() === '');
      
      if (!hasValue) {
        missingFields.push(fieldKey);
      }
    }

    if (missingFields.length === 0) {
      // All required questions answered
      return {
        question: null,
        completed: true,
      };
    }

    // Get the first missing field
    const nextFieldKey = missingFields[0];
    const questionMapping = FIELD_QUESTIONS[nextFieldKey];

    if (!questionMapping) {
      return {
        question: null,
        completed: true,
      };
    }

    return {
      question: {
        id: questionMapping.questionId,
        field: questionMapping.field,
        type: questionMapping.type,
        label: questionMapping.label,
        description: questionMapping.description,
        required: questionMapping.required,
        options: questionMapping.options,
      },
      completed: false,
    };
  }

  /**
   * Helper to check if a field value exists
   */
  private hasValue(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return false;
    }
    if (typeof value === 'boolean') {
      return true; // Boolean values are valid
    }
    return true;
  }
}

export const claimService = new ClaimService();

