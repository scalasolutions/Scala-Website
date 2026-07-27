'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Building,
  AlertTriangle,
  ArrowRight,
  Receipt,
  Ticket,
  FileText,
  ClipboardList,
} from 'lucide-react';
import { MockClient, MockInvoice, MockClientTask, MockPartner } from '@/lib/db/queries';
import { cn, getSubscriptionRemainingMonths, TABLE_ROW_HOVER, isOutstandingInvoice } from '@/lib/utils';
import { formatCurrencyIDR } from '@/app/admin/invoices/components/invoice-types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import FilterBar, { FilterOption } from '@/components/ui/FilterBar';
import ActionMenu from '@/components/ui/ActionMenu';

type StatusFilter = 'all' | 'active' | 'pending' | 'inactive';

interface ClientsListProps {
  clients: MockClient[];
  partners: MockPartner[];
  invoices: MockInvoice[];
  allTasks: MockClientTask[];
  loading: boolean;
  search: string;
  setSearch: (val: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (val: StatusFilter) => void;
  setSelectedAgreementClient: (client: MockClient | null) => void;
  setModalOpen: (open: boolean) => void;
}

export function ClientsList({
  clients,
  partners,
  invoices,
  allTasks,
  loading,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  setSelectedAgreementClient,
  setModalOpen,
}: ClientsListProps) {
  const router = useRouter();
  const now = React.useMemo(() => new Date(), []);

  if (search === 'simulate-error-crash') {
    throw new Error('Simulated rendering failure in ClientsList for testing ComponentErrorBoundary');
  }

  const getSourcedByLabel = (sourcedByVal: string | null) => {
    if (
      !sourcedByVal ||
      sourcedByVal === 'organic' ||
      sourcedByVal === 'fredrick' ||
      sourcedByVal === 'nicholas'
    ) {
      return 'Organic';
    }
    const partner = partners.find((p) => p.id === sourcedByVal);
    if (partner) {
      return partner.name;
    }
    if (sourcedByVal === 'affiliate') {
      return 'Affiliate';
    }
    return sourcedByVal || 'Organic';
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  // Quick metrics
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'active').length;
  const pendingClients = clients.filter((c) => c.status === 'pending').length;
  const inactiveClients = clients.filter((c) => c.status === 'inactive').length;

  const statusOptions: FilterOption<StatusFilter>[] = [
    { value: 'all', label: 'All', count: totalClients },
    { value: 'active', label: 'Active', count: activeClients },
    { value: 'pending', label: 'Pending', count: pendingClients },
    { value: 'inactive', label: 'Inactive', count: inactiveClients },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar: search + status filter */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search clients by name, email, or company…"
            leftIcon={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <FilterBar<StatusFilter>
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {loading ? (
        <Card padding="sm">
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-4 px-4 border-b border-border last:border-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton className="h-10 w-10 shrink-0" rounded="xl" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <Skeleton className="h-4 w-24 sm:w-36" />
                    <Skeleton className="h-3 w-32 sm:w-48" />
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right space-y-2 hidden sm:block">
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-6 w-16" rounded="lg" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : filteredClients.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Building size={20} />}
            title="No clients found"
            description="Try adjusting your search or filters, or add a new client account."
            action={
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setModalOpen(true)}
              >
                New Client
              </Button>
            }
          />
        </Card>
      ) : (
        <Card padding="sm">
          <div className="divide-y divide-border animate-fade-in-scale">
            {filteredClients.map((client) => {
              const remaining = getSubscriptionRemainingMonths(client);
              const isExpiring = remaining !== null && remaining < 3;

              // Calculate outstanding invoices
              const clientInvoices = invoices.filter(inv => inv.clientId === client.id);
              const hasOutstanding = clientInvoices.some(isOutstandingInvoice);

              // Calculate if any maintenance task is overdue
              const isMaintenanceOverdue = (() => {
                if (client.status !== 'active') return false; // only alert for active clients
                
                // Env rotation overdue check
                if (client.envRotationLastAt) {
                  const envDue = new Date(client.envRotationLastAt);
                  envDue.setMonth(envDue.getMonth() + (client.envRotationInterval || 6));
                  if (now > envDue) return true;
                } else if (client.createdAt) {
                  const envDue = new Date(client.createdAt);
                  envDue.setMonth(envDue.getMonth() + (client.envRotationInterval || 6));
                  if (now > envDue) return true;
                }

                // Stability check overdue check
                if (client.stabilityCheckLastAt) {
                  const stabDue = new Date(client.stabilityCheckLastAt);
                  stabDue.setMonth(stabDue.getMonth() + (client.stabilityCheckInterval || 1));
                  if (now > stabDue) return true;
                } else if (client.createdAt) {
                  const stabDue = new Date(client.createdAt);
                  stabDue.setMonth(stabDue.getMonth() + (client.stabilityCheckInterval || 1));
                  if (now > stabDue) return true;
                }

                // Expectations check overdue check
                if (client.expectationsCheckLastAt) {
                  const expDue = new Date(client.expectationsCheckLastAt);
                  expDue.setMonth(expDue.getMonth() + (client.expectationsCheckInterval || 3));
                  if (now > expDue) return true;
                } else if (client.createdAt) {
                  const expDue = new Date(client.createdAt);
                  expDue.setMonth(expDue.getMonth() + (client.expectationsCheckInterval || 3));
                  if (now > expDue) return true;
                }

                return false;
              })();

              const statusVariant:
                | 'success'
                | 'warning'
                | 'neutral' =
                client.status === 'active'
                  ? 'success'
                  : client.status === 'pending'
                  ? 'warning'
                  : 'neutral';

              const sourcedLabel = getSourcedByLabel(client.sourcedBy);
              const isOrganic = sourcedLabel === 'Organic';

              const clDomain = client.websiteAddress ? client.websiteAddress.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : null;
              const clFavicon = clDomain ? `https://www.google.com/s2/favicons?domain=${clDomain}&sz=64` : null;

              return (
                <div
                  key={client.id}
                  className={cn(
                    'group flex items-center justify-between gap-4 py-4 px-3 -mx-3 rounded-lg border border-transparent',
                    TABLE_ROW_HOVER,
                  )}
                >
                  {/* Left + Middle Clickable Region */}
                  <div
                    onClick={() => router.push(`/admin/clients/${client.id}`)}
                    className="min-w-0 flex-1 flex items-center justify-between gap-4 cursor-pointer active-press"
                  >
                    {/* Logo avatar */}
                    <div className="w-9 h-9 rounded-full border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden self-start mt-0.5">
                      {clFavicon ? (
                        <>
                          <img
                            src={clFavicon}
                            alt={client.name}
                            className="w-5 h-5 object-contain"
                            onLoad={(e) => {
                              const img = e.target as HTMLImageElement;
                              if (img.naturalWidth <= 16) {
                                img.style.display = 'none';
                                img.nextElementSibling?.removeAttribute('style');
                              }
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
                            }}
                          />
                          <span className="text-xs font-bold text-muted-foreground" style={{ display: 'none' }}>
                            {client.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">
                          {client.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1.5">
                        {/* Line 1: Client Name */}
                        <p className="text-sm font-semibold text-foreground truncate">
                          {client.name}
                        </p>

                        {/* Line 2: Badges Row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* 1. Outstanding Badge */}
                          {hasOutstanding && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/invoices?client=${client.id}`);
                              }}
                              className="relative group/badge cursor-pointer inline-flex items-center gap-0.5 text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider animate-pulse-subtle hover:bg-red-500/25 active:scale-95 transition-all select-none shrink-0"
                            >
                              Outstanding
                              {/* Custom Tooltip on Hover */}
                              <span className="absolute bottom-full left-0 mb-2 p-3 bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 text-zinc-100 text-[10px] font-bold rounded-xl opacity-0 pointer-events-none group-hover/badge:opacity-100 transition-opacity duration-200 shadow-2xl z-50 w-52 leading-relaxed normal-case select-none text-left">
                                <div className="text-[10px] uppercase tracking-wider text-red-400 font-extrabold pb-1 border-b border-zinc-800 mb-1.5 flex justify-between items-center">
                                  <span>⚠️ Unpaid Bills</span>
                                  <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 rounded font-bold">Click to View</span>
                                </div>
                                <div className="space-y-1 font-mono font-medium max-h-[120px] overflow-y-auto">
                                  {clientInvoices.filter(isOutstandingInvoice).map(inv => (
                                    <div key={inv.id} className="flex justify-between items-center gap-2">
                                      <span className="text-zinc-400 truncate">{inv.invoiceNumber}</span>
                                      <span className="text-zinc-100 shrink-0">{formatCurrencyIDR(inv.total - (inv.amountPaid || 0))}</span>
                                    </div>
                                  ))}
                                </div>
                              </span>
                            </span>
                          )}
                          {isMaintenanceOverdue && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/clients/${client.id}?focus=maintenance`);
                              }}
                              className="relative group/maint cursor-pointer inline-flex items-center gap-0.5 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider transition-all select-none shrink-0 hover:bg-amber-500/25 active:scale-95 animate-pulse-subtle"
                            >
                              ⚠️ Maint. Due
                              {/* Custom Tooltip on Hover */}
                              <span className="absolute bottom-full left-0 mb-2 p-3 bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 text-zinc-100 text-[10px] font-bold rounded-xl opacity-0 pointer-events-none group-hover/maint:opacity-100 transition-opacity duration-200 shadow-2xl z-50 w-56 leading-relaxed normal-case select-none text-left">
                                <div className="text-[10px] uppercase tracking-wider text-amber-400 font-extrabold pb-1 border-b border-zinc-800 mb-1.5 flex justify-between items-center">
                                  <span>⚠️ Maintenance Alert</span>
                                  <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 rounded font-bold">Click to Resolve</span>
                                </div>
                                <div className="space-y-1 text-zinc-400 text-[10px] font-medium leading-relaxed">
                                  Environment variables, stability checkups, or client reviews are overdue. Click to open operations panel.
                                </div>
                              </span>
                            </span>
                          )}

                          {/* 2. Status Badge */}
                          <Badge variant={statusVariant} className="capitalize shrink-0 text-[10px] py-0.5 leading-none">
                            {client.status === 'pending'
                              ? `Pending | ${Math.floor((now.getTime() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24))}D`
                              : client.status}
                          </Badge>

                          {/* 3. Tasks Badge */}
                          {(() => {
                            const taskCount = allTasks.filter(
                              t => t.clientId === client.id && t.status !== 'achieved'
                            ).length;
                            if (taskCount === 0) return null;
                            return (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/admin/board?client=${client.id}`);
                                }}
                                className="inline-flex items-center gap-1 text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-bold cursor-pointer hover:bg-primary/20 active:scale-95 transition-all select-none shrink-0"
                                title={`${taskCount} active task${taskCount !== 1 ? 's' : ''}`}
                              >
                                <ClipboardList size={9} />
                                {taskCount}
                              </span>
                            );
                          })()}

                          {/* 4. Partner Badge */}
                          {!isOrganic && (
                            <Badge variant="neutral" className="text-[9px] py-0.5 leading-none shrink-0">via {sourcedLabel}</Badge>
                          )}
                        </div>

                        {/* Line 3: Company Name */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                          <span className="inline-flex items-center gap-1 truncate font-medium">
                            <Building size={11} className="shrink-0 text-muted-foreground/70" />
                            {client.companyName || 'No company'}
                          </span>
                          {client.subscriptionType && (
                            <span className="inline-flex items-center gap-1 capitalize">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/35" />
                              {client.subscriptionType} hosting
                            </span>
                          )}
                        </div>

                        {client.description && (
                          <p className="text-[11px] text-muted-foreground/80 line-clamp-1 mt-0.5 max-w-md">
                            {client.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Middle: quota */}
                    <div className="hidden md:flex flex-col items-end shrink-0 min-w-[140px]">
                      {remaining !== null ? (
                        <>
                          <div className="flex items-center gap-2">
                            {isExpiring && (
                              <AlertTriangle
                                size={12}
                                className={
                                  remaining === 0 ? 'text-red-500' : 'text-amber-500'
                                }
                              />
                            )}
                            <span className="text-sm font-medium text-foreground tabular-nums">
                              {remaining}
                              <span className="text-muted-foreground font-normal">
                                {' '}/ {client.subscriptionMonths} mo
                              </span>
                            </span>
                          </div>
                          <div className="mt-1.5 w-24 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                remaining === 0
                                  ? 'bg-red-500'
                                  : isExpiring
                                  ? 'bg-amber-500'
                                  : 'bg-foreground/30'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  (remaining / (client.subscriptionMonths || 12)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">No plan</span>
                      )}
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="shrink-0">
                    <ActionMenu
                      ariaLabel="Client actions"
                      items={[
                        {
                          key: 'view',
                          label: 'View profile',
                          icon: <ArrowRight size={14} />,
                          href: `/admin/clients/${client.id}`,
                        },
                        {
                          key: 'invoices',
                          label: 'View invoices',
                          icon: <Receipt size={14} />,
                          href: `/admin/invoices?client=${client.id}`,
                        },
                        {
                          key: 'support',
                          label: 'Support tickets',
                          icon: <Ticket size={14} />,
                          href: `/admin/tickets?client=${client.id}`,
                        },
                        {
                          key: 'agreement',
                          label: 'Download T&C / SLA',
                          icon: <FileText size={14} />,
                          onSelect: () => setSelectedAgreementClient(client),
                        },
                      ]}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
