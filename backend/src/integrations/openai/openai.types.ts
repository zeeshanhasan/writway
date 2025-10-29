/**
 * TypeScript types for OpenAI integration
 */

export interface OpenAIExtractionResponse {
  extracted: {
    // Eligibility
    totalAmount?: number;
    isAmountUnder35000?: boolean;
    isBasedInOntario?: boolean;
    issueDate?: string;
    claimType?: 'money' | 'property' | 'damages';
    
    // Plaintiff
    plaintiffName?: string;
    filingType?: 'individual' | 'business' | 'organization';
    plaintiffAddress?: string;
    plaintiffCity?: string;
    plaintiffProvince?: string;
    plaintiffPostalCode?: string;
    plaintiffPhone?: string;
    plaintiffEmail?: string;
    hasRepresentative?: boolean;
    representativeName?: string;
    representativeBusinessName?: string;
    representativeAddress?: string;
    representativeContact?: string;
    
    // Defendant
    defendantCount?: number;
    defendants?: Array<{
      fullName: string;
      type: 'individual' | 'business' | 'corporation';
      address?: string;
      phone?: string;
      email?: string;
      registeredBusinessName?: string;
    }>;
    
    // Claim Details
    issueStartDate?: string;
    location?: string;
    agreement?: string;
    defendantAction?: string;
    askedToResolve?: boolean;
    response?: string;
    partialPayments?: boolean;
    partialPaymentDetails?: string;
    
    // Amount
    principalAmount?: number;
    claimingInterest?: boolean;
    interestRate?: number;
    interestDate?: string;
    claimingCosts?: boolean;
    costsAmount?: number;
    claimingDamages?: boolean;
    damagesAmount?: number;
    
    // Remedy
    payMoney?: boolean;
    returnProperty?: boolean;
    performObligation?: boolean;
    interestAndCosts?: boolean;
    
    // Evidence
    documents?: string;
    hasWitnesses?: boolean;
    witnessDetails?: string;
    evidenceDescription?: string;
    timeline?: string;
  };
  missing: string[]; // Array of field names that need clarification
  ambiguous: Array<{
    field: string;
    reason: string;
    question: string;
  }>;
}

export interface NextQuestionResponse {
  question: {
    id: string;
    field: string;
    type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea';
    label: string;
    description?: string;
    required: boolean;
    options?: Array<{ label: string; value: string }>;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
    };
  } | null; // null if no more questions
  completed: boolean;
}

export interface DocumentGenerationResponse {
  pdf: {
    url: string;
    filename: string;
  };
  word: {
    url: string;
    filename: string;
  };
}

