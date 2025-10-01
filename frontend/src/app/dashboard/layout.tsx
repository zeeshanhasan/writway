export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r bg-muted/40">
        <div className="p-4">
          <h2 className="text-lg font-semibold">WritWay</h2>
          <nav className="mt-4 space-y-2">
            <div className="text-sm text-muted-foreground">Dashboard</div>
            <div className="text-sm text-muted-foreground">Clients</div>
            <div className="text-sm text-muted-foreground">Cases</div>
            <div className="text-sm text-muted-foreground">Workflows</div>
            <div className="text-sm text-muted-foreground">Tasks</div>
            <div className="text-sm text-muted-foreground">Settings</div>
          </nav>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="border-b p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <div className="text-sm text-muted-foreground">User Menu</div>
          </div>
        </header>
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
