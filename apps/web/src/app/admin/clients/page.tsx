'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  X,
  AlertTriangle,
  ArrowRight,
  Users,
  Receipt,
  Ticket,
  Loader2,
  Pencil,
  Trash2,
  Briefcase,
  FileText,
} from 'lucide-react';
import { ClientAgreementPreview } from './components/ClientAgreementPreview';
import {
  getClients,
  createClient,
  MockClient,
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
  MockPartner,
  getInvoices,
  MockInvoice,
} from '@/lib/db/queries';
import { cn, getSubscriptionRemainingMonths, TABLE_ROW_HOVER } from '@/lib/utils';
import { formatCurrencyIDR } from '@/app/admin/invoices/components/invoice-types';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import EmptyState from '@/components/ui/EmptyState';
import SectionHeading from '@/components/ui/SectionHeading';
import FilterBar, { FilterOption } from '@/components/ui/FilterBar';
import ActionMenu from '@/components/ui/ActionMenu';

type TabValue = 'clients' | 'partners';
type StatusFilter = 'all' | 'active' | 'pending' | 'inactive';

export default function ClientsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Tab State
  const [activeTab, setActiveTab] = useState<TabValue>('clients');

  // Clients Directory State
  const [clients, setClients] = useState<MockClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Partners Directory State
  const [partners, setPartners] = useState<MockPartner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [partnersSearch, setPartnersSearch] = useState('');

  // Invoices State
  const [invoices, setInvoices] = useState<MockInvoice[]>([]);

  // Create/Edit Client Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Client Form Fields
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
  const [sourcedBy, setSourcedBy] = useState('organic');

  // SLA Agreement & Maintenance Reminders configuration states
  const [selectedAgreementClient, setSelectedAgreementClient] = useState<MockClient | null>(null);
  const [envRotationInterval, setEnvRotationInterval] = useState<number>(6);
  const [stabilityCheckInterval, setStabilityCheckInterval] = useState<number>(1);
  const [expectationsCheckInterval, setExpectationsCheckInterval] = useState<number>(3);

  // Create/Edit Partner Modal State
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<MockPartner | null>(null);

  // Partner Form Fields
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerCompanyName, setPartnerCompanyName] = useState('');
  const [partnerReferralRate, setPartnerReferralRate] = useState<number>(10);
  const [partnerBankDetails, setPartnerBankDetails] = useState('');

  useEffect(() => {
    // Check if redirect query string contains new=true to auto-open modal
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === 'true') {
        setModalOpen(true);
      }
    }

    async function loadAllData() {
      try {
        const [c, p, inv] = await Promise.all([getClients(), getPartners(), getInvoices()]);
        setClients(c);
        setPartners(p as MockPartner[]);
        setInvoices(inv as MockInvoice[]);
      } catch (err) {
        console.error('Failed to load directory data', err);
      } finally {
        setLoading(false);
        setPartnersLoading(false);
      }
    }
    loadAllData();
  }, []);

  // Prevent background scrolling when Add Client or Partner modal is open
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (modalOpen || partnerModalOpen) {
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
  }, [modalOpen, partnerModalOpen]);

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
          portalPassword: portalPassword || null,
          sourcedBy: sourcedBy || 'organic',
          tcStatus: 'pending',
          envRotationInterval: Number(envRotationInterval),
          stabilityCheckInterval: Number(stabilityCheckInterval),
          expectationsCheckInterval: Number(expectationsCheckInterval),
          envRotationLastAt: new Date(),
          stabilityCheckLastAt: new Date(),
          expectationsCheckLastAt: new Date(),
        });

        if (newClient) {
          setClients((prev) => [newClient as MockClient, ...prev]);
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
          setSourcedBy('organic');
          setEnvRotationInterval(6);
          setStabilityCheckInterval(1);
          setExpectationsCheckInterval(3);
          setModalOpen(false);

          // Clear query string
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/admin/clients');
          }
        }
      } catch (err) {
        console.error('Failed to create client', err);
      }
    });
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName || !partnerEmail) return;

    startTransition(async () => {
      try {
        if (editingPartner) {
          const updated = await updatePartner(editingPartner.id, {
            name: partnerName,
            email: partnerEmail,
            phone: partnerPhone || null,
            companyName: partnerCompanyName || null,
            referralRate: Number(partnerReferralRate),
            bankDetails: partnerBankDetails || null,
          });
          if (updated) {
            setPartners((prev) =>
              prev.map((p) => (p.id === updated.id ? (updated as MockPartner) : p))
            );
          }
        } else {
          const created = await createPartner({
            name: partnerName,
            email: partnerEmail,
            phone: partnerPhone || null,
            companyName: partnerCompanyName || null,
            referralRate: Number(partnerReferralRate),
            bankDetails: partnerBankDetails || null,
          });
          if (created) {
            setPartners((prev) => [created as MockPartner, ...prev]);
          }
        }

        // Reset fields & close
        setPartnerName('');
        setPartnerEmail('');
        setPartnerPhone('');
        setPartnerCompanyName('');
        setPartnerReferralRate(10);
        setPartnerBankDetails('');
        setEditingPartner(null);
        setPartnerModalOpen(false);
      } catch (err) {
        console.error('Failed to save partner', err);
      }
    });
  };

  const handleEditPartnerClick = (partner: MockPartner) => {
    setEditingPartner(partner);
    setPartnerName(partner.name);
    setPartnerEmail(partner.email);
    setPartnerPhone(partner.phone || '');
    setPartnerCompanyName(partner.companyName || '');
    setPartnerReferralRate(partner.referralRate);
    setPartnerBankDetails(partner.bankDetails || '');
    setPartnerModalOpen(true);
  };

  const handleDeletePartnerClick = async (partnerId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this partner? Any clients referred by them will be marked as organic.'
      )
    )
      return;

    startTransition(async () => {
      try {
        await deletePartner(partnerId);
        setPartners((prev) => prev.filter((p) => p.id !== partnerId));
        // Refresh clients to reflect organic status if any were modified
        const c = await getClients();
        setClients(c);
      } catch (err) {
        console.error('Failed to delete partner', err);
      }
    });
  };

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

  const filteredPartners = partners.filter((p) => {
    return (
      p.name.toLowerCase().includes(partnersSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(partnersSearch.toLowerCase()) ||
      (p.companyName && p.companyName.toLowerCase().includes(partnersSearch.toLowerCase()))
    );
  });

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  // Quick metrics for the clients tab
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'active').length;
  const pendingClients = clients.filter((c) => c.status === 'pending').length;
  const inactiveClients = clients.filter((c) => c.status === 'inactive').length;

  // Status filter options (with counts)
  const statusOptions: FilterOption<StatusFilter>[] = [
    { value: 'all', label: 'All', count: totalClients },
    { value: 'active', label: 'Active', count: activeClients },
    { value: 'pending', label: 'Pending', count: pendingClients },
    { value: 'inactive', label: 'Inactive', count: inactiveClients },
  ];

  // Tab options
  const tabOptions: FilterOption<TabValue>[] = [
    { value: 'clients', label: 'Clients', count: clients.length },
    { value: 'partners', label: 'Affiliate Partners', count: partners.length },
  ];

  const isClients = activeTab === 'clients';

  return (
    <>
      <div className={cn("space-y-8 animate-fade-up", selectedAgreementClient && "print:hidden")}>
        {/* Tab switcher — calm FilterBar, not aggressive coloured tab strip */}
      <FilterBar<TabValue>
        options={tabOptions}
        value={activeTab}
        onChange={setActiveTab}
        size="md"
      />

      {/* Page header */}
      <PageHeader
        title={isClients ? 'Client Directory' : 'Affiliate Partners'}
        description={
          isClients
            ? 'Manage client accounts, subscription billing, and hosting quotas.'
            : 'Manage external entities that refer clients and build the pipeline.'
        }
        actions={
          isClients ? (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={() => setModalOpen(true)}
            >
              New Client
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={() => {
                setEditingPartner(null);
                setPartnerName('');
                setPartnerEmail('');
                setPartnerPhone('');
                setPartnerCompanyName('');
                setPartnerReferralRate(10);
                setPartnerBankDetails('');
                setPartnerModalOpen(true);
              }}
            >
              New Partner
            </Button>
          )
        }
      />

      {/* --- CLIENTS TAB --- */}
      {isClients && (
        <>
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
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
              <Loader2 className="animate-spin text-muted-foreground" size={20} />
              <p className="text-sm text-muted-foreground">Loading clients…</p>
            </div>
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
              <div className="divide-y divide-border">
                {filteredClients.map((client) => {
                  const remaining = getSubscriptionRemainingMonths(client);
                  const isExpiring = remaining !== null && remaining < 3;

                  // Calculate outstanding invoices
                  const clientInvoices = invoices.filter(inv => inv.clientId === client.id);
                  const hasOutstanding = clientInvoices.some(inv => 
                    inv.status === 'issued' || inv.status === 'past_due' || inv.status === 'partially_paid'
                  );

                  // Calculate if any maintenance task is overdue
                  const isMaintenanceOverdue = (() => {
                    if (client.status !== 'active') return false; // only alert for active clients
                    
                    const now = new Date();
                    
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
                        {/* Left: name + meta */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground truncate">
                              {client.name}
                            </p>
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
                                    <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 rounded">Click to View</span>
                                  </div>
                                  <div className="space-y-1 font-mono font-medium max-h-[120px] overflow-y-auto">
                                    {clientInvoices.filter(inv => inv.status === 'issued' || inv.status === 'past_due' || inv.status === 'partially_paid').map(inv => (
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
                                    <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 rounded">Click to Resolve</span>
                                  </div>
                                  <div className="space-y-1 text-zinc-400 text-[10px] font-medium leading-relaxed">
                                    Environment variables, stability checkups, or client reviews are overdue. Click to open operations panel.
                                  </div>
                                </span>
                              </span>
                            )}
                            <Badge variant={statusVariant} className="capitalize">
                              {client.status}
                            </Badge>
                            {!isOrganic && (
                              <Badge variant="neutral">via {sourcedLabel}</Badge>
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 truncate">
                              <Building size={11} className="shrink-0" />
                              {client.companyName || 'No company'}
                            </span>
                            {client.subscriptionType && (
                              <span className="inline-flex items-center gap-1 capitalize">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                {client.subscriptionType} hosting
                              </span>
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

                      {/* Right: actions — single 3-dot menu with labeled items */}
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
        </>
      )}

      {/* --- AFFILIATE PARTNERS TAB --- */}
      {!isClients && (
        <>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search partners by name, email, or company…"
                leftIcon={<Search size={16} />}
                value={partnersSearch}
                onChange={(e) => setPartnersSearch(e.target.value)}
              />
            </div>
          </div>

          {partnersLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
              <Loader2 className="animate-spin text-muted-foreground" size={20} />
              <p className="text-sm text-muted-foreground">Loading partners…</p>
            </div>
          ) : filteredPartners.length === 0 ? (
            <Card padding="lg">
              <EmptyState
                icon={<Users size={20} />}
                title="No affiliate partners found"
                description="Try adjusting your search, or register a new external referrer."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus size={14} />}
                    onClick={() => {
                      setEditingPartner(null);
                      setPartnerName('');
                      setPartnerEmail('');
                      setPartnerPhone('');
                      setPartnerCompanyName('');
                      setPartnerReferralRate(10);
                      setPartnerBankDetails('');
                      setPartnerModalOpen(true);
                    }}
                  >
                    New Partner
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card padding="sm">
              <div className="divide-y divide-border">
                {filteredPartners.map((partner) => {
                  const referralsCount = clients.filter(
                    (c) => c.sourcedBy === partner.id
                  ).length;

                  return (
                    <div
                      key={partner.id}
                      className={cn(
                        'group flex items-start justify-between gap-4 py-4 px-3 -mx-3 rounded-lg border border-transparent',
                        TABLE_ROW_HOVER,
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground truncate">
                            {partner.name}
                          </p>
                          <Badge variant="neutral">
                            {partner.referralRate}% commission
                          </Badge>
                          <Badge
                            variant={referralsCount > 0 ? 'success' : 'neutral'}
                            dot={referralsCount > 0}
                          >
                            {referralsCount} {referralsCount === 1 ? 'referral' : 'referrals'}
                          </Badge>
                        </div>
                        <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 truncate">
                            <Briefcase size={11} className="shrink-0" />
                            {partner.companyName || 'Freelance / Individual'}
                          </span>
                          <span className="inline-flex items-center gap-1 truncate">
                            <Mail size={11} className="shrink-0" />
                            {partner.email}
                          </span>
                          {partner.phone && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <Phone size={11} className="shrink-0" />
                              {partner.phone}
                            </span>
                          )}
                        </div>
                        {partner.bankDetails && (
                          <p
                            className="mt-1.5 text-xs text-muted-foreground truncate max-w-md"
                            title={partner.bankDetails}
                          >
                            Payout: {partner.bankDetails}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!p-0 !h-8 !w-8"
                          aria-label="Edit partner"
                          onClick={() => handleEditPartnerClick(partner)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!p-0 !h-8 !w-8 hover:!text-red-500"
                          aria-label="Delete partner"
                          onClick={() => handleDeletePartnerClick(partner.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* --- CREATE CLIENT MODAL --- */}
      {mounted && modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-background/85 backdrop-blur-md"
              onClick={() => setModalOpen(false)}
            />

            <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
              <div className="p-6 sm:p-8">
                <SectionHeading
                  title="New client"
                  description="Create a new client account and optional subscription."
                  action={
                    <button
                      onClick={() => setModalOpen(false)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  }
                />

                <form onSubmit={handleCreateClient} className="space-y-8">
                  {/* ── 1. Contact details ── */}
                  <section className="space-y-4">
                    <SectionHeading
                      eyebrow="01 · Contact"
                      title="Contact details"
                      className="!mb-0"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Full name *"
                        required
                        placeholder="e.g. Fredrick Yang"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <Input
                        label="Email *"
                        type="email"
                        required
                        placeholder="e.g. fredrick@anakweb.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <Input
                        label="Phone number"
                        placeholder="e.g. +628123456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        containerClassName="sm:col-span-2"
                      />
                    </div>
                  </section>

                  <hr className="border-border" />

                  {/* ── 2. Business ── */}
                  <section className="space-y-4">
                    <SectionHeading
                      eyebrow="02 · Business"
                      title="Business"
                      className="!mb-0"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Company name"
                        placeholder="e.g. Anak Web"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                      <Input
                        label="Website address"
                        type="url"
                        placeholder="https://anakweb.com"
                        value={websiteAddress}
                        onChange={(e) => setWebsiteAddress(e.target.value)}
                      />
                      <Select
                        label="Sourced by"
                        value={sourcedBy}
                        onChange={(e) => setSourcedBy(e.target.value)}
                        containerClassName="sm:col-span-2"
                      >
                        <option value="organic">Organic / Direct</option>
                        {partners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.referralRate}% commission)
                          </option>
                        ))}
                        <option value="affiliate">External affiliate (10%)</option>
                      </Select>
                    </div>
                  </section>

                  <hr className="border-border" />

                  {/* ── 3. Subscription & access ── */}
                  <section className="space-y-4">
                    <SectionHeading
                      eyebrow="03 · Subscription"
                      title="Subscription & access"
                      className="!mb-0"
                    />

                    {/* Initial status — segmented control */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Initial status
                      </label>
                      <div className="flex gap-2">
                        {(['pending', 'active', 'inactive'] as const).map((stat) => (
                          <button
                            key={stat}
                            type="button"
                            onClick={() => setStatus(stat)}
                            className={cn(
                              'flex-1 px-3 py-2 rounded-lg border text-xs font-medium capitalize transition-colors cursor-pointer',
                              status === stat
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {stat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subscription type — segmented control */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Hosting plan
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {(
                          [
                            { key: '', label: 'No plan' },
                            { key: 'static', label: 'Static · 200k/mo' },
                            { key: 'dynamic', label: 'Dynamic · 350k/mo' },
                          ] as const
                        ).map((type) => (
                          <button
                            key={type.key}
                            type="button"
                            onClick={() =>
                              setSubscriptionType(type.key as 'static' | 'dynamic' | '')
                            }
                            className={cn(
                              'flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer',
                              subscriptionType === type.key
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {subscriptionType !== '' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-scale">
                        <Input
                          label="Quota (months)"
                          type="number"
                          min="1"
                          max="120"
                          required
                          value={subscriptionMonths}
                          onChange={(e) => setSubscriptionMonths(Number(e.target.value))}
                        />
                        <Input
                          label="Start date"
                          type="date"
                          required
                          value={subscriptionStartDate}
                          onChange={(e) => setSubscriptionStartDate(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                        Operations & Maintenance (Interval in Months)
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          label="Env Rotation"
                          type="number"
                          min="1"
                          required
                          value={envRotationInterval}
                          onChange={(e) => setEnvRotationInterval(Number(e.target.value))}
                        />
                        <Input
                          label="Stability Check"
                          type="number"
                          min="1"
                          required
                          value={stabilityCheckInterval}
                          onChange={(e) => setStabilityCheckInterval(Number(e.target.value))}
                        />
                        <Input
                          label="Client Review"
                          type="number"
                          min="1"
                          required
                          value={expectationsCheckInterval}
                          onChange={(e) => setExpectationsCheckInterval(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <Input
                      label="Portal password (optional)"
                      placeholder="Leave blank to auto-generate"
                      value={portalPassword}
                      onChange={(e) => setPortalPassword(e.target.value)}
                    />
                  </section>

                  <div className="flex gap-2 justify-end pt-5 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isPending}
                    >
                      {isPending ? 'Saving…' : 'Create client'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* --- CREATE / EDIT PARTNER MODAL --- */}
      {mounted && partnerModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-background/85 backdrop-blur-md"
              onClick={() => setPartnerModalOpen(false)}
            />

            <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
              <div className="p-6 sm:p-8">
                <SectionHeading
                  title={editingPartner ? 'Edit affiliate partner' : 'New affiliate partner'}
                  description="External referrer details and commission rate."
                  action={
                    <button
                      onClick={() => setPartnerModalOpen(false)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  }
                />

                <form onSubmit={handleCreatePartner} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Name *"
                      required
                      placeholder="e.g. Alex Kim"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                    />
                    <Input
                      label="Email *"
                      type="email"
                      required
                      placeholder="e.g. alex@marketingventures.com"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Company name"
                      placeholder="e.g. Marketing Ventures Ltd"
                      value={partnerCompanyName}
                      onChange={(e) => setPartnerCompanyName(e.target.value)}
                    />
                    <Input
                      label="Phone number"
                      placeholder="e.g. +6281999888777"
                      value={partnerPhone}
                      onChange={(e) => setPartnerPhone(e.target.value)}
                    />
                  </div>

                  <Input
                    label="Referral commission rate (%)"
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={partnerReferralRate}
                    onChange={(e) => setPartnerReferralRate(Number(e.target.value))}
                  />

                  <Textarea
                    label="Payment / bank details"
                    placeholder="e.g. BCA Account 1234567890 (a.n. Alex Kim)"
                    value={partnerBankDetails}
                    onChange={(e) => setPartnerBankDetails(e.target.value)}
                    rows={3}
                  />

                  <div className="flex gap-2 justify-end pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setPartnerModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isPending}
                    >
                      {isPending ? 'Saving…' : editingPartner ? 'Save changes' : 'Create partner'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      </div>

      {/* SLA / T&C Print Modal */}
      {selectedAgreementClient && (
        <ClientAgreementPreview
          client={selectedAgreementClient}
          onClose={() => setSelectedAgreementClient(null)}
        />
      )}
    </>
  );
}
