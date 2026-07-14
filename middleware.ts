import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

const COOKIE_NAME = 'study_assistant_user_id';

export function middleware(request: NextRequest) {
  const userId = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  // Define route protection
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/workspace') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/settings');

  if (isProtectedRoute && !userId) {
    // Redirect to login if accessing protected routes without session
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && userId) {
    // Redirect to dashboard if logged in and trying to access auth pages
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/workspace/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
};
