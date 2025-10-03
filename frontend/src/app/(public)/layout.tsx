import Link from 'next/link';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand"><Link href="/">WRITWAY</Link></div>
          <nav className="nav header-center" aria-label="Main">
            <Link href="/pricing">Pricing</Link>
            <Link href="/solution">Solution</Link>
            <Link href="/resources">Resources</Link>
          </nav>
          <div className="auth-actions">
            <Link href="/auth/register">Sign up</Link>
            <Link className="btn-black prominent" href="/auth/login">Login</Link>
          </div>
        </div>
      </header>
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>{children}</main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div>© {new Date().getFullYear()} WritWay</div>
          <div className="footer-links">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

