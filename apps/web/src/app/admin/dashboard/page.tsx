'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Receipt,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Ticket,
  Loader2,
  AlertTriangle,
  LifeBuoy,
  Wallet,
} from 'lucide-react';

const ticketCategoryLabels: Record<string, string> = {
  billing: 'Billing',
  technical: 'Technical',
  general: 'General',
  feature_request: 'Feature request',
};
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
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';

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
      <div className="space-y-8 animate-fade-up">
        {/* Header skeleton */}
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2.5">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          <Skeleton className="h-10 w-32" rounded="xl" />
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Two-column block skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2 space-y-4">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-10 w-10" rounded="full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-3/5" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <Skeleton className="h-4 w-28" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3.5 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate Metrics
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'active').length;

  // Calculate MRR from actual active subscriptions: Static = 200k, Dynamic = 350k
  const calculatedMRR = clients.reduce((sum, c) => {
    if (c.status !== 'active') return sum;
    if (c.subscriptionType === 'static') return sum + 200000;
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

  const openTickets = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').slice(0, 3);
  const outstandingInvoices = invoices.filter(inv => inv.status === 'issued' || inv.status === 'past_due').slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-up">

      {/* Title */}
      <PageHeader
        title="Dashboard"
        description="Overview of clients, invoices, and operations."
      />

      {/* Quick Actions — pulled to the top so the most common admin moves are one click away. */}
      <Card padding="md">
        <SectionHeading
          eyebrow="Get started"
          title="Quick actions"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/admin/clients?new=true" className="block">
            <Button variant="primary" size="md" leftIcon={<Plus size={16} />} className="w-full">
              New Client
            </Button>
          </Link>
          <Link href="/admin/invoices?new=true" className="block">
            <Button variant="secondary" size="md" leftIcon={<Receipt size={16} />} className="w-full">
              New Invoice
            </Button>
          </Link>
          <Link href="/admin/tickets?new=true" className="block">
            <Button variant="secondary" size="md" leftIcon={<Ticket size={16} />} className="w-full">
              New Ticket
            </Button>
          </Link>
        </div>
      </Card>

      {/* --- METRICS GRID --- */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

        {/* Metric 1: Clients — accent on the headline metric only. */}
        <Link href="/admin/clients" className="block">
          <StatCard
            label="Total clients"
            value={totalClients}
            icon={<Users size={14} />}
            accent
            delta={{ value: `${activeClients} active`, trend: 'neutral' }}
            className="h-full hover:border-foreground/15 transition-colors"
          />
        </Link>

        {/* Metric 2: Estimated MRR */}
        <Link href="/admin/clients" className="block">
          <StatCard
            label="Hosting MRR"
            value={formatCurrencyIDR(calculatedMRR)}
            icon={<TrendingUp size={14} />}
            delta={{ value: 'From active subscriptions', trend: 'neutral' }}
            className="h-full hover:border-foreground/15 transition-colors"
          />
        </Link>

        {/* Metric 3: Outstanding Receivables */}
        <Link href="/admin/invoices" className="block">
          <StatCard
            label="Outstanding"
            value={formatCurrencyIDR(outstandingInvoicesTotal)}
            icon={<Receipt size={14} />}
            delta={{ value: `${outstandingInvoices.length} invoice${outstandingInvoices.length === 1 ? '' : 's'} unpaid`, trend: 'neutral' }}
            className="h-full hover:border-foreground/15 transition-colors"
          />
        </Link>

        {/* Metric 4: Unresolved Tickets */}
        <Link href="/admin/tickets" className="block">
          <StatCard
            label="Open tickets"
            value={unresolvedTickets}
            icon={<Ticket size={14} />}
            delta={{ value: unresolvedTickets === 0 ? 'All resolved' : 'Awaiting action', trend: 'neutral' }}
            className="h-full hover:border-foreground/15 transition-colors"
          />
        </Link>

      </div>

      {/* --- EXPIRING SUBSCRIPTIONS PANEL --- */}
      {expiringClients.length > 0 && (
        <Card padding="md">
          <SectionHeading
            icon={<AlertTriangle size={16} />}
            title="Subscriptions expiring soon"
            description="These clients have less than 3 months remaining."
            action={<Badge variant="warning">Expiring</Badge>}
          />

          <div className="divide-y divide-border">
            {expiringClients.map(c => {
              const rem = getSubscriptionRemainingMonths(c);

              const cDomain = c.websiteAddress ? c.websiteAddress.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : null;
              const cFavicon = cDomain ? `https://www.google.com/s2/favicons?domain=${cDomain}&sz=64` : null;

              return (
                <Link key={c.id} href={`/admin/clients/${c.id}`} className="block">
                  <div className="flex items-center justify-between gap-3 py-4 px-2 -mx-2 rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Logo avatar */}
                      <div className="w-8 h-8 rounded-full border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {cFavicon ? (
                          <img
                            src={cFavicon}
                            alt={c.name}
                            className="w-5 h-5 object-contain"
                            onLoad={(e) => {
                              const img = e.target as HTMLImageElement;
                              if (img.naturalWidth <= 16) {
                                img.style.display = 'none';
                                img.nextElementSibling?.removeAttribute('style');
                              }
                            }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style'); }}
                          />
                        ) : null}
                        <span className="text-xs font-bold text-muted-foreground" style={cFavicon ? { display: 'none' } : {}}>
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{c.subscriptionType} hosting</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {rem === 0 ? (
                        <Badge variant="danger">Expired</Badge>
                      ) : (
                        <Badge variant="warning">{rem} mo left</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* --- TWO-COLUMN: Support Queue (left) + Recent Clients (right) --- */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Support Queue — action-oriented, sits left. */}
        <Card padding="md">
          <SectionHeading
            icon={<LifeBuoy size={16} />}
            title="Support queue"
            description="Unresolved client issues needing review."
            action={
              <Link
                href="/admin/tickets"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
                <ArrowRight size={12} />
              </Link>
            }
          />

          <div className="space-y-3">
            {openTickets.length > 0 ? openTickets.map((ticket) => {
              const priorityVariant: 'danger' | 'warning' | 'neutral' =
                ticket.priority === 'urgent' ? 'danger'
                : ticket.priority === 'high' ? 'warning'
                : 'neutral';

              return (
                <Link key={ticket.id} href={`/admin/tickets?id=${ticket.id}`} className="block">
                  <div className="p-4 rounded-xl border border-border hover:border-foreground/15 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-foreground truncate flex-1">{ticket.title}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="neutral">
                          {ticketCategoryLabels[ticket.category] ?? ticket.category}
                        </Badge>
                        <Badge variant={priorityVariant} className="capitalize">
                          {ticket.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                      <Clock size={12} />
                      <span>{new Date(ticket.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </Link>
              );
            }) : (
              <EmptyState
                icon={<CheckCircle2 size={18} />}
                title="Queue clear"
                description="All support tickets are currently resolved."
                className="py-10"
              />
            )}
          </div>
        </Card>

        {/* Recent Clients — informational, sits right. */}
        <Card padding="md">
          <SectionHeading
            icon={<Users size={16} />}
            title="Recent clients"
            description="Directory of recently onboarded client sites."
            action={
              <Link
                href="/admin/clients"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
                <ArrowRight size={12} />
              </Link>
            }
          />

          <div className="divide-y divide-border">
            {clients.slice(0, 3).map((client) => {
              const statusVariant: 'success' | 'warning' | 'neutral' =
                client.status === 'active' ? 'success'
                : client.status === 'pending' ? 'warning'
                : 'neutral';

              const rDomain = client.websiteAddress ? client.websiteAddress.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : null;
              const rFavicon = rDomain ? `https://www.google.com/s2/favicons?domain=${rDomain}&sz=64` : null;

              return (
                <Link key={client.id} href={`/admin/clients/${client.id}`} className="block">
                  <div className="flex items-center justify-between gap-3 py-4 px-2 -mx-2 rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Logo avatar */}
                      <div className="w-8 h-8 rounded-full border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {rFavicon ? (
                          <img
                            src={rFavicon}
                            alt={client.name}
                            className="w-5 h-5 object-contain"
                            onLoad={(e) => {
                              const img = e.target as HTMLImageElement;
                              if (img.naturalWidth <= 16) {
                                img.style.display = 'none';
                                img.nextElementSibling?.removeAttribute('style');
                              }
                            }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style'); }}
                          />
                        ) : null}
                        <span className="text-xs font-bold text-muted-foreground" style={rFavicon ? { display: 'none' } : {}}>
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {client.companyName || 'No company'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusVariant} className="capitalize">
                        {client.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

      </div>

      {/* --- COLLECTIONS — full-width below the split. --- */}
      <Card padding="md">
        <SectionHeading
          icon={<Wallet size={16} />}
          title="Collections"
          description="Outstanding accounts receivable."
          action={
            <Link
              href="/admin/invoices"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
              <ArrowRight size={12} />
            </Link>
          }
        />

        {outstandingInvoices.length > 0 ? (
          <div className="divide-y divide-border">
            {outstandingInvoices.map((invoice) => {
              const client = clients.find(c => c.id === invoice.clientId);
              const statusVariant: 'danger' | 'warning' = invoice.status === 'past_due' ? 'danger' : 'warning';

              const oDomain = client?.websiteAddress ? client.websiteAddress.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : null;
              const oFavicon = oDomain ? `https://www.google.com/s2/favicons?domain=${oDomain}&sz=64` : null;
              const oName = client?.name || 'Unknown Client';

              return (
                <div key={invoice.id} className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Logo avatar */}
                    <div className="w-8 h-8 rounded-full border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {oFavicon ? (
                        <img
                          src={oFavicon}
                          alt={oName}
                          className="w-5 h-5 object-contain"
                          onLoad={(e) => {
                            const img = e.target as HTMLImageElement;
                            if (img.naturalWidth <= 16) {
                              img.style.display = 'none';
                              img.nextElementSibling?.removeAttribute('style');
                            }
                          }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style'); }}
                        />
                      ) : null}
                      <span className="text-xs font-bold text-muted-foreground" style={oFavicon ? { display: 'none' } : {}}>
                        {oName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{oName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {invoice.invoiceNumber} · Due {new Date(invoice.dueDate).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={statusVariant} className="capitalize">
                      {invoice.status.replace('_', ' ')}
                    </Badge>
                    <p className="text-sm font-medium text-foreground tabular-nums">
                      {formatCurrencyIDR(invoice.total)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<CheckCircle2 size={18} />}
            title="Collections paid"
            description="All issued invoices have been fully paid."
            className="py-10"
          />
        )}
      </Card>

    </div>
  );
}
