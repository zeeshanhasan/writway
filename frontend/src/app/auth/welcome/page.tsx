export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-[var(--color-primary)] mb-2">
            Welcome to WritWay!
          </h1>
          <p className="text-[var(--color-neutral-mid)]">
            Let's set up your AI Paralegal Assistant platform
          </p>
        </div>

        {/* Business Information Form */}
        <div className="bg-white rounded-[12px] shadow-card p-8">
          <form className="space-y-6">
            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                Business Name *
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                placeholder="Enter your law firm or practice name"
              />
            </div>

            {/* Business Type */}
            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                Business Type *
              </label>
              <select
                id="businessType"
                name="businessType"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              >
                <option value="">Select your business type</option>
                <option value="solo-practitioner">Solo Practitioner</option>
                <option value="small-firm">Small Law Firm (2-10 attorneys)</option>
                <option value="medium-firm">Medium Law Firm (11-50 attorneys)</option>
                <option value="large-firm">Large Law Firm (50+ attorneys)</option>
                <option value="paralegal-service">Paralegal Service</option>
                <option value="legal-consultant">Legal Consultant</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Practice Areas */}
            <div>
              <label htmlFor="practiceAreas" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                Practice Areas *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Personal Injury', 'Family Law', 'Criminal Defense', 'Real Estate',
                  'Estate Planning', 'Business Law', 'Immigration', 'Employment Law',
                  'Bankruptcy', 'Medical Malpractice', 'Workers Compensation', 'Other'
                ].map((area) => (
                  <label key={area} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="practiceAreas"
                      value={area.toLowerCase().replace(' ', '-')}
                      className="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                    />
                    <span className="text-sm text-[var(--color-primary)]">{area}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Number of Clients */}
            <div>
              <label htmlFor="clientCount" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                Approximate Number of Active Clients *
              </label>
              <select
                id="clientCount"
                name="clientCount"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              >
                <option value="">Select range</option>
                <option value="1-10">1-10 clients</option>
                <option value="11-25">11-25 clients</option>
                <option value="26-50">26-50 clients</option>
                <option value="51-100">51-100 clients</option>
                <option value="100+">100+ clients</option>
              </select>
            </div>

            {/* Goals */}
            <div>
              <label htmlFor="goals" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                What are your main goals with WritWay? *
              </label>
              <div className="space-y-2">
                {[
                  'Automate client communication',
                  'Streamline document collection',
                  'Reduce administrative tasks',
                  'Improve client experience',
                  'Increase case efficiency',
                  'Better deadline management'
                ].map((goal) => (
                  <label key={goal} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="goals"
                      value={goal.toLowerCase().replace(' ', '-')}
                      className="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                    />
                    <span className="text-sm text-[var(--color-primary)]">{goal}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex items-center justify-center px-4 py-3 bg-[var(--color-primary)] text-white font-medium rounded-[12px] hover:bg-[var(--color-primary)] hover:opacity-90 transition-colors"
              >
                Complete Setup & Go to Dashboard
              </button>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-[var(--color-neutral-mid)]">
          <p>
            This information helps us customize your AI assistants for your specific practice needs.
          </p>
        </div>
      </div>
    </div>
  );
}
