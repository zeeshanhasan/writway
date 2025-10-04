import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    // Handle OAuth error
    return NextResponse.redirect(new URL('/auth/login?error=oauth_error', request.url));
  }

  if (!code) {
    // No code provided, redirect to login
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  try {
    // TODO: Exchange code for access token with Google
    // TODO: Get user info from Google
    // TODO: Check if user exists in database
    // TODO: Create session/token
    // TODO: Check if user has completed onboarding
    // TODO: Redirect to welcome page for new users, dashboard for existing users

    // For now, redirect to welcome page for onboarding
    return NextResponse.redirect(new URL('/auth/welcome', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=callback_error', request.url));
  }
}
