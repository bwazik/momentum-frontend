import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0].toLowerCase();
  if (host === 'admin.momentum.test') {
    const path = request.nextUrl.pathname;
    const internalPath = path === '/' ? '/platform' : path === '/login' ? '/platform-login' : path.startsWith('/tenants/') ? `/platform${path}` : null;
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
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|v1/|sanctum/|.*\\..*).*)'],
};
