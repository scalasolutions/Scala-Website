"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Lock, Moon, Sun } from 'lucide-react';

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
 * (landing page, services page). Owns the theme toggle so individual
 * pages don't need to repeat the localStorage dance.
 */
export default function PublicNav({
  links = [
    { href: '/services', label: 'Services' },
    { href: '/services#pricing', label: 'Pricing' },
    { href: '/#contact', label: 'Contact' },
  ],
}: PublicNavProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Defer the post-mount theme sync so we're not calling setState
    // synchronously in the effect body (lint: set-state-in-effect).
    // The flash-of-default-theme is sub-frame and matches the prior behavior.
    const t = setTimeout(() => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
      } else {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      setIsDark(false);
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <header className="glass-strong sticky top-0 z-50 w-full">
      <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Scala — home">
          {/* New wordmark assets. Two files rather than one re-tinted SVG so
              the lime mark in the icon stays the brand hex on both themes
              without needing CSS filters. Light theme shows the dark-ink
              wordmark; dark theme shows the white wordmark. */}
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
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-border bg-card/60 text-muted-foreground hover:text-foreground transition-colors active-press"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card/60 text-foreground text-sm font-medium hover:bg-muted/40 transition-colors active-press"
          >
            <Lock className="w-3.5 h-3.5" />
            Client Login
          </Link>
        </div>
      </div>
    </header>
  );
}
