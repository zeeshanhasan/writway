'use client';

import { Button } from '@/components/ui/button';
import { 
  Users, 
  Workflow, 
  CreditCard, 
  TrendingUp
} from 'lucide-react';

export default function SolutionPage() {
  const modules = [
    {
      title: "CRM & Case Management",
      description: "Organize clients, track cases, and manage relationships all in one place.",
      icon: Users,
      features: ["Client profiles", "Case tracking", "Document storage", "Communication history"]
    },
    {
      title: "Automated Workflows",
      description: "Set up smart workflows that handle routine tasks automatically.",
      icon: Workflow,
      features: ["Email reminders", "Form collection", "Deadline tracking", "Status updates"]
    },
    {
      title: "Billing & Subscriptions",
      description: "Streamline billing with automated invoicing and subscription management.",
      icon: CreditCard,
      features: ["Automated invoicing", "Payment tracking", "Subscription plans", "Financial reports"]
    },
    {
      title: "Analytics Dashboard",
      description: "Get insights into your practice with powerful analytics and reporting.",
      icon: TrendingUp,
      features: ["Case metrics", "Revenue tracking", "Performance insights", "Custom reports"]
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Modules Overview Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-4">
              Everything You Need to Run Your Practice
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              WritWay combines all the tools you need into one powerful platform designed specifically for legal practices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {modules.map((module, index) => (
              <div
                key={module.title}
                className="bg-card rounded-lg p-4 md:p-6 shadow-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300 border border-border/50 group"
              >
                <div className="mb-4">
                  <module.icon className="w-12 h-12 text-primary mb-4 group-hover:text-primary-foreground transition-colors duration-300" />
                  <h3 className="text-xl font-semibold text-primary mb-2 group-hover:text-primary-foreground transition-colors duration-300">
                    {module.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed group-hover:text-primary-foreground/80 transition-colors duration-300">
                    {module.description}
                  </p>
                </div>
                
                <ul className="space-y-2">
                  {module.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-muted-foreground group-hover:text-primary-foreground/80 transition-colors duration-300">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0 group-hover:bg-primary-foreground transition-colors duration-300" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

