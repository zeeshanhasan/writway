import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Workflow, 
  CheckSquare, 
  Settings,
  CreditCard,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

export const dashboardNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and analytics',
  },
  {
    title: 'Clients',
    href: '/dashboard/clients',
    icon: Users,
    description: 'Manage your clients',
  },
  {
    title: 'Workflows',
    href: '/dashboard/workflows',
    icon: Workflow,
    description: 'Automated workflows',
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Account settings',
  },
];

export const userMenuItems: NavItem[] = [];

export interface PublicNavItem {
  title: string;
  href: string;
}

export const publicNavItems: PublicNavItem[] = [
  { title: 'Pricing', href: '/pricing' },
  { title: 'Solution', href: '/solution' },
  { title: 'Resources', href: '/resources' },
];

