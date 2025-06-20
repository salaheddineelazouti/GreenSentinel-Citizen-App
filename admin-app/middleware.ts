import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Check if it's a dashboard route that needs protection
  const isDashboardRoute = pathname.startsWith('/dashboard');
  
  // Get the token from cookies
  const token = request.cookies.get('gs_admin_token')?.value;

  // If trying to access protected route and not authenticated, redirect to login
  if (isDashboardRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If accessing login page while already authenticated, redirect to dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If accessing root path, redirect to dashboard or login based on auth state
  if (pathname === '/') {
    return NextResponse.redirect(new URL(token ? '/dashboard' : '/login', request.url));
  }

  return NextResponse.next();
}

// Configure the paths that should invoke the middleware
export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
  ],
};
