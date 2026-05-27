'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Lock, Mail, AlertCircle, Eye, EyeOff, Loader2, Sun, Moon } from 'lucide-react';

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
    <div className={`relative min-h-screen w-full flex items-center justify-center overflow-hidden p-4 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#090A0F]' : 'bg-slate-50'
    }`}>
      {/* Floating Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 p-2.5 rounded-xl border transition-all duration-300 cursor-pointer shadow-sm z-20 ${
          theme === 'dark'
            ? 'bg-[#11131E] border-white/10 hover:bg-white/10 text-white'
            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
        }`}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Immersive ambient glowing graphics */}
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[130px] pointer-events-none animate-pulse-slow transition-colors duration-300 ${
        theme === 'dark' ? 'bg-primary/4' : 'bg-primary/10'
      }`}></div>
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[130px] pointer-events-none animate-pulse-slow transition-colors duration-300 ${
        theme === 'dark' ? 'bg-blue-500/3' : 'bg-blue-500/10'
      }`}></div>

      {/* Main login card wrapper */}
      <div className="relative w-full max-w-md z-10 animate-fade-in-scale">
        <div className={`border rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-[#11131E]/60 border-white/5' 
            : 'bg-white/90 border-slate-200/80 shadow-slate-200/50'
        }`}>
          {/* Neon top highlight bar */}
          <div className={`absolute top-0 left-6 right-6 h-0.5 blur-[2px] bg-gradient-to-r transition-all duration-300 ${
            theme === 'dark' ? 'from-primary/30 to-blue-500/30' : 'from-primary/80 to-blue-500/80'
          }`}></div>

          {/* Logo & header block */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 mb-3">
              {/* Scala Branding Logo Mark */}
              <svg width="100" height="35" viewBox="0 0 1312 539" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
                <path d="M364 71C392.167 71 415 156.514 415 262C415 367.486 392.167 453 364 453C343.793 453 326.332 408.99 318.076 345.168C317.638 341.778 312.326 341.44 311.44 344.741C294.178 409.036 265.384 454.256 241.682 450.393C231.539 448.739 223.734 438.327 218.653 421.783C217.773 418.916 213.386 418.598 212.097 421.305C202.798 440.82 189.618 453 175 453C146.833 453 124 407.781 124 352C124 296.219 146.833 251 175 251C192.351 251 207.678 268.16 216.89 294.379C217.215 295.302 218.595 295.208 218.772 294.246C233.834 212.527 268.511 149.942 296.225 154.46C302.758 155.525 308.32 160.224 312.81 167.855C314.412 170.578 319.292 169.952 319.772 166.829C328.578 109.558 345.087 71 364 71Z" fill={theme === 'dark' ? '#CEF84E' : '#6fa100'}/>
                <path d="M563 365.5C519 365.5 492 342.5 492 306.25H531C531 323 543.5 332.75 562.75 332.75C579.25 332.75 589.75 326 589.75 314.25C589.75 302 578.5 294.75 553.75 289.5C512.75 280.75 493.5 263.75 493.5 235.25C493.5 203.25 518.5 183.5 558.75 183.5C600.25 183.5 626.75 206 626.75 241.25H588.5C588.5 225.5 577.5 216 559.25 216C542.5 216 532.25 223 532.25 234.5C532.25 245.25 541.5 252 568.25 258.25C611.75 268.5 630 285 630 312.75C630 345.75 604.5 365.5 563 365.5ZM722.656 365.5C680.406 365.5 650.906 336.75 650.906 296.25C650.906 256 680.656 227.25 722.656 227.25C759.156 227.25 787.156 248.5 793.156 281H756.656C750.406 267.75 738.156 259.75 723.156 259.75C702.656 259.75 688.406 274.75 688.406 296.25C688.406 317.75 702.656 332.75 722.656 332.75C739.156 332.75 752.156 323.5 757.406 309.25H794.406C787.406 343.75 759.656 365.5 722.656 365.5ZM865.283 364.5C834.283 364.5 815.033 349 815.033 323.75C815.033 299.5 832.533 283.75 859.783 283.75H907.283V277.75C907.283 264.75 897.033 256.25 882.033 256.25C869.783 256.25 860.283 262.5 858.033 271.75H821.533C826.283 243.25 848.283 227.25 881.783 227.25C921.033 227.25 944.533 248.25 944.533 283V362H916.283L912.033 346.75C900.783 358.25 884.783 364.5 865.283 364.5ZM852.533 322.25C852.533 331.25 861.033 337.25 874.033 337.25C893.033 337.25 906.783 325.25 907.533 307.5H871.533C860.033 307.5 852.533 313.25 852.533 322.25ZM979.98 362V177H1017.98V362H979.98ZM1099.66 364.5C1068.66 364.5 1049.41 349 1049.41 323.75C1049.41 299.5 1066.91 283.75 1094.16 283.75H1141.66V277.75C1141.66 264.75 1131.41 256.25 1116.41 256.25C1104.16 256.25 1094.66 262.5 1092.41 271.75H1055.91C1060.66 243.25 1082.66 227.25 1116.16 227.25C1155.41 227.25 1178.91 248.25 1178.91 283V362H1150.66L1146.41 346.75C1135.16 358.25 1119.16 364.5 1099.66 364.5ZM1086.91 322.25C1086.91 331.25 1095.41 337.25 1108.41 337.25C1127.41 337.25 1141.16 325.25 1141.91 307.5H1105.91C1094.41 307.5 1086.91 313.25 1086.91 322.25Z" fill={theme === 'dark' ? 'white' : '#0f172a'}/>
              </svg>
              <span className={`text-[10px] uppercase font-bold tracking-widest border px-1.5 py-0.5 rounded transition-all duration-300 ${
                theme === 'dark' ? 'text-[#CEF84E] border-[#CEF84E]/20' : 'text-[#6fa100] border-[#6fa100]/20'
              }`}>
                Portal
              </span>
            </div>
            <h2 className={`text-xl font-bold tracking-tight transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Scala Client Workspace
            </h2>
            <p className={`text-xs mt-1.5 text-center transition-colors duration-300 ${
              theme === 'dark' ? 'text-muted-foreground' : 'text-slate-500'
            }`}>
              Access your invoices, static hosting SLAs, dynamic metrics, and open support tickets.
            </p>
          </div>

          {/* Form container */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error banner */}
            {error && (
              <div className="flex gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 animate-fade-in-scale">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 transition-colors duration-300 ${
                theme === 'dark' ? 'text-muted-foreground' : 'text-slate-500'
              }`}>
                Workspace Email Address
              </label>
              <div className="relative">
                <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  theme === 'dark' ? 'text-muted-foreground' : 'text-slate-400'
                }`} />
                <input
                  type="email"
                  required
                  placeholder="Enter workspace email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-all font-semibold ${
                    theme === 'dark' 
                      ? 'bg-muted/20 border border-white/5 text-white focus:border-primary/45 placeholder:text-muted-foreground/30' 
                      : 'bg-slate-100/50 border border-slate-200 text-slate-900 focus:border-primary/60 placeholder:text-slate-400/60'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className={`block text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                  theme === 'dark' ? 'text-muted-foreground' : 'text-slate-500'
                }`}>
                  Workspace Password
                </label>
              </div>
              <div className="relative">
                <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  theme === 'dark' ? 'text-muted-foreground' : 'text-slate-400'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter workspace password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl text-sm focus:outline-none transition-all font-mono font-semibold ${
                    theme === 'dark' 
                      ? 'bg-muted/20 border border-white/5 text-white focus:border-primary/45 placeholder:text-muted-foreground/30' 
                      : 'bg-slate-100/50 border border-slate-200 text-slate-900 focus:border-primary/60 placeholder:text-slate-400/60'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors cursor-pointer ${
                    theme === 'dark' ? 'text-muted-foreground hover:text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 active-press transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-2"
              style={{ boxShadow: theme === 'dark' ? '0 0 20px rgba(206, 248, 78, 0.25)' : 'none' }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Entering Portal...</span>
                </>
              ) : (
                <span>Enter Portal</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
