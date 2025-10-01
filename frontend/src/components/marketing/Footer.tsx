import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-primary text-primary-foreground">
      <div className="container py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <nav aria-label="Footer" className="text-sm">
              <Link href="/terms" className="hover:text-primary-foreground/80">
                Terms
              </Link>
              <span className="px-2">|</span>
              <Link href="/privacy" className="hover:text-primary-foreground/80">
                Privacy
              </Link>
            </nav>
            <p className="mt-2 text-xs text-primary-foreground/80">© {year} WritWay. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#"
              aria-label="Twitter"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="#"
              aria-label="GitHub"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}


