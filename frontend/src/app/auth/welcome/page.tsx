'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Tenant {
  id: string;
  name: string | null;
  address: string | null;
  country: string | null;
  city: string | null;
  businessType: string | null;
  practiceAreas: string | null;
  activeClients: number | null;
  goals: string | null;
  isOnboardingComplete: boolean;
}

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [practiceAreas, setPracticeAreas] = useState<string[]>([]);
  const [clientCount, setClientCount] = useState('');
  const [goals, setGoals] = useState<string[]>([]);

  useEffect(() => {
    // Check if user is authenticated and fetch tenant data
    const checkAuth = async () => {
      try {
        const response = await apiClient.getCurrentUser();
        if (response && response.success) {
          // Narrow unknown types
          const data = response.data as { user: User; tenant: Tenant };
          setUser(data.user);
          setTenant(data.tenant);
          
          // If onboarding is already complete, redirect to dashboard
          if (data.tenant.isOnboardingComplete) {
            router.push('/dashboard');
            return;
          }

          // Fetch detailed tenant data to pre-fill form
          const tenantResponse = await apiClient.getTenant(data.tenant.id);
          if (tenantResponse && tenantResponse.success) {
            const tenantData = tenantResponse.data as { tenant: Tenant };
            const tenantDetails = tenantData.tenant;
            
            // Pre-fill form fields with existing data
            if (tenantDetails.name) setBusinessName(tenantDetails.name);
            if (tenantDetails.businessType) setBusinessType(tenantDetails.businessType);
            if (tenantDetails.practiceAreas) {
              setPracticeAreas(tenantDetails.practiceAreas.split(', ').filter(Boolean));
            }
            if (tenantDetails.activeClients !== null) {
              // Convert number to range string for select
              const clientCount = tenantDetails.activeClients;
              if (clientCount <= 10) setClientCount('1-10');
              else if (clientCount <= 25) setClientCount('11-25');
              else if (clientCount <= 50) setClientCount('26-50');
              else if (clientCount <= 100) setClientCount('51-100');
              else setClientCount('100+');
            }
            if (tenantDetails.goals) {
              setGoals(tenantDetails.goals.split(', ').filter(Boolean));
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handlePracticeAreaChange = (area: string) => {
    setPracticeAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleGoalChange = (goal: string) => {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  // Auto-save function
  const saveFormData = async () => {
    if (!tenant) return;
    
    setSaving(true);
    try {
      const formData = {
        name: businessName,
        businessType: businessType || undefined,
        practiceAreas: practiceAreas.join(', ') || undefined,
        activeClients: clientCount ? parseInt(clientCount.split('-')[0]) : undefined,
        goals: goals.join(', ') || undefined,
      };

      await apiClient.updateTenantSettings(tenant.id, formData);
    } catch (error) {
      console.error('Failed to save form data:', error);
    } finally {
      setSaving(false);
    }
  };

  // Check if all required fields are filled
  const isFormComplete = () => {
    return businessName.trim() !== '' && 
           businessType !== '' && 
           practiceAreas.length > 0 && 
           clientCount !== '' && 
           goals.length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setSubmitting(true);
    try {
      const onboardingData = {
        name: businessName,
        businessType: businessType || undefined,
        practiceAreas: practiceAreas.join(', ') || undefined,
        activeClients: clientCount ? parseInt(clientCount.split('-')[0]) : undefined,
        goals: goals.join(', ') || undefined,
      };

      await apiClient.completeOnboarding(tenant.id, onboardingData);
      
      // Redirect directly to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding submission failed:', error);
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full space-y-8">

        {/* Two Column Layout */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 min-h-[600px]">
            {/* Left Column - Form */}
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Business Name and Business Type in one row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium text-primary mb-2">
                      Business Name *
                    </label>
                    <Input
                      type="text"
                      id="businessName"
                      name="businessName"
                      required
                      value={businessName}
                      onChange={(e) => {
                        setBusinessName(e.target.value);
                        // Auto-save after a short delay
                        setTimeout(saveFormData, 1000);
                      }}
                      placeholder="Enter your law firm or practice name"
                    />
                  </div>
                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium text-primary mb-2">
                      Business Type *
                    </label>
                    <Select required value={businessType} onValueChange={(value) => {
                      setBusinessType(value);
                      setTimeout(saveFormData, 500);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo-practitioner">Solo Practitioner</SelectItem>
                        <SelectItem value="small-firm">Small Law Firm (2-10 attorneys)</SelectItem>
                        <SelectItem value="medium-firm">Medium Law Firm (11-50 attorneys)</SelectItem>
                        <SelectItem value="large-firm">Large Law Firm (50+ attorneys)</SelectItem>
                        <SelectItem value="paralegal-service">Paralegal Service</SelectItem>
                        <SelectItem value="legal-consultant">Legal Consultant</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Practice Areas */}
                <div>
                  <label htmlFor="practiceAreas" className="block text-sm font-medium text-primary mb-2">
                    Practice Areas (select multiple) *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'Personal Injury', 'Family Law', 'Criminal Defense', 'Real Estate',
                      'Estate Planning', 'Business Law', 'Immigration', 'Employment Law',
                      'Bankruptcy', 'Medical Malpractice', 'Workers Compensation', 'Other'
                    ].map((area) => (
                      <div key={area} className="flex items-center space-x-2">
                        <Checkbox
                          id={`practice-${area}`}
                          checked={practiceAreas.includes(area)}
                          onCheckedChange={() => {
                            handlePracticeAreaChange(area);
                            setTimeout(saveFormData, 500);
                          }}
                        />
                        <label
                          htmlFor={`practice-${area}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {area}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Approximate Number of Active Clients */}
                <div>
                  <label htmlFor="clientCount" className="block text-sm font-medium text-primary mb-2">
                    How many clients do you plan to manage? *
                  </label>
                  <Select required value={clientCount} onValueChange={(value) => {
                    setClientCount(value);
                    setTimeout(saveFormData, 500);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 clients</SelectItem>
                      <SelectItem value="11-25">11-25 clients</SelectItem>
                      <SelectItem value="26-50">26-50 clients</SelectItem>
                      <SelectItem value="51-100">51-100 clients</SelectItem>
                      <SelectItem value="100+">100+ clients</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Main Goals with WritWay */}
                <div>
                  <label htmlFor="goals" className="block text-sm font-medium text-primary mb-2">
                    Main Goals with WritWay (select multiple) *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'Automate client communication',
                      'Streamline document collection',
                      'Reduce administrative tasks',
                      'Improve client experience',
                      'Increase case efficiency',
                      'Better deadline management'
                    ].map((goal) => (
                      <div key={goal} className="flex items-center space-x-2">
                        <Checkbox
                          id={`goal-${goal}`}
                          checked={goals.includes(goal)}
                          onCheckedChange={() => {
                            handleGoalChange(goal);
                            setTimeout(saveFormData, 500);
                          }}
                        />
                        <label
                          htmlFor={`goal-${goal}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {goal}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <div className="space-y-2">
                    {/* Validation message above button */}
                    <div className="text-center min-h-[20px] flex items-center justify-center">
                      {saving ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-muted-foreground mr-2"></div>
                          Saving...
                        </div>
                      ) : !isFormComplete() ? (
                        <p className="text-sm text-muted-foreground">
                          Please fill in all required fields to continue
                        </p>
                      ) : (
                        <p className="text-sm text-green-600">
                          All good now to proceed
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={submitting || !isFormComplete()}
                      className="w-full"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Completing Setup...
                        </>
                      ) : (
                        'Complete Setup'
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column - Charcoal Background */}
            <div className="bg-primary text-primary-foreground p-8 flex flex-col justify-center">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold leading-tight">
                  Welcome to WritWay
                </h2>
                <div className="space-y-4 text-lg">
                  <p>
                    Your AI-powered assistant for smarter, faster, and more organized legal work.
                  </p>
                  <p>
                    Automate routine tasks, manage clients seamlessly, and stay on top of every case with ease.
                  </p>
                  <p>
                    Let's get your account tailored to your practice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            This information helps us customize your AI assistants for your specific practice needs.
          </p>
        </div>
      </div>
    </div>
  );
}
