export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-[var(--color-primary)] mb-2">
            Welcome to WritWay
          </h1>
          <p className="text-[var(--color-neutral-mid)]">
            Your AI Paralegal Assistant Platform
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-[12px] shadow-card p-8">
          <div className="space-y-6">
            {/* Google Sign In Button */}
            <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-[12px] bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[var(--color-neutral-mid)]">
                  New to WritWay? We'll set up your account
                </span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="text-center text-sm text-[var(--color-neutral-mid)]">
              <p>
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-[var(--color-accent)] hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-[var(--color-accent)] hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-[var(--color-neutral-mid)]">
          <p>
            Already have an account?{' '}
            <a href="/auth/login" className="text-[var(--color-accent)] hover:underline font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
