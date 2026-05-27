'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Receipt, 
  Ticket, 
  TrendingUp, 
  ArrowUpRight, 
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { 
  getClients, 
  getInvoices, 
  getTickets, 
  MockClient, 
  MockInvoice, 
  MockTicket 
} from '@/lib/db/queries';
import { getSubscriptionRemainingMonths } from '@/lib/utils';

export default function DashboardHome() {
  const [clients, setClients] = useState<MockClient[]>([]);
  const [invoices, setInvoices] = useState<MockInvoice[]>([]);
  const [tickets, setTickets] = useState<MockTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const c = await getClients();
        const inv = await getInvoices();
        const t = await getTickets();
        setClients(c);
        setInvoices(inv as MockInvoice[]);
        setTickets(t);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">Gathering control plane analytics...</p>
      </div>
    );
  }

  // Calculate Metrics
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  
  // Calculate MRR from actual active subscriptions: Static = 150k, Dynamic = 350k
  const calculatedMRR = clients.reduce((sum, c) => {
    if (c.status !== 'active') return sum;
    if (c.subscriptionType === 'static') return sum + 150000;
    if (c.subscriptionType === 'dynamic') return sum + 350000;
    return sum;
  }, 0);
  
  // Total Outstanding Invoices (issued + past_due)
  const outstandingInvoicesTotal = invoices
    .filter(inv => inv.status === 'issued' || inv.status === 'past_due')
    .reduce((sum, inv) => sum + inv.total, 0);

  // Unresolved support tickets
  const unresolvedTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  // Filter clients with subscriptions expiring in < 3 months
  const expiringClients = clients.filter(c => {
    if (c.status !== 'active' || !c.subscriptionType) return false;
    const remaining = getSubscriptionRemainingMonths(c);
    return remaining !== null && remaining < 3;
  });

  const formatCurrencyIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-up">
      
      {/* Title Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">System Control Plane</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of Scala solutions clients, invoices, and operations.</p>
        </div>
        
        {/* Quick Date Display */}
        <div className="flex items-center gap-2 bg-muted/40 border border-border px-3.5 py-1.5 rounded-xl text-xs text-muted-foreground font-medium">
          <Calendar size={13} className="text-primary" />
          <span>System Date: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* --- EXPIRY ALERTS PANEL --- */}
      {expiringClients.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.03)] animate-pulse-subtle">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200">Action Required: Subscriptions Expiring Soon</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                The following client subscriptions have less than 3 months remaining. Reach out to secure renewal.
              </p>
              
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                {expiringClients.map(c => {
                  const rem = getSubscriptionRemainingMonths(c);
                  const hasUrl = c.websiteAddress && c.websiteAddress !== '';
                  const domain = hasUrl ? c.websiteAddress!.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : '';
                  const logoUrl = hasUrl ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;

                  return (
                    <Link key={c.id} href={`/admin/clients/${c.id}`} className="block">
                      <div className="p-3 rounded-xl bg-card border border-amber-500/10 hover:border-amber-500/30 transition-all flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3 min-w-0">
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt={c.name} 
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                              className="w-8 h-8 rounded-lg border border-border object-contain bg-white p-0.5 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center font-bold text-xs text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-all duration-200 shrink-0">
                              {c.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold truncate group-hover:text-primary transition-colors">{c.name}</h4>
                            <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{c.subscriptionType} Hosting</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[9px] font-black px-2 py-0.75 rounded-md tracking-wider font-mono ${
                            rem === 0 
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20' 
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            {rem === 0 ? 'Expired' : `${rem} mo remaining`}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- METRICS GRID --- */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Metric 1: Clients */}
        <Link href="/admin/clients" className="block group">
          <div className="p-6 rounded-2xl bg-card border border-border group-hover:border-primary/30 transition-all hover:shadow-[0_0_15px_rgba(206,248,78,0.05)] cursor-pointer relative h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Clients</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight flex items-baseline gap-1.5">
                {totalClients}
                <ArrowUpRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                {activeClients} active accounts
              </p>
            </div>
          </div>
        </Link>

        {/* Metric 2: Estimated MRR */}
        <Link href="/admin/clients" className="block group">
          <div className="p-6 rounded-2xl bg-card border border-border group-hover:border-primary/30 transition-all hover:shadow-[0_0_15px_rgba(206,248,78,0.05)] cursor-pointer relative h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hosting MRR</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold tracking-tight text-emerald-400 flex items-baseline gap-1.5">
                {formatCurrencyIDR(calculatedMRR)}
                <ArrowUpRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Hosting recurring subscription</p>
            </div>
          </div>
        </Link>

        {/* Metric 3: Outstanding Receivables */}
        <Link href="/admin/invoices" className="block group">
          <div className="p-6 rounded-2xl bg-card border border-border group-hover:border-primary/30 transition-all hover:shadow-[0_0_15px_rgba(206,248,78,0.05)] cursor-pointer relative h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding Invoices</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Receipt size={16} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold tracking-tight text-amber-400 flex items-baseline gap-1.5">
                {formatCurrencyIDR(outstandingInvoicesTotal)}
                <ArrowUpRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pending collection invoices</p>
            </div>
          </div>
        </Link>

        {/* Metric 4: Unresolved Tickets */}
        <Link href="/admin/tickets" className="block group">
          <div className="p-6 rounded-2xl bg-card border border-border group-hover:border-primary/30 transition-all hover:shadow-[0_0_15px_rgba(206,248,78,0.05)] cursor-pointer relative h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Support Tickets</span>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                <Ticket size={16} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight text-red-400 flex items-baseline gap-1.5">
                {unresolvedTickets}
                <ArrowUpRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                Requires admin resolution
              </p>
            </div>
          </div>
        </Link>

      </div>

      {/* --- QUICK ACTIONS & SPLIT PANEL --- */}
      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Left Column: Quick Actions & Recent Clients */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Recent Clients List */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold">Recent Clients</h2>
                <p className="text-xs text-muted-foreground">Directory of recently onboarded client sites.</p>
              </div>
              <Link href="/admin/clients">
                <button className="flex items-center gap-1 text-xs text-primary hover:underline font-medium cursor-pointer">
                  View all clients
                  <ArrowRight size={14} />
                </button>
              </Link>
            </div>

            <div className="divide-y divide-border">
              {clients.slice(0, 3).map((client) => {
                const hasUrl = client.websiteAddress && client.websiteAddress !== '';
                // Simple regex to extract domain
                const domain = hasUrl ? client.websiteAddress!.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : '';
                const logoUrl = hasUrl ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;

                return (
                  <Link key={client.id} href={`/admin/clients/${client.id}`} className="block group">
                    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0 cursor-pointer hover:bg-muted/10 px-2 rounded-xl transition-all duration-200">
                      <div className="flex items-center gap-3">
                        {logoUrl ? (
                          <img 
                            src={logoUrl} 
                            alt={client.name} 
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                            className="w-10 h-10 rounded-xl border border-border object-contain bg-white p-1"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center font-bold text-sm text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-all duration-200">
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">{client.name}</h4>
                          <p className="text-xs text-muted-foreground">{client.companyName || 'No Company'} • {client.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {client.subscriptionType && (
                          <span className={`text-[10px] capitalize px-2 py-0.5 rounded-md font-semibold ${
                            client.subscriptionType === 'dynamic' 
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {client.subscriptionType}
                          </span>
                        )}
                        <span className={`text-[9px] uppercase font-black px-2 py-0.75 rounded-md border tracking-wider font-mono ${
                          client.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : client.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}>
                          {client.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="p-6 rounded-2xl bg-muted/20 border border-border">
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Admin Operations</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Link href="/admin/clients?new=true">
                <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-center w-full group cursor-pointer active-press">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2.5 group-hover:scale-110 transition-transform">
                    <Plus size={16} />
                  </div>
                  <span className="text-xs font-semibold">New Client</span>
                </button>
              </Link>

              <Link href="/admin/invoices?new=true">
                <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-center w-full group cursor-pointer active-press">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2.5 group-hover:scale-110 transition-transform">
                    <Receipt size={16} />
                  </div>
                  <span className="text-xs font-semibold">New Invoice</span>
                </button>
              </Link>

              <Link href="/admin/tickets?new=true">
                <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-center w-full group cursor-pointer active-press">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2.5 group-hover:scale-110 transition-transform">
                    <Ticket size={16} />
                  </div>
                  <span className="text-xs font-semibold">New Ticket</span>
                </button>
              </Link>
            </div>
          </div>

        </div>

        {/* Right Column: Support Tickets & Invoices list */}
        <div className="space-y-8">
          
          {/* Urgent Tickets Panel */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold">Support Queue</h2>
                <p className="text-xs text-muted-foreground">Unresolved client issues needing review.</p>
              </div>
              <Link href="/admin/tickets">
                <button className="flex items-center gap-1 text-xs text-primary hover:underline font-medium cursor-pointer">
                  Open Hub
                  <ArrowRight size={14} />
                </button>
              </Link>
            </div>

            <div className="space-y-4">
              {tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').slice(0, 3).map((ticket) => (
                <Link key={ticket.id} href={`/admin/tickets?id=${ticket.id}`} className="block">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors flex-1">{ticket.title}</h4>
                      <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                        ticket.priority === 'urgent' 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : ticket.priority === 'high' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-3">
                      <Clock size={12} />
                      <span>{new Date(ticket.createdAt).toLocaleDateString('id-ID')}</span>
                      <span>•</span>
                      <span className="capitalize">{ticket.category}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length === 0 && (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <CheckCircle size={24} className="text-primary mb-2 opacity-50" />
                  <p className="text-sm font-semibold">Queue Clear</p>
                  <p className="text-xs text-muted-foreground">All support tickets are currently resolved.</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Invoices Panel */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold">Collections</h2>
                <p className="text-xs text-muted-foreground">Outstanding accounts receivable details.</p>
              </div>
            </div>

            <div className="space-y-3">
              {invoices.filter(inv => inv.status === 'issued' || inv.status === 'past_due').slice(0, 3).map((invoice) => {
                const client = clients.find(c => c.id === invoice.clientId);
                return (
                  <div key={invoice.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate">{client?.name || 'Unknown Client'}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Due: {new Date(invoice.dueDate).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold">{formatCurrencyIDR(invoice.total)}</p>
                      <span className={`text-[8px] uppercase font-black px-1 py-0.25 rounded ${
                        invoice.status === 'past_due' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {invoice.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
              {invoices.filter(inv => inv.status === 'issued' || inv.status === 'past_due').length === 0 && (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <CheckCircle size={24} className="text-emerald-400 mb-2 opacity-50" />
                  <p className="text-sm font-semibold">Collections Paid</p>
                  <p className="text-xs text-muted-foreground">All issued invoices have been fully paid!</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
