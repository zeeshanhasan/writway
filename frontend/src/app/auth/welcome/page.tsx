'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Tenant {
  id: string;
  name: string | null;
  isOnboardingComplete: boolean;
}

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [practiceAreas, setPracticeAreas] = useState<string[]>([]);
  const [clientCount, setClientCount] = useState('');
  const [goals, setGoals] = useState<string[]>([]);

  useEffect(() => {
    // Check if user is authenticated
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
      
      // Redirect to dashboard after successful onboarding
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--color-neutral-mid)]">Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-[var(--color-primary)] mb-2">
            Welcome to WritWay!
          </h1>
          <p className="text-[var(--color-neutral-mid)]">
            Let's set up your AI Paralegal Assistant platform
          </p>
        </div>

        {/* Business Information Form */}
        <div className="bg-white rounded-[12px] shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                Business Name *
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                placeholder="Enter your law firm or practice name"
              />
            </div>

            {/* Business Type */}
            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                Business Type *
              </label>
              <select
                id="businessType"
                name="businessType"
                required
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              >
                <option value="">Select your business type</option>
                <option value="solo-practitioner">Solo Practitioner</option>
                <option value="small-firm">Small Law Firm (2-10 attorneys)</option>
                <option value="medium-firm">Medium Law Firm (11-50 attorneys)</option>
                <option value="large-firm">Large Law Firm (50+ attorneys)</option>
                <option value="paralegal-service">Paralegal Service</option>
                <option value="legal-consultant">Legal Consultant</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Practice Areas */}
            <div>
              <label htmlFor="practiceAreas" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                Practice Areas *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Personal Injury', 'Family Law', 'Criminal Defense', 'Real Estate',
                  'Estate Planning', 'Business Law', 'Immigration', 'Employment Law',
                  'Bankruptcy', 'Medical Malpractice', 'Workers Compensation', 'Other'
                ].map((area) => (
                  <label key={area} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="practiceAreas"
                      value={area}
                      checked={practiceAreas.includes(area)}
                      onChange={() => handlePracticeAreaChange(area)}
                      className="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                    />
                    <span className="text-sm text-[var(--color-primary)]">{area}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Number of Clients */}
            <div>
              <label htmlFor="clientCount" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                Approximate Number of Active Clients *
              </label>
              <select
                id="clientCount"
                name="clientCount"
                required
                value={clientCount}
                onChange={(e) => setClientCount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              >
                <option value="">Select range</option>
                <option value="1-10">1-10 clients</option>
                <option value="11-25">11-25 clients</option>
                <option value="26-50">26-50 clients</option>
                <option value="51-100">51-100 clients</option>
                <option value="100+">100+ clients</option>
              </select>
            </div>

            {/* Goals */}
            <div>
              <label htmlFor="goals" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                What are your main goals with WritWay? *
              </label>
              <div className="space-y-2">
                {[
                  'Automate client communication',
                  'Streamline document collection',
                  'Reduce administrative tasks',
                  'Improve client experience',
                  'Increase case efficiency',
                  'Better deadline management'
                ].map((goal) => (
                  <label key={goal} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="goals"
                      value={goal}
                      checked={goals.includes(goal)}
                      onChange={() => handleGoalChange(goal)}
                      className="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                    />
                    <span className="text-sm text-[var(--color-primary)]">{goal}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center px-4 py-3 bg-[var(--color-primary)] text-white font-medium rounded-[12px] hover:bg-[var(--color-primary)] hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing Setup...
                  </>
                ) : (
                  'Complete Setup & Go to Dashboard'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-[var(--color-neutral-mid)]">
          <p>
            This information helps us customize your AI assistants for your specific practice needs.
          </p>
        </div>
      </div>
    </div>
  );
}
