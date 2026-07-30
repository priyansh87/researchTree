import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect workspaces and dashboard routes
  const isProtectedRoute = pathname.startsWith('/workspaces') || pathname.startsWith('/dashboard');

  if (isProtectedRoute) {
    console.log('[Middleware] Checking protected route:', pathname);
    try {
      const res = await fetch(new URL('/api/auth/current-session', request.url), {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      });

      console.log('[Middleware] Session fetch status:', res.status);
      const text = await res.text();
      console.log('[Middleware] Session raw text:', text.slice(0, 200));

      let session = null;
      try {
        session = JSON.parse(text);
      } catch (e) {
        console.error('[Middleware] JSON parse error:', e);
      }

      console.log('[Middleware] Parsed session:', session);

      // Neon Auth returns session inside a "data" key: { data: { session: ..., user: ... } }
      if (!session || !session.data || !session.data.session) {
        console.log('[Middleware] No active session, redirecting to sign-in');
        const signInUrl = new URL('/auth/sign-in', request.url);
        signInUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(signInUrl);
      }
      console.log('[Middleware] Session verified, proceeding to:', pathname);
    } catch (err) {
      console.error('[Middleware] General error:', err);
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
