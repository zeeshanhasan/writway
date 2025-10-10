'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Clock, 
  Building2, 
  Briefcase,
  TrendingUp,
  Users,
  Zap,
  Shield,
  Calendar,
  Rocket,
  Award,
  Mail,
  FileText,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

type TabType = 'insights' | 'timeline' | 'company' | 'usecases';

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('insights');

  const navItems = [
    { id: 'insights' as TabType, label: 'Insights', icon: Activity },
    { id: 'timeline' as TabType, label: 'Timeline', icon: Clock },
    { id: 'company' as TabType, label: 'Company', icon: Building2 },
    { id: 'usecases' as TabType, label: 'Use Cases', icon: Briefcase },
  ];

  const stats = [
    { label: 'Active Clients', value: '1,200+', icon: Users },
    { label: 'Workflows Automated', value: '8,400+', icon: Zap },
    { label: 'Uptime', value: '99.98%', icon: Shield },
  ];

  const insightsFeed = [
    {
      id: 1,
      content: "We've crossed 1,000 active users this month. This milestone represents a significant step forward in our mission to streamline legal operations.\n\nThe growth has been driven by our automated workflow features that save paralegals an average of 15 hours per week.\n\nWe're seeing increased adoption across small to medium-sized law firms who appreciate the simplicity and reliability of our platform.\n\nNext quarter, we're planning to launch advanced analytics features to help practices track their efficiency gains.",
      author: "WritWay Team",
      time: "2 hours ago"
    },
    {
      id: 2,
      content: "New workflow builder launched with 3x faster form automations.\n\nThe updated interface allows users to create complex workflows in minutes rather than hours.\n\nKey improvements include drag-and-drop functionality, real-time preview, and template library.\n\nEarly feedback shows 85% reduction in setup time for new automation workflows.",
      author: "Product Team",
      time: "1 day ago"
    },
    {
      id: 3,
      content: "LegalTech Journal features WritWay as a Top 10 Automation Tool.\n\nThe recognition highlights our commitment to innovation in legal technology.\n\nOur platform was praised for its user-friendly interface and robust automation capabilities.\n\nThe article specifically mentioned our Google Workspace integration as a standout feature.\n\nThis recognition validates our approach to making legal tech accessible and practical.",
      author: "WritWay Team",
      time: "3 days ago"
    },
    {
      id: 4,
      content: "Q4 2024: 300% increase in client onboarding efficiency.\n\nOur automated intake processes have revolutionized how law firms handle new clients.\n\nThe system now processes 95% of initial client information without human intervention.\n\nClient satisfaction scores have improved by 40% due to faster response times.\n\nWe're planning to expand these capabilities to include document verification and conflict checking.",
      author: "Engineering Team",
      time: "1 week ago"
    },
    {
      id: 5,
      content: "Integration with Google Workspace now supports advanced email automation.\n\nThe enhanced integration allows for seamless email workflows directly from Gmail.\n\nUsers can now automate client communications, document requests, and follow-up reminders.\n\nThis feature has been requested by 78% of our user base and significantly improves workflow efficiency.\n\nWe're also working on calendar integration for automated scheduling and deadline management.",
      author: "Product Team",
      time: "2 weeks ago"
    }
  ];

  const timelineItems = [
    {
      date: "Q2 2025",
      title: "MVP Launched 🚀",
      description: "Initial release with core workflow automation features"
    },
    {
      date: "Q3 2025",
      title: "Multi-tenant Release",
      description: "Added support for multiple organizations and team collaboration"
    },
    {
      date: "Q4 2025",
      title: "Google Workspace Integration",
      description: "Seamless email sync and automation with Gmail and Google Drive"
    },
    {
      date: "Q1 2026",
      title: "Advanced Analytics Dashboard",
      description: "Comprehensive reporting and insights for practice management"
    },
    {
      date: "Q2 2026",
      title: "Mobile App Launch",
      description: "Native iOS and Android apps for on-the-go case management"
    }
  ];

  const useCases = [
    {
      title: "Client Intake Automation",
      description: "Save 3 hours per new client with automated form collection, document verification, and initial case setup.",
      cta: "Explore Workflow"
    },
    {
      title: "Recurring Document Requests",
      description: "Never chase clients again. Automated reminders and document collection for ongoing cases.",
      cta: "Read More"
    },
    {
      title: "Case Progress Tracking",
      description: "Keep clients updated automatically with real-time case status and milestone notifications.",
      cta: "Explore Workflow"
    },
    {
      title: "Billing & Invoice Automation",
      description: "Streamline billing with automated time tracking, invoice generation, and payment reminders.",
      cta: "Read More"
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Milestone': return 'text-success';
      case 'Feature Launch': return 'text-info';
      case 'Press': return 'text-warning';
      case 'Update': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'insights':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-4">Insights</h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="bg-card rounded-lg p-4 border border-border/50 hover:shadow-sm transition-shadow">
                  <div className="flex items-center mb-2">
                    <stat.icon className={`w-5 h-5 mr-2 ${stat.label === 'Uptime' ? 'text-info' : 'text-primary'}`} />
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <div className={`text-2xl font-bold ${stat.label === 'Uptime' ? 'text-info' : 'text-primary'}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Insights Feed */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-primary">Recent Updates</h3>
              <div className="space-y-3">
                {insightsFeed.map((post, index) => (
                  <div key={post.id} className="bg-card rounded-lg p-6 border border-border/50 hover:shadow-sm transition-all duration-200">
                    {/* LinkedIn-style header */}
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold mr-3">
                        W
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-semibold text-foreground">{post.author}</span>
                          <span className="text-muted-foreground mx-2">•</span>
                          <span className="text-sm text-muted-foreground">{post.time}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="text-sm text-foreground leading-relaxed whitespace-pre-line mb-4">{post.content}</div>
                    
                    {/* LinkedIn-style footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center space-x-6">
                        <button className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                          <span className="text-sm">Like</span>
                        </button>
                        <button className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                          <span className="text-sm">Comment</span>
                        </button>
                        <button className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                          <span className="text-sm">Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-4">Company Timeline</h2>
              <p className="text-muted-foreground">Key milestones in our journey</p>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
              <div className="space-y-8">
                {timelineItems.map((item, index) => (
                  <div key={index} className="relative flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold relative z-10">
                      {index + 1}
                    </div>
                    <div className="ml-6 flex-1">
                      <div className="bg-card rounded-lg p-4 border border-border/50">
                        <div className="flex items-center mb-2">
                          <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                          <span className="text-sm font-medium text-muted-foreground">{item.date}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-primary mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'company':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-4">About WritWay</h2>
              <p className="text-muted-foreground">Our mission, vision, and team</p>
            </div>

            <div className="prose prose-gray max-w-none">
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                WritWay was founded to help paralegals and small law teams eliminate the repetitive manual work that slows down legal operations.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                We believe in automation, simplicity, and trust — building technology that feels like a digital assistant, not another software.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg p-6 border border-border/50">
                <div className="flex items-center mb-4">
                  <Rocket className="w-6 h-6 text-primary mr-3" />
                  <h3 className="text-xl font-semibold text-primary">Mission</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To empower legal professionals with intelligent automation that enhances productivity while maintaining the highest standards of accuracy and compliance.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 border border-border/50">
                <div className="flex items-center mb-4">
                  <Award className="w-6 h-6 text-primary mr-3" />
                  <h3 className="text-xl font-semibold text-primary">Vision</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A future where every legal practice operates with seamless efficiency, allowing professionals to focus on what matters most — serving their clients.
                </p>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Mail className="w-6 h-6 text-primary mr-3" />
                  <h3 className="text-xl font-semibold text-primary">Contact</h3>
                </div>
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Talk to Us
                </Button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ready to transform your legal practice? Get in touch with our team to learn how WritWay can streamline your operations.
              </p>
            </div>
          </div>
        );

      case 'usecases':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-4">Use Cases</h2>
              <p className="text-muted-foreground">How legal professionals automate with WritWay</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {useCases.map((useCase, index) => (
                <div key={index} className="bg-card rounded-lg p-6 border border-border/50 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary-foreground">
                      {useCase.cta}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  <h3 className="text-lg font-semibold text-primary mb-3">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{useCase.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-8">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        activeTab === item.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-card rounded-lg p-6 md:p-8 border border-border/50">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

