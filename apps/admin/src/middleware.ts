import { auth } from '@/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role as 'admin' | 'client' | undefined;
  
  const isAuthPage = req.nextUrl.pathname.startsWith('/login');
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin');
  const isPortalPage = req.nextUrl.pathname.startsWith('/portal');

  // 1. Guard Admin Pages
  if (isAdminPage) {
    if (!isLoggedIn) {
      return Response.redirect(new URL('/login', req.nextUrl));
    }
    if (role !== 'admin') {
      return Response.redirect(new URL('/portal', req.nextUrl));
    }
  }

  // 2. Guard Client Portal Pages
  if (isPortalPage) {
    if (!isLoggedIn) {
      return Response.redirect(new URL('/login', req.nextUrl));
    }
    if (role !== 'client') {
      return Response.redirect(new URL('/admin/dashboard', req.nextUrl));
    }
  }

  // 3. Handle Login Page Redirections for Authenticated Users
  if (isAuthPage && isLoggedIn) {
    if (role === 'admin') {
      return Response.redirect(new URL('/admin/dashboard', req.nextUrl));
    }
    if (role === 'client') {
      return Response.redirect(new URL('/portal', req.nextUrl));
    }
  }
});

// Configure protected matchers
export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/login'],
};
