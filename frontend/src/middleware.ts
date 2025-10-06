import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const cookie = request.headers.get('cookie') || '';
    const res = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        cookie,
        // Hint CORS (not strictly necessary server-to-server)
        origin: 'http://localhost:3000',
        'content-type': 'application/json',
      },
      // Ensure no caching in middleware
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return Boolean(data && data.success);
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
