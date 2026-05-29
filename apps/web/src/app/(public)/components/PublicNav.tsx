"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Lock } from 'lucide-react';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { useState } from 'react';

interface NavLink {
  href: string;
  label: string;
}

interface PublicNavProps {
  /** Center nav links. Defaults to the home page links. */
  links?: NavLink[];
}

/**
 * Sticky translucent header used across the public marketing surface
 * (landing page, services page).
 *
 * Scroll behavior — softly "jellies" past ~40px of scroll:
 *   - row height shrinks from 80px → 64px
 *   - logo scales 1 → 0.95
 *   - background opacity / blur ramps up
 *   - a hairline border fades in
 *
 * All driven through a spring so the motion feels organic, not mechanical.
 * Respects `prefers-reduced-motion` by snapping straight to the resting
 * state and skipping the spring entirely.
 *
 * Note: marketing routes are force-dark via `app/(public)/layout.tsx`, so
 * there is no theme toggle in this nav — a toggle on a forced-dark page is
 * misleading.
 */
export default function PublicNav({
  links = [
    { href: '/services', label: 'Services' },
    { href: '/services#pricing', label: 'Pricing' },
    { href: '/#contact', label: 'Contact' },
  ],
}: PublicNavProps) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  // Raw scroll → 0..1 progress between 0px and 80px. After 80px we're "fully
  // scrolled" and stop animating further.
  const progressRaw = useTransform(scrollY, [0, 80], [0, 1], { clamp: true });
  // Spring so the transition feels like a gentle settle rather than a
  // direct map. Tuned soft: low stiffness, generous damping — no overshoot
  // but a perceptible easing tail.
  const progress = useSpring(progressRaw, {
    stiffness: 180,
    damping: 30,
    mass: 0.7,
  });

  // Track whether we're "scrolled" so we can tag the wrapper for the
  // backdrop styles that aren't easily animatable through motion values.
  useMotionValueEvent(scrollY, 'change', (v) => {
    setScrolled(v > 40);
  });

  // Derived values. If reduced motion is on, lock everything to the
  // resting state regardless of scroll.
  const height = useTransform(progress, [0, 1], reduce ? [80, 80] : [80, 64]);
  const logoScale = useTransform(progress, [0, 1], reduce ? [1, 1] : [1, 0.95]);
  const bgOpacity = useTransform(progress, [0, 1], reduce ? [0.55, 0.55] : [0.35, 0.7]);
  const borderOpacity = useTransform(progress, [0, 1], reduce ? [0.5, 0.5] : [0, 0.5]);

  return (
    <motion.header
      data-scrolled={scrolled || undefined}
      className="sticky top-0 z-50 w-full backdrop-blur-[24px] backdrop-saturate-150"
      style={{ height }}
    >
      {/* Background layer driven by the motion value. Sits behind the
          content so the saturate/blur filter on the header still applies. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10 bg-background"
        style={{ opacity: bgOpacity }}
      />
      {/* Hairline border that fades in past the scroll threshold. */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-border"
        style={{ opacity: borderOpacity }}
      />

      <div className="mx-auto max-w-7xl px-6 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Scala — home">
          <motion.span
            className="inline-flex"
            style={{ scale: logoScale, transformOrigin: 'left center' }}
          >
            {/* New wordmark assets. Two files rather than one re-tinted SVG so
                the lime mark in the icon stays the brand hex on both themes
                without needing CSS filters. */}
            <Image
              src="/scala-logo-dark.svg"
              alt="Scala"
              width={138}
              height={40}
              priority
              className="h-9 w-auto block dark:hidden"
            />
            <Image
              src="/scala-logo-white.svg"
              alt="Scala"
              width={138}
              height={40}
              priority
              className="h-9 w-auto hidden dark:block"
            />
          </motion.span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary/10 transition-colors active-press"
          >
            <Lock className="w-3.5 h-3.5" />
            Client Login
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
