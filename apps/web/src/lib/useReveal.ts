"use client";

import { useEffect, useRef, useState } from 'react';

/**
 * Adds an `.in-view` class to the returned ref the first time it crosses
 * the viewport. Used with the `.reveal` CSS utility to fade/slide elements
 * in as the user scrolls.
 *
 * Honors `prefers-reduced-motion` by reporting in-view immediately.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  { threshold = 0.18, once = true }: { threshold?: number; once?: boolean } = {},
) {
  const ref = useRef<T | null>(null);
  // Lazy init: if the user prefers reduced motion, skip the reveal animation
  // entirely. SSR returns `false`, which is fine — the client will hydrate
  // with the correct value and skip the observer.
  const [inView, setInView] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (inView) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) obs.unobserve(entry.target);
          } else if (!once) {
            setInView(false);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -10% 0px' },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, once, inView]);

  return { ref, inView };
}
