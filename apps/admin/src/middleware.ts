import { auth } from '@/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login');
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin');

  // If visiting an admin page and not logged in, redirect to login page
  if (isAdminPage && !isLoggedIn) {
    return Response.redirect(new URL('/login', req.nextUrl));
  }

  // If visiting the login page and already logged in, redirect to admin panel
  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL('/admin/dashboard', req.nextUrl));
  }
});

// Configure protected matchers
export const config = {
  matcher: ['/admin/:path*', '/login'],
};
