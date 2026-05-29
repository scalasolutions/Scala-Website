'use client';

import { useEffect } from 'react';

/**
 * Public marketing layout — `/` and `/services`.
 *
 * Forces dark mode on every public route. The marketing surface was designed
 * for the dark canvas; the light-mode variant of these pages was never
 * properly art-directed. Admin / portal still honor the user's stored theme
 * preference because their own layouts re-apply the `theme` localStorage key
 * on mount.
 *
 * Approach: client-side class toggle on `<html>`. We intentionally do NOT
 * write to `localStorage` here — the user's true preference is preserved for
 * when they navigate into the admin or portal. The flash from the root
 * pre-paint script is mitigated by a path check it makes for public routes.
 *
 * Reversible: delete the route group (move `page.tsx` and `services/page.tsx`
 * back to `app/`), drop this file, restore the toggle in PublicNav, and
 * remove the path branch from the root layout's inline script.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const root = document.documentElement;
    // Snapshot whatever the class was when we arrived so we can restore it on
    // unmount. In practice the admin/portal layouts will overwrite this on
    // their own mount, so this is belt-and-braces.
    const hadDark = root.classList.contains('dark');
    root.classList.add('dark');

    return () => {
      // Only revert if we actually flipped it. If the user navigates away to
      // a route whose layout has its own theme effect, that effect will run
      // after this cleanup and win — which is what we want.
      if (!hadDark) {
        root.classList.remove('dark');
      }
    };
  }, []);

  return <>{children}</>;
}
