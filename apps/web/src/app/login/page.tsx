'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Lock, Mail, Eye, EyeOff, Loader2, Sun, Moon } from 'lucide-react';
import ScalaLogo from '@/components/ui/ScalaLogo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
      if (savedTheme) {
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        // Default to light mode
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password: password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid client email address or workspace portal password.');
        setLoading(false);
      } else {
        // Fetch session immediately to determine role and redirect instantly
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        const role = session?.user?.role;

        if (role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/portal');
        }
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected authentication error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full md:grid md:grid-cols-2">
      {/* Theme toggle — calm hairline button, top right */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer z-30"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* ── Left: dark brand panel with the big wordmark ──────────────────
          Always dark so the white-on-transparent wordmark reads correctly,
          independent of the form-side theme toggle. */}
      <div className="relative hidden md:flex flex-col items-center justify-center overflow-hidden bg-zinc-950 p-12 lg:p-16">
        {/* Lime ambient glows — editorial punctuation, not decoration. */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-[140px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-primary/5 blur-[120px]" />

        <Image
          src="/scala-navbar-logo.svg"
          alt="Scala"
          width={560}
          height={127}
          priority
          className="relative w-64 lg:w-[22rem] h-auto"
        />

        <p className="absolute bottom-12 lg:bottom-16 text-xs text-zinc-600">
          © {new Date().getFullYear()} Scala Solutions · Secure workspace portal
        </p>
      </div>

      {/* ── Right: sign-in fields ───────────────────────────────────────────
          On mobile the left panel is hidden, so this becomes the whole screen:
          min-h-screen + center so the form sits in the vertical middle, with
          the wordmark floated above it — simplified, editorial. */}
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-6 sm:p-12 md:min-h-0">
        {/* Single faint lime blur, mobile-only ambience behind the form. */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary/4 blur-[120px] md:hidden" />

        <div className="relative z-10 w-full max-w-sm animate-fade-in-scale">
          {/* Mobile brand — left panel is hidden under md. The navbar wordmark
              is white-on-transparent, so it only reads on the dark canvas; fall
              back to the theme-adaptive mark in light mode. */}
          <div className="mb-14 flex justify-center md:hidden">
            {theme === 'dark' ? (
              <Image
                src="/scala-navbar-logo.svg"
                alt="Scala"
                width={420}
                height={95}
                priority
                className="h-8 w-auto"
              />
            ) : (
              <ScalaLogo variant="full" className="h-11 w-auto" />
            )}
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Sign in
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Access your invoices, hosting SLAs, dynamic metrics, and open support tickets.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              leftIcon={<Mail size={16} />}
              autoComplete="email"
            />

            {/* Password field with an overlay reveal toggle. The Input primitive's rightIcon
                slot is pointer-events-none (decorative only), so the reveal button is rendered
                as a sibling overlay positioned over the input. */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                leftIcon={<Lock size={16} />}
                className="pr-10"
                autoComplete="current-password"
                error={error || undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[30px] p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
              leftIcon={loading ? <Loader2 size={14} className="animate-spin" /> : undefined}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Scala Solutions · Secure workspace portal
          </p>
        </div>
      </div>
    </div>
  );
}
