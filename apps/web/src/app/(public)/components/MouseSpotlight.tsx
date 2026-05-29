"use client";

import { useEffect, useRef } from 'react';

/**
 * Vercel-style hero spotlight: a soft lime radial that follows the cursor
 * while it's inside the parent surface. Sets CSS custom props on its own
 * element (the parent reads them via the `.spotlight` utility).
 *
 * Drop this as a sibling under a `relative` container with the `.spotlight`
 * class, or use the convenience `wrap` prop to render the container for you.
 */
export default function MouseSpotlight({
  className = '',
}: {
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const parent = el.parentElement;
    if (!parent) return;

    const move = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      el.style.setProperty('--my', `${e.clientY - rect.top}px`);
      el.style.setProperty('--mo', '1');
    };
    const leave = () => {
      el.style.setProperty('--mo', '0');
    };

    parent.addEventListener('mousemove', move);
    parent.addEventListener('mouseleave', leave);
    return () => {
      parent.removeEventListener('mousemove', move);
      parent.removeEventListener('mouseleave', leave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`spotlight absolute inset-0 pointer-events-none ${className}`}
    />
  );
}
