'use client';

import { useState } from 'react';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Free',
      monthlyPrice: 0,
      annualPrice: 0,
      description: 'Perfect for getting started',
      features: [
        'Up to 5 clients',
        'Basic workflow templates',
        'Email integration',
        'Standard support',
        '1 user account'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Plus',
      monthlyPrice: 29,
      annualPrice: 24,
      description: 'For growing practices',
      features: [
        'Up to 50 clients',
        'Advanced workflow automation',
        'Google Workspace integration',
        'Priority support',
        'Up to 5 user accounts',
        'Custom templates',
        'Basic analytics'
      ],
      cta: 'Get Started',
      popular: true
    },
    {
      name: 'Pro',
      monthlyPrice: 69,
      annualPrice: 58,
      description: 'For established firms',
      features: [
        'Unlimited clients',
        'Full workflow customization',
        'Advanced integrations',
        '24/7 priority support',
        'Unlimited user accounts',
        'Advanced analytics',
        'API access',
        'Custom branding'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Enterprise',
      monthlyPrice: null,
      annualPrice: null,
      description: 'For large organizations',
      features: [
        'Everything in Pro',
        'Dedicated account manager',
        'Custom integrations',
        'On-premise deployment',
        'SLA guarantees',
        'Training & onboarding',
        'Custom workflows',
        'White-label solution'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-16 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-semibold text-[var(--color-primary)] mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-[var(--color-neutral-mid)] mb-8">
          Start with our free plan and scale as your practice grows
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-[#E8E2D8] rounded-[12px] p-1 flex">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-[8px] text-sm font-medium transition-colors cursor-pointer ${
                !isAnnual
                  ? 'bg-white text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-neutral-mid)] hover:text-[var(--color-primary)]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-[8px] text-sm font-medium transition-colors cursor-pointer ${
                isAnnual
                  ? 'bg-white text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-neutral-mid)] hover:text-[var(--color-primary)]'
              }`}
            >
              Annual
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="bg-white rounded-[12px] shadow-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative p-8 ${
                index < plans.length - 1 ? 'border-r border-gray-200' : ''
              } ${index >= 2 ? 'md:border-t border-gray-200' : ''}`}
            >
                {/* Plan Name */}
                <h3 className="text-2xl font-semibold text-[var(--color-primary)] mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  {plan.monthlyPrice !== null ? (
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-[var(--color-primary)]">
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-[var(--color-neutral-mid)] ml-2">
                        /{isAnnual ? 'month' : 'month'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-[var(--color-primary)]">
                        Custom
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-[var(--color-neutral-mid)] mb-6">
                  {plan.description}
                </p>

                {/* CTA Button */}
                <a
                  href="/auth/register"
                  className="w-full py-3 px-4 rounded-[12px] font-medium transition-colors mb-6 border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:!text-white cursor-pointer inline-block text-center"
                >
                  {plan.cta}
                </a>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-[var(--color-primary)] mr-3 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-[var(--color-primary)]">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-8">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-left">
            <h3 className="font-medium text-[var(--color-primary)] mb-2">
              Can I change plans anytime?
            </h3>
            <p className="text-[var(--color-neutral-mid)]">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div className="text-left">
            <h3 className="font-medium text-[var(--color-primary)] mb-2">
              What happens to my data if I cancel?
            </h3>
            <p className="text-[var(--color-neutral-mid)]">
              Your data is retained for 30 days after cancellation. You can export your data before canceling.
            </p>
          </div>
          <div className="text-left">
            <h3 className="font-medium text-[var(--color-primary)] mb-2">
              Do you offer refunds?
            </h3>
            <p className="text-[var(--color-neutral-mid)]">
              We offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

