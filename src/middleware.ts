import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const role = request.cookies.get('auth-role')?.value;
  const { pathname } = request.nextUrl;

  // Let API and static files pass through
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // If not logged in and not on login page, redirect to /login
  if (!role && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If already logged in, skip login page
  if (role && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Admin section: Only Admin can access
  if (pathname.startsWith('/admin') && role !== 'Admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Request Management: Only Admin and HR can access
  if (pathname.startsWith('/request-management') && role !== 'HR' && role !== 'Admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
