'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Filter, 
  Globe, 
  Mail, 
  Phone, 
  Building,
  Check,
  X,
  Sparkles,
  ArrowUpRight,
  Receipt,
  Ticket,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { getClients, createClient, MockClient } from '@/lib/db/queries';
import { getSubscriptionRemainingMonths } from '@/lib/utils';

export default function ClientsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [clients, setClients] = useState<MockClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [websiteAddress, setWebsiteAddress] = useState('');
  const [status, setStatus] = useState<'pending' | 'active' | 'inactive'>('pending');
  const [subscriptionType, setSubscriptionType] = useState<'static' | 'dynamic' | ''>('');
  const [subscriptionMonths, setSubscriptionMonths] = useState<number>(12);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [portalPassword, setPortalPassword] = useState('');

  useEffect(() => {
    // Check if redirect query string contains new=true to auto-open modal
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === 'true') {
        setModalOpen(true);
      }
    }

    async function loadClients() {
      const c = await getClients();
      setClients(c);
      setLoading(false);
    }
    loadClients();
  }, []);

  // Prevent background scrolling when Add Client modal is open (prevent double scrollbar)
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (modalOpen) {
      if (mainEl) mainEl.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      if (mainEl) mainEl.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      if (mainEl) mainEl.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    startTransition(async () => {
      try {
        const newClient = await createClient({
          name,
          email,
          phone: phone || null,
          companyName: companyName || null,
          websiteAddress: websiteAddress || null,
          status,
          logoUrl: null,
          subscriptionType: subscriptionType || null,
          subscriptionMonths: subscriptionType ? Number(subscriptionMonths) : null,
          subscriptionStartDate: subscriptionType ? new Date(subscriptionStartDate) : null,
          portalPassword: portalPassword || null
        });

        if (newClient) {
          setClients(prev => [newClient as MockClient, ...prev]);
          // Reset form fields
          setName('');
          setEmail('');
          setPhone('');
          setCompanyName('');
          setWebsiteAddress('');
          setStatus('pending');
          setSubscriptionType('');
          setSubscriptionMonths(12);
          setSubscriptionStartDate(new Date().toISOString().substring(0, 10));
          setPortalPassword('');
          setModalOpen(false);
          
          // Clear query string
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/admin/clients');
          }
        }
      } catch (err) {
        console.error("Failed to create client", err);
      }
    });
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase()));
    
    const matchesFilter = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-fade-up">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Client Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage partner accounts, subscription billing SLAs, and system quotas.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active-press transition-all duration-200 cursor-pointer self-start"
          style={{ boxShadow: '0 0 15px rgba(206, 248, 78, 0.25)' }}
        >
          <Plus size={16} />
          Add Client Account
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-card border border-border">
        
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by client name, email, or company..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          <div className="flex rounded-xl bg-muted/40 border border-border p-0.5">
            {['all', 'active', 'pending', 'inactive'].map((filt) => (
              <button
                key={filt}
                onClick={() => setStatusFilter(filt)}
                className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer font-medium ${
                  statusFilter === filt 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {filt}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* --- CLIENTS LIST / TABLE --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-xs text-muted-foreground">Gathering clients data...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-dashed border-border bg-card">
          <Building className="mx-auto text-muted-foreground opacity-30 mb-3" size={32} />
          <h3 className="font-semibold text-base">No Client Accounts Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria, clearing filters, or adding a new client account.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/25 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Client / Company</th>
                  <th className="px-6 py-4">Hosting Plan</th>
                  <th className="px-6 py-4">Quota (Months)</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredClients.map((client) => {
                  const remaining = getSubscriptionRemainingMonths(client);
                  const isExpiring = remaining !== null && remaining < 3;
                  const hasUrl = client.websiteAddress && client.websiteAddress !== '';
                  
                  // Simple regex to extract domain
                  const domain = hasUrl ? client.websiteAddress!.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : '';
                  const faviconUrl = hasUrl ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;

                  return (
                    <tr 
                      key={client.id} 
                      onClick={() => router.push(`/admin/clients/${client.id}`)}
                      className="hover:bg-muted/15 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Logo as url fetcher to their website */}
                          {faviconUrl ? (
                            <div className="relative">
                              <img 
                                src={faviconUrl} 
                                alt={client.name} 
                                onError={(e) => {
                                  // Fallback to text avatar if image fails
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                                className="w-10 h-10 rounded-xl border border-border object-contain bg-white p-1.5 shadow-sm group-hover:scale-105 transition-transform"
                              />
                              {hasUrl && (
                                <a 
                                  href={client.websiteAddress!} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  onClick={(e) => e.stopPropagation()} 
                                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-muted border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-card transition-colors shadow-xs"
                                  title={`Visit ${domain}`}
                                >
                                  <ExternalLink size={8} />
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-black text-sm group-hover:bg-primary/10 transition-colors">
                              {client.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                              {client.name}
                            </h4>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Building size={10} className="shrink-0" />
                              {client.companyName || 'No Company'}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {client.subscriptionType ? (
                          <div className="space-y-1">
                            <span className={`text-[9px] uppercase font-black px-2 py-0.75 rounded-md border tracking-wider font-mono ${
                              client.subscriptionType === 'dynamic' 
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/25' 
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                            }`}>
                              {client.subscriptionType} Hosting
                            </span>
                            <div className="text-[11px] text-muted-foreground font-medium">
                              {client.subscriptionType === 'static' ? 'IDR 150.000 / mo' : 'IDR 350.000 / mo'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No Active Plan</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        {remaining !== null ? (
                          <div className="space-y-1.5 max-w-[140px]">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span>Remaining:</span>
                              <span className={isExpiring ? 'text-amber-400 font-bold' : 'text-foreground'}>
                                {remaining} / {client.subscriptionMonths} mo
                              </span>
                            </div>
                            
                            {/* Quota Progress Bar */}
                            <div className="w-full h-1.5 bg-muted border border-border rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  remaining === 0 
                                    ? 'bg-red-500' 
                                    : isExpiring 
                                    ? 'bg-amber-400' 
                                    : 'bg-primary'
                                }`} 
                                style={{ width: `${Math.min(100, (remaining / (client.subscriptionMonths || 12)) * 100)}%` }}
                              ></div>
                            </div>
                            
                            {/* Expiry alerts & notifications trigger */}
                            {isExpiring && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold animate-pulse-subtle">
                                <AlertTriangle size={10} className="shrink-0" />
                                <span>{remaining === 0 ? 'Expired Plan' : 'Expires Soon (<3 mo)'}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[9px] uppercase font-black px-2 py-0.75 rounded-md border tracking-wider font-mono ${
                          client.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : client.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2.5">
                          {/* Visit profile link */}
                          <Link href={`/admin/clients/${client.id}`} title="View Profile">
                            <button className="flex items-center justify-center p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-primary hover:bg-primary/5 border border-border hover:border-primary/20 transition-all cursor-pointer">
                              <ArrowRight size={13} />
                            </button>
                          </Link>

                          <Link href={`/admin/invoices?client=${client.id}`} title="Invoices">
                            <button className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/20 transition-all cursor-pointer font-semibold">
                              <Receipt size={11} />
                              <span>Billing</span>
                            </button>
                          </Link>
                          
                          <Link href={`/admin/tickets?client=${client.id}`} title="Support tickets">
                            <button className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/20 transition-all cursor-pointer font-semibold">
                              <Ticket size={11} />
                              <span>Support</span>
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CREATE CLIENT MODAL --- */}
      {mounted && modalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/85 backdrop-blur-md" onClick={() => setModalOpen(false)}></div>
          
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl animate-fade-in-scale max-h-[82vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary animate-pulse" />
                <h3 className="text-lg font-bold">Add Client Account</h3>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Client Full Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Fredrick Yang"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address *</label>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. fredrick@anakweb.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Company Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Anak Web Solutions"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. +628123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Website Address</label>
                <input 
                  type="url" 
                  placeholder="e.g. https://anakweb.com"
                  value={websiteAddress}
                  onChange={(e) => setWebsiteAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Portal Password (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Leave blank to auto-generate memorable password"
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                />
              </div>

              {/* Subscriptions Area */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                <div className="flex items-center gap-1.5">
                  <Layers size={14} className="text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hosting Subscription Details</h4>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">Subscription Hosting Type</label>
                  <div className="flex gap-2">
                    {[
                      { key: '', label: 'No Active Sub' },
                      { key: 'static', label: 'Static (150k/mo)' },
                      { key: 'dynamic', label: 'Dynamic (350k/mo)' }
                    ].map((type) => (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => setSubscriptionType(type.key as 'static' | 'dynamic' | '')}
                        className={`flex-1 py-2 border text-xs capitalize transition-all cursor-pointer font-bold rounded-lg ${
                          subscriptionType === type.key
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {subscriptionType !== '' && (
                  <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-scale">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Purchased Months Quota</label>
                      <input 
                        type="number" 
                        min="1"
                        max="120"
                        required
                        value={subscriptionMonths}
                        onChange={(e) => setSubscriptionMonths(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Subscription Start Date</label>
                      <input 
                        type="date" 
                        required
                        value={subscriptionStartDate}
                        onChange={(e) => setSubscriptionStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Initial Account Status</label>
                <div className="flex gap-2">
                  {(['pending', 'active', 'inactive'] as const).map((stat) => (
                    <button
                      key={stat}
                      type="button"
                      onClick={() => setStatus(stat)}
                      className={`flex-1 py-2 rounded-xl border text-xs capitalize transition-all cursor-pointer font-bold ${
                        status === stat 
                          ? 'bg-primary/10 border-primary text-primary' 
                          : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {stat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active-press transition-all cursor-pointer"
                  style={{ boxShadow: '0 0 10px rgba(206, 248, 78, 0.15)' }}
                >
                  {isPending ? 'Saving...' : 'Add Account'}
                  <Check size={14} />
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
