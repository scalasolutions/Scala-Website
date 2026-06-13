import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const hostname = req.headers.get('host') || '';
  const host = hostname.split(':')[0]; // Remove port if any
  
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role as 'admin' | 'client' | undefined;
  
  const pathname = req.nextUrl.pathname;
  
  // Define subdomains (including local testing subdomains)
  const isAdminSubdomain = host === 'admin.scalasolutions.id' || host === 'admin.localhost';
  const isClientsSubdomain = host === 'clients.scalasolutions.id' || host === 'clients.localhost';
  
  // 1. Handle main domain redirects to subdomains
  if (!isAdminSubdomain && !isClientsSubdomain) {
    if (pathname.startsWith('/admin')) {
      const targetPath = pathname.replace('/admin', '') || '/';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const redirectHost = host.includes('localhost') ? 'admin.localhost:3000' : 'admin.scalasolutions.id';
      return NextResponse.redirect(new URL(`${protocol}://${redirectHost}${targetPath}${req.nextUrl.search}`, req.url), 308);
    }
    
    if (pathname.startsWith('/portal')) {
      const targetPath = pathname.replace('/portal', '') || '/';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const redirectHost = host.includes('localhost') ? 'clients.localhost:3000' : 'clients.scalasolutions.id';
      return NextResponse.redirect(new URL(`${protocol}://${redirectHost}${targetPath}${req.nextUrl.search}`, req.url), 308);
    }
    
    if (pathname.startsWith('/client-portal')) {
      const targetPath = pathname.replace('/client-portal', '') || '/';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const redirectHost = host.includes('localhost') ? 'clients.localhost:3000' : 'clients.scalasolutions.id';
      return NextResponse.redirect(new URL(`${protocol}://${redirectHost}${targetPath}${req.nextUrl.search}`, req.url), 308);
    }
  }

  // 2. Handle Subdomain clean URL redirection (e.g. admin.scalasolutions.id/admin/dashboard -> admin.scalasolutions.id/dashboard)
  if (isAdminSubdomain && pathname.startsWith('/admin')) {
    const cleanPath = pathname.replace('/admin', '') || '/';
    return NextResponse.redirect(new URL(cleanPath + req.nextUrl.search, req.url), 308);
  }

  if (isClientsSubdomain && pathname.startsWith('/portal')) {
    const cleanPath = pathname.replace('/portal', '') || '/';
    return NextResponse.redirect(new URL(cleanPath + req.nextUrl.search, req.url), 308);
  }

  // Determine logical pathname for auth checks (treat subdomain requests as prepended paths)
  let logicalPathname = pathname;
  if (isAdminSubdomain && !pathname.startsWith('/admin') && !pathname.startsWith('/login') && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.includes('.')) {
    logicalPathname = `/admin${pathname}`;
  } else if (isClientsSubdomain && !pathname.startsWith('/portal') && !pathname.startsWith('/login') && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.includes('.')) {
    logicalPathname = `/portal${pathname}`;
  }

  const isAuthPage = logicalPathname.startsWith('/login');
  const isAdminPage = logicalPathname.startsWith('/admin');
  const isPortalPage = logicalPathname.startsWith('/portal');

  // 3. Guard Admin Pages
  if (isAdminPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (role !== 'admin') {
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const redirectHost = host.includes('localhost') ? 'clients.localhost:3000' : 'clients.scalasolutions.id';
      return NextResponse.redirect(new URL(`${protocol}://${redirectHost}`, req.url));
    }
  }

  // 4. Guard Client Portal Pages
  if (isPortalPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (role !== 'client') {
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const redirectHost = host.includes('localhost') ? 'admin.localhost:3000' : 'admin.scalasolutions.id';
      return NextResponse.redirect(new URL(`${protocol}://${redirectHost}`, req.url));
    }
  }

  // 5. Handle Login Page Redirections for Authenticated Users
  if (isAuthPage && isLoggedIn) {
    if (role === 'admin') {
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const redirectHost = host.includes('localhost') ? 'admin.localhost:3000' : 'admin.scalasolutions.id';
      return NextResponse.redirect(new URL(`${protocol}://${redirectHost}`, req.url));
    }
    if (role === 'client') {
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const redirectHost = host.includes('localhost') ? 'clients.localhost:3000' : 'clients.scalasolutions.id';
      return NextResponse.redirect(new URL(`${protocol}://${redirectHost}`, req.url));
    }
  }

  // 6. Rewrite Subdomain requests internally to their target folders
  if (isAdminSubdomain && !pathname.startsWith('/admin') && !pathname.startsWith('/login') && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.includes('.')) {
    const url = req.nextUrl.clone();
    url.pathname = `/admin${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (isClientsSubdomain && !pathname.startsWith('/portal') && !pathname.startsWith('/login') && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.includes('.')) {
    const url = req.nextUrl.clone();
    url.pathname = `/portal${pathname}`;
    return NextResponse.rewrite(url);
  }
});

// Configure protected matchers to run on all pages except for APIs, static assets, and images
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.svg|.*\\.png|.*\\.ico|.*\\.jpg).*)',
  ],
};
