import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'drk-sq-session';

/**
 * Public API prefixes that do NOT require a session cookie.
 * - /api/auth/*  → login, verify, register, logout
 * - /api/v1/*    → external API (uses API-key auth, checked per-route)
 */
const PUBLIC_API_PREFIXES = ['/api/auth/', '/api/v1/'];

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Defense-in-depth middleware: rejects API requests that lack the session
 * cookie before they reach route handlers. This is a presence check only —
 * iron-session decryption still happens inside each route's getSession().
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /api/* routes; non-API pages are handled by client-side AuthGuard
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Let public API routes through without a cookie check
  if (isPublicApi(pathname)) {
    return NextResponse.next();
  }

  // Protected API route — require session cookie presence
  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.json(
      { error: 'Nicht authentifiziert' },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
