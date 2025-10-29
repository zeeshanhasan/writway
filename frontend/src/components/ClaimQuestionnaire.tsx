'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DynamicQuestionRenderer } from '@/components/DynamicQuestionRenderer';
import { apiClient } from '@/lib/api';
import { Loader2, Download, FileText } from 'lucide-react';

// Types for form data
interface EligibilityData {
  totalAmount: string;
  isAmountUnder35000: boolean | null;
  isBasedInOntario: boolean | null;
  issueDate: string;
  claimType: string;
  qualifies: boolean | null;
}

interface PlaintiffData {
  fullName: string;
  filingType: 'individual' | 'business' | 'organization';
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  hasRepresentative: boolean;
  representative?: {
    name: string;
    businessName: string;
    address: string;
    contact: string;
  };
}

interface DefendantData {
  count: number;
  defendants: Array<{
    fullName: string;
    type: 'individual' | 'business' | 'corporation';
    address: string;
    phone?: string;
    email?: string;
    registeredBusinessName?: string;
  }>;
}

interface ClaimDetailsData {
  description: string;
  issueStartDate: string;
  location: string;
  agreement: string;
  defendantAction: string;
  askedToResolve: boolean;
  response?: string;
  partialPayments: boolean;
  partialPaymentDetails?: string;
}

interface AmountData {
  principalAmount: string;
  claimingInterest: boolean;
  interestRate?: string;
  interestDate?: string;
  claimingCosts: boolean;
  costsAmount?: string;
  claimingDamages: boolean;
  damagesDetails?: string;
  totalAmount: string;
}

interface RemedyData {
  payMoney: boolean;
  returnProperty: boolean;
  performObligation: boolean;
  interestAndCosts: boolean;
}

interface EvidenceData {
  documents: string;
  hasWitnesses: boolean;
  witnessDetails?: string;
  evidenceDescription?: string;
  timeline?: string;
}

interface FormData {
  eligibility: EligibilityData;
  plaintiff: PlaintiffData;
  defendants: DefendantData;
  claimDetails: ClaimDetailsData;
  amount: AmountData;
  remedy: RemedyData;
  evidence: EvidenceData;
}

const TOTAL_STEPS = 10;

