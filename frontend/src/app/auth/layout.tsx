export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header with centered brand */}
      <header className="py-6">
        <div className="container mx-auto">
          <div className="text-center">
            <a href="/" className="text-2xl font-semibold tracking-wide text-[var(--color-primary)]">
              WRITWAY
            </a>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container">
          <div className="py-6 text-center text-sm text-[var(--color-neutral-mid)]">
            <p>© 2025 WritWay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
