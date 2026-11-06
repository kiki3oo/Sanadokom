import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Whitelist public paths that NEVER require authentication
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/whatsapp-bot/webhook')
  ) {
    // If user is already logged in and visits /login, redirect to their home page
    if (pathname === '/login') {
      const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (token) {
        const session = await verifySessionToken(token);
        if (session) {
          const dest = session.role === 'CALL_AGENT' ? '/call-center' : '/';
          return NextResponse.redirect(new URL(dest, req.url));
        }
      }
    }
    return NextResponse.next();
  }

  // 2. Check for valid session cookie
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session || !session.userId) {
    // If it's an API request, return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Non authentifié. Connexion requise.' },
        { status: 401 }
      );
    }

    // If it's a page, redirect to /login
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname);
    }
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  // 3. User is authenticated
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (*.svg, *.png, *.jpg, *.jpeg, *.gif, *.webp, *.css, *.js)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
