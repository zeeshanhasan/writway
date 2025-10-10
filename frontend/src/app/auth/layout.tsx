export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="container mx-auto">
          <div className="py-6 text-center text-sm text-muted-foreground">
            <p>© 2025 WritWay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
