export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-[12px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-neutral-mid)]">Active Clients</p>
              <p className="text-2xl font-semibold text-[var(--color-primary)]">24</p>
            </div>
            <div className="w-12 h-12 bg-[var(--color-accent)] bg-opacity-20 rounded-[12px] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-neutral-mid)]">Open Cases</p>
              <p className="text-2xl font-semibold text-[var(--color-primary)]">12</p>
            </div>
            <div className="w-12 h-12 bg-[var(--color-accent-secondary)] bg-opacity-20 rounded-[12px] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-neutral-mid)]">Tasks Completed</p>
              <p className="text-2xl font-semibold text-[var(--color-primary)]">48</p>
            </div>
            <div className="w-12 h-12 bg-[var(--color-success)] bg-opacity-20 rounded-[12px] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-neutral-mid)]">AI Agents Active</p>
              <p className="text-2xl font-semibold text-[var(--color-primary)]">6</p>
            </div>
            <div className="w-12 h-12 bg-[var(--color-accent)] bg-opacity-20 rounded-[12px] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[12px] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {[
              { action: "Document collected", client: "Sarah Johnson", time: "2 hours ago", status: "success" },
              { action: "Follow-up email sent", client: "Mike Chen", time: "4 hours ago", status: "success" },
              { action: "Case status updated", client: "Emily Davis", time: "6 hours ago", status: "info" },
              { action: "Deadline reminder", client: "Robert Wilson", time: "1 day ago", status: "warning" },
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-[12px]">
                <div className={`w-2 h-2 rounded-full ${
                  item.status === 'success' ? 'bg-[var(--color-success)]' :
                  item.status === 'warning' ? 'bg-[var(--color-accent)]' :
                  'bg-[var(--color-accent-secondary)]'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-primary)]">{item.action}</p>
                  <p className="text-xs text-[var(--color-neutral-mid)]">{item.client}</p>
                </div>
                <p className="text-xs text-[var(--color-neutral-mid)]">{item.time}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button className="w-full text-left p-4 bg-gray-50 rounded-[12px] hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[var(--color-accent)] bg-opacity-20 rounded-[12px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--color-primary)]">Add New Client</p>
                  <p className="text-sm text-[var(--color-neutral-mid)]">Start a new case</p>
                </div>
              </div>
            </button>

            <button className="w-full text-left p-4 bg-gray-50 rounded-[12px] hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[var(--color-accent-secondary)] bg-opacity-20 rounded-[12px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--color-accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--color-primary)]">Create Workflow</p>
                  <p className="text-sm text-[var(--color-neutral-mid)]">Automate your processes</p>
                </div>
              </div>
            </button>

            <button className="w-full text-left p-4 bg-gray-50 rounded-[12px] hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[var(--color-success)] bg-opacity-20 rounded-[12px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--color-primary)]">View Reports</p>
                  <p className="text-sm text-[var(--color-neutral-mid)]">Analytics & insights</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
