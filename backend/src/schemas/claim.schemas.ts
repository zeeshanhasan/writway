/**
 * Zod schemas for claim data validation
 */

import { z } from 'zod';

// Eligibility schema
export const eligibilitySchema = z.object({
  totalAmount: z.string().optional(),
  isAmountUnder35000: z.boolean().nullable().optional(),
  isBasedInOntario: z.boolean().nullable().optional(),
  issueDate: z.string().optional(),
  claimType: z.enum(['money', 'property', 'damages']).optional(),
  qualifies: z.boolean().nullable().optional(),
});

// Plaintiff schema
export const plaintiffSchema = z.object({
  fullName: z.string().optional(),
  filingType: z.enum(['individual', 'business', 'organization']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  hasRepresentative: z.boolean().optional(),
  representative: z.object({
    name: z.string().optional(),
    businessName: z.string().optional(),
    address: z.string().optional(),
    contact: z.string().optional(),
  }).optional(),
});

// Defendant schema
export const defendantSchema = z.object({
  count: z.number().int().min(1).optional(),
  defendants: z.array(z.object({
    fullName: z.string(),
    type: z.enum(['individual', 'business', 'corporation']),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    registeredBusinessName: z.string().optional(),
  })).optional(),
});

// Claim details schema
export const claimDetailsSchema = z.object({
  description: z.string().optional(),
  issueStartDate: z.string().optional(),
  location: z.string().optional(),
  agreement: z.string().optional(),
  defendantAction: z.string().optional(),
  askedToResolve: z.boolean().optional(),
  response: z.string().optional(),
  partialPayments: z.boolean().optional(),
  partialPaymentDetails: z.string().optional(),
});

// Amount schema
export const amountSchema = z.object({
  principalAmount: z.string().optional(),
  claimingInterest: z.boolean().optional(),
  interestRate: z.string().optional(),
  interestDate: z.string().optional(),
  claimingCosts: z.boolean().optional(),
  costsAmount: z.string().optional(),
  claimingDamages: z.boolean().optional(),
  damagesDetails: z.string().optional(),
  totalAmount: z.string().optional(),
});

// Remedy schema
export const remedySchema = z.object({
  payMoney: z.boolean().optional(),
  returnProperty: z.boolean().optional(),
  performObligation: z.boolean().optional(),
  interestAndCosts: z.boolean().optional(),
});

// Evidence schema
export const evidenceSchema = z.object({
  documents: z.string().optional(),
  hasWitnesses: z.boolean().optional(),
  witnessDetails: z.string().optional(),
  evidenceDescription: z.string().optional(),
  timeline: z.string().optional(),
});

// Complete form data schema
export const claimFormDataSchema = z.object({
  eligibility: eligibilitySchema.optional(),
  plaintiff: plaintiffSchema.optional(),
  defendants: defendantSchema.optional(),
  claimDetails: claimDetailsSchema.optional(),
  amount: amountSchema.optional(),
  remedy: remedySchema.optional(),
  evidence: evidenceSchema.optional(),
});

// Analyze request schema
export const analyzeRequestSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

// Next question request schema
export const nextQuestionRequestSchema = z.object({
  claimData: claimFormDataSchema,
  answeredQuestions: z.array(z.string()).optional(), // Array of field IDs already answered
});

// Question response schema
export const questionResponseSchema = z.object({
  id: z.string(),
  field: z.string(),
  type: z.enum(['text', 'number', 'date', 'select', 'boolean', 'textarea']),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
});

// Next question response schema
export const nextQuestionResponseSchema = z.object({
  question: questionResponseSchema.nullable(),
  completed: z.boolean(),
});

// Generate documents request schema
export const generateDocumentsRequestSchema = z.object({
  claimData: claimFormDataSchema,
  initialDescription: z.string().optional(),
});

// Type exports
export type EligibilityData = z.infer<typeof eligibilitySchema>;
export type PlaintiffData = z.infer<typeof plaintiffSchema>;
export type DefendantData = z.infer<typeof defendantSchema>;
export type ClaimDetailsData = z.infer<typeof claimDetailsSchema>;
export type AmountData = z.infer<typeof amountSchema>;
export type RemedyData = z.infer<typeof remedySchema>;
export type EvidenceData = z.infer<typeof evidenceSchema>;
export type ClaimFormData = z.infer<typeof claimFormDataSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type NextQuestionRequest = z.infer<typeof nextQuestionRequestSchema>;
export type QuestionResponse = z.infer<typeof questionResponseSchema>;
export type NextQuestionResponse = z.infer<typeof nextQuestionResponseSchema>;
export type GenerateDocumentsRequest = z.infer<typeof generateDocumentsRequestSchema>;

