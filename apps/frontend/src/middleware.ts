import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-2fa', '/auth/callback', '/terms', '/privacy', '/support'];
const PORTAL_PATHS = ['/portal'];
const ADMIN_PATHS = ['/admin'];

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function isTokenExpired(payload: Record<string, unknown>): boolean {
  const exp = payload.exp as number;
  if (!exp) return true;
  return Date.now() >= exp * 1000;
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

function isStudioPath(pathname: string): boolean {
  return !ADMIN_PATHS.some((p) => pathname.startsWith(p)) &&
         !PORTAL_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;

  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl, 302);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  const payload = decodeJwtPayload(accessToken);
  if (!payload || isTokenExpired(payload)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl, 302);
    response.cookies.delete('access_token');
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  const rol = payload.rol as string;

  // SUPERADMIN can only access /admin
  if (rol === 'SUPERADMIN' && !ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Non-SUPERADMIN cannot access /admin
  if (rol !== 'SUPERADMIN' && ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    const target = rol === 'CLIENTE' ? '/portal' : '/';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // CLIENTE can only access /portal
  if (rol === 'CLIENTE' && isStudioPath(pathname)) {
    return NextResponse.redirect(new URL('/portal', request.url));
  }

  // Non-CLIENTE cannot access /portal
  if (rol !== 'CLIENTE' && PORTAL_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
