import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Decode a JWT payload without verifying signature (Edge Runtime safe). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;
    // atob is available in Edge Runtime
    const json = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Return the role-based dashboard path for a given role string. */
function dashboardForRole(role: unknown): string {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'EMPLOYEE') return '/employee/dashboard';
  return '/login'; // unknown role — force re-login
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;

  // Public routes
  const publicPaths = ['/login'];
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    if (accessToken) {
      // Already logged in — redirect to the correct role dashboard
      const payload = decodeJwtPayload(accessToken);
      const dest = payload ? dashboardForRole(payload.role) : '/login';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // Protected routes — redirect to login if no token
  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - api routes
     *  - _next internals (static, image optimiser)
     *  - favicon.ico
     *  - public static assets (images, fonts, svg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|otf)).*)',
  ],
};
