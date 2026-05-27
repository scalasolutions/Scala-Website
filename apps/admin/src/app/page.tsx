"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Shield, 
  Activity, 
  FileText, 
  Layers, 
  Database, 
  Zap, 
  Cpu, 
  Terminal, 
  CheckCircle2,
  Lock,
  Moon,
  Sun,
  Layout,
  MessageSquare
} from 'lucide-react';

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);

  // Sync theme switch with local storage and document class list
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
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
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      {/* Floating Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black tracking-tighter text-xl shadow-lg shadow-primary/20">
              S
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
              Scala Solutions
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#services" className="hover:text-foreground transition-colors">Services</a>
            <a href="#slas" className="hover:text-foreground transition-colors">SLA Framework</a>
            <a href="#tech" className="hover:text-foreground transition-colors">Infrastructure</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2.5 rounded-lg border border-border bg-card/50 text-muted-foreground hover:text-foreground transition-all active-press"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link 
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-all shadow-md shadow-primary/20 hover:shadow-primary/30 active-press hover:opacity-95"
            >
              <Lock className="w-3.5 h-3.5" />
              Client Space
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-20 md:pt-36 md:pb-32 mx-auto max-w-7xl flex flex-col items-center text-center">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-wide mb-8 animate-fade-up stagger-1">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Next-Gen Software & Cloud Architectures
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.1] animate-fade-up stagger-2">
          Architecting High-Performance <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">Digital Ecosystems</span>
        </h1>

        <p className="mt-8 text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed animate-fade-up stagger-3">
          Scala Solutions crafts premium Next.js applications, serverless cloud topologies, and secure client environments backed by rock-solid Service Level Agreements (SLAs).
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-up stagger-4">
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:scale-[1.02] active-press"
          >
            Access Client Workspace
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a 
            href="#services" 
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-border bg-card/60 hover:bg-card backdrop-blur-sm text-foreground font-semibold transition-all hover:border-muted-foreground/30 active-press"
          >
            Explore Services
          </a>
        </div>
      </section>

      {/* Trust Grid */}
      <section id="services" className="py-24 border-t border-border/40 bg-card/20 relative">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight">Engineered for absolute stability</h2>
            <p className="mt-4 text-muted-foreground">Every digital system we build adheres to enterprise availability and rigorous design principles.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="glow-card p-8 rounded-2xl bg-card border border-border/50 animate-fade-up stagger-1">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Enterprise React & Monorepos</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Clean, robust architectures utilizing modern Next.js patterns, optimized workspaces, and strict TypeScript verification to prevent logic bugs.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glow-card p-8 rounded-2xl bg-card border border-border/50 animate-fade-up stagger-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Serverless DB & Cloud Topologies</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Dynamic data layers backed by PostgreSQL (Neon, Vercel Postgres) and distributed serverless edge functions for lighting-fast caching.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glow-card p-8 rounded-2xl bg-card border border-border/50 animate-fade-up stagger-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Covert Client Space</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Highly isolated customer accounts featuring B2B tenancy barriers. Secure invoices preview, technical support queues, and realtime chat logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SLA Tiers Section */}
      <section id="slas" className="py-24 border-t border-border/40 relative">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Structured Hosting & Support SLA</h2>
            <p className="mt-4 text-muted-foreground">Select the support SLA that matches your transaction volumes and computational requirements.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* SLA Static */}
            <div className="glow-card p-10 rounded-3xl bg-card border border-border/80 flex flex-col justify-between animate-fade-up stagger-1">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Static Hosting SLA</h3>
                    <p className="text-muted-foreground text-xs mt-1">Best for static profiles & static web documents</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    Optimal Availability
                  </span>
                </div>

                <ul className="space-y-4 mb-10 text-sm">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                    <span>Global Edge CDN caching</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                    <span>Automated dependency checks & SSL certificates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                    <span>99.9% availability uptime guarantee</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                    <span>Business hours SLA ticket responding</span>
                  </li>
                </ul>
              </div>

              <Link 
                href="/login" 
                className="w-full py-3.5 rounded-xl border border-border bg-card/80 text-foreground font-bold text-center text-sm transition-all hover:bg-muted active-press"
              >
                Inquire Portal Setup
              </Link>
            </div>

            {/* SLA Dynamic */}
            <div className="glow-card p-10 rounded-3xl bg-card border-2 border-primary/80 flex flex-col justify-between relative shadow-xl shadow-primary/5 animate-fade-up stagger-2">
              <div className="absolute top-0 right-8 -translate-y-1/2 px-4 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-md">
                Highly Recommended
              </div>

              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Dynamic Hosting SLA</h3>
                    <p className="text-muted-foreground text-xs mt-1">Best for high-concurrency B2B platforms</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    24/7 Priority
                  </span>
                </div>

                <ul className="space-y-4 mb-10 text-sm">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                    <span>Serverless auto-scaling database cluster</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                    <span>Realtime client ticketing & support messaging</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                    <span>Uptime monitoring with hourly health checks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                    <span>High-priority response times (under 4 hours)</span>
                  </li>
                </ul>
              </div>

              <Link 
                href="/login" 
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-center text-sm transition-all shadow-md shadow-primary/20 hover:opacity-95 active-press"
              >
                Inquire Portal Setup
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Specifications Terminal */}
      <section id="tech" className="py-24 border-t border-border/40 bg-card/10 relative">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary mb-4">
                <Cpu className="w-4.5 h-4.5" />
                Infrastructure Stack
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-6">Designed with extreme engineering parameters</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our deployments are managed under absolute strict guidelines, featuring isolated tenancy structures, robust schema control via Drizzle ORM, and fast client assets assembly.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-1">1</div>
                  <p className="text-sm text-muted-foreground"><strong className="text-foreground">FART-Proof Theme Injection:</strong> Direct theme checks inserted programmatically in the layout header to guarantee zero-flash hydration jumps.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-1">2</div>
                  <p className="text-sm text-muted-foreground"><strong className="text-foreground">Secure Tenancy Bounds:</strong> Multi-tenant isolation at database query levels prevents customer accounts from ever viewing unrelated SLAs or invoices.</p>
                </div>
              </div>
            </div>

            {/* Simulated Shell Terminal */}
            <div className="bg-slate-950 text-slate-300 p-6 rounded-2xl border border-slate-800 shadow-2xl font-mono text-sm leading-relaxed overflow-hidden relative">
              <div className="absolute top-3 left-4 flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/70" />
                <span className="w-3 h-3 rounded-full bg-amber-500/70" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="text-center text-slate-500 text-xs border-b border-slate-900 pb-3 mb-4">
                scala-deploy-handshake
              </div>
              <div className="space-y-2">
                <p className="text-slate-500"># Initializing deployment check...</p>
                <div className="flex gap-2">
                  <span className="text-primary">$</span>
                  <p>npm run build --workspace=apps/admin</p>
                </div>
                <p className="text-blue-400">▶ next build</p>
                <p className="text-emerald-400">✓ Linting and static optimization check complete</p>
                <p className="text-emerald-400">✓ Schema integrity verified via Drizzle Kit</p>
                <div className="flex gap-2 text-slate-400 mt-4">
                  <span className="text-primary">$</span>
                  <p>drizzle-kit push</p>
                </div>
                <p className="text-slate-500">Connecting to Neon Database serverless cluster...</p>
                <p className="text-emerald-400">✓ Tables synced successfully [100% compliant]</p>
                <p className="text-white font-semibold mt-4">✔ Scala Portal Server online and secure.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/40 bg-card/40 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-black text-xs">
              S
            </div>
            <span className="font-bold text-foreground">Scala Solutions</span>
          </div>

          <div>
            © {new Date().getFullYear()} Scala Solutions. All rights reserved.
          </div>

          <div className="flex gap-6">
            <a href="#services" className="hover:text-foreground">Terms</a>
            <a href="#services" className="hover:text-foreground">SLA</a>
            <Link href="/login" className="hover:text-primary transition-colors flex items-center gap-1">
              <Lock className="w-3 h-3" /> Admin Gateway
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
