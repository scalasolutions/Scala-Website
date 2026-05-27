'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Lock, Mail, Eye, EyeOff, Loader2, Sun, Moon } from 'lucide-react';
import ScalaLogo from '@/components/ui/ScalaLogo';
import Card from '@/components/ui/Card';
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
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden p-6 bg-background">
      {/* Theme toggle — calm hairline button, top right */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer z-20"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* One subtle lime ambient blur in the corner — punctuation only. */}
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/4 blur-[120px] pointer-events-none" />

      {/* Centered stack — logo above, then the card. */}
      <div className="relative w-full max-w-md z-10 animate-fade-in-scale">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <ScalaLogo variant="full" className="h-16 w-auto" />
        </div>

        {/* Form card */}
        <Card padding="lg">
          <div className="mb-7">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Sign in to Scala
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
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
        </Card>

        {/* Subtle legal footer */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Scala Solutions · Secure workspace portal
        </p>
      </div>
    </div>
  );
}
