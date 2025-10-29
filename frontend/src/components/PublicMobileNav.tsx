'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { publicNavItems } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function PublicMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="p-6 border-b border-border">
          <Link href="/" className="brand" onClick={() => setOpen(false)}>
            WRITWAY
          </Link>
        </div>
        <nav className="flex flex-col p-4 space-y-1">
          {publicNavItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                  isActive
                    ? 'text-primary bg-accent/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
                )}
              >
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <Button asChild variant="ghost" className="w-full justify-start" onClick={() => setOpen(false)}>
            <Link href="/auth/register">Sign up</Link>
          </Button>
          <Button asChild className="w-full justify-start" onClick={() => setOpen(false)}>
            <Link href="/auth/login">Login</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

