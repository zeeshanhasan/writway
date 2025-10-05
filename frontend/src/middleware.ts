import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user is accessing dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // TODO: Check for valid session/token from backend
    // For now, allow access (will be implemented with actual auth)
    // In production, redirect to /auth/login if not authenticated
    return NextResponse.next();
  }

  // Check if user is accessing welcome page
  if (pathname === '/auth/welcome') {
    // TODO: Check for valid session/token from backend
    // For now, allow access (will be implemented with actual auth)
    // In production, redirect to /auth/login if not authenticated
    return NextResponse.next();
  }

  // Check if user is accessing auth routes while logged in
  if (pathname.startsWith('/auth')) {
    // TODO: Check if user is already logged in via backend
    // If logged in, redirect to dashboard
    // For now, allow access
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
