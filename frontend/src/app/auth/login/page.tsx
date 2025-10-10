'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
  const handleGoogleAuth = () => {
    // Redirect to backend Google OAuth endpoint - UPDATED FOR V1 API
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    console.log('Redirecting to:', `${base}/auth/google`); // Debug log
    window.location.href = `${base}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-wide text-primary mb-2 hover:text-primary/80 transition-colors">
              WRITWAY
            </h1>
          </Link>
          <p className="text-muted-foreground">
            Sign in to your WritWay account
          </p>
        </div>

        {/* Auth Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Google Sign In Button - Dark with Charcoal */}
              <Button 
                onClick={handleGoogleAuth}
                variant="default"
                size="lg"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-medium"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">
                    Secure authentication
                  </span>
                </div>
              </div>

              {/* Additional Info */}
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  By continuing, you agree to our{' '}
                  <Link href="/terms" className="text-secondary hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-secondary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
