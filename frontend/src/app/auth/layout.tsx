export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
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