export function ClaimQuestionnaire() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    eligibility: {
      totalAmount: '',
      isAmountUnder35000: null,
      isBasedInOntario: null,
      issueDate: '',
      claimType: '',
      qualifies: null,
    },
    plaintiff: {
      fullName: '',
      filingType: 'individual',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      phone: '',
      email: '',
      hasRepresentative: false,
    },
    defendants: {
      count: 1,
      defendants: [{
        fullName: '',
        type: 'individual',
        address: '',
      }],
    },
    claimDetails: {
      description: '',
      issueStartDate: '',
      location: '',
      agreement: '',
      defendantAction: '',
      askedToResolve: false,
      partialPayments: false,
    },
    amount: {
      principalAmount: '',
      claimingInterest: false,
      claimingCosts: false,
      claimingDamages: false,
      totalAmount: '0',
    },
    remedy: {
      payMoney: false,
      returnProperty: false,
      performObligation: false,
      interestAndCosts: false,
    },
    evidence: {
      documents: '',
      hasWitnesses: false,
    },
  });

  const progress = (currentStep / TOTAL_STEPS) * 100;
  
  // Add initial description field to form data
  const [initialDescription, setInitialDescription] = useState('');
  
  // AI-powered dynamic question flow state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showExtractedDataReview, setShowExtractedDataReview] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<FormData> | null>(null);
  const [dynamicMode, setDynamicMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<{
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
  } | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, any>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  const [isGeneratingDocuments, setIsGeneratingDocuments] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState<{
    pdf?: { content: string; filename: string };
    word?: { content: string; filename: string };
  } | null>(null);

  const updateEligibility = (field: keyof EligibilityData, value: any) => {
    setFormData(prev => ({
      ...prev,
      eligibility: { ...prev.eligibility, [field]: value },
    }));
  };

  const updatePlaintiff = (field: keyof PlaintiffData, value: any) => {
    setFormData(prev => ({
      ...prev,
      plaintiff: { ...prev.plaintiff, [field]: value },
    }));
  };

  const updateDefendants = (field: keyof DefendantData, value: any) => {
    setFormData(prev => ({
      ...prev,
      defendants: { ...prev.defendants, [field]: value },
    }));
  };

  const updateClaimDetails = (field: keyof ClaimDetailsData, value: any) => {
    setFormData(prev => ({
      ...prev,
      claimDetails: { ...prev.claimDetails, [field]: value },
    }));
  };

  const updateAmount = (field: keyof AmountData, value: any) => {
    setFormData(prev => ({
      ...prev,
      amount: { ...prev.amount, [field]: value },
    }));
    
    // Auto-calculate total when relevant fields change
    if (field === 'principalAmount' || field === 'costsAmount' || field === 'damagesDetails') {
      calculateTotal();
    }
  };

  const calculateTotal = () => {
    const principal = parseFloat(formData.amount.principalAmount) || 0;
    const costs = parseFloat(formData.amount.costsAmount || '0') || 0;
    const damages = parseFloat(formData.amount.damagesDetails || '0') || 0;
    const total = principal + costs + damages;
    
    setFormData(prev => ({
      ...prev,
      amount: { ...prev.amount, totalAmount: total.toFixed(2) },
    }));
  };

  const updateRemedy = (field: keyof RemedyData, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      remedy: { ...prev.remedy, [field]: value },
    }));
  };

  const updateEvidence = (field: keyof EvidenceData, value: any) => {
    setFormData(prev => ({
      ...prev,
      evidence: { ...prev.evidence, [field]: value },
    }));
  };

  const handleNext = async () => {
    // Step 1: Analyze description when Continue is clicked
    if (currentStep === 1 && initialDescription.trim().length >= 10) {
      setIsAnalyzing(true);
      try {
        const response = await apiClient.analyzeClaimDescription(initialDescription);
        if (response.success && response.data) {
          console.log('Analysis response:', response.data);
          
          // Store extracted data
          const extracted = response.data.extracted as any;
          setExtractedData(extracted);
          
          // Merge extracted data into formData
          setFormData(prev => {
            const updated = {
              ...prev,
              eligibility: {
                ...prev.eligibility,
                ...(extracted.eligibility || {}),
              },
              plaintiff: {
                ...prev.plaintiff,
                ...(extracted.plaintiff || {}),
              },
              defendants: {
                ...prev.defendants,
                ...(extracted.defendants || {}),
              },
              claimDetails: {
                ...prev.claimDetails,
                ...(extracted.claimDetails || {}),
                description: initialDescription, // Preserve original description
              },
              amount: {
                ...prev.amount,
                ...(extracted.amount || {}),
              },
              remedy: {
                ...prev.remedy,
                ...(extracted.remedy || {}),
              },
              evidence: {
                ...prev.evidence,
                ...(extracted.evidence || {}),
              },
            };
            console.log('Updated formData:', updated);
            return updated;
          });

          // Always show extracted data review page first
          setShowExtractedDataReview(true);
        } else {
          console.error('Analysis failed:', response);
          alert(`Analysis failed: ${(response.error as any)?.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Analysis error:', error);
        
        // Show detailed error message
        let errorMessage = 'Failed to analyze description. ';
        if (error instanceof Error) {
          if (error.message.includes('quota') || error.message.includes('rate limit')) {
            errorMessage += 'OpenAI quota exceeded. Please check your OpenAI account billing at https://platform.openai.com/account/billing';
          } else if (error.message.includes('API key')) {
            errorMessage += 'OpenAI API key is invalid or missing.';
          } else {
            errorMessage += error.message;
          }
        }
        
        alert(errorMessage);
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }

    // Dynamic mode: save answer and load next question
    if (dynamicMode && currentQuestion) {
      // Get the current answer from questionAnswers (user's input)
      const fieldPath = currentQuestion.field;
      const [section, field] = fieldPath.split('.');
      const answerValue = questionAnswers[currentQuestion.field];
      
      // Only proceed if we have an answer
      if (answerValue === undefined || answerValue === null || answerValue === '') {
        alert('Please provide an answer before continuing.');
        return;
      }

      // Update formData with the answer
      updateFormDataByPath(fieldPath, answerValue);

      // Mark as answered
      setAnsweredQuestions(prev => {
        if (!prev.includes(fieldPath)) {
          return [...prev, fieldPath];
        }
        return prev;
      });

      // Clear the current answer from questionAnswers (ready for next question)
      setQuestionAnswers(prev => {
        const next = { ...prev };
        delete next[fieldPath];
        return next;
      });

      // Load next question
      await loadNextQuestion();
      return;
    }

    // Traditional step flow
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const loadNextQuestion = async () => {
    try {
      // Clean formData before sending
      const cleanFormData = cleanFormDataForAPI(formData);
      console.log('Loading next question with cleaned data:', { cleanFormData, answeredQuestions });
      const response = await apiClient.getNextQuestion(cleanFormData, answeredQuestions);
      console.log('Next question response:', response);
      
      if (response.success && response.data) {
        if (response.data.completed) {
          // All questions answered, switch to review step
          setDynamicMode(false);
          setCurrentStep(TOTAL_STEPS);
        } else if (response.data.question) {
          setCurrentQuestion(response.data.question);
          // Pre-fill answer if already exists in formData
          const fieldPath = response.data.question.field;
          const [section, field] = fieldPath.split('.');
          const existingValue = getNestedValue(formData, section, field);
          if (existingValue !== undefined && existingValue !== null && existingValue !== '') {
            setQuestionAnswers(prev => ({
              ...prev,
              [fieldPath]: existingValue
            }));
          }
        } else {
          // No question returned but not completed - likely an issue
          console.warn('No question returned but not marked as completed:', response.data);
          alert('No more questions available. Moving to review...');
          setDynamicMode(false);
          setCurrentStep(TOTAL_STEPS);
        }
      } else {
        console.error('Unsuccessful response:', response);
        const errorMsg = (response.error as any)?.message || 'Unknown error';
        alert(`Failed to load next question: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Load next question error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to load next question: ${errorMessage}\n\nCheck browser console for details.`);
    }
  };

  const updateFormDataByPath = (path: string, value: any) => {
    const [section, field] = path.split('.');
    setFormData(prev => {
      const sectionData = (prev as any)[section];
      if (!sectionData) return prev;
      
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: value,
        }
      };
    });
  };

  const getNestedValue = (obj: any, section: string, field: string): any => {
    return obj?.[section]?.[field];
  };

  // Helper to clean formData for API submission (removes empty/null values)
  const cleanFormDataForAPI = (data: FormData) => {
    return {
      eligibility: data.eligibility.isAmountUnder35000 !== null || 
                   data.eligibility.isBasedInOntario !== null ||
                   data.eligibility.totalAmount ||
                   data.eligibility.issueDate ||
                   data.eligibility.claimType
        ? {
            ...(data.eligibility.totalAmount && { totalAmount: data.eligibility.totalAmount }),
            ...(data.eligibility.isAmountUnder35000 !== null && { isAmountUnder35000: data.eligibility.isAmountUnder35000 }),
            ...(data.eligibility.isBasedInOntario !== null && { isBasedInOntario: data.eligibility.isBasedInOntario }),
            ...(data.eligibility.issueDate && { issueDate: data.eligibility.issueDate }),
            ...(data.eligibility.claimType && { claimType: data.eligibility.claimType }),
          }
        : undefined,
      plaintiff: data.plaintiff.fullName ||
                 data.plaintiff.address ||
                 data.plaintiff.email
        ? {
            ...(data.plaintiff.fullName && { fullName: data.plaintiff.fullName }),
            ...(data.plaintiff.filingType && { filingType: data.plaintiff.filingType }),
            ...(data.plaintiff.address && { address: data.plaintiff.address }),
            ...(data.plaintiff.city && { city: data.plaintiff.city }),
            ...(data.plaintiff.province && { province: data.plaintiff.province }),
            ...(data.plaintiff.postalCode && { postalCode: data.plaintiff.postalCode }),
            ...(data.plaintiff.phone && { phone: data.plaintiff.phone }),
            ...(data.plaintiff.email && { email: data.plaintiff.email }),
            ...(data.plaintiff.hasRepresentative !== undefined && { hasRepresentative: data.plaintiff.hasRepresentative }),
          }
        : undefined,
      defendants: data.defendants.defendants?.length > 0 ||
                  data.defendants.count > 0
        ? {
            count: data.defendants.count,
            defendants: data.defendants.defendants,
          }
        : undefined,
      claimDetails: data.claimDetails.description ||
                    data.claimDetails.issueStartDate ||
                    data.claimDetails.location
        ? {
            ...(data.claimDetails.description && { description: data.claimDetails.description }),
            ...(data.claimDetails.issueStartDate && { issueStartDate: data.claimDetails.issueStartDate }),
            ...(data.claimDetails.location && { location: data.claimDetails.location }),
            ...(data.claimDetails.agreement && { agreement: data.claimDetails.agreement }),
            ...(data.claimDetails.defendantAction && { defendantAction: data.claimDetails.defendantAction }),
            ...(data.claimDetails.askedToResolve !== undefined && { askedToResolve: data.claimDetails.askedToResolve }),
            ...(data.claimDetails.response && { response: data.claimDetails.response }),
            ...(data.claimDetails.partialPayments !== undefined && { partialPayments: data.claimDetails.partialPayments }),
            ...(data.claimDetails.partialPaymentDetails && { partialPaymentDetails: data.claimDetails.partialPaymentDetails }),
          }
        : undefined,
      amount: data.amount.principalAmount ||
              data.amount.claimingInterest !== undefined ||
              data.amount.claimingCosts !== undefined
        ? {
            ...(data.amount.principalAmount && { principalAmount: data.amount.principalAmount }),
            ...(data.amount.claimingInterest !== undefined && { claimingInterest: data.amount.claimingInterest }),
            ...(data.amount.interestRate && { interestRate: data.amount.interestRate }),
            ...(data.amount.interestDate && { interestDate: data.amount.interestDate }),
            ...(data.amount.claimingCosts !== undefined && { claimingCosts: data.amount.claimingCosts }),
            ...(data.amount.costsAmount && { costsAmount: data.amount.costsAmount }),
            ...(data.amount.claimingDamages !== undefined && { claimingDamages: data.amount.claimingDamages }),
            ...(data.amount.damagesDetails && { damagesDetails: data.amount.damagesDetails }),
            ...(data.amount.totalAmount && { totalAmount: data.amount.totalAmount }),
          }
        : undefined,
      remedy: data.remedy.payMoney !== undefined ||
              data.remedy.returnProperty !== undefined ||
              data.remedy.performObligation !== undefined
        ? {
            ...(data.remedy.payMoney !== undefined && { payMoney: data.remedy.payMoney }),
            ...(data.remedy.returnProperty !== undefined && { returnProperty: data.remedy.returnProperty }),
            ...(data.remedy.performObligation !== undefined && { performObligation: data.remedy.performObligation }),
            ...(data.remedy.interestAndCosts !== undefined && { interestAndCosts: data.remedy.interestAndCosts }),
          }
        : undefined,
      evidence: data.evidence.documents ||
                data.evidence.hasWitnesses !== undefined ||
                data.evidence.witnessDetails
        ? {
            ...(data.evidence.documents && { documents: data.evidence.documents }),
            ...(data.evidence.hasWitnesses !== undefined && { hasWitnesses: data.evidence.hasWitnesses }),
            ...(data.evidence.witnessDetails && { witnessDetails: data.evidence.witnessDetails }),
            ...(data.evidence.evidenceDescription && { evidenceDescription: data.evidence.evidenceDescription }),
            ...(data.evidence.timeline && { timeline: data.evidence.timeline }),
          }
        : undefined,
    };
  };

  const handleDynamicQuestionChange = (value: any) => {
    if (!currentQuestion) return;
    setQuestionAnswers(prev => ({
      ...prev,
      [currentQuestion.field]: value,
    }));
  };

  const handlePrevious = () => {
    if (dynamicMode) {
      // In dynamic mode, go back to previous question if possible
      const lastAnswered = answeredQuestions[answeredQuestions.length - 1];
      if (lastAnswered) {
        setAnsweredQuestions(prev => prev.slice(0, -1));
        // Re-load current question from remaining unanswered
        loadNextQuestion();
      } else {
        // Go back to step 1
        setDynamicMode(false);
        setCurrentStep(1);
      }
      return;
    }

    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsGeneratingDocuments(true);
    try {
      const response = await apiClient.generateClaimDocuments(formData, initialDescription);
      if (response.success && response.data) {
        setGeneratedDocuments({
          pdf: {
            content: response.data.pdf.content,
            filename: response.data.pdf.filename,
          },
          word: {
            content: response.data.word.content,
            filename: response.data.word.filename,
          },
        });
      }
    } catch (error) {
      console.error('Document generation error:', error);
      alert('Failed to generate documents. Please try again.');
    } finally {
      setIsGeneratingDocuments(false);
    }
  };

  const downloadDocument = (content: string, filename: string, mimeType: string) => {
    const byteCharacters = atob(content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Check eligibility
  const checkEligibility = () => {
    const { isAmountUnder35000, isBasedInOntario, issueDate, claimType } = formData.eligibility;
    const qualifies = 
      isAmountUnder35000 === true && 
      isBasedInOntario === true && 
      issueDate !== '' && 
      claimType !== '';
    
    updateEligibility('qualifies', qualifies);
  };

  const renderStep = () => {
    // Show analyzing state
    if (isAnalyzing) {
      return (
        <div className="space-y-8 py-8">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-semibold mb-2">Analyzing your description...</h2>
            <p className="text-muted-foreground">We're extracting information and identifying what we need to clarify.</p>
          </div>
        </div>
      );
    }

    // Show extracted data review page after analysis
    if (showExtractedDataReview && extractedData) {
      return <ExtractedDataReview 
        extractedData={extractedData}
        formData={formData}
        onEdit={(section, field, value) => {
          if (section === 'eligibility') updateEligibility(field as keyof EligibilityData, value);
          else if (section === 'plaintiff') updatePlaintiff(field as keyof PlaintiffData, value);
          else if (section === 'defendants') updateDefendants(field as keyof DefendantData, value);
          else if (section === 'claimDetails') updateClaimDetails(field as keyof ClaimDetailsData, value);
          else if (section === 'amount') updateAmount(field as keyof AmountData, value);
          else if (section === 'remedy') updateRemedy(field as keyof RemedyData, value);
          else if (section === 'evidence') updateEvidence(field as keyof EvidenceData, value);
        }}
        onContinue={() => {
          setShowExtractedDataReview(false);
          // Check for missing fields and enter dynamic mode if needed
          const cleaned = cleanFormDataForAPI(formData);
          const hasMissingFields = Object.keys(cleaned).some(key => !cleaned[key as keyof typeof cleaned]);
          
          if (hasMissingFields) {
            setDynamicMode(true);
            loadNextQuestion();
          } else {
            setCurrentStep(TOTAL_STEPS);
          }
        }}
      />;
    }

    // Dynamic question mode
    if (dynamicMode && currentQuestion) {
      const currentAnswer = questionAnswers[currentQuestion.field] || 
        getNestedValue(formData, currentQuestion.field.split('.')[0], currentQuestion.field.split('.')[1]);
      
      return (
        <div className="space-y-6">
          <DynamicQuestionRenderer
            question={currentQuestion}
            value={currentAnswer}
            onChange={handleDynamicQuestionChange}
          />
        </div>
      );
    }

    // Document generation complete
    if (generatedDocuments && currentStep === TOTAL_STEPS) {
      return (
        <div className="space-y-6">
          <div className="text-center py-8">
            <FileText className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-2xl font-semibold mb-2">Documents Generated Successfully!</h2>
            <p className="text-muted-foreground mb-6">Your Statement of Claim documents are ready to download.</p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => downloadDocument(
                  generatedDocuments.pdf!.content,
                  generatedDocuments.pdf!.filename,
                  'application/pdf'
                )}
                size="lg"
                className="gap-2"
              >
                <Download className="h-5 w-5" />
                Download PDF
              </Button>
              <Button
                onClick={() => downloadDocument(
                  generatedDocuments.word!.content,
                  generatedDocuments.word!.filename,
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                )}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Download className="h-5 w-5" />
                Download Word
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Traditional step flow
    switch (currentStep) {
      case 1:
        return <Step1WhatHappened description={initialDescription} update={setInitialDescription} />;
      case 2:
        return <Step2Eligibility data={formData.eligibility} update={updateEligibility} checkEligibility={checkEligibility} />;
      case 3:
        return <Step3Plaintiff data={formData.plaintiff} update={updatePlaintiff} />;
      case 4:
        return <Step4Defendant data={formData.defendants} update={updateDefendants} />;
      case 5:
        return <Step5ClaimDetails data={formData.claimDetails} update={updateClaimDetails} initialDescription={initialDescription} />;
      case 6:
        return <Step6Amount data={formData.amount} update={updateAmount} calculateTotal={calculateTotal} />;
      case 7:
        return <Step7Remedy data={formData.remedy} update={updateRemedy} />;
      case 8:
        return <Step8Evidence data={formData.evidence} update={updateEvidence} />;
      case 9:
        return <Step9LegalIssues formData={formData} />;
      case 10:
        return <Step10Review formData={formData} initialDescription={initialDescription} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Progress hidden for now */}
      {/* <p className="text-muted-foreground mb-4">
        Step {currentStep} of {TOTAL_STEPS}
      </p>
      <Progress value={progress} className="h-2" /> */}

      {currentStep === 1 ? (
        // First step without Card wrapper for cleaner look
        <div>
          {renderStep()}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{getStepTitle(currentStep)}</CardTitle>
            <CardDescription>{getStepDescription(currentStep)}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>
      )}

      {isGeneratingDocuments ? (
        <div className="flex justify-center mt-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Generating your documents...</p>
          </div>
        </div>
      ) : generatedDocuments && currentStep === TOTAL_STEPS ? (
        // Documents generated - buttons shown in renderStep
        null
      ) : showExtractedDataReview ? (
        // Extracted data review - Continue button shown in component
        null
      ) : currentStep === 1 ? (
        // First step: centered, large Continue button only
        <div className="flex justify-center mt-8">
          <Button 
            onClick={handleNext} 
            size="lg" 
            className="px-8 py-6 text-lg"
            disabled={isAnalyzing || initialDescription.trim().length < 10}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      ) : (
        // Other steps: Previous and Continue/Generate buttons
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={isAnalyzing}
          >
            Previous
          </Button>
          {currentStep < TOTAL_STEPS ? (
            <Button onClick={handleNext} disabled={isAnalyzing}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isGeneratingDocuments}>
              {isGeneratingDocuments ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Documents'
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function getStepTitle(step: number): string {
  const titles = [
    '', // 0-indexed
    'What happened?', // Step 1 - new first question
    'Eligibility Check',
    'Plaintiff Information',
    'Defendant Information',
    'Details of the Claim',
    'Amount of Claim',
    'Remedy Requested',
    'Supporting Facts & Evidence',
    'Legal Issue Identification',
    'Review & Generate',
  ];
  return titles[step] || '';
}

function getStepDescription(step: number): string {
  const descriptions = [
    '',
    'Briefly describe what happened', // Step 1
    'Let\'s verify if your case qualifies for Ontario Small Claims Court',
    'Tell us about yourself',
    'Information about the defendant(s)',
    'Details about what happened',
    'The amount you are claiming',
    'What you are asking the court to order',
    'Evidence and supporting documents',
    'AI will identify relevant legal issues',
    'Review all information before generating documents',
  ];
  return descriptions[step] || '';
}

// Step Components
function Step1WhatHappened({
  description,
  update
}: {
  description: string;
  update: (value: string) => void;
}) {
  return (
    <div className="space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4">
          What happened?
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8">
          Tell us what happened and we will help you build your case
        </p>
      </div>
      <div>
        <textarea
          value={description}
          onChange={(e) => update(e.target.value)}
          className="w-full min-h-[300px] p-4 rounded-xl border border-input bg-white text-base resize-y shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Tell us what happened... (e.g., The Defendant failed to pay for renovation work.)"
        />
      </div>
    </div>
  );
}

function Step2Eligibility({ 
  data, 
  update, 
  checkEligibility 
}: { 
  data: EligibilityData; 
  update: (field: keyof EligibilityData, value: any) => void;
  checkEligibility: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="totalAmount">What is the total amount you are claiming (including any interest or costs)?</Label>
        <Input
          id="totalAmount"
          type="number"
          placeholder="0.00"
          value={data.totalAmount}
          onChange={(e) => {
            update('totalAmount', e.target.value);
            const amount = parseFloat(e.target.value) || 0;
            update('isAmountUnder35000', amount <= 35000);
          }}
          className="mt-2"
        />
      </div>

      <div>
        <Label>Is the amount $35,000 or less?</Label>
        <div className="flex gap-4 mt-2">
          <Button
            type="button"
            variant={data.isAmountUnder35000 === true ? 'default' : 'outline'}
            onClick={() => update('isAmountUnder35000', true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={data.isAmountUnder35000 === false ? 'default' : 'outline'}
            onClick={() => update('isAmountUnder35000', false)}
          >
            No
          </Button>
        </div>
      </div>

      <div>
        <Label>Is your claim based in Ontario (e.g., the transaction or event happened here or the Defendant is located here)?</Label>
        <div className="flex gap-4 mt-2">
          <Button
            type="button"
            variant={data.isBasedInOntario === true ? 'default' : 'outline'}
            onClick={() => update('isBasedInOntario', true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={data.isBasedInOntario === false ? 'default' : 'outline'}
            onClick={() => update('isBasedInOntario', false)}
          >
            No
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="issueDate">When did the issue happen?</Label>
        <Input
          id="issueDate"
          type="date"
          value={data.issueDate}
          onChange={(e) => update('issueDate', e.target.value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="claimType">Is this about money owed, property returned, or damages for a loss?</Label>
        <select
          id="claimType"
          value={data.claimType}
          onChange={(e) => update('claimType', e.target.value)}
          className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="">Select...</option>
          <option value="money">Money owed</option>
          <option value="property">Property returned</option>
          <option value="damages">Damages for a loss</option>
        </select>
      </div>

      {data.isAmountUnder35000 === false || data.isBasedInOntario === false ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          <p className="font-medium">Your case might not qualify for Ontario Small Claims Court.</p>
          <p className="text-sm mt-1">Would you like to learn about other options?</p>
        </div>
      ) : null}

      {data.qualifies === false && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p>Your case does not qualify for Ontario Small Claims Court based on the criteria above.</p>
        </div>
      )}
    </div>
  );
}

function Step3Plaintiff({ 
  data, 
  update 
}: { 
  data: PlaintiffData; 
  update: (field: keyof PlaintiffData, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="fullName">Please enter your full legal name</Label>
        <Input
          id="fullName"
          value={data.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label>Are you filing as an individual, business, or organization?</Label>
        <select
          value={data.filingType}
          onChange={(e) => update('filingType', e.target.value as 'individual' | 'business' | 'organization')}
          className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="individual">Individual</option>
          <option value="business">Business</option>
          <option value="organization">Organization</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="address">Street address</Label>
          <Input
            id="address"
            value={data.address}
            onChange={(e) => update('address', e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={data.city}
            onChange={(e) => update('city', e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="province">Province</Label>
          <Input
            id="province"
            value={data.province}
            onChange={(e) => update('province', e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="postalCode">Postal code</Label>
          <Input
            id="postalCode"
            value={data.postalCode}
            onChange={(e) => update('postalCode', e.target.value)}
            className="mt-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label>Do you have a representative (paralegal, lawyer, or agent)?</Label>
        <div className="flex gap-4 mt-2">
          <Button
            type="button"
            variant={data.hasRepresentative ? 'default' : 'outline'}
            onClick={() => update('hasRepresentative', true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={!data.hasRepresentative ? 'default' : 'outline'}
            onClick={() => update('hasRepresentative', false)}
          >
            No
          </Button>
        </div>
      </div>

      {data.hasRepresentative && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h3 className="font-medium">Representative Information</h3>
          <div>
            <Label htmlFor="repName">Representative name</Label>
            <Input
              id="repName"
              value={data.representative?.name || ''}
              onChange={(e) => update('representative', {
                ...data.representative,
                name: e.target.value,
                businessName: data.representative?.businessName || '',
                address: data.representative?.address || '',
                contact: data.representative?.contact || '',
              })}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="repBusiness">Business name</Label>
            <Input
              id="repBusiness"
              value={data.representative?.businessName || ''}
              onChange={(e) => update('representative', {
                ...data.representative,
                name: data.representative?.name || '',
                businessName: e.target.value,
                address: data.representative?.address || '',
                contact: data.representative?.contact || '',
              })}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="repAddress">Address</Label>
            <Input
              id="repAddress"
              value={data.representative?.address || ''}
              onChange={(e) => update('representative', {
                ...data.representative,
                name: data.representative?.name || '',
                businessName: data.representative?.businessName || '',
                address: e.target.value,
                contact: data.representative?.contact || '',
              })}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="repContact">Contact details</Label>
            <Input
              id="repContact"
              value={data.representative?.contact || ''}
              onChange={(e) => update('representative', {
                ...data.representative,
                name: data.representative?.name || '',
                businessName: data.representative?.businessName || '',
                address: data.representative?.address || '',
                contact: e.target.value,
              })}
              className="mt-2"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Step4Defendant({ 
  data, 
  update 
}: { 
  data: DefendantData; 
  update: (field: keyof DefendantData, value: any) => void;
}) {
  const addDefendant = () => {
    const newDefendants = [...data.defendants, {
      fullName: '',
      type: 'individual' as const,
      address: '',
    }];
    update('defendants', newDefendants);
    update('count', newDefendants.length);
  };

  const updateDefendant = (index: number, field: string, value: any) => {
    const updated = [...data.defendants];
    updated[index] = { ...updated[index], [field]: value };
    update('defendants', updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="defendantCount">How many defendants are there?</Label>
        <Input
          id="defendantCount"
          type="number"
          min="1"
          value={data.count}
          onChange={(e) => {
            const count = parseInt(e.target.value) || 1;
            update('count', count);
            // Adjust defendants array
            const currentCount = data.defendants.length;
            if (count > currentCount) {
              const newDefendants = [...data.defendants];
              for (let i = currentCount; i < count; i++) {
                newDefendants.push({
                  fullName: '',
                  type: 'individual',
                  address: '',
                });
              }
              update('defendants', newDefendants);
            } else if (count < currentCount) {
              update('defendants', data.defendants.slice(0, count));
            }
          }}
          className="mt-2"
        />
      </div>

      {data.defendants.map((defendant, index) => (
        <Card key={index} className="p-4">
          <h3 className="font-medium mb-4">Defendant {index + 1}</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor={`def-name-${index}`}>Full legal name</Label>
              <Input
                id={`def-name-${index}`}
                value={defendant.fullName}
                onChange={(e) => updateDefendant(index, 'fullName', e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor={`def-type-${index}`}>Type</Label>
              <select
                id={`def-type-${index}`}
                value={defendant.type}
                onChange={(e) => updateDefendant(index, 'type', e.target.value)}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="individual">Individual</option>
                <option value="business">Business</option>
                <option value="corporation">Corporation</option>
              </select>
            </div>
            <div>
              <Label htmlFor={`def-address-${index}`}>Address for service</Label>
              <Input
                id={`def-address-${index}`}
                value={defendant.address}
                onChange={(e) => updateDefendant(index, 'address', e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`def-phone-${index}`}>Phone (if known)</Label>
                <Input
                  id={`def-phone-${index}`}
                  type="tel"
                  value={defendant.phone || ''}
                  onChange={(e) => updateDefendant(index, 'phone', e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor={`def-email-${index}`}>Email (if known)</Label>
                <Input
                  id={`def-email-${index}`}
                  type="email"
                  value={defendant.email || ''}
                  onChange={(e) => updateDefendant(index, 'email', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`def-business-name-${index}`}>Registered business name (if different from legal name)</Label>
              <Input
                id={`def-business-name-${index}`}
                value={defendant.registeredBusinessName || ''}
                onChange={(e) => updateDefendant(index, 'registeredBusinessName', e.target.value)}
                className="mt-2"
                placeholder="Optional"
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Step5ClaimDetails({ 
  data, 
  update,
  initialDescription
}: { 
  data: ClaimDetailsData; 
  update: (field: keyof ClaimDetailsData, value: any) => void;
  initialDescription: string;
}) {
  // Pre-populate description from initial step if not already set
  useEffect(() => {
    if (initialDescription && !data.description) {
      update('description', initialDescription);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDescription]);

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="description">Briefly describe what happened</Label>
        <textarea
          id="description"
          value={data.description || initialDescription}
          onChange={(e) => update('description', e.target.value)}
          className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          placeholder="e.g., The Defendant failed to pay for renovation work."
        />
      </div>

      <div>
        <Label htmlFor="issueStartDate">When did the issue start?</Label>
        <Input
          id="issueStartDate"
          type="date"
          value={data.issueStartDate}
          onChange={(e) => update('issueStartDate', e.target.value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="location">Where did it happen?</Label>
        <Input
          id="location"
          value={data.location}
          onChange={(e) => update('location', e.target.value)}
          className="mt-2"
          placeholder="Address or city"
        />
      </div>

      <div>
        <Label htmlFor="agreement">What agreement or understanding existed between you and the Defendant?</Label>
        <textarea
          id="agreement"
          value={data.agreement}
          onChange={(e) => update('agreement', e.target.value)}
          className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        />
      </div>

      <div>
        <Label htmlFor="defendantAction">What did the Defendant do (or fail to do) that caused this claim?</Label>
        <textarea
          id="defendantAction"
          value={data.defendantAction}
          onChange={(e) => update('defendantAction', e.target.value)}
          className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        />
      </div>

      <div>
        <Label>Have you already asked the Defendant to resolve the issue?</Label>
        <div className="flex gap-4 mt-2">
          <Button
            type="button"
            variant={data.askedToResolve ? 'default' : 'outline'}
            onClick={() => update('askedToResolve', true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={!data.askedToResolve ? 'default' : 'outline'}
            onClick={() => update('askedToResolve', false)}
          >
            No
          </Button>
        </div>
      </div>

      {data.askedToResolve && (
        <div>
          <Label htmlFor="response">What was their response?</Label>
          <textarea
            id="response"
            value={data.response || ''}
            onChange={(e) => update('response', e.target.value)}
            className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          />
        </div>
      )}

      <div>
        <Label>Has the Defendant made any partial payments or offers?</Label>
        <div className="flex gap-4 mt-2">
          <Button
            type="button"
            variant={data.partialPayments ? 'default' : 'outline'}
            onClick={() => update('partialPayments', true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={!data.partialPayments ? 'default' : 'outline'}
            onClick={() => update('partialPayments', false)}
          >
            No
          </Button>
        </div>
      </div>

      {data.partialPayments && (
        <div>
          <Label htmlFor="partialPaymentDetails">Please specify the partial payments or offers</Label>
          <textarea
            id="partialPaymentDetails"
            value={data.partialPaymentDetails || ''}
            onChange={(e) => update('partialPaymentDetails', e.target.value)}
            className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          />
        </div>
      )}
    </div>
  );
}

function Step6Amount({ 
  data, 
  update,
  calculateTotal 
}: { 
  data: AmountData; 
  update: (field: keyof AmountData, value: any) => void;
  calculateTotal: () => void;
}) {
  useEffect(() => {
    calculateTotal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.principalAmount, data.costsAmount, data.damagesDetails]);

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="principalAmount">What is the principal amount you are claiming?</Label>
        <Input
          id="principalAmount"
          type="number"
          step="0.01"
          value={data.principalAmount}
          onChange={(e) => update('principalAmount', e.target.value)}
          className="mt-2"
          placeholder="0.00"
        />
      </div>

      <div>
        <Label>Are you claiming interest?</Label>
        <div className="flex gap-4 mt-2">
          <Button
            type="button"
            variant={data.claimingInterest ? 'default' : 'outline'}
            onClick={() => update('claimingInterest', true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={!data.claimingInterest ? 'default' : 'outline'}
            onClick={() => update('claimingInterest', false)}
          >
            No
          </Button>
        </div>
      </div>

      {data.claimingInterest && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="interestRate">Interest rate (%)</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.01"
              value={data.interestRate || ''}
              onChange={(e) => update('interestRate', e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="interestDate">From what date?</Label>
            <Input
              id="interestDate"
              type="date"
              value={data.interestDate || ''}
              onChange={(e) => update('interestDate', e.target.value)}
              className="mt-2"
            />
          </div>
        </div>
      )}

      <div>
        <Label>Are you claiming court filing costs or service fees?</Label>
        <div className="flex gap-4 mt-2">
          <Button
            type="button"
            variant={data.claimingCosts ? 'default' : 'outline'}
            onClick={() => update('claimingCosts', true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={!data.claimingCosts ? 'default' : 'outline'}
            onClick={() => update('claimingCosts', false)}
          >
            No
          </Button>
        </div>
      </div>

      {data.claimingCosts && (
        <div>
          <Label htmlFor="costsAmount">Estimated amount</Label>
          <Input
            id="costsAmount"
            type="number"
            step="0.01"
            value={data.costsAmount || ''}
            onChange={(e) => update('costsAmount', e.target.value)}
            className="mt-2"
            placeholder="0.00"
          />
        </div>
      )}

      <div>
        <Label>Are you claiming any additional damages (e.g., inconvenience, property damage, or lost income)?</Label>
        <div className="flex gap-4 mt-2">
          <Button
            type="button"
            variant={data.claimingDamages ? 'default' : 'outline'}
            onClick={() => update('claimingDamages', true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={!data.claimingDamages ? 'default' : 'outline'}
            onClick={() => update('claimingDamages', false)}
          >
            No
          </Button>
        </div>
      </div>

      {data.claimingDamages && (
        <div>
          <Label htmlFor="damagesDetails">Damages amount</Label>
          <Input
            id="damagesDetails"
            type="number"
            step="0.01"
            value={data.damagesDetails || ''}
            onChange={(e) => update('damagesDetails', e.target.value)}
            className="mt-2"
            placeholder="0.00"
          />
        </div>
      )}

      <div className="bg-muted p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Amount:</span>
          <span className="text-2xl font-bold">${data.totalAmount}</span>
        </div>
      </div>
    </div>
  );
}

function Step7Remedy({ 
  data, 
  update 
}: { 
  data: RemedyData; 
  update: (field: keyof RemedyData, value: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label>What are you asking the court to order the Defendant to do?</Label>
        <div className="space-y-3 mt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="payMoney"
              checked={data.payMoney}
              onCheckedChange={(checked) => update('payMoney', checked === true)}
            />
            <Label htmlFor="payMoney" className="font-normal cursor-pointer">
              Pay money
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="returnProperty"
              checked={data.returnProperty}
              onCheckedChange={(checked) => update('returnProperty', checked === true)}
            />
            <Label htmlFor="returnProperty" className="font-normal cursor-pointer">
              Return property
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="performObligation"
              checked={data.performObligation}
              onCheckedChange={(checked) => update('performObligation', checked === true)}
            />
            <Label htmlFor="performObligation" className="font-normal cursor-pointer">
              Perform an obligation
            </Label>
          </div>
        </div>
      </div>

      <div>
        <Label>Do you want interest and costs awarded as well?</Label>
        <div className="flex gap-4 mt-2">
          <Button
            type="button"
            variant={data.interestAndCosts ? 'default' : 'outline'}
            onClick={() => update('interestAndCosts', true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={!data.interestAndCosts ? 'default' : 'outline'}
            onClick={() => update('interestAndCosts', false)}
          >
            No
          </Button>
        </div>
      </div>
    </div>
  );
}

function Step8Evidence({ 
  data, 
  update 
}: { 
  data: EvidenceData; 
  update: (field: keyof EvidenceData, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="documents">What documents support your claim? (e.g., invoices, contracts, emails, receipts)</Label>
        <textarea
          id="documents"
          value={data.documents}
          onChange={(e) => update('documents', e.target.value)}
          className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          placeholder="List all supporting documents"
        />
      </div>

      <div>
        <Label>Do you have any witnesses?</Label>
        <div className="flex gap-4 mt-2">
          <Button
            type="button"
            variant={data.hasWitnesses ? 'default' : 'outline'}
            onClick={() => update('hasWitnesses', true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={!data.hasWitnesses ? 'default' : 'outline'}
            onClick={() => update('hasWitnesses', false)}
          >
            No
          </Button>
        </div>
      </div>

      {data.hasWitnesses && (
        <div>
          <Label htmlFor="witnessDetails">Witness details</Label>
          <textarea
            id="witnessDetails"
            value={data.witnessDetails || ''}
            onChange={(e) => update('witnessDetails', e.target.value)}
            className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            placeholder="Provide witness names and contact information"
          />
        </div>
      )}

      <div>
        <Label htmlFor="evidenceDescription">Would you like to describe key pieces of evidence now?</Label>
        <textarea
          id="evidenceDescription"
          value={data.evidenceDescription || ''}
          onChange={(e) => update('evidenceDescription', e.target.value)}
          className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          placeholder="Describe key evidence"
        />
      </div>

      <div>
        <Label htmlFor="timeline">Please provide a timeline of the main events, if possible</Label>
        <textarea
          id="timeline"
          value={data.timeline || ''}
          onChange={(e) => update('timeline', e.target.value)}
          className="mt-2 flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          placeholder="Provide a chronological timeline of events"
        />
      </div>
    </div>
  );
}

function Step9LegalIssues({ formData }: { formData: FormData }) {
  const [legalIssues, setLegalIssues] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const analyzeLegalIssues = () => {
    setIsProcessing(true);
    // TODO: API call to OpenAI/Alexi
    setTimeout(() => {
      setLegalIssues([
        'Breach of Contract',
        'Unpaid Invoice',
      ]);
      setIsProcessing(false);
    }, 2000);
  };

  useEffect(() => {
    analyzeLegalIssues();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          AI will analyze your case to identify relevant legal issues, case law, and legislation.
        </p>
      </div>

      {isProcessing ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Analyzing your case...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label>Identified Legal Issues:</Label>
            <ul className="mt-2 space-y-2">
              {legalIssues.map((issue, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-primary rounded-full"></span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Note: This is a prototype. In production, AI will provide detailed legal context, 
              relevant case law, and legislation based on your specific case.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ExtractedDataReview({ 
  extractedData, 
  formData, 
  onEdit,
  onContinue 
}: { 
  extractedData: Partial<FormData>; 
  formData: FormData;
  onEdit: (section: string, field: string, value: any) => void;
  onContinue: () => void;
}) {
  // Define all fields from all steps with their labels
  const allFields = [
    // Step 2: Eligibility Check
    { section: 'eligibility', field: 'totalAmount', label: 'Total Amount Claimed', step: 2, stepName: 'Eligibility Check' },
    { section: 'eligibility', field: 'isAmountUnder35000', label: 'Is Amount Under $35,000?', step: 2, stepName: 'Eligibility Check', type: 'boolean' },
    { section: 'eligibility', field: 'isBasedInOntario', label: 'Is Based in Ontario?', step: 2, stepName: 'Eligibility Check', type: 'boolean' },
    { section: 'eligibility', field: 'issueDate', label: 'Issue Date', step: 2, stepName: 'Eligibility Check' },
    { section: 'eligibility', field: 'claimType', label: 'Claim Type', step: 2, stepName: 'Eligibility Check' },
    
    // Step 3: Plaintiff Information
    { section: 'plaintiff', field: 'fullName', label: 'Full Name', step: 3, stepName: 'Plaintiff Information' },
    { section: 'plaintiff', field: 'filingType', label: 'Filing Type', step: 3, stepName: 'Plaintiff Information' },
    { section: 'plaintiff', field: 'address', label: 'Address', step: 3, stepName: 'Plaintiff Information' },
    { section: 'plaintiff', field: 'city', label: 'City', step: 3, stepName: 'Plaintiff Information' },
    { section: 'plaintiff', field: 'province', label: 'Province', step: 3, stepName: 'Plaintiff Information' },
    { section: 'plaintiff', field: 'postalCode', label: 'Postal Code', step: 3, stepName: 'Plaintiff Information' },
    { section: 'plaintiff', field: 'phone', label: 'Phone', step: 3, stepName: 'Plaintiff Information' },
    { section: 'plaintiff', field: 'email', label: 'Email', step: 3, stepName: 'Plaintiff Information' },
    { section: 'plaintiff', field: 'hasRepresentative', label: 'Has Representative?', step: 3, stepName: 'Plaintiff Information', type: 'boolean' },
    
    // Step 4: Defendant Information
    { section: 'defendants', field: 'count', label: 'Number of Defendants', step: 4, stepName: 'Defendant Information', type: 'count' },
    { section: 'defendants', field: 'defendants', label: 'Defendant Details', step: 4, stepName: 'Defendant Information', type: 'array' },
    
    // Step 5: Claim Details
    { section: 'claimDetails', field: 'description', label: 'Description', step: 5, stepName: 'Details of the Claim' },
    { section: 'claimDetails', field: 'issueStartDate', label: 'Issue Start Date', step: 5, stepName: 'Details of the Claim' },
    { section: 'claimDetails', field: 'location', label: 'Location', step: 5, stepName: 'Details of the Claim' },
    { section: 'claimDetails', field: 'agreement', label: 'Agreement Details', step: 5, stepName: 'Details of the Claim' },
    { section: 'claimDetails', field: 'defendantAction', label: 'Defendant Action', step: 5, stepName: 'Details of the Claim' },
    { section: 'claimDetails', field: 'askedToResolve', label: 'Asked to Resolve?', step: 5, stepName: 'Details of the Claim', type: 'boolean' },
    { section: 'claimDetails', field: 'response', label: 'Response Received', step: 5, stepName: 'Details of the Claim' },
    { section: 'claimDetails', field: 'partialPayments', label: 'Partial Payments?', step: 5, stepName: 'Details of the Claim', type: 'boolean' },
    { section: 'claimDetails', field: 'partialPaymentDetails', label: 'Partial Payment Details', step: 5, stepName: 'Details of the Claim' },
    
    // Step 6: Amount
    { section: 'amount', field: 'principalAmount', label: 'Principal Amount', step: 6, stepName: 'Amount of Claim' },
    { section: 'amount', field: 'claimingInterest', label: 'Claiming Interest?', step: 6, stepName: 'Amount of Claim', type: 'boolean' },
    { section: 'amount', field: 'interestRate', label: 'Interest Rate', step: 6, stepName: 'Amount of Claim' },
    { section: 'amount', field: 'interestDate', label: 'Interest Date', step: 6, stepName: 'Amount of Claim' },
    { section: 'amount', field: 'claimingCosts', label: 'Claiming Costs?', step: 6, stepName: 'Amount of Claim', type: 'boolean' },
    { section: 'amount', field: 'costsAmount', label: 'Costs Amount', step: 6, stepName: 'Amount of Claim' },
    { section: 'amount', field: 'claimingDamages', label: 'Claiming Damages?', step: 6, stepName: 'Amount of Claim', type: 'boolean' },
    { section: 'amount', field: 'damagesDetails', label: 'Damages Details', step: 6, stepName: 'Amount of Claim' },
    { section: 'amount', field: 'totalAmount', label: 'Total Amount', step: 6, stepName: 'Amount of Claim' },
    
    // Step 7: Remedy
    { section: 'remedy', field: 'payMoney', label: 'Pay Money', step: 7, stepName: 'Remedy Requested', type: 'boolean' },
    { section: 'remedy', field: 'returnProperty', label: 'Return Property', step: 7, stepName: 'Remedy Requested', type: 'boolean' },
    { section: 'remedy', field: 'performObligation', label: 'Perform Obligation', step: 7, stepName: 'Remedy Requested', type: 'boolean' },
    { section: 'remedy', field: 'interestAndCosts', label: 'Interest and Costs', step: 7, stepName: 'Remedy Requested', type: 'boolean' },
    
    // Step 8: Evidence
    { section: 'evidence', field: 'documents', label: 'Documents', step: 8, stepName: 'Supporting Facts & Evidence' },
    { section: 'evidence', field: 'hasWitnesses', label: 'Has Witnesses?', step: 8, stepName: 'Supporting Facts & Evidence', type: 'boolean' },
    { section: 'evidence', field: 'witnessDetails', label: 'Witness Details', step: 8, stepName: 'Supporting Facts & Evidence' },
    { section: 'evidence', field: 'evidenceDescription', label: 'Evidence Description', step: 8, stepName: 'Supporting Facts & Evidence' },
    { section: 'evidence', field: 'timeline', label: 'Timeline', step: 8, stepName: 'Supporting Facts & Evidence' },
  ];

  // Calculate completion percentage
  const getFieldValue = (section: string, field: string): any => {
    const sectionData = formData[section as keyof FormData] as any;
    if (!sectionData) return null;
    
    if (section === 'defendants' && field === 'defendants') {
      return sectionData.defendants || [];
    }
    
    return sectionData[field];
  };

  const formatFieldValue = (section: string, field: string, value: any, type?: string): string => {
    if (value === null || value === undefined || value === '') {
      return 'Not provided';
    }
    
    if (type === 'boolean') {
      return value === true ? 'Yes' : value === false ? 'No' : 'Not provided';
    }
    
    if (type === 'array') {
      if (Array.isArray(value) && value.length > 0) {
        return `${value.length} defendant(s)`;
      }
      return 'Not provided';
    }
    
    if (type === 'count') {
      return value ? `${value} defendant(s)` : 'Not provided';
    }
    
    if (field === 'claimType' || field === 'filingType') {
      return String(value).charAt(0).toUpperCase() + String(value).slice(1);
    }
    
    if (field.includes('Amount') || field === 'totalAmount' || field === 'principalAmount' || field === 'costsAmount' || field === 'damagesDetails') {
      return `$${value}`;
    }
    
    return String(value);
  };

  const isFieldFilled = (section: string, field: string, value: any): boolean => {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    if (typeof value === 'boolean') {
      return true; // Boolean values are always "filled" even if false
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return true;
  };

  // Count filled vs total fields
  let filledCount = 0;
  let totalCount = 0;
  
  allFields.forEach(fieldDef => {
    totalCount++;
    const value = getFieldValue(fieldDef.section, fieldDef.field);
    if (isFieldFilled(fieldDef.section, fieldDef.field, value)) {
      filledCount++;
    }
  });
  
  const completionPercentage = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  // Group fields by step
  const fieldsByStep: Record<number, typeof allFields> = {};
  allFields.forEach(field => {
    if (!fieldsByStep[field.step]) {
      fieldsByStep[field.step] = [];
    }
    fieldsByStep[field.step].push(field);
  });

  return (
    <div className="space-y-6">
      {/* Completion Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-blue-900 mb-1">✅ Data Extraction Complete</h2>
            <p className="text-blue-700 text-sm">
              We've extracted information from your description. Please review all fields below.
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-900">{completionPercentage}%</div>
            <div className="text-sm text-blue-700">Complete</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-blue-800 font-medium">Fields Extracted</span>
            <span className="text-blue-800 font-medium">{filledCount} of {totalCount}</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Render all fields grouped by step */}
        {Object.entries(fieldsByStep).map(([step, fields]) => (
          <Card key={step}>
            <CardHeader>
              <CardTitle className="text-lg">
                Step {step}: {fields[0]?.stepName || 'Unknown Step'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((fieldDef) => {
                const value = getFieldValue(fieldDef.section, fieldDef.field);
                const isFilled = isFieldFilled(fieldDef.section, fieldDef.field, value);
                const displayValue = formatFieldValue(fieldDef.section, fieldDef.field, value, fieldDef.type);
                
                // Special handling for defendants array
                if (fieldDef.type === 'array' && Array.isArray(value) && value.length > 0) {
                  return (
                    <div key={fieldDef.field} className="border-b pb-3 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isFilled ? (
                            <span className="text-green-600">✅</span>
                          ) : (
                            <span className="text-red-500">❌</span>
                          )}
                          <span className="font-medium text-sm">{fieldDef.label}:</span>
                        </div>
                        <span className={`text-sm ${isFilled ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {displayValue}
                        </span>
                      </div>
                      {value.map((def: any, idx: number) => (
                        <div key={idx} className="ml-6 mt-2 text-xs space-y-1 text-muted-foreground">
                          <div><strong>Defendant {idx + 1}:</strong> {def.fullName || 'N/A'}</div>
                          {def.type && <div>Type: {def.type}</div>}
                          {def.registeredBusinessName && <div>Business: {def.registeredBusinessName}</div>}
                          {def.address && <div>Address: {def.address}</div>}
                          {def.phone && <div>Phone: {def.phone}</div>}
                          {def.email && <div>Email: {def.email}</div>}
                        </div>
                      ))}
                    </div>
                  );
                }
                
                return (
                  <div key={fieldDef.field} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      {isFilled ? (
                        <span className="text-green-600 font-bold">✅</span>
                      ) : (
                        <span className="text-red-500 font-bold">❌</span>
                      )}
                      <span className={`text-sm ${isFilled ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {fieldDef.label}:
                      </span>
                    </div>
                    <span className={`text-sm ${isFilled ? 'font-semibold text-foreground' : 'text-muted-foreground italic'}`}>
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={onContinue} size="lg" className="gap-2">
          Continue to Next Questions
        </Button>
      </div>
    </div>
  );
}

function Step10Review({ formData, initialDescription }: { formData: FormData; initialDescription: string }) {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 font-medium mb-2">Review your information</p>
        <p className="text-green-700 text-sm">
          Please review all information below. Once confirmed, we will generate your legal documents.
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What Happened</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="whitespace-pre-wrap">{initialDescription || formData.claimDetails.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Eligibility</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>Total Amount:</strong> ${formData.eligibility.totalAmount}</p>
            <p><strong>Amount under $35,000:</strong> {formData.eligibility.isAmountUnder35000 ? 'Yes' : 'No'}</p>
            <p><strong>Based in Ontario:</strong> {formData.eligibility.isBasedInOntario ? 'Yes' : 'No'}</p>
            <p><strong>Claim Type:</strong> {formData.eligibility.claimType}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plaintiff Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>Name:</strong> {formData.plaintiff.fullName}</p>
            <p><strong>Type:</strong> {formData.plaintiff.filingType}</p>
            <p><strong>Address:</strong> {formData.plaintiff.address}, {formData.plaintiff.city}, {formData.plaintiff.province}</p>
            <p><strong>Contact:</strong> {formData.plaintiff.phone} / {formData.plaintiff.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Claim Amount</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-xl font-bold">${formData.amount.totalAmount}</p>
          </CardContent>
        </Card>

        <div>
          <Label>Is everything correct?</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Click "Generate Documents" to create your legal claim forms.
          </p>
        </div>
      </div>
    </div>
  );
}


