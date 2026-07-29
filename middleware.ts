import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect workspaces and dashboard routes
  const isProtectedRoute = pathname.startsWith('/workspaces') || pathname.startsWith('/dashboard');

  if (isProtectedRoute) {
    try {
      const res = await fetch(new URL('/api/auth/get-session', request.url), {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      });

      const session = await res.json();

      // Better Auth returns session inside a "session" key, check if it's null/empty
      if (!session || !session.session) {
        const signInUrl = new URL('/auth/sign-in', request.url);
        signInUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(signInUrl);
      }
    } catch (err) {
      console.error('Middleware session fetch error:', err);
      const signInUrl = new URL('/auth/sign-in', request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
