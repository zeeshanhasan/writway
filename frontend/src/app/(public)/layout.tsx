import Link from 'next/link';
import { headers } from 'next/headers';
import { Button } from '@/components/ui/button';
import { Twitter, Linkedin, Facebook } from 'lucide-react';
import { publicNavItems } from '@/config/navigation';
import { PublicMobileNav } from '@/components/PublicMobileNav';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let isAuthed = false;
  try {
    const headersList = await headers();
    const cookie = headersList.get('cookie') || '';
    const proto = headersList.get('x-forwarded-proto') || 'https';
    const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
    const base = API_URL || `${proto}://${host}/api`;
    const res = await fetch(`${base}/auth/me`, {
      method: 'GET',
      headers: {
        cookie,
        origin: `${proto}://${host}`,
        'content-type': 'application/json',
      },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      isAuthed = Boolean(data && data.success);
    }
  } catch {
    isAuthed = false;
  }

  return (
    <>
      <header className="site-header">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between py-4 relative">
            <div className="brand">
              <Link href="/">WRITWAY</Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 gap-6" aria-label="Main">
              {publicNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-foreground/90 hover:text-foreground transition-colors"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
            
            <div className="flex gap-2 items-center">
              {/* Mobile Navigation Menu */}
              <div className="md:hidden">
                <PublicMobileNav />
              </div>
              
              {isAuthed ? (
                <Button asChild className="hidden md:inline-flex">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild className="hidden sm:inline-flex">
                    <Link href="/auth/register">Sign up</Link>
                  </Button>
                  <Button asChild className="hidden sm:inline-flex">
                    <Link href="/auth/login">Login</Link>
                  </Button>
                  {/* Mobile Login Button */}
                  <Button asChild size="sm" className="sm:hidden">
                    <Link href="/auth/login">Login</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 lg:px-6 py-6">{children}</main>
      
      <footer className="site-footer hidden">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between py-6 gap-4 text-sm">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <div className="text-primary-foreground">
                © {new Date().getFullYear()} WritWay
              </div>
              <div className="flex gap-4">
                <Link href="/terms" className="text-primary-foreground/80 hover:text-primary-foreground transition-opacity">
                  Terms
                </Link>
                <Link href="/privacy" className="text-primary-foreground/80 hover:text-primary-foreground transition-opacity">
                  Privacy
                </Link>
              </div>
            </div>
            
            <div className="flex gap-3">
              <a 
                href="#" 
                aria-label="Twitter"
                className="flex items-center justify-center w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                aria-label="LinkedIn"
                className="flex items-center justify-center w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                aria-label="Facebook"
                className="flex items-center justify-center w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

