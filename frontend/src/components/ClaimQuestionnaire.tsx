'use client';

import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Chip } from '@/components/ui/chip';
import { DynamicQuestionRenderer } from '@/components/DynamicQuestionRenderer';
import { apiClient } from '@/lib/api';
import { Loader2, Download, Plus, Minus, Upload } from 'lucide-react';

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
    addressLine1: string;
    city: string;
    province: string;
    postalCode: string;
    phoneNumber: string;
    email: string;
    lsoNumber: string;
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

const TOTAL_STEPS = 12;

export function ClaimQuestionnaire() {
  const ENABLE_AI_ANALYSIS = false;
  
  // Check for test mode from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const testMode = params.get('test') === 'true';
      const stepParam = params.get('step');
      
      if (testMode) {
        const step = stepParam ? parseInt(stepParam, 10) : 12;
        setCurrentStep(step);
        
        // If testing step 12, set up test documents
        if (step === 12) {
          setGeneratedDocuments({
            claimType: 'Breach of Contract',
            legalBases: 'The Plaintiff entered into a written contract with the Defendant for a renovation project. The Defendant failed to complete the work as agreed and refused to return the deposit, constituting a breach of contract under Ontario law.',
            form7AText: '<html><body><h1>Form 7A Test Content</h1><p>This is test Form 7A HTML content.</p></body></html>',
            scheduleAText: '1. The Plaintiff, John Doe, claims against the Defendant, ABC Construction Ltd., for damages arising from breach of contract.\n\n2. The Defendant was at all material times a construction company engaged in renovation services.\n\n3. On January 1, 2024, the parties entered into a written contract for renovation work.\n\n4. The Defendant failed to complete the work as agreed.\n\n5. The Plaintiff suffered losses in the amount of $5,000.',
          });
        }
      }
    }
  }, []);
  
  const [currentStep, setCurrentStep] = useState(() => {
    // Initialize step from URL if in test mode
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('test') === 'true') {
        const stepParam = params.get('step');
        return stepParam ? parseInt(stepParam, 10) : 1;
      }
    }
    return 1;
  });
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
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationLogs, setGenerationLogs] = useState<Array<{ time: string; level: 'info' | 'success' | 'error' | 'warning'; message: string }>>([]);
  const [generatedDocuments, setGeneratedDocuments] = useState<{
    claimType?: string;
    legalBases?: string;
    form7AText?: string;
    scheduleAText?: string;
    warnings?: string;
  } | null>(null);

  const addLog = (level: 'info' | 'success' | 'error' | 'warning', message: string) => {
    const time = new Date().toLocaleTimeString();
    const logEntry = { time, level, message };
    console.log(`[addLog] Called with:`, { level, message, time });
    setGenerationLogs(prev => {
      const updated = [...prev, logEntry];
      console.log(`[addLog] State update:`, { 
        prevCount: prev.length, 
        newCount: updated.length, 
        allLogs: updated 
      });
      return updated;
    });
  };

  // Load dummy data on component mount for testing
  useEffect(() => {
    // Populate form with dummy data for testing
    setFormData({
      eligibility: {
        totalAmount: '15000',
        isAmountUnder35000: true,
        isBasedInOntario: true,
        issueDate: '2024-01-15',
        claimType: 'money',
        qualifies: true,
      },
      plaintiff: {
        fullName: 'John Doe',
        filingType: 'individual',
        address: '123 Main Street',
        city: 'Toronto',
        province: 'Ontario',
        postalCode: 'M5H 2N2',
        phone: '+1 416-555-1234',
        email: 'john.doe@example.com',
        hasRepresentative: false,
      },
      defendants: {
        count: 1,
        defendants: [{
          fullName: 'ABC Construction Ltd.',
          type: 'business',
          address: '456 Business Ave, Toronto, ON M6K 1A1',
          phone: '+1 416-555-5678',
          email: 'info@abcconstruction.com',
        }],
      },
      claimDetails: {
        description: 'The Defendant failed to complete renovation work as agreed and refused to return the deposit.',
        issueStartDate: '2024-01-15',
        location: 'Toronto, Ontario',
        agreement: 'Written contract dated January 1, 2024 for $20,000 renovation project',
        defendantAction: 'Stopped showing up and did not respond to calls or emails',
        askedToResolve: true,
        response: 'No response received',
        partialPayments: false,
      },
      amount: {
        principalAmount: '5000',
        claimingInterest: true,
        interestRate: '2',
        interestDate: '2024-01-15',
        claimingCosts: true,
        costsAmount: '500',
        claimingDamages: false,
        totalAmount: '5500',
      },
      remedy: {
        payMoney: true,
        returnProperty: false,
        performObligation: false,
        interestAndCosts: true,
      },
      evidence: {
        documents: 'Contract agreement, email correspondence, bank statements',
        hasWitnesses: true,
        witnessDetails: 'Jane Smith - witnessed the contract signing',
        evidenceDescription: 'Written contract and email chain showing agreement and subsequent refusal',
        timeline: 'Jan 1 - Contract signed, Jan 5 - Work started, Jan 10 - Defendant stopped responding',
      },
    });
    setInitialDescription('The Defendant ABC Construction Ltd. agreed to perform renovation work for $20,000. They received a $5,000 deposit but failed to complete the work and stopped responding to communications.');
  }, []);

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
    // Step 1: either analyze (if enabled) or proceed with traditional stepper
    if (currentStep === 1) {
      if (ENABLE_AI_ANALYSIS && initialDescription.trim().length >= 10) {
        setIsAnalyzing(true);
        try {
          const response = await apiClient.analyzeClaimDescription(initialDescription);
          if (response.success && response.data) {
            const extracted = response.data.extracted as any;
            setExtractedData(extracted);
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
                  description: initialDescription,
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
              return updated;
            });
            setShowExtractedDataReview(true);
          } else {
            console.error('Analysis failed:', response);
            alert(`Analysis failed: ${(response.error as any)?.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Analysis error:', error);
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
      } else {
        // Proceed to next step without AI
        if (currentStep < TOTAL_STEPS) {
          setCurrentStep(prev => prev + 1);
        }
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
    console.log('[handleSubmit] ========== FUNCTION CALLED ==========');
    console.log('[handleSubmit] Current state before changes:', { 
      currentStep, 
      isGeneratingDocuments, 
      logsCount: generationLogs.length 
    });
    
    // Initialize with first log immediately BEFORE navigation
    const initialLog = { 
      time: new Date().toLocaleTimeString(), 
      level: 'info' as const, 
      message: 'Starting document generation process...' 
    };
    
    console.log('[handleSubmit] Setting initial log:', initialLog);
    
    // Use flushSync to force synchronous state update
    flushSync(() => {
      setGenerationLogs([initialLog]);
      setGenerationError(null);
    setIsGeneratingDocuments(true);
    });
    
    console.log('[handleSubmit] State updated, now setting currentStep to 11');
    
    // Navigate to generation step AFTER logs are set
    flushSync(() => {
      setCurrentStep(11);
    });
    
    console.log('[handleSubmit] Navigated to step 11. Waiting for render...');
    
    // Small delay to let React render
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log('[handleSubmit] After delay, continuing with async operations...');
    
    try {
      addLog('info', 'Initialization complete');
      console.log('First addLog called');
      
      // Test backend connection
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      addLog('info', `API URL: ${apiUrl}`);
      addLog('info', `Form data present: ${!!formData}`);
      
      // Check if backend is reachable
      try {
        addLog('info', 'Testing backend connection...');
        const healthResponse = await fetch(`${apiUrl.replace('/api/v1', '')}/api/v1/health`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (healthResponse.ok) {
          addLog('success', 'Backend connection successful');
        } else {
          addLog('warning', `Backend health check returned status: ${healthResponse.status}`);
        }
      } catch (healthError) {
        addLog('error', `Backend health check failed: ${healthError instanceof Error ? healthError.message : 'Unknown error'}`);
        addLog('warning', 'Continuing anyway...');
      }
      
      // Test OpenAI key (via backend)
      addLog('info', 'Checking OpenAI API key configuration...');
      
      addLog('info', 'Sending request to generate documents...');
      addLog('info', `Request payload size: ${JSON.stringify({ claimData: formData, initialDescription }).length} bytes`);
      const startTime = Date.now();
      
      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout after 180 seconds'));
        }, 180000); // 3 minutes
      });
      
      addLog('info', 'Waiting for backend response...');
      const response = await Promise.race([
        apiClient.generateClaimDocuments(formData, initialDescription),
        timeoutPromise,
      ]) as any;
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      addLog('info', `API response received in ${duration}s`);
      addLog('info', `Response success: ${response.success}`);
      addLog('info', `Has data: ${!!response.data}`);
      addLog('info', `Has error: ${!!response.error}`);
      
      if (response.success && response.data) {
        addLog('success', 'Documents generated successfully!');
        addLog('info', `Form 7A text length: ${response.data.form7AText?.length || 0} characters`);
        addLog('info', `Schedule A text length: ${response.data.scheduleAText?.length || 0} characters`);
        addLog('info', `Claim type: ${response.data.claimType || 'Not specified'}`);
        
        if (response.data.warnings) {
          addLog('warning', 'Warnings detected in generated documents');
        }
        
        console.log('[handleSubmit] Setting generatedDocuments with:', {
          claimType: response.data.claimType,
          form7ATextLength: response.data.form7AText?.length || 0,
          scheduleATextLength: response.data.scheduleAText?.length || 0,
          hasWarnings: !!response.data.warnings,
        });
        
        console.log('[handleSubmit] Form 7A text preview:', response.data.form7AText?.substring(0, 200));
        console.log('[handleSubmit] Schedule A text preview:', response.data.scheduleAText?.substring(0, 200));
        
        setGeneratedDocuments({
          claimType: response.data.claimType,
          legalBases: response.data.legalBases,
          form7AText: response.data.form7AText || '',
          scheduleAText: response.data.scheduleAText || '',
          warnings: response.data.warnings,
        });
        
        addLog('success', 'Navigating to documents view...');
        // Navigate to the documents view step after generation completes
        setCurrentStep(12);
      } else {
        // If generation failed, stay on step 11 and show error
        const errorData = response.error as any;
        const errorMessage = errorData?.message || errorData?.code || 'Failed to generate documents. Please try again.';
        const errorDetails = errorData?.details ? JSON.stringify(errorData.details, null, 2) : null;
        
        addLog('error', `Generation failed: ${errorMessage}`);
        if (errorDetails) {
          addLog('error', `Error details: ${errorDetails}`);
        }
        
        setGenerationError(errorDetails ? `${errorMessage}\n\nDetails:\n${errorDetails}` : errorMessage);
      }
    } catch (error) {
      // Show error message on step 11
      let errorMessage = 'Failed to generate documents. Please check your connection and try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific error types
        if (error.message.includes('timeout') || error.message.includes('aborted')) {
          errorMessage = 'The request timed out. This might be because the backend is not responding. Please check if the backend server is running.';
          addLog('error', 'Request timeout - backend may not be responding');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Cannot connect to the server. Please check if the backend is running at http://localhost:3001';
          addLog('error', 'Network error - cannot connect to backend');
        } else if (error.message.includes('404')) {
          errorMessage = 'API endpoint not found. Please check the backend server configuration.';
          addLog('error', 'API endpoint not found (404)');
        } else {
          addLog('error', `Unexpected error: ${error.message}`);
        }
      } else {
        addLog('error', 'Unknown error occurred');
      }
      
      setGenerationError(errorMessage);
    } finally {
      setIsGeneratingDocuments(false);
      addLog('info', 'Generation process completed');
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


    // Traditional step flow
    switch (currentStep) {
      case 1:
        return <Step1WhatHappened description={initialDescription} update={setInitialDescription} />;
      case 2:
        return <Step2Eligibility data={formData.eligibility} update={updateEligibility} checkEligibility={checkEligibility} />;
      case 3:
        return <Step3Plaintiff data={formData.plaintiff} update={updatePlaintiff} />;
      case 4:
        return <Step3Representative data={formData.plaintiff} update={updatePlaintiff} />;
      case 5:
        return <Step4Defendant data={formData.defendants} update={updateDefendants} />;
      case 6:
        return <Step5ClaimDetails data={formData.claimDetails} update={updateClaimDetails} initialDescription={initialDescription} />;
      case 7:
        return <Step6Amount data={formData.amount} update={updateAmount} calculateTotal={calculateTotal} />;
      case 8:
        return <Step7Remedy data={formData.remedy} update={updateRemedy} />;
      case 9:
        return <Step8Evidence data={formData.evidence} update={updateEvidence} />;
      case 10:
        return <Step10Review formData={formData} initialDescription={initialDescription} />;
      case 11:
        console.log('[renderStep] Case 11 - Rendering Step11', { 
          logsCount: generationLogs.length, 
          logs: generationLogs,
          isGenerating: isGeneratingDocuments,
          error: !!generationError
        });
        return <Step11GeneratingDocuments 
          isGenerating={isGeneratingDocuments} 
          error={generationError} 
          logs={generationLogs}
          onRetry={handleSubmit} 
          onGoBack={() => setCurrentStep(10)} 
        />;
      case 12:
        return <Step12ViewDocuments 
          generatedDocuments={generatedDocuments} 
          formData={formData}
          onFormDataChange={(updatedFormData) => {
            setFormData(updatedFormData);
          }}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Test Mode Indicator */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('test') === 'true' && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-sm">
          <strong>🧪 Test Mode Active</strong> - Using test data. 
          <a href="/claim?test=true&step=12" className="ml-2 text-blue-600 underline">
            Refresh this page
          </a>
        </div>
      )}
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
        <>
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-2">
              {getStepTitle(currentStep)}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              {getStepDescription(currentStep)}
            </p>
          </div>
          <Card>
            <CardContent>
              {renderStep()}
            </CardContent>
          </Card>
        </>
      )}

      {showExtractedDataReview ? (
        // Extracted data review - Continue button shown in component
        null
      ) : currentStep === 1 ? (
        // First step: centered, large Continue button only
        <div className="flex justify-center mt-8">
          <Button 
            onClick={handleNext} 
            size="lg" 
            className="px-8 py-6 text-lg"
            disabled={initialDescription.trim().length < 10}
          >
            {'Continue'}
          </Button>
        </div>
      ) : currentStep === TOTAL_STEPS ? (
        // Final step - no buttons (handled in component)
        null
      ) : currentStep === 10 ? (
        // Step 10 (Review & Generate): Show Generate Documents button
        <div className="flex flex-col items-center mt-8 space-y-4">
          <Button 
            onClick={() => {
              console.log('[Button] Generate Documents clicked');
              console.log('[Button] Current state:', { 
                currentStep, 
                isGeneratingDocuments, 
                logsCount: generationLogs.length 
              });
              handleSubmit();
            }} 
            size="lg" 
            className="px-8 py-6 text-lg"
            disabled={isGeneratingDocuments}
          >
              {isGeneratingDocuments ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Documents'
              )}
            </Button>
          <button
            type="button"
            onClick={handlePrevious}
            className="text-base text-muted-foreground hover:text-foreground transition-colors"
          >
            Go Back
          </button>
        </div>
      ) : (
        // All other steps: Centered Continue button with Go Back text below (like Eligibility Check)
        <div className="flex flex-col items-center mt-8 space-y-4">
          {currentStep < 10 ? (
            <Button 
              onClick={handleNext} 
              size="lg" 
              className="px-8 py-6 text-lg"
              disabled={isAnalyzing}
            >
              Continue
            </Button>
          ) : null}
          {currentStep !== 11 && currentStep !== 12 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="text-base text-muted-foreground hover:text-foreground transition-colors"
            >
              Go Back
            </button>
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
    'Representative', // Step 4 - new step
    'Defendant Information',
    'Details of the Claim',
    'Amount of Claim',
    'Remedy Requested',
    'Supporting Facts & Evidence',
    'Review & Generate',
    'Generating Documents',
    'Your Documents',
  ];
  return titles[step] || '';
}

function getStepDescription(step: number): string {
  const descriptions = [
    '',
    'Briefly describe what happened', // Step 1
    'Let\'s verify if your case qualifies for Ontario Small Claims Court',
    'Tell us about yourself',
    'Do you have a representative?', // Step 4 - new step
    'Information about the defendant(s)',
    'Details about what happened',
    'The amount you are claiming',
    'What you are asking the court to order',
    'Evidence and supporting documents',
    'Review all information before generating documents',
    'Please wait while we generate your documents',
    'Review and download your generated documents',
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
      <div className="pt-6">
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
          className="mt-2 h-12 text-base px-4"
        />
      </div>

      {/* Hidden - auto-set based on totalAmount */}
      {/* <div>
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
      </div> */}

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
          className="mt-2 h-12 text-base px-4"
        />
      </div>

      <div>
        <Label className="mb-4 block">Is this about money owed, property returned, or damages for a loss?</Label>
        <div className="flex flex-wrap gap-3 mt-2">
          <Chip
            selected={data.claimType === 'money'}
            onClick={() => update('claimType', 'money')}
          >
            Money owed
          </Chip>
          <Chip
            selected={data.claimType === 'property'}
            onClick={() => update('claimType', 'property')}
          >
            Property returned
          </Chip>
          <Chip
            selected={data.claimType === 'damages'}
            onClick={() => update('claimType', 'damages')}
          >
            Damages for a loss
          </Chip>
        </div>
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
      <div className="pt-6">
        <Label htmlFor="fullName">Please enter your full legal name</Label>
        <Input
          id="fullName"
          value={data.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          className="mt-2 h-12 text-base px-4"
        />
      </div>

      <div>
        <Label className="mb-4 block">Are you filing as an individual, business, or organization?</Label>
        <div className="flex flex-wrap gap-3 mt-2">
          <Chip
            selected={data.filingType === 'individual'}
            onClick={() => update('filingType', 'individual')}
          >
            Individual
          </Chip>
          <Chip
            selected={data.filingType === 'business'}
            onClick={() => update('filingType', 'business')}
          >
            Business
          </Chip>
          <Chip
            selected={data.filingType === 'organization'}
            onClick={() => update('filingType', 'organization')}
          >
            Organization
          </Chip>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Your Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="address">Street address</Label>
          <Input
            id="address"
            value={data.address}
            onChange={(e) => update('address', e.target.value)}
            className="mt-2 h-12 text-base px-4"
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={data.city}
            onChange={(e) => update('city', e.target.value)}
            className="mt-2 h-12 text-base px-4"
          />
        </div>
        <div>
          <Label htmlFor="province">Province</Label>
          <Input
            id="province"
            value={data.province}
            onChange={(e) => update('province', e.target.value)}
            className="mt-2 h-12 text-base px-4"
          />
        </div>
        <div>
          <Label htmlFor="postalCode">Postal code</Label>
          <Input
            id="postalCode"
            value={data.postalCode}
            onChange={(e) => update('postalCode', e.target.value)}
            className="mt-2 h-12 text-base px-4"
          />
          </div>
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
            className="mt-2 h-12 text-base px-4"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            className="mt-2 h-12 text-base px-4"
          />
        </div>
      </div>
    </div>
  );
}

function Step3Representative({ 
  data, 
  update 
}: { 
  data: PlaintiffData; 
  update: (field: keyof PlaintiffData, value: any) => void;
}) {
  const [selectedLawyer, setSelectedLawyer] = useState<string | null>(null);

  // Mock lawyer data - in production this would come from an API
  const availableLawyers = [
    {
      id: 'lawyer1',
      name: 'Nauman Aslam Dar',
      title: 'Ontario Licensed Paralegal',
      description: 'Providing legal services related to Small Claims Court and Employment Law',
      image: 'https://media.licdn.com/dms/image/v2/D5603AQGlVKTTXg9vSg/profile-displayphoto-shrink_800_800/B56ZW6zpx9GoAc-/0/1742595857863?e=1763596800&v=beta&t=uIuYnmkzVoi_tXQMNhb2xn7y68EeSPE5BX3TyTtPPfM',
      businessName: 'Dar Paralegal SVCS',
      contact: '+1 365 889 1193',
      address: '166 Main St W Unit L1, Grimsby, ON L3M 1S3',
      email: 'nauman@darparalegal.ca',
      lsoNumber: 'P20576',
    },
  ];

  const handleLawyerSelect = (lawyerId: string) => {
    const lawyer = availableLawyers.find(l => l.id === lawyerId);
    if (lawyer) {
      if (selectedLawyer === lawyerId) {
        // Deselect if clicking same lawyer
        setSelectedLawyer(null);
        update('hasRepresentative', false);
        update('representative', undefined);
      } else {
        // Select lawyer and auto-fill all fields
        setSelectedLawyer(lawyerId);
        update('hasRepresentative', true);
        // Parse address into components
        const addressParts = lawyer.address.split(',');
        const addressLine1 = addressParts[0]?.trim() || '';
        // Parse remaining parts: "Grimsby, ON L3M 1S3"
        const remainingParts = addressParts.slice(1).join(',').trim();
        const remainingPartsArray = remainingParts.split(',').map(p => p.trim());
        const city = remainingPartsArray[0] || '';
        const province = remainingPartsArray[1]?.split(' ')[0] || '';
        const postalCode = remainingPartsArray[1]?.split(' ').slice(1).join(' ') || '';
        
        update('representative', {
          name: lawyer.name,
          businessName: lawyer.businessName,
          addressLine1: addressLine1,
          city: city,
          province: province,
          postalCode: postalCode,
          phoneNumber: lawyer.contact,
          email: lawyer.email || '',
          lsoNumber: lawyer.lsoNumber || '',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="pt-6">
        <Label>Do you have a representative (paralegal, lawyer, or agent)?</Label>
        <div className="flex gap-4 mt-2">
          <Button
            type="button"
            variant={data.hasRepresentative === true ? 'default' : 'outline'}
            onClick={() => {
              update('hasRepresentative', true);
              // Keep selected lawyer if already selected
              if (!selectedLawyer) {
                setSelectedLawyer(null);
              }
            }}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={data.hasRepresentative === false ? 'default' : 'outline'}
            onClick={() => {
              update('hasRepresentative', false);
              setSelectedLawyer(null);
              update('representative', undefined);
            }}
          >
            No
          </Button>
        </div>
      </div>

      {(data.hasRepresentative === false || selectedLawyer) && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Available Representatives</h3>
          <div className="space-y-4">
            {availableLawyers.map((lawyer) => (
              <Card
                key={lawyer.id}
                className={`cursor-pointer transition-all ${
                  selectedLawyer === lawyer.id
                    ? 'bg-accent text-white border-2 border-accent'
                    : 'bg-white border hover:border-accent'
                }`}
                onClick={() => handleLawyerSelect(lawyer.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {lawyer.image ? (
                        <img
                          src={lawyer.image}
                          alt={lawyer.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.textContent = lawyer.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase();
                              parent.className += ' text-accent font-semibold text-xl';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-xl">
                          {lawyer.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={`font-semibold text-lg ${selectedLawyer === lawyer.id ? 'text-white' : ''}`}>{lawyer.name}</h4>
                          <p className={`text-sm mt-1 ${selectedLawyer === lawyer.id ? 'text-white/90' : 'text-muted-foreground'}`}>{lawyer.title}</p>
                        </div>
                        {selectedLawyer === lawyer.id && (
                          <div className={`${selectedLawyer === lawyer.id ? 'text-white' : 'text-accent'}`}>✓ Selected</div>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className={`text-sm ${selectedLawyer === lawyer.id ? 'text-white/90' : 'text-muted-foreground'}`}>{lawyer.description}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {data.hasRepresentative === true && !selectedLawyer && (
        <div className="space-y-4 p-4 border rounded-lg bg-slate-50/30">
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
                addressLine1: data.representative?.addressLine1 || '',
                city: data.representative?.city || '',
                province: data.representative?.province || '',
                postalCode: data.representative?.postalCode || '',
                phoneNumber: data.representative?.phoneNumber || '',
                email: data.representative?.email || '',
                lsoNumber: data.representative?.lsoNumber || '',
              })}
              className="mt-2 h-12 text-base px-4"
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
                addressLine1: data.representative?.addressLine1 || '',
                city: data.representative?.city || '',
                province: data.representative?.province || '',
                postalCode: data.representative?.postalCode || '',
                phoneNumber: data.representative?.phoneNumber || '',
                email: data.representative?.email || '',
                lsoNumber: data.representative?.lsoNumber || '',
              })}
              className="mt-2 h-12 text-base px-4"
            />
          </div>
          <div>
            <Label htmlFor="repAddressLine1">Address Line 1</Label>
            <Input
              id="repAddressLine1"
              value={data.representative?.addressLine1 || ''}
              onChange={(e) => update('representative', {
                ...data.representative,
                name: data.representative?.name || '',
                businessName: data.representative?.businessName || '',
                addressLine1: e.target.value,
                city: data.representative?.city || '',
                province: data.representative?.province || '',
                postalCode: data.representative?.postalCode || '',
                phoneNumber: data.representative?.phoneNumber || '',
                email: data.representative?.email || '',
                lsoNumber: data.representative?.lsoNumber || '',
              })}
              className="mt-2 h-12 text-base px-4"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="repCity">City</Label>
              <Input
                id="repCity"
                value={data.representative?.city || ''}
                onChange={(e) => update('representative', {
                  ...data.representative,
                  name: data.representative?.name || '',
                  businessName: data.representative?.businessName || '',
                  addressLine1: data.representative?.addressLine1 || '',
                  city: e.target.value,
                  province: data.representative?.province || '',
                  postalCode: data.representative?.postalCode || '',
                  phoneNumber: data.representative?.phoneNumber || '',
                  email: data.representative?.email || '',
                  lsoNumber: data.representative?.lsoNumber || '',
                })}
                className="mt-2 h-12 text-base px-4"
              />
            </div>
            <div>
              <Label htmlFor="repProvince">Province</Label>
              <Input
                id="repProvince"
                value={data.representative?.province || ''}
                onChange={(e) => update('representative', {
                  ...data.representative,
                  name: data.representative?.name || '',
                  businessName: data.representative?.businessName || '',
                  addressLine1: data.representative?.addressLine1 || '',
                  city: data.representative?.city || '',
                  province: e.target.value,
                  postalCode: data.representative?.postalCode || '',
                  phoneNumber: data.representative?.phoneNumber || '',
                  email: data.representative?.email || '',
                  lsoNumber: data.representative?.lsoNumber || '',
                })}
                className="mt-2 h-12 text-base px-4"
              />
            </div>
            <div>
              <Label htmlFor="repPostalCode">Postal Code</Label>
              <Input
                id="repPostalCode"
                value={data.representative?.postalCode || ''}
                onChange={(e) => update('representative', {
                  ...data.representative,
                  name: data.representative?.name || '',
                  businessName: data.representative?.businessName || '',
                  addressLine1: data.representative?.addressLine1 || '',
                  city: data.representative?.city || '',
                  province: data.representative?.province || '',
                  postalCode: e.target.value,
                  phoneNumber: data.representative?.phoneNumber || '',
                  email: data.representative?.email || '',
                  lsoNumber: data.representative?.lsoNumber || '',
                })}
                className="mt-2 h-12 text-base px-4"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="repPhone">Phone Number</Label>
            <Input
              id="repPhone"
              type="tel"
              value={data.representative?.phoneNumber || ''}
              onChange={(e) => update('representative', {
                ...data.representative,
                name: data.representative?.name || '',
                businessName: data.representative?.businessName || '',
                addressLine1: data.representative?.addressLine1 || '',
                city: data.representative?.city || '',
                province: data.representative?.province || '',
                postalCode: data.representative?.postalCode || '',
                phoneNumber: e.target.value,
                email: data.representative?.email || '',
                lsoNumber: data.representative?.lsoNumber || '',
              })}
              className="mt-2 h-12 text-base px-4"
            />
          </div>
          <div>
            <Label htmlFor="repEmail">Email</Label>
            <Input
              id="repEmail"
              type="email"
              value={data.representative?.email || ''}
              onChange={(e) => update('representative', {
                ...data.representative,
                name: data.representative?.name || '',
                businessName: data.representative?.businessName || '',
                addressLine1: data.representative?.addressLine1 || '',
                city: data.representative?.city || '',
                province: data.representative?.province || '',
                postalCode: data.representative?.postalCode || '',
                phoneNumber: data.representative?.phoneNumber || '',
                email: e.target.value,
                lsoNumber: data.representative?.lsoNumber || '',
              })}
              className="mt-2 h-12 text-base px-4"
            />
          </div>
          <div>
            <Label htmlFor="repLSO">LSO#</Label>
            <Input
              id="repLSO"
              value={data.representative?.lsoNumber || ''}
              onChange={(e) => update('representative', {
                ...data.representative,
                name: data.representative?.name || '',
                businessName: data.representative?.businessName || '',
                addressLine1: data.representative?.addressLine1 || '',
                city: data.representative?.city || '',
                province: data.representative?.province || '',
                postalCode: data.representative?.postalCode || '',
                phoneNumber: data.representative?.phoneNumber || '',
                email: data.representative?.email || '',
                lsoNumber: e.target.value,
              })}
              className="mt-2 h-12 text-base px-4"
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

  const handleCountChange = (newCount: number) => {
    if (newCount < 1) newCount = 1;
    update('count', newCount);
            // Adjust defendants array
            const currentCount = data.defendants.length;
    if (newCount > currentCount) {
              const newDefendants = [...data.defendants];
      for (let i = currentCount; i < newCount; i++) {
                newDefendants.push({
                  fullName: '',
                  type: 'individual',
                  address: '',
                });
              }
              update('defendants', newDefendants);
    } else if (newCount < currentCount) {
      update('defendants', data.defendants.slice(0, newCount));
    }
  };

  return (
    <div className="space-y-6">
      <div className="pt-6">
        <Label className="mb-4 block">How many defendants are there?</Label>
        <div className="flex items-center gap-4 mt-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-12 w-12"
            onClick={() => handleCountChange(data.count - 1)}
            disabled={data.count <= 1}
          >
            <Minus className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-2xl font-semibold">{data.count}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-12 w-12"
            onClick={() => handleCountChange(data.count + 1)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {data.defendants.map((defendant, index) => (
        <Card key={index} className="p-4 border shadow-none">
          <h3 className="font-medium mb-4">Defendant {index + 1}</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor={`def-name-${index}`}>Full legal name</Label>
              <Input
                id={`def-name-${index}`}
                value={defendant.fullName}
                onChange={(e) => updateDefendant(index, 'fullName', e.target.value)}
                className="mt-2 h-12 text-base px-4"
              />
            </div>
            <div>
              <Label htmlFor={`def-type-${index}`}>Type</Label>
              <select
                id={`def-type-${index}`}
                value={defendant.type}
                onChange={(e) => updateDefendant(index, 'type', e.target.value)}
                className="mt-2 flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background"
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
                className="mt-2 h-12 text-base px-4"
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
                  className="mt-2 h-12 text-base px-4"
                />
              </div>
              <div>
                <Label htmlFor={`def-email-${index}`}>Email (if known)</Label>
                <Input
                  id={`def-email-${index}`}
                  type="email"
                  value={defendant.email || ''}
                  onChange={(e) => updateDefendant(index, 'email', e.target.value)}
                  className="mt-2 h-12 text-base px-4"
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`def-business-name-${index}`}>Registered business name (if different from legal name)</Label>
              <Input
                id={`def-business-name-${index}`}
                value={defendant.registeredBusinessName || ''}
                onChange={(e) => updateDefendant(index, 'registeredBusinessName', e.target.value)}
                className="mt-2 h-12 text-base px-4"
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
      <div className="pt-6">
        <Label htmlFor="description">Briefly describe what happened</Label>
        <textarea
          id="description"
          value={data.description || initialDescription}
          onChange={(e) => update('description', e.target.value)}
          className="mt-2 flex min-h-[120px] w-full rounded-md border border-border bg-white px-4 py-3 text-base ring-offset-background"
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
          className="mt-2 h-12 text-base px-4"
        />
      </div>

      <div>
        <Label htmlFor="location">Where did it happen?</Label>
        <Input
          id="location"
          value={data.location}
          onChange={(e) => update('location', e.target.value)}
          className="mt-2 h-12 text-base px-4"
          placeholder="Address or city"
        />
      </div>

      <div>
        <Label htmlFor="agreement">What agreement or understanding existed between you and the Defendant?</Label>
        <textarea
          id="agreement"
          value={data.agreement}
          onChange={(e) => update('agreement', e.target.value)}
          className="mt-2 flex min-h-[120px] w-full rounded-md border border-border bg-white px-4 py-3 text-base ring-offset-background"
        />
      </div>

      <div>
        <Label htmlFor="defendantAction">What did the Defendant do (or fail to do) that caused this claim?</Label>
        <textarea
          id="defendantAction"
          value={data.defendantAction}
          onChange={(e) => update('defendantAction', e.target.value)}
          className="mt-2 flex min-h-[120px] w-full rounded-md border border-border bg-white px-4 py-3 text-base ring-offset-background"
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
            className="mt-2 flex min-h-[120px] w-full rounded-md border border-border bg-white px-4 py-3 text-base ring-offset-background"
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
            className="mt-2 flex min-h-[120px] w-full rounded-md border border-border bg-white px-4 py-3 text-base ring-offset-background"
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
      <div className="pt-6">
        <Label htmlFor="principalAmount">What is the principal amount you are claiming?</Label>
        <Input
          id="principalAmount"
          type="number"
          step="0.01"
          value={data.principalAmount}
          onChange={(e) => update('principalAmount', e.target.value)}
          className="mt-2 h-12 text-base px-4"
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
              className="mt-2 h-12 text-base px-4"
            />
          </div>
          <div>
            <Label htmlFor="interestDate">From what date?</Label>
            <Input
              id="interestDate"
              type="date"
              value={data.interestDate || ''}
              onChange={(e) => update('interestDate', e.target.value)}
              className="mt-2 h-12 text-base px-4"
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
            className="mt-2 h-12 text-base px-4"
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
            className="mt-2 h-12 text-base px-4"
            placeholder="0.00"
          />
        </div>
      )}

      <div className="bg-primary text-white p-4 rounded-lg">
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
      <div className="pt-6">
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    // Update documents field with file names
    const fileNames = files.map(f => f.name).join(', ');
    update('documents', data.documents ? `${data.documents}, ${fileNames}` : fileNames);
  };

  const removeFile = (index: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updated);
    // Update documents field
    const fileNames = updated.map(f => f.name).join(', ');
    update('documents', fileNames || '');
  };

  return (
    <div className="space-y-6">
      <div className="pt-6">
        <Label htmlFor="documents">What documents support your claim? (e.g., invoices, contracts, emails, receipts)</Label>
        <div className="mt-2 space-y-3">
          <div className="flex items-center gap-4">
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="h-4 w-4" />
              Upload Files
            </Button>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                  <span className="text-sm truncate flex-1">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        <textarea
          id="documents"
          value={data.documents}
          onChange={(e) => update('documents', e.target.value)}
            className="flex min-h-[120px] w-full rounded-md border border-input bg-white px-4 py-3 text-base ring-offset-background"
            placeholder="List all supporting documents or upload files above"
        />
        </div>
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
            className="mt-2 flex min-h-[120px] w-full rounded-md border border-border bg-white px-4 py-3 text-base ring-offset-background"
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
          className="mt-2 flex min-h-[120px] w-full rounded-md border border-border bg-white px-4 py-3 text-base ring-offset-background"
          placeholder="Describe key evidence"
        />
      </div>

      <div>
        <Label htmlFor="timeline">Please provide a timeline of the main events, if possible</Label>
        <textarea
          id="timeline"
          value={data.timeline || ''}
          onChange={(e) => update('timeline', e.target.value)}
          className="mt-2 flex min-h-[160px] w-full rounded-md border border-input bg-white px-4 py-3 text-base ring-offset-background"
          placeholder="Provide a chronological timeline of events"
        />
      </div>
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
  const formatFieldValue = (value: any, type?: string): string => {
    if (value === null || value === undefined || value === '') {
      return 'Not provided';
    }
    
    if (type === 'boolean') {
      return value === true ? 'Yes' : value === false ? 'No' : 'Not provided';
    }
    
    if (Array.isArray(value)) {
      if (value.length > 0) {
        return `${value.length} item(s)`;
      }
      return 'Not provided';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* What Happened */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">What Happened</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="whitespace-pre-wrap">{initialDescription || formData.claimDetails.description || 'Not provided'}</p>
          </CardContent>
        </Card>

        {/* Eligibility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Eligibility Check</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Total Amount:</span>
              <span>${formData.eligibility.totalAmount || '0.00'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Amount under $35,000:</span>
              <span>{formData.eligibility.isAmountUnder35000 ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Based in Ontario:</span>
              <span>{formData.eligibility.isBasedInOntario ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Issue Date:</span>
              <span>{formData.eligibility.issueDate || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">Claim Type:</span>
              <span>{formData.eligibility.claimType ? String(formData.eligibility.claimType).charAt(0).toUpperCase() + String(formData.eligibility.claimType).slice(1) : 'Not provided'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Plaintiff Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plaintiff Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Full Name:</span>
              <span>{formData.plaintiff.fullName || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Filing Type:</span>
              <span>{formData.plaintiff.filingType ? String(formData.plaintiff.filingType).charAt(0).toUpperCase() + String(formData.plaintiff.filingType).slice(1) : 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Address:</span>
              <span className="text-right">{formData.plaintiff.address || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">City:</span>
              <span>{formData.plaintiff.city || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Province:</span>
              <span>{formData.plaintiff.province || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Postal Code:</span>
              <span>{formData.plaintiff.postalCode || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Phone:</span>
              <span>{formData.plaintiff.phone || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Email:</span>
              <span>{formData.plaintiff.email || 'Not provided'}</span>
            </div>
            {formData.plaintiff.hasRepresentative && formData.plaintiff.representative && (
              <>
                <div className="pt-2 mt-2 border-t">
                  <div className="font-medium mb-2">Representative:</div>
                  <div className="space-y-1 ml-4">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span>{formData.plaintiff.representative.name || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Business:</span>
                      <span>{formData.plaintiff.representative.businessName || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Address Line 1:</span>
                      <span className="text-right">{formData.plaintiff.representative.addressLine1 || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>City:</span>
                      <span>{formData.plaintiff.representative.city || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Province:</span>
                      <span>{formData.plaintiff.representative.province || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Postal Code:</span>
                      <span>{formData.plaintiff.representative.postalCode || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span>{formData.plaintiff.representative.phoneNumber || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span>{formData.plaintiff.representative.email || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>LSO#:</span>
                      <span>{formData.plaintiff.representative.lsoNumber || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Defendant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Defendant Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Number of Defendants:</span>
              <span>{formData.defendants.count || 0}</span>
            </div>
            {formData.defendants.defendants.map((defendant, index) => (
              <div key={index} className="pt-2 border-t space-y-1">
                <div className="font-medium">Defendant {index + 1}:</div>
                <div className="space-y-1 ml-4">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span>{defendant.fullName || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span>{defendant.type ? String(defendant.type).charAt(0).toUpperCase() + String(defendant.type).slice(1) : 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Address:</span>
                    <span className="text-right">{defendant.address || 'Not provided'}</span>
                  </div>
                  {defendant.phone && (
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span>{defendant.phone}</span>
                    </div>
                  )}
                  {defendant.email && (
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span>{defendant.email}</span>
                    </div>
                  )}
                  {defendant.registeredBusinessName && (
                    <div className="flex justify-between">
                      <span>Business Name:</span>
                      <span>{defendant.registeredBusinessName}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Claim Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Details of the Claim</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Description:</span>
              <span className="text-right flex-1 ml-4">{formData.claimDetails.description || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Issue Start Date:</span>
              <span>{formData.claimDetails.issueStartDate || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Location:</span>
              <span>{formData.claimDetails.location || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Agreement:</span>
              <span className="text-right flex-1 ml-4">{formData.claimDetails.agreement || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Defendant Action:</span>
              <span className="text-right flex-1 ml-4">{formData.claimDetails.defendantAction || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Asked to Resolve:</span>
              <span>{formData.claimDetails.askedToResolve ? 'Yes' : 'No'}</span>
            </div>
            {formData.claimDetails.response && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Response:</span>
                <span className="text-right flex-1 ml-4">{formData.claimDetails.response}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Partial Payments:</span>
              <span>{formData.claimDetails.partialPayments ? 'Yes' : 'No'}</span>
            </div>
            {formData.claimDetails.partialPaymentDetails && (
              <div className="flex justify-between py-2">
                <span className="font-medium">Partial Payment Details:</span>
                <span className="text-right flex-1 ml-4">{formData.claimDetails.partialPaymentDetails}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Amount */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Amount of Claim</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Principal Amount:</span>
              <span>${formData.amount.principalAmount || '0.00'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Claiming Interest:</span>
              <span>{formData.amount.claimingInterest ? 'Yes' : 'No'}</span>
            </div>
            {formData.amount.claimingInterest && (
              <>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Interest Rate:</span>
                  <span>{formData.amount.interestRate ? `${formData.amount.interestRate}%` : 'Not provided'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Interest Date:</span>
                  <span>{formData.amount.interestDate || 'Not provided'}</span>
                </div>
              </>
            )}
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Claiming Costs:</span>
              <span>{formData.amount.claimingCosts ? 'Yes' : 'No'}</span>
            </div>
            {formData.amount.claimingCosts && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Costs Amount:</span>
                <span>${formData.amount.costsAmount || '0.00'}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Claiming Damages:</span>
              <span>{formData.amount.claimingDamages ? 'Yes' : 'No'}</span>
            </div>
            {formData.amount.claimingDamages && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Damages Amount:</span>
                <span>${formData.amount.damagesDetails || '0.00'}</span>
              </div>
            )}
            <div className="flex justify-between py-2 pt-2 border-t-2 border-primary">
              <span className="font-bold">Total Amount:</span>
              <span className="font-bold text-lg">${formData.amount.totalAmount || '0.00'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Remedy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Remedy Requested</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Pay Money:</span>
              <span>{formData.remedy.payMoney ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Return Property:</span>
              <span>{formData.remedy.returnProperty ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Perform Obligation:</span>
              <span>{formData.remedy.performObligation ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">Interest and Costs:</span>
              <span>{formData.remedy.interestAndCosts ? 'Yes' : 'No'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Evidence */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supporting Facts & Evidence</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Documents:</span>
              <span className="text-right flex-1 ml-4">{formData.evidence.documents || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Has Witnesses:</span>
              <span>{formData.evidence.hasWitnesses ? 'Yes' : 'No'}</span>
            </div>
            {formData.evidence.witnessDetails && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Witness Details:</span>
                <span className="text-right flex-1 ml-4">{formData.evidence.witnessDetails}</span>
              </div>
            )}
            {formData.evidence.evidenceDescription && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Evidence Description:</span>
                <span className="text-right flex-1 ml-4">{formData.evidence.evidenceDescription}</span>
              </div>
            )}
            {formData.evidence.timeline && (
              <div className="flex justify-between py-2">
                <span className="font-medium">Timeline:</span>
                <span className="text-right flex-1 ml-4">{formData.evidence.timeline}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Step 11: Generation loading state with console
function Step11GeneratingDocuments({ 
  isGenerating, 
  error, 
  logs,
  onRetry, 
  onGoBack 
}: { 
  isGenerating: boolean;
  error: string | null;
  logs: Array<{ time: string; level: 'info' | 'success' | 'error' | 'warning'; message: string }>;
  onRetry: () => void;
  onGoBack: () => void;
}) {
  const consoleRef = React.useRef<HTMLDivElement>(null);
  const [localLogs, setLocalLogs] = useState<Array<{ time: string; level: 'info' | 'success' | 'error' | 'warning'; message: string }>>([]);

  // Initialize with a test log if no logs provided and component just mounted
  useEffect(() => {
    if (logs.length === 0 && localLogs.length === 0) {
      const testLog = {
        time: new Date().toLocaleTimeString(),
        level: 'warning' as const,
        message: '⚠️ No logs received yet. Waiting for generation to start...'
      };
      setLocalLogs([testLog]);
      console.log('[Step11 Component] Initialized with test log:', testLog);
    } else if (logs.length > 0) {
      // Use actual logs when they arrive
      setLocalLogs(logs);
    }
  }, [logs]);

  // Debug: Log when logs prop changes
  useEffect(() => {
    console.log('[Step11 Component] Logs prop updated:', logs.length, 'logs:', logs);
    if (logs.length > 0) {
      setLocalLogs(logs);
    }
  }, [logs]);

  // Log on every render
  console.log('[Step11 Component] Rendered with:', { 
    isGenerating, 
    error: !!error, 
    logsCount: logs.length,
    localLogsCount: localLogs.length,
    logs: logs 
  });
  
  // Use localLogs for display (has test log if no real logs)
  const displayLogs = logs.length > 0 ? logs : localLogs;

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  if (error) {
    return (
      <div className="space-y-6 py-8">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-red-100">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-red-800">Generation Failed</h2>
        </div>
        
        {/* Console Logs */}
        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Console Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={consoleRef}
                className="bg-slate-900 text-green-400 font-mono text-xs p-4 rounded-lg max-h-[300px] overflow-y-auto"
                style={{ fontFamily: 'Monaco, Menlo, "Courier New", monospace' }}
              >
                {logs.map((log, idx) => (
                  <div key={idx} className={`mb-1 ${getLogColor(log.level)}`}>
                    <span className="text-slate-500">[{log.time}]</span>{' '}
                    <span className="font-bold">[{getLogIcon(log.level)}]</span>{' '}
                    {log.message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg text-red-800">Error Details</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono bg-white p-4 rounded border border-red-200 overflow-auto max-h-[300px]">
              {error}
            </pre>
          </CardContent>
        </Card>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={onRetry}
            size="lg"
            className="gap-2"
          >
            Try Again
          </Button>
          <Button
            onClick={onGoBack}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            Go Back to Review
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6 text-primary" />
        <h2 className="text-2xl font-semibold mb-3">Generating your documents...</h2>
        <p className="text-muted-foreground text-lg mb-6">
          We're using AI to create your Form 7A and Schedule A documents. This may take a moment.
        </p>
        <Button
          onClick={onGoBack}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          Go Back
        </Button>
        </div>

      {/* Console Viewer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Generation Console</span>
            <span className="text-sm text-muted-foreground font-normal">
              {logs.length} log{logs.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={consoleRef}
            className="bg-slate-900 text-green-400 font-mono text-xs p-4 rounded-lg max-h-[400px] overflow-y-auto"
            style={{ fontFamily: 'Monaco, Menlo, "Courier New", monospace' }}
          >
            {displayLogs.length === 0 ? (
              <div className="text-slate-500 space-y-2">
                <div>Waiting for logs... (logs.length = {logs.length}, localLogs.length = {localLogs.length})</div>
                <div className="text-xs mt-2 text-slate-600">
                  ⚠️ DEBUG INFO:
                  <br />• Open browser console (F12) to see all logs
                  <br />• Check if handleSubmit is being called
                  <br />• Verify backend server is running on port 3001
                  <br />• Check Network tab for failed API requests
      </div>
                <div className="text-xs mt-1 text-yellow-400">
                  Expected logs:
                  <br />• [Button] Generate Documents clicked
                  <br />• [handleSubmit] Starting...
                  <br />• [addLog] Called with...
                </div>
              </div>
            ) : (
              <>
                <div className="text-green-600 mb-2 text-xs">
                  Showing {displayLogs.length} log entries:
                  {logs.length === 0 && localLogs.length > 0 && (
                    <span className="text-yellow-400 ml-2">(Test logs - waiting for real logs...)</span>
                  )}
                </div>
                {displayLogs.map((log, idx) => (
                  <div key={idx} className={`mb-1 ${getLogColor(log.level)}`}>
                    <span className="text-slate-500">[{log.time}]</span>{' '}
                    <span className="font-bold">[{getLogIcon(log.level)}]</span>{' '}
                    {log.message}
                  </div>
                ))}
              </>
            )}
            {isGenerating && (
              <div className="text-slate-500 mt-2">
                <Loader2 className="h-3 w-3 inline animate-spin mr-2" />
                Processing...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 12: View documents with tabs and editable form data
function Step12ViewDocuments({
  generatedDocuments,
  formData,
  onFormDataChange,
}: {
  generatedDocuments: {
    claimType?: string;
    legalBases?: string;
    form7AText?: string;
    scheduleAText?: string;
    warnings?: string;
  } | null;
  formData: FormData;
  onFormDataChange: (updatedFormData: FormData) => void;
}) {
  const [activeTab, setActiveTab] = useState<'form7a' | 'schedulea' | 'formdata'>('form7a');
  const [localFormData, setLocalFormData] = useState<FormData>(formData);

  // Sync local form data when prop changes
  useEffect(() => {
    setLocalFormData(formData);
  }, [formData]);

  const updateLocalField = (section: keyof FormData, field: string, value: any) => {
    setLocalFormData(prev => {
      const updated = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      };
      // Immediately update parent
      onFormDataChange(updated);
      return updated;
    });
  };

  // Debug: Log what we received
  useEffect(() => {
    console.log('[Step12 Component] Generated documents:', generatedDocuments);
    console.log('[Step12 Component] Form 7A text length:', generatedDocuments?.form7AText?.length || 0);
    console.log('[Step12 Component] Schedule A text length:', generatedDocuments?.scheduleAText?.length || 0);
    console.log('[Step12 Component] Form 7A text preview:', generatedDocuments?.form7AText?.substring(0, 100));
    console.log('[Step12 Component] Schedule A text preview:', generatedDocuments?.scheduleAText?.substring(0, 100));
  }, [generatedDocuments]);

  if (!generatedDocuments) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No documents generated yet. Please go back and generate documents.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Claim Type and Legal Bases */}
      <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
        {/* Claim Type */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start gap-4">
            <div className="font-bold text-base min-w-[140px]">Claim Type:</div>
            <div className="flex-1 text-base">
              {generatedDocuments.claimType || 'Not specified'}
            </div>
          </div>
        </div>
        
        {/* Legal Bases */}
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className="font-bold text-base min-w-[140px]">Legal Bases:</div>
            <div className="flex-1 text-base">
              {generatedDocuments.legalBases || 'Not specified'}
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {generatedDocuments.warnings && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-800">⚠️ Important Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-yellow-800 whitespace-pre-wrap font-mono bg-white p-4 rounded border border-yellow-200">
              {generatedDocuments.warnings}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 border-b overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('form7a')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'form7a'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Form 7A
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schedulea')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'schedulea'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Schedule "A"
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('formdata')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'formdata'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Form Data
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Form 7A Tab Content */}
          {activeTab === 'form7a' && (
            <div className="space-y-4">
              {generatedDocuments.form7AText ? (
                <div className="bg-white border rounded-lg p-6 max-h-[600px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                    {generatedDocuments.form7AText}
                  </pre>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Form 7A text not available. The OpenAI response may not have included this content.
                    <br />
                    <span className="text-xs mt-2 block">Debug: Check browser console for API response details.</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Schedule A Tab Content */}
          {activeTab === 'schedulea' && (
            <div className="space-y-4">
              {generatedDocuments.scheduleAText ? (
                <div className="bg-white border rounded-lg p-8 max-h-[600px] overflow-y-auto">
                  {/* Schedule A Header */}
                  <div className="relative mb-8">
                    {/* Case No - Top Left */}
                    <div className="absolute top-0 left-0 text-xs font-normal mb-4">
                      Case No: _________________
                    </div>
                    
                    {/* Center Aligned Content */}
                    <div className="text-center space-y-2 pt-8">
                      <div className="text-base font-semibold uppercase tracking-wide">
                        ONTARIO SUPERIOR COURT OF JUSTICE
                      </div>
                      <div className="text-base font-semibold uppercase tracking-wide">
                        SMALL CLAIMS
                      </div>
                      <div className="text-base font-semibold uppercase tracking-wide mt-4">
                        BETWEEN:
                      </div>
                      
                      {/* Plaintiff */}
                      <div className="mt-6 space-y-1">
                        <div className="text-base font-medium uppercase">
                          {formData.plaintiff.fullName || 'PLAINTIFF NAME'}
                        </div>
                        <div className="text-base uppercase font-semibold tracking-wide">
                          PLAINTIFF
                        </div>
                      </div>
                      
                      {/* AND */}
                      <div className="text-base font-semibold uppercase tracking-wide my-4">
                        AND
                      </div>
                      
                      {/* Defendant(s) */}
                      <div className="space-y-3">
                        {formData.defendants.defendants.map((defendant, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="text-base font-medium uppercase">
                              {defendant.fullName || `DEFENDANT ${idx + 1} NAME`}
                            </div>
                            <div className="text-base uppercase font-semibold tracking-wide">
                              DEFENDANT{formData.defendants.defendants.length > 1 ? ` ${idx + 1}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Separator before Schedule "A" */}
                      <div className="border-t border-gray-300 my-6"></div>
                      
                      {/* Schedule "A" Title */}
                      <div className="text-base font-semibold uppercase tracking-wide">
                        SCHEDULE "A"
                      </div>
                    </div>
                  </div>
                  
                  {/* Schedule A Content */}
                  <div className="mt-8">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                      {generatedDocuments.scheduleAText}
                    </pre>
                  </div>
                  
                  {/* Schedule A Footer */}
                  <div className="mt-12 space-y-6">
                    {/* Dated line */}
                    <div className="text-sm">
                      Dated: {new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}
                    </div>
                    
                    {/* Representative Information - Right Aligned */}
                    {formData.plaintiff.hasRepresentative && formData.plaintiff.representative ? (
                      <div className="text-right space-y-1 text-sm">
                        <div className="font-medium">
                          {formData.plaintiff.representative.businessName || '[Business Name]'}
                        </div>
                        <div>
                          {formData.plaintiff.representative.addressLine1 || '[Address Line 1]'}
                        </div>
                        <div>
                          {(() => {
                            const city = formData.plaintiff.representative.city || '';
                            const province = formData.plaintiff.representative.province || '';
                            const postalCode = formData.plaintiff.representative.postalCode || '';
                            const cityProvincePostal = [city, province, postalCode].filter(Boolean).join(', ');
                            return cityProvincePostal || '[City, Province, Postal Code]';
                          })()}
                        </div>
                        <div>
                          {formData.plaintiff.representative.phoneNumber || '[Phone Number]'}
                        </div>
                        <div>
                          {formData.plaintiff.representative.email || '[Email]'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-right space-y-1 text-sm">
                        <div className="font-medium">
                          [Business Name]
                        </div>
                        <div>
                          [Address Line 1]
                        </div>
                        <div>
                          [City, Province, Postal Code]
                        </div>
                        <div>
                          [Phone Number]
                        </div>
                        <div>
                          [Email]
                        </div>
                      </div>
                    )}
                    
                    {/* Representative Statement */}
                    <div className="text-sm mt-4">
                      {formData.plaintiff.hasRepresentative && formData.plaintiff.representative ? (
                        <>
                          {formData.plaintiff.representative.name || '[Representative Name]'}, LSO# {formData.plaintiff.representative.lsoNumber || '[LSO Number]'} Representative for {formData.plaintiff.fullName || '[Plaintiff Name]'} (Plaintiff)
                        </>
                      ) : (
                        <>
                          [Representative Name], LSO# [LSO Number] Representative for {formData.plaintiff.fullName || '[Plaintiff Name]'} (Plaintiff)
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Schedule A text not available. The OpenAI response may not have included this content.
                    <br />
                    <span className="text-xs mt-2 block">Debug: Check browser console for API response details.</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Form Data Tab Content - Editable */}
          {activeTab === 'formdata' && (
            <div className="space-y-6 max-h-[500px] overflow-y-auto">
              {/* Eligibility */}
              <div>
                <Label className="text-base font-semibold mb-2 block">Eligibility</Label>
                <div className="space-y-2 pl-4 border-l-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Amount</Label>
                    <Input
                      value={localFormData.eligibility.totalAmount}
                      onChange={(e) => updateLocalField('eligibility', 'totalAmount', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Claim Type</Label>
                    <Input
                      value={localFormData.eligibility.claimType}
                      onChange={(e) => updateLocalField('eligibility', 'claimType', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Issue Date</Label>
                    <Input
                      type="date"
                      value={localFormData.eligibility.issueDate}
                      onChange={(e) => updateLocalField('eligibility', 'issueDate', e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Plaintiff */}
              <div>
                <Label className="text-base font-semibold mb-2 block">Plaintiff</Label>
                <div className="space-y-2 pl-4 border-l-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                    <Input
                      value={localFormData.plaintiff.fullName}
                      onChange={(e) => updateLocalField('plaintiff', 'fullName', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Address</Label>
                    <Input
                      value={localFormData.plaintiff.address}
                      onChange={(e) => updateLocalField('plaintiff', 'address', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">City</Label>
                      <Input
                        value={localFormData.plaintiff.city}
                        onChange={(e) => updateLocalField('plaintiff', 'city', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Postal Code</Label>
                      <Input
                        value={localFormData.plaintiff.postalCode}
                        onChange={(e) => updateLocalField('plaintiff', 'postalCode', e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <Input
                      value={localFormData.plaintiff.phone}
                      onChange={(e) => updateLocalField('plaintiff', 'phone', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input
                      type="email"
                      value={localFormData.plaintiff.email}
                      onChange={(e) => updateLocalField('plaintiff', 'email', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  
                  {/* Representative Section */}
                  {localFormData.plaintiff.hasRepresentative && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Representative</Label>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Name</Label>
                          <Input
                            value={localFormData.plaintiff.representative?.name || ''}
                            onChange={(e) => updateLocalField('plaintiff', 'representative', {
                              ...localFormData.plaintiff.representative,
                              name: e.target.value,
                              businessName: localFormData.plaintiff.representative?.businessName || '',
                              addressLine1: localFormData.plaintiff.representative?.addressLine1 || '',
                              city: localFormData.plaintiff.representative?.city || '',
                              province: localFormData.plaintiff.representative?.province || '',
                              postalCode: localFormData.plaintiff.representative?.postalCode || '',
                              phoneNumber: localFormData.plaintiff.representative?.phoneNumber || '',
                              email: localFormData.plaintiff.representative?.email || '',
                              lsoNumber: localFormData.plaintiff.representative?.lsoNumber || '',
                            })}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Business Name</Label>
                          <Input
                            value={localFormData.plaintiff.representative?.businessName || ''}
                            onChange={(e) => updateLocalField('plaintiff', 'representative', {
                              ...localFormData.plaintiff.representative,
                              name: localFormData.plaintiff.representative?.name || '',
                              businessName: e.target.value,
                              addressLine1: localFormData.plaintiff.representative?.addressLine1 || '',
                              city: localFormData.plaintiff.representative?.city || '',
                              province: localFormData.plaintiff.representative?.province || '',
                              postalCode: localFormData.plaintiff.representative?.postalCode || '',
                              phoneNumber: localFormData.plaintiff.representative?.phoneNumber || '',
                              email: localFormData.plaintiff.representative?.email || '',
                              lsoNumber: localFormData.plaintiff.representative?.lsoNumber || '',
                            })}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Address Line 1</Label>
                          <Input
                            value={localFormData.plaintiff.representative?.addressLine1 || ''}
                            onChange={(e) => updateLocalField('plaintiff', 'representative', {
                              ...localFormData.plaintiff.representative,
                              name: localFormData.plaintiff.representative?.name || '',
                              businessName: localFormData.plaintiff.representative?.businessName || '',
                              addressLine1: e.target.value,
                              city: localFormData.plaintiff.representative?.city || '',
                              province: localFormData.plaintiff.representative?.province || '',
                              postalCode: localFormData.plaintiff.representative?.postalCode || '',
                              phoneNumber: localFormData.plaintiff.representative?.phoneNumber || '',
                              email: localFormData.plaintiff.representative?.email || '',
                              lsoNumber: localFormData.plaintiff.representative?.lsoNumber || '',
                            })}
                            className="h-10"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">City</Label>
                            <Input
                              value={localFormData.plaintiff.representative?.city || ''}
                              onChange={(e) => updateLocalField('plaintiff', 'representative', {
                                ...localFormData.plaintiff.representative,
                                name: localFormData.plaintiff.representative?.name || '',
                                businessName: localFormData.plaintiff.representative?.businessName || '',
                                addressLine1: localFormData.plaintiff.representative?.addressLine1 || '',
                                city: e.target.value,
                                province: localFormData.plaintiff.representative?.province || '',
                                postalCode: localFormData.plaintiff.representative?.postalCode || '',
                                phoneNumber: localFormData.plaintiff.representative?.phoneNumber || '',
                                email: localFormData.plaintiff.representative?.email || '',
                                lsoNumber: localFormData.plaintiff.representative?.lsoNumber || '',
                              })}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Province</Label>
                            <Input
                              value={localFormData.plaintiff.representative?.province || ''}
                              onChange={(e) => updateLocalField('plaintiff', 'representative', {
                                ...localFormData.plaintiff.representative,
                                name: localFormData.plaintiff.representative?.name || '',
                                businessName: localFormData.plaintiff.representative?.businessName || '',
                                addressLine1: localFormData.plaintiff.representative?.addressLine1 || '',
                                city: localFormData.plaintiff.representative?.city || '',
                                province: e.target.value,
                                postalCode: localFormData.plaintiff.representative?.postalCode || '',
                                phoneNumber: localFormData.plaintiff.representative?.phoneNumber || '',
                                email: localFormData.plaintiff.representative?.email || '',
                                lsoNumber: localFormData.plaintiff.representative?.lsoNumber || '',
                              })}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Postal Code</Label>
                            <Input
                              value={localFormData.plaintiff.representative?.postalCode || ''}
                              onChange={(e) => updateLocalField('plaintiff', 'representative', {
                                ...localFormData.plaintiff.representative,
                                name: localFormData.plaintiff.representative?.name || '',
                                businessName: localFormData.plaintiff.representative?.businessName || '',
                                addressLine1: localFormData.plaintiff.representative?.addressLine1 || '',
                                city: localFormData.plaintiff.representative?.city || '',
                                province: localFormData.plaintiff.representative?.province || '',
                                postalCode: e.target.value,
                                phoneNumber: localFormData.plaintiff.representative?.phoneNumber || '',
                                email: localFormData.plaintiff.representative?.email || '',
                                lsoNumber: localFormData.plaintiff.representative?.lsoNumber || '',
                              })}
                              className="h-10"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Phone Number</Label>
                          <Input
                            type="tel"
                            value={localFormData.plaintiff.representative?.phoneNumber || ''}
                            onChange={(e) => updateLocalField('plaintiff', 'representative', {
                              ...localFormData.plaintiff.representative,
                              name: localFormData.plaintiff.representative?.name || '',
                              businessName: localFormData.plaintiff.representative?.businessName || '',
                              addressLine1: localFormData.plaintiff.representative?.addressLine1 || '',
                              city: localFormData.plaintiff.representative?.city || '',
                              province: localFormData.plaintiff.representative?.province || '',
                              postalCode: localFormData.plaintiff.representative?.postalCode || '',
                              phoneNumber: e.target.value,
                              email: localFormData.plaintiff.representative?.email || '',
                              lsoNumber: localFormData.plaintiff.representative?.lsoNumber || '',
                            })}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Email</Label>
                          <Input
                            type="email"
                            value={localFormData.plaintiff.representative?.email || ''}
                            onChange={(e) => updateLocalField('plaintiff', 'representative', {
                              ...localFormData.plaintiff.representative,
                              name: localFormData.plaintiff.representative?.name || '',
                              businessName: localFormData.plaintiff.representative?.businessName || '',
                              addressLine1: localFormData.plaintiff.representative?.addressLine1 || '',
                              city: localFormData.plaintiff.representative?.city || '',
                              province: localFormData.plaintiff.representative?.province || '',
                              postalCode: localFormData.plaintiff.representative?.postalCode || '',
                              phoneNumber: localFormData.plaintiff.representative?.phoneNumber || '',
                              email: e.target.value,
                              lsoNumber: localFormData.plaintiff.representative?.lsoNumber || '',
                            })}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">LSO#</Label>
                          <Input
                            value={localFormData.plaintiff.representative?.lsoNumber || ''}
                            onChange={(e) => updateLocalField('plaintiff', 'representative', {
                              ...localFormData.plaintiff.representative,
                              name: localFormData.plaintiff.representative?.name || '',
                              businessName: localFormData.plaintiff.representative?.businessName || '',
                              addressLine1: localFormData.plaintiff.representative?.addressLine1 || '',
                              city: localFormData.plaintiff.representative?.city || '',
                              province: localFormData.plaintiff.representative?.province || '',
                              postalCode: localFormData.plaintiff.representative?.postalCode || '',
                              phoneNumber: localFormData.plaintiff.representative?.phoneNumber || '',
                              email: localFormData.plaintiff.representative?.email || '',
                              lsoNumber: e.target.value,
                            })}
                            className="h-10"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Defendants */}
              <div>
                <Label className="text-base font-semibold mb-2 block">Defendant(s)</Label>
                <div className="space-y-3 pl-4 border-l-2">
                  {localFormData.defendants.defendants.map((def, idx) => (
                    <div key={idx} className="space-y-2 p-3 border rounded">
                      <Label className="text-xs font-medium">Defendant {idx + 1}</Label>
                      <div>
                        <Label className="text-xs text-muted-foreground">Full Name</Label>
                        <Input
                          value={def.fullName}
                          onChange={(e) => {
                            const updated = [...localFormData.defendants.defendants];
                            updated[idx] = { ...updated[idx], fullName: e.target.value };
                            updateLocalField('defendants', 'defendants', updated);
                          }}
                          className="h-10"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Address</Label>
                        <Input
                          value={def.address}
                          onChange={(e) => {
                            const updated = [...localFormData.defendants.defendants];
                            updated[idx] = { ...updated[idx], address: e.target.value };
                            updateLocalField('defendants', 'defendants', updated);
                          }}
                          className="h-10"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <Label className="text-base font-semibold mb-2 block">Amount</Label>
                <div className="space-y-2 pl-4 border-l-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Principal Amount</Label>
                    <Input
                      type="number"
                      value={localFormData.amount.principalAmount}
                      onChange={(e) => updateLocalField('amount', 'principalAmount', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Amount</Label>
                    <Input
                      type="number"
                      value={localFormData.amount.totalAmount}
                      onChange={(e) => updateLocalField('amount', 'totalAmount', e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Claim Details */}
              <div>
                <Label className="text-base font-semibold mb-2 block">Claim Details</Label>
                <div className="space-y-2 pl-4 border-l-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <textarea
                      value={localFormData.claimDetails.description}
                      onChange={(e) => updateLocalField('claimDetails', 'description', e.target.value)}
                      className="w-full min-h-[80px] p-2 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    <Input
                      value={localFormData.claimDetails.location}
                      onChange={(e) => updateLocalField('claimDetails', 'location', e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


