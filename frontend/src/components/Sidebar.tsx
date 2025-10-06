export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="brand">
          <a href="/dashboard">WRITWAY</a>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <a href="/dashboard" className="flex items-center px-3 py-2 text-[var(--color-primary)] bg-[var(--color-accent)] bg-opacity-10 rounded-[12px] font-medium">Dashboard</a>
        <a href="/dashboard/clients" className="flex items-center px-3 py-2 text-[var(--color-neutral-mid)] hover:text-[var(--color-primary)] hover:bg-gray-50 rounded-[12px] transition-colors">Clients</a>
        <a href="/dashboard/cases" className="flex items-center px-3 py-2 text-[var(--color-neutral-mid)] hover:text-[var(--color-primary)] hover:bg-gray-50 rounded-[12px] transition-colors">Cases</a>
        <a href="/dashboard/workflows" className="flex items-center px-3 py-2 text-[var(--color-neutral-mid)] hover:text-[var(--color-primary)] hover:bg-gray-50 rounded-[12px] transition-colors">Workflows</a>
        <a href="/dashboard/tasks" className="flex items-center px-3 py-2 text-[var(--color-neutral-mid)] hover:text-[var(--color-primary)] hover:bg-gray-50 rounded-[12px] transition-colors">Tasks</a>
        <a href="/dashboard/settings" className="flex items-center px-3 py-2 text-[var(--color-neutral-mid)] hover:text-[var(--color-primary)] hover:bg-gray-50 rounded-[12px] transition-colors">Settings</a>
      </nav>
    </aside>
  );
}


