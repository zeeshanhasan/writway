import { Sidebar } from '@/components/Sidebar';
import { UserMenu } from '@/components/UserMenu';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      {/* Full-width Charcoal Header */}
      <div className="px-6 py-4" style={{ backgroundColor: '#1A1A1A', color: '#F5F1EB' }}>
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-base font-semibold" style={{ cursor: 'pointer' }}>WRITWAY</a>
          </div>
          {/* Center: Search */}
          <div className="flex-1 px-6">
            <div className="max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-3 py-2 rounded-[12px] text-sm"
                style={{ color: '#1A1A1A' }}
              />
            </div>
          </div>
          {/* Right: Notifications + UserMenu */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-[12px] hover:bg-[rgba(255,255,255,0.08)] transition-colors" aria-label="Notifications" style={{ cursor: 'pointer' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5L9 15l4.5 4.5" />
              </svg>
            </button>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Main Body container with top radius; Sidebar inside container */}
      <div className="flex-1 px-6 pb-6 rounded-t-[16px] overflow-hidden">
        <div className="bg-white shadow-card">
          <div className="flex">
            <Sidebar />
            <section className="flex-1 p-6 bg-[var(--color-background)]">
              {children}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
