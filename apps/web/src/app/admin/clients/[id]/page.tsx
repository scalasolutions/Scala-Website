'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Edit,
  Layers,
  Calendar,
  Receipt,
  Ticket,
  AlertTriangle,
  CheckCircle,
  X,
  Clock,
  User,
  Loader2,
} from 'lucide-react';
import {
  getClientById,
  getInvoices,
  getTickets,
  updateClient,
  deleteClient,
  MockClient,
  MockInvoice,
  MockTicket,
  getPartners,
  MockPartner,
} from '@/lib/db/queries';
import { getSubscriptionRemainingMonths } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import SectionHeading from '@/components/ui/SectionHeading';
import EmptyState from '@/components/ui/EmptyState';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [client, setClient] = useState<MockClient | null>(null);
  const [invoices, setInvoices] = useState<MockInvoice[]>([]);
  const [tickets, setTickets] = useState<MockTicket[]>([]);
  const [partners, setPartners] = useState<MockPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [websiteAddress, setWebsiteAddress] = useState('');
  const [status, setStatus] = useState<'pending' | 'active' | 'inactive'>('pending');
  const [subscriptionType, setSubscriptionType] = useState<'static' | 'dynamic' | ''>('');
  const [subscriptionMonths, setSubscriptionMonths] = useState<number>(12);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string>('');
  const [portalPassword, setPortalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sourcedBy, setSourcedBy] = useState('organic');

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleteConfirmNameInput, setDeleteConfirmNameInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadClientData() {
      if (!id) return;
      try {
        const c = await getClientById(id);
        if (!c) {
          setLoading(false);
          return;
        }
        setClient(c);

        // Load Invoices, Tickets, Partners to filter for this client
        const [allInvoices, allTickets, allPartners] = await Promise.all([
          getInvoices(),
          getTickets(),
          getPartners(),
        ]);

        setInvoices(allInvoices.filter((inv) => inv.clientId === id) as MockInvoice[]);
        setTickets(allTickets.filter((t) => t.clientId === id));
        setPartners(allPartners as MockPartner[]);

        // Initialize form fields
        setName(c.name);
        setEmail(c.email);
        setPhone(c.phone || '');
        setCompanyName(c.companyName || '');
        setWebsiteAddress(c.websiteAddress || '');
        setStatus(c.status);
        setSubscriptionType(c.subscriptionType || '');
        setSubscriptionMonths(c.subscriptionMonths || 12);
        setSubscriptionStartDate(
          c.subscriptionStartDate
            ? new Date(c.subscriptionStartDate).toISOString().substring(0, 10)
            : new Date().toISOString().substring(0, 10)
        );
        setPortalPassword(c.portalPassword || '');
        const loadedSourcedBy = c.sourcedBy || 'organic';
        setSourcedBy(
          loadedSourcedBy === 'fredrick' || loadedSourcedBy === 'nicholas'
            ? 'organic'
            : loadedSourcedBy
        );
      } catch (err) {
        console.error('Failed to load client profile details', err);
      } finally {
        setLoading(false);
      }
    }
    loadClientData();
  }, [id]);

  // Prevent background scrolling when Edit or Delete modal is open
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (editModalOpen || deleteModalOpen) {
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
  }, [editModalOpen, deleteModalOpen]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
        <p className="text-sm text-muted-foreground">Loading client…</p>
      </div>
    );
  }

  if (!client) {
    return (
      <Card padding="lg" className="max-w-xl mx-auto mt-12">
        <EmptyState
          icon={<AlertTriangle size={20} />}
          title="Client not found"
          description="The requested client record does not exist or may have been deleted."
          action={
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft size={14} />}
              onClick={() => router.push('/admin/clients')}
            >
              Back to directory
            </Button>
          }
        />
      </Card>
    );
  }

  // Calculate subscription math
  const remaining = getSubscriptionRemainingMonths(client);
  const isExpiring = remaining !== null && remaining < 3;

  // Calculate Expiry Date
  let expiryDateString = 'N/A';
  if (client.subscriptionStartDate && client.subscriptionMonths) {
    const start = new Date(client.subscriptionStartDate);
    const expiry = new Date(start);
    expiry.setMonth(start.getMonth() + client.subscriptionMonths);
    expiryDateString = expiry.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const formatCurrencyIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const updated = await updateClient(client.id, {
          name,
          email,
          phone: phone || null,
          companyName: companyName || null,
          websiteAddress: websiteAddress || null,
          status,
          subscriptionType: subscriptionType || null,
          subscriptionMonths: subscriptionType ? Number(subscriptionMonths) : null,
          subscriptionStartDate: subscriptionType ? new Date(subscriptionStartDate) : null,
          portalPassword: portalPassword || null,
          sourcedBy: sourcedBy || 'organic',
        });

        if (updated) {
          setClient(updated as MockClient);
          setEditModalOpen(false);
        }
      } catch (err) {
        console.error('Failed to update client', err);
      }
    });
  };

  const handleDeleteClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmInput !== 'CONFIRM' || deleteConfirmNameInput !== client.name) return;

    setIsDeleting(true);
    try {
      await deleteClient(client.id);
      setDeleteModalOpen(false);
      router.push('/admin/clients');
    } catch (err) {
      console.error('Failed to delete client account', err);
      setIsDeleting(false);
    }
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

  const hasUrl = client.websiteAddress && client.websiteAddress !== '';
  const domain = hasUrl
    ? client.websiteAddress!.replace(/https?:\/\/(www\.)?/, '').split('/')[0]
    : '';
  const faviconUrl = hasUrl
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    : null;

  const sourcedLabel = getSourcedByLabel(client.sourcedBy);
  const isOrganic = sourcedLabel === 'Organic';

  const statusVariant: 'success' | 'warning' | 'neutral' =
    client.status === 'active'
      ? 'success'
      : client.status === 'pending'
      ? 'warning'
      : 'neutral';

  // Helper: map invoice status to Badge variant
  const invoiceStatusVariant = (
    s: string
  ): 'success' | 'warning' | 'danger' | 'neutral' => {
    if (s === 'paid') return 'success';
    if (s === 'past_due') return 'danger';
    if (s === 'issued') return 'warning';
    return 'neutral';
  };

  const ticketPriorityVariant = (
    p: string
  ): 'success' | 'warning' | 'danger' | 'neutral' => {
    if (p === 'urgent') return 'danger';
    if (p === 'high') return 'warning';
    return 'neutral';
  };

  return (
    <div className="space-y-8 animate-fade-up pb-20">
      {/* Back link (sits above PageHeader for clear breadcrumb intent) */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
      >
        <ArrowLeft size={14} />
        Back to directory
      </Link>

      {/* Page header */}
      <PageHeader
        eyebrow="Client profile"
        title={client.name}
        description={client.companyName || 'Freelance / individual'}
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Edit size={14} />}
            onClick={() => setEditModalOpen(true)}
          >
            Edit profile
          </Button>
        }
      />

      {/* Identity card — favicon, name, status pills */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt={client.name}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                className="w-14 h-14 rounded-xl border border-border object-contain bg-white p-2"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-muted/40 border border-border flex items-center justify-center text-foreground font-semibold text-lg shrink-0">
                {client.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
                <Building size={12} className="shrink-0" />
                <span className="truncate">
                  {client.companyName || 'Freelance / individual'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isOrganic ? (
              <Badge variant="brand">
                via {sourcedLabel}
              </Badge>
            ) : (
              <Badge variant="neutral">Organic</Badge>
            )}
            <Badge variant={statusVariant} className="capitalize">
              {client.status}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Grid Layout for details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Contact info & Portal access */}
        <div className="space-y-6">
          <Card padding="md">
            <SectionHeading title="Contact" />

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail
                  className="text-muted-foreground shrink-0 mt-0.5"
                  size={16}
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${client.email}`}
                    className="text-foreground hover:text-foreground/70 transition-colors break-all"
                  >
                    {client.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone
                  className="text-muted-foreground shrink-0 mt-0.5"
                  size={16}
                />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <span className="text-foreground">
                    {client.phone || (
                      <span className="text-muted-foreground italic">Not provided</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe
                  className="text-muted-foreground shrink-0 mt-0.5"
                  size={16}
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Website</p>
                  {client.websiteAddress ? (
                    <a
                      href={client.websiteAddress}
                      target="_blank"
                      rel="noreferrer"
                      className="text-foreground hover:text-foreground/70 transition-colors inline-flex items-center gap-1 min-w-0 break-all"
                    >
                      <span className="truncate">{client.websiteAddress}</span>
                      <ExternalLink size={12} className="shrink-0" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">No domain</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Client Portal Access Card */}
          <Card padding="md" className="relative overflow-hidden">
            <SectionHeading
              title="Portal access"
              icon={<User size={16} />}
            />

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Portal link</p>
                <Link
                  href="/portal"
                  target="_blank"
                  className="text-foreground hover:text-foreground/70 transition-colors inline-flex items-center gap-1"
                >
                  <span>Open client portal</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Username</p>
                <p className="text-foreground select-all">{client.email}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Password</p>
                <div className="flex items-center gap-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    readOnly
                    value={client.portalPassword || 'No password assigned'}
                    className="bg-background border border-border px-3 py-1.5 rounded-lg text-xs font-mono flex-1 focus:outline-none select-all text-foreground"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Coming-soon overlay (subtler, less aggressive) */}
            <div className="absolute inset-0 bg-card/85 backdrop-blur-[2px] flex items-center justify-center z-10 select-none">
              <Badge variant="warning" className="!px-3 !py-1 text-[11px]">
                Client portal coming soon
              </Badge>
            </div>
          </Card>
        </div>

        {/* Right Columns: Subscription Details & Linked records */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription */}
          <Card padding="md">
            <SectionHeading
              title="Hosting subscription"
              icon={<Layers size={16} />}
              action={
                client.subscriptionType ? (
                  <Badge variant="neutral" className="capitalize">
                    {client.subscriptionType}
                  </Badge>
                ) : undefined
              }
            />

            {client.subscriptionType ? (
              <div className="space-y-6">
                {/* Expiring warning */}
                {isExpiring && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <AlertTriangle
                      className="text-amber-500 shrink-0 mt-0.5"
                      size={15}
                    />
                    <div className="text-xs leading-relaxed">
                      <span className="font-medium text-foreground">Renewal alert</span>
                      <p className="text-muted-foreground mt-0.5">
                        Expires in{' '}
                        <span className="text-foreground font-medium">
                          {remaining} {remaining === 1 ? 'month' : 'months'}
                        </span>
                        . Plan renewal is recommended.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">Monthly rate</p>
                    <p className="text-lg font-semibold text-foreground mt-1 tabular-nums">
                      {client.subscriptionType === 'static'
                        ? formatCurrencyIDR(150000)
                        : formatCurrencyIDR(350000)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                      {client.subscriptionType} hosting
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">Quota remaining</p>
                    <p className="text-lg font-semibold text-foreground mt-1 tabular-nums">
                      {remaining}
                      <span className="text-muted-foreground font-normal text-sm">
                        {' '}/ {client.subscriptionMonths} mo
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Based on contracted SLA
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">Expiry</p>
                    <p className="text-sm font-medium text-foreground mt-1 inline-flex items-center gap-1.5">
                      <Calendar size={13} className="text-muted-foreground" />
                      <span>{expiryDateString}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Calculated from start date
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Quota elapsed</span>
                    <span className="text-foreground tabular-nums">
                      {client.subscriptionMonths
                        ? Math.round((remaining! / client.subscriptionMonths) * 100)
                        : 0}
                      % remaining
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        remaining === 0
                          ? 'bg-red-500'
                          : isExpiring
                          ? 'bg-amber-500'
                          : 'bg-primary'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (remaining! / (client.subscriptionMonths || 12)) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>
                      Start:{' '}
                      {client.subscriptionStartDate
                        ? new Date(client.subscriptionStartDate).toLocaleDateString(
                            'id-ID'
                          )
                        : 'N/A'}
                    </span>
                    <span>End: {expiryDateString}</span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<Layers size={20} />}
                title="No active subscription"
                description="This client has no hosting plan. Edit profile to assign a static or dynamic plan."
              />
            )}
          </Card>

          {/* Connected Invoices & Tickets */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Connected Invoices */}
            <Card padding="md">
              <SectionHeading
                title={`Invoices (${invoices.length})`}
                icon={<Receipt size={16} />}
                action={
                  <Link
                    href={`/admin/invoices?client=${client.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    View all
                    <ExternalLink size={11} />
                  </Link>
                }
              />

              <div className="space-y-2 max-h-[260px] overflow-y-auto -mr-1 pr-1">
                {invoices.length > 0 ? (
                  invoices.slice(0, 4).map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/admin/invoices?id=${inv.id}`}
                      className="block"
                    >
                      <div className="p-3 rounded-xl border border-border bg-muted/10 hover:border-foreground/15 transition-colors flex justify-between items-center text-xs">
                        <div className="min-w-0">
                          <p className="font-mono text-foreground truncate">
                            {inv.invoiceNumber}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Due {new Date(inv.dueDate).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-medium text-foreground tabular-nums">
                            {formatCurrencyIDR(inv.total)}
                          </p>
                          <Badge
                            variant={invoiceStatusVariant(inv.status)}
                            className="mt-1 capitalize"
                          >
                            {inv.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground italic">
                    No invoice history
                  </div>
                )}
              </div>
            </Card>

            {/* Connected Support Tickets */}
            <Card padding="md">
              <SectionHeading
                title={`Tickets (${tickets.length})`}
                icon={<Ticket size={16} />}
                action={
                  <Link
                    href={`/admin/tickets?client=${client.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    View all
                    <ExternalLink size={11} />
                  </Link>
                }
              />

              <div className="space-y-2 max-h-[260px] overflow-y-auto -mr-1 pr-1">
                {tickets.length > 0 ? (
                  tickets.slice(0, 4).map((t) => (
                    <Link key={t.id} href={`/admin/tickets?id=${t.id}`} className="block">
                      <div className="p-3 rounded-xl border border-border bg-muted/10 hover:border-foreground/15 transition-colors text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-medium truncate text-foreground flex-1">
                            {t.title}
                          </p>
                          <Badge
                            variant={ticketPriorityVariant(t.priority)}
                            className="shrink-0 capitalize"
                          >
                            {t.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-2">
                          <Clock size={11} />
                          <span>{new Date(t.createdAt).toLocaleDateString('id-ID')}</span>
                          <span>·</span>
                          <span className="capitalize">{t.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground italic flex flex-col items-center gap-1.5">
                    <CheckCircle size={16} className="text-muted-foreground/60" />
                    <span>No open issues</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <Card padding="md" className="border-red-500/15 bg-red-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium text-foreground inline-flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-red-500" />
              Danger zone
            </h4>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
              Permanently delete this client account, portal access, and revoke all
              active SLAs. This action is irreversible.
            </p>
          </div>
          <Button
            variant="danger"
            size="md"
            onClick={() => {
              setDeleteConfirmInput('');
              setDeleteConfirmNameInput('');
              setDeleteModalOpen(true);
            }}
          >
            Delete account
          </Button>
        </div>
      </Card>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {mounted &&
        deleteModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-background/85 backdrop-blur-md"
              onClick={() => setDeleteModalOpen(false)}
            />

            <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
              <div className="p-6">
                <div className="flex items-start gap-3 pb-4 mb-4 border-b border-border">
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      Delete client account
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  Are you sure you want to delete{' '}
                  <span className="font-medium text-foreground">{client.name}</span>?
                  Portal credentials, active SLAs, all invoices, billing history, and
                  support tickets will be permanently removed.
                </p>

                <form onSubmit={handleDeleteClient} className="space-y-4">
                  <Input
                    label={`Type the client's name (${client.name}) to confirm`}
                    required
                    placeholder={client.name}
                    value={deleteConfirmNameInput}
                    onChange={(e) => setDeleteConfirmNameInput(e.target.value)}
                  />

                  <Input
                    label="Type CONFIRM to authorize deletion"
                    required
                    placeholder="CONFIRM"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    className="font-mono uppercase tracking-wider text-center"
                  />

                  <div className="flex gap-2 justify-end pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setDeleteModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="danger"
                      size="md"
                      disabled={
                        deleteConfirmInput !== 'CONFIRM' ||
                        deleteConfirmNameInput !== client.name ||
                        isDeleting
                      }
                    >
                      {isDeleting ? 'Deleting…' : 'Delete permanently'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* --- EDIT CLIENT MODAL --- */}
      {mounted &&
        editModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-background/85 backdrop-blur-md"
              onClick={() => setEditModalOpen(false)}
            />

            <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
              <div className="p-6 sm:p-8">
                <SectionHeading
                  title="Edit profile"
                  description="Update client account details and subscription."
                  action={
                    <button
                      onClick={() => setEditModalOpen(false)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  }
                />

                <form onSubmit={handleUpdateClient} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Company name"
                      placeholder="e.g. Anak Web"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                    <Input
                      label="Phone number"
                      placeholder="e.g. +628123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <Input
                    label="Website address"
                    type="url"
                    placeholder="https://anakweb.com"
                    value={websiteAddress}
                    onChange={(e) => setWebsiteAddress(e.target.value)}
                  />

                  <Input
                    label="Portal password"
                    placeholder="Custom portal password"
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    className="font-mono"
                  />

                  {/* Subscription block */}
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
                    <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Hosting subscription
                    </p>

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Plan type</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {(
                          [
                            { key: '', label: 'No plan' },
                            { key: 'static', label: 'Static · 150k/mo' },
                            { key: 'dynamic', label: 'Dynamic · 350k/mo' },
                          ] as const
                        ).map((type) => (
                          <button
                            key={type.key}
                            type="button"
                            onClick={() =>
                              setSubscriptionType(type.key as 'static' | 'dynamic' | '')
                            }
                            className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                              subscriptionType === type.key
                                ? 'border-foreground/20 bg-muted text-foreground'
                                : 'border-border bg-card text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {subscriptionType !== '' && (
                      <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-scale">
                        <Input
                          label="Quota (months)"
                          type="number"
                          min="1"
                          max="120"
                          required
                          value={subscriptionMonths}
                          onChange={(e) =>
                            setSubscriptionMonths(Number(e.target.value))
                          }
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
                  </div>

                  <Select
                    label="Sourced by"
                    value={sourcedBy}
                    onChange={(e) => setSourcedBy(e.target.value)}
                  >
                    <option value="organic">Organic / Direct</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.referralRate}% commission)
                      </option>
                    ))}
                    <option value="affiliate">External affiliate (10%)</option>
                  </Select>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Account status
                    </label>
                    <div className="flex gap-2">
                      {(['pending', 'active', 'inactive'] as const).map((stat) => (
                        <button
                          key={stat}
                          type="button"
                          onClick={() => setStatus(stat)}
                          className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium capitalize transition-colors cursor-pointer ${
                            status === stat
                              ? 'border-foreground/20 bg-muted text-foreground'
                              : 'border-border bg-card text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {stat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setEditModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isPending}
                    >
                      {isPending ? 'Saving…' : 'Save changes'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
