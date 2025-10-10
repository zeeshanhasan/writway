import { Sidebar } from '@/components/Sidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileNav } from '@/components/MobileNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, Search } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 lg:px-6 py-4 border-b border-border/10">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Mobile menu + Logo */}
          <div className="flex items-center gap-3">
            <MobileNav />
            <a href="/dashboard" className="brand-header hidden lg:block">
              WRITWAY
            </a>
          </div>
          
          {/* Center: Search (hidden on mobile) */}
          <div className="hidden md:flex flex-1 px-6">
            <div className="max-w-xl mx-auto w-full relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 bg-card/10 border-border/20 text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          
          {/* Right: Notifications + UserMenu */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hover:bg-accent/10">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main container */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
