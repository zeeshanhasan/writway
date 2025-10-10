import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    // Check if access_token cookie exists
    const token = request.cookies.get('access_token')?.value;
    
    if (!token) return false;

    const res = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'cookie': `access_token=${token}`,
      },
      cache: 'no-store',
    });
    
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.success && data?.data);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  if (pathname.startsWith('/dashboard') || pathname === '/auth/welcome') {
    const authed = await isAuthenticated(request);
    if (!authed) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Prevent hitting auth pages when already logged in
  if (pathname.startsWith('/auth')) {
    const authed = await isAuthenticated(request);
    if (authed) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
  ],
};
