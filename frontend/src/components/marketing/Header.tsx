import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <header className="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container py-4">
        <div className="grid grid-cols-3 items-center">
          <div>
            <Link href="/" className="text-base font-bold uppercase tracking-wide">
              WritWay
            </Link>
          </div>
          <nav className="flex items-center justify-center gap-6">
            <Link href="/pricing" className="text-sm text-foreground/80 hover:text-foreground">
              Pricing
            </Link>
            <Link href="/solution" className="text-sm text-foreground/80 hover:text-foreground">
              Solutions
            </Link>
            <Link href="/resources" className="text-sm text-foreground/80 hover:text-foreground">
              Resources
            </Link>
          </nav>
          <div className="flex items-center justify-end gap-3">
            <Link href="/auth/login" className="text-sm text-foreground/80 hover:text-foreground">
              Sign in
            </Link>
            <Button asChild className="bg-black text-white hover:bg-black/90">
              <Link href="/auth/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}


