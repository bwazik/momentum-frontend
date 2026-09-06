import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0].toLowerCase();

  // Handle platform admin host rewrites
  if (host === 'admin.momentum.test') {
    const path = request.nextUrl.pathname;
    const internalPath =
      path === '/'
        ? '/platform'
        : path === '/login'
          ? '/platform-login'
          : path.startsWith('/tenants/')
            ? `/platform${path}`
            : null;

    if (internalPath) {
      const url = request.nextUrl.clone();
      url.pathname = internalPath;
      const response = NextResponse.rewrite(url);
      response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      return response;
    }
  }

  // Handle impersonation token handoff on tenant hosts
  if (request.nextUrl.searchParams.has('platform_token')) {
    const token = request.nextUrl.searchParams.get('platform_token')!;
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete('platform_token');

    // Scope cookie to the tenant subdomain so it's sent to this tenant
    // but NOT to admin.momentum.test or other tenant subdomains.
    const isMomentumDomain = host?.endsWith('.momentum.test') ?? false;
    const cookieDomain = isMomentumDomain ? `.${host}` : undefined;

    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set('impersonation_token', token, {
      path: '/',
      domain: cookieDomain,
      sameSite: 'lax',
      httpOnly: false, // Allow client-side apiClient to read token and attach Bearer header
      maxAge: 3600, // 1 hour expiration
    });
    response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|v1/|sanctum/|.*\\..*).*)'],
};
