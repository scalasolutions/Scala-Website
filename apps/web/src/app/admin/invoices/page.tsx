'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Plus,
  Search,
  Receipt,
  X,
  PlusCircle,
  Trash2,
  Eye,
  Check,
  AlertTriangle,
  Sliders,
  Loader2,
} from 'lucide-react';
import {
  getInvoices,
  getClients,
  createInvoice,
  updateInvoiceStatus,
  updateInvoice,
  deleteInvoice,
  MockInvoice,
  MockClient,
  getInvoiceLinePresets,
  MockInvoiceLinePreset,
  getInvoicePagePresets,
  MockInvoicePagePreset,
} from '@/lib/db/queries';
import { InvoiceLineItem, formatCurrencyIDR } from './components/invoice-types';
import { InvoicePreview } from './components/InvoicePreview';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Combobox from '@/components/ui/Combobox';
import EmptyState from '@/components/ui/EmptyState';
import SectionHeading from '@/components/ui/SectionHeading';
import FilterBar, { FilterOption } from '@/components/ui/FilterBar';
import ActionMenu, { ActionMenuItem } from '@/components/ui/ActionMenu';
import { cn, TABLE_ROW_HOVER } from '@/lib/utils';

type InvoiceStatusFilter = 'all' | 'draft' | 'issued' | 'past_due' | 'paid';
type EffectiveStatus = MockInvoice['status'];

// Map an effective invoice status -> Badge variant. Calm, semantic, no custom hex.
const statusToBadgeVariant = (
  s: EffectiveStatus
): 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (s) {
    case 'paid':
      return 'success';
    case 'issued':
      return 'warning';
    case 'past_due':
      return 'danger';
    case 'written_off':
      return 'neutral';
    case 'draft':
    default:
      return 'neutral';
  }
};

// ── Page component ────────────────────────────────────────────
export default function InvoicesPage() {
  const formatInputNumberIDR = (val: number | string): string => {
    if (val === undefined || val === null || val === '') return '';
    const num = String(val).replace(/[^0-9]/g, '');
    if (!num) return '';
    return new Intl.NumberFormat('id-ID').format(Number(num));
  };

  const getPageTitle = (key: string): string => {
    const titlePreset = allPagePresets.find(
      (p) => p.pageKey === key && p.sectionKey === 'page_title'
    );
    if (titlePreset?.content) return titlePreset.content;

    if (key === 'tc1') return 'T&C Page 1';
    if (key === 'tc2') return 'T&C Page 2';
    if (key === 'cover') return 'Cover Page';
    if (key.startsWith('custom_')) {
      return key.replace('custom_', '').replace(/_/g, ' ');
    }
    return key;
  };

  const [invoices, setInvoices] = useState<MockInvoice[]>([]);
  const [clients, setClients] = useState<MockClient[]>([]);
  const [linePresets, setLinePresets] = useState<MockInvoiceLinePreset[]>([]);
  const [allPagePresets, setAllPagePresets] = useState<MockInvoicePagePreset[]>([]);
  const [includedPages, setIncludedPages] = useState<string[]>(['cover', 'tc1', 'tc2']);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<MockInvoice | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  const [clientFilterId, setClientFilterId] = useState('');
  const [editingInvoice, setEditingInvoice] = useState<MockInvoice | null>(null);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<MockInvoice | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Create invoice form fields
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [status, setStatus] = useState<
    'draft' | 'issued' | 'paid' | 'past_due' | 'written_off'
  >('draft');
  const [dueDate, setDueDate] = useState('');
  const [hostingType, setHostingType] = useState<'static' | 'dynamic' | 'none'>('none');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'none'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Line items
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      name: 'Starter Company Profile Package',
      description: '',
      price: 5500000,
      quantity: 1,
    },
  ]);

  const startEditInvoice = (invoice: MockInvoice) => {
    setEditingInvoice(invoice);
    setSelectedClientId(invoice.clientId);
    setInvoiceNumber(invoice.invoiceNumber);
    setStatus(invoice.status);
    setDueDate(
      invoice.dueDate ? new Date(invoice.dueDate).toISOString().substring(0, 10) : ''
    );

    const items = JSON.parse(invoice.itemsJson) as InvoiceLineItem[];
    setLineItems(items);

    // Auto-detect hosting type from loaded line items
    const hostingItem = items.find((item) => item.name.toLowerCase().includes('hosting'));
    if (hostingItem) {
      if (hostingItem.name.toLowerCase().includes('static')) {
        setHostingType('static');
      } else if (hostingItem.name.toLowerCase().includes('dynamic')) {
        setHostingType('dynamic');
      } else {
        setHostingType('none');
      }
    } else {
      setHostingType('none');
    }

    setDiscountType(invoice.discountType || 'none');
    setDiscountValue(invoice.discountValue || 0);

    if (invoice.includedPagesJson) {
      try {
        setIncludedPages(JSON.parse(invoice.includedPagesJson) as string[]);
      } catch {
        setIncludedPages(['cover', 'tc1', 'tc2']);
      }
    } else {
      setIncludedPages(['cover', 'tc1', 'tc2']);
    }

    setModalOpen(true);
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) {
      setHostingType('none');
      setLineItems((prev) =>
        prev.filter((item) => !item.name.toLowerCase().includes('hosting'))
      );
      return;
    }
    const client = clients.find((c) => c.id === clientId);
    if (
      client &&
      (client.subscriptionType === 'static' || client.subscriptionType === 'dynamic')
    ) {
      const type = client.subscriptionType;
      setHostingType(type);

      const price = type === 'static' ? 150000 : 350000;
      const name =
        type === 'static' ? 'Static Hosting Subscription' : 'Dynamic Hosting Subscription';
      const description = `${type === 'static' ? 'Static' : 'Dynamic'} Hosting Services Plan`;

      const hostingIndex = lineItems.findIndex((item) =>
        item.name.toLowerCase().includes('hosting')
      );
      if (hostingIndex >= 0) {
        setLineItems((prev) =>
          prev.map((item, idx) => {
            if (idx !== hostingIndex) return item;
            return { ...item, name, price };
          })
        );
      } else {
        setLineItems((prev) => [...prev, { name, description, price, quantity: 12 }]);
      }
    } else {
      setHostingType('none');
      setLineItems((prev) =>
        prev.filter((item) => !item.name.toLowerCase().includes('hosting'))
      );
    }
  };

  const handleHostingTypeChange = (type: 'static' | 'dynamic' | 'none') => {
    setHostingType(type);

    if (type === 'none') {
      setLineItems((prev) =>
        prev.filter((item) => !item.name.toLowerCase().includes('hosting'))
      );
    } else {
      const price = type === 'static' ? 150000 : 350000;
      const name =
        type === 'static' ? 'Static Hosting Subscription' : 'Dynamic Hosting Subscription';
      const description = `${type === 'static' ? 'Static' : 'Dynamic'} Hosting Services Plan`;

      const hostingIndex = lineItems.findIndex((item) =>
        item.name.toLowerCase().includes('hosting')
      );
      if (hostingIndex >= 0) {
        setLineItems((prev) =>
          prev.map((item, idx) => {
            if (idx !== hostingIndex) return item;
            return { ...item, name, price };
          })
        );
      } else {
        setLineItems((prev) => [...prev, { name, description, price, quantity: 12 }]);
      }
    }
  };

  // ── Bootstrap ─────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === 'true') setModalOpen(true);
      const targetClient = params.get('client');
      if (targetClient) {
        setSelectedClientId(targetClient);
        setClientFilterId(targetClient);
      }
    }

    async function loadData() {
      const [inv, c, presets, pages] = await Promise.all([
        getInvoices(),
        getClients(),
        getInvoiceLinePresets(),
        getInvoicePagePresets(),
      ]);
      setInvoices(inv as MockInvoice[]);
      setClients(c);
      setLinePresets(presets as MockInvoiceLinePreset[]);
      setAllPagePresets(pages as MockInvoicePagePreset[]);

      const activeKeys = pages
        .filter((p) => p.sectionKey === 'full_page_html')
        .map((p) => p.pageKey);
      setIncludedPages(['cover', ...activeKeys]);

      setInvoiceNumber(`INV-2026-${String(inv.length + 1).padStart(3, '0')}`);

      const defaultDue = new Date();
      defaultDue.setDate(defaultDue.getDate() + 14);
      setDueDate(defaultDue.toISOString().slice(0, 10));

      setLoading(false);
    }
    loadData();
  }, []);

  // Prevent background scrolling when the create/edit modal is open
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

  // Hide the layout top header when invoice preview is active
  useEffect(() => {
    if (previewInvoice) {
      document.documentElement.classList.add('invoice-preview-active');
    } else {
      document.documentElement.classList.remove('invoice-preview-active');
    }
    return () => document.documentElement.classList.remove('invoice-preview-active');
  }, [previewInvoice]);

  // ── Line item helpers ──────────────────────────────────────
  const handleAddLineItem = () =>
    setLineItems((prev) => [
      ...prev,
      { name: '', description: '', price: 0, quantity: 1 },
    ]);

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (
    index: number,
    field: keyof InvoiceLineItem,
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          [field]:
            field === 'price'
              ? Number(value)
              : field === 'quantity'
              ? Number(value)
              : value,
        };
      })
    );
  };

  // ── Invoice totals ─────────────────────────────────────────
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = 0;
  let discountAmount = 0;
  if (discountType === 'percentage' && discountValue) {
    discountAmount = Math.round(subtotal * (discountValue / 100));
  } else if (discountType === 'fixed' && discountValue) {
    discountAmount = discountValue;
  }
  const total = Math.max(0, subtotal - discountAmount);

  const resetForm = () => {
    setEditingInvoice(null);
    setSelectedClientId('');
    setStatus('draft');
    setHostingType('none');
    setDiscountType('none');
    setDiscountValue(0);
    setLineItems([
      {
        name: 'Starter Company Profile Package',
        description: '',
        price: 5500000,
        quantity: 1,
      },
    ]);
    setInvoiceNumber(`INV-2026-${String(invoices.length + 2).padStart(3, '0')}`);
    const activeKeys = allPagePresets
      .filter((p) => p.sectionKey === 'full_page_html')
      .map((p) => p.pageKey);
    setIncludedPages(['cover', ...activeKeys]);
  };

  // ── Create or Edit invoice ─────────────────────────────────────────
  const handleCreateOrEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedClientId ||
      !invoiceNumber ||
      lineItems.some((i) => !i.name || i.price <= 0)
    )
      return;

    startTransition(async () => {
      try {
        if (editingInvoice) {
          const updatedInv = await updateInvoice(editingInvoice.id, {
            clientId: selectedClientId,
            invoiceNumber,
            subtotal,
            tax,
            total,
            status,
            itemsJson: JSON.stringify(lineItems),
            includedPagesJson: JSON.stringify(includedPages),
            dueDate: new Date(dueDate),
            discountType: discountType === 'none' ? null : discountType,
            discountValue: Number(discountValue),
          });

          if (updatedInv) {
            const client = clients.find((c) => c.id === selectedClientId);
            setInvoices((prev) =>
              prev.map((inv) =>
                inv.id === editingInvoice.id
                  ? ({ ...updatedInv, client } as any)
                  : inv
              )
            );
            setModalOpen(false);
            resetForm();
          }
        } else {
          const newInv = await createInvoice({
            clientId: selectedClientId,
            invoiceNumber,
            subtotal,
            tax,
            total,
            status,
            itemsJson: JSON.stringify(lineItems),
            includedPagesJson: JSON.stringify(includedPages),
            dueDate: new Date(dueDate),
            issuedAt: status !== 'draft' ? new Date() : null,
            paidAt: status === 'paid' ? new Date() : null,
            discountType: discountType === 'none' ? null : discountType,
            discountValue: Number(discountValue),
          });

          if (newInv) {
            const client = clients.find((c) => c.id === selectedClientId);
            setInvoices((prev) => [{ ...newInv, client } as any, ...prev]);
            setModalOpen(false);
            resetForm();
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', '/admin/invoices');
            }
          }
        }
      } catch (err) {
        console.error('Failed to save invoice', err);
      }
    });
  };

  // ── Status helpers ─────────────────────────────────────────
  const handleMarkAsPaid = async (id: string) => {
    const updated = await updateInvoiceStatus(id, 'paid').catch(() => null);
    if (updated)
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === id ? { ...inv, status: 'paid', paidAt: new Date() } : inv
        )
      );
  };

  const triggerDeleteConfirmation = (invoice: MockInvoice) => {
    setInvoiceToDelete(invoice);
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;

    if (invoiceToDelete.status === 'paid' && deleteConfirmText !== 'CONFIRM') {
      return;
    }

    startTransition(async () => {
      try {
        const deleted = await deleteInvoice(invoiceToDelete.id);
        if (deleted) {
          setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceToDelete.id));
          setDeleteModalOpen(false);
          setInvoiceToDelete(null);
          setDeleteConfirmText('');
        }
      } catch (err) {
        console.error('Failed to delete invoice', err);
      }
    });
  };

  // Auto-derives 'past_due' from due date — issued invoices past their due date are shown as past_due
  const getEffectiveStatus = (inv: MockInvoice): MockInvoice['status'] => {
    if (inv.status === 'issued' && new Date(inv.dueDate) < new Date()) {
      return 'past_due';
    }
    return inv.status;
  };

  // ── Filtered invoices ──────────────────────────────────────
  const filteredInvoices = invoices.filter((inv) => {
    const client = clients.find((c) => c.id === inv.clientId);
    const clientName = client?.name || '';
    const effectiveStatus = getEffectiveStatus(inv);
    const matchesClient = !clientFilterId || inv.clientId === clientFilterId;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter === 'all' || effectiveStatus === statusFilter;
    return matchesClient && matchesSearch && matchesFilter;
  });

  // Counts for filter pills
  const counts = {
    all: invoices.length,
    draft: invoices.filter((i) => i.status === 'draft').length,
    issued: invoices.filter((i) => getEffectiveStatus(i) === 'issued').length,
    past_due: invoices.filter((i) => getEffectiveStatus(i) === 'past_due').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
  };

  const statusOptions: FilterOption<InvoiceStatusFilter>[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'draft', label: 'Draft', count: counts.draft },
    { value: 'issued', label: 'Issued', count: counts.issued },
    { value: 'past_due', label: 'Past due', count: counts.past_due },
    { value: 'paid', label: 'Paid', count: counts.paid },
  ];

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className={previewInvoice && mounted ? '' : 'space-y-8 animate-fade-up'}>
      {/* ── Invoice Preview (replaces page content inline, keeping sidebar layout) ── */}
      {previewInvoice && mounted ? (
        <InvoicePreview
          invoice={previewInvoice}
          clients={clients}
          onClose={() => setPreviewInvoice(null)}
          onModify={() => {
            if (previewInvoice) {
              const target = previewInvoice;
              setPreviewInvoice(null);
              startEditInvoice(target);
            }
          }}
        />
      ) : (
        <>
          {/* ── Page header ── */}
          <PageHeader
            title="Invoices"
            description="Review receivables, generate client invoices, and track payments."
            actions={
              <>
                <Link href="/admin/invoices/presets" title="Invoice presets">
                  <Button
                    variant="secondary"
                    size="md"
                    leftIcon={<Sliders size={16} />}
                  >
                    Presets
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Plus size={16} />}
                  onClick={() => {
                    const activeKeys = allPagePresets
                      .filter((p) => p.sectionKey === 'full_page_html')
                      .map((p) => p.pageKey);
                    setIncludedPages(['cover', ...activeKeys]);
                    setModalOpen(true);
                  }}
                >
                  New Invoice
                </Button>
              </>
            }
          />

          {/* ── Toolbar ── */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search by invoice number or client name…"
                leftIcon={<Search size={16} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <FilterBar<InvoiceStatusFilter>
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>

          {/* ── Client filter chip ── */}
          {clientFilterId && (
            <div className="flex items-center gap-2 animate-fade-in-scale">
              <Badge variant="neutral">
                Client:{' '}
                <span className="text-foreground font-medium ml-1">
                  {clients.find((c) => c.id === clientFilterId)?.name}
                </span>
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setClientFilterId('');
                  setSelectedClientId('');
                  if (typeof window !== 'undefined') {
                    window.history.replaceState({}, '', '/admin/invoices');
                  }
                }}
                leftIcon={<X size={14} />}
              >
                Clear filter
              </Button>
            </div>
          )}

          {/* ── Invoices list ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
              <Loader2 className="animate-spin text-muted-foreground" size={20} />
              <p className="text-sm text-muted-foreground">Loading invoices…</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <Card padding="lg">
              <EmptyState
                icon={<Receipt size={20} />}
                title="No invoices found"
                description="Try adjusting your search or filters, or create a new invoice."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus size={14} />}
                    onClick={() => setModalOpen(true)}
                  >
                    New Invoice
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card padding="sm">
              <div className="divide-y divide-border">
                {filteredInvoices.map((invoice) => {
                  const client = clients.find((c) => c.id === invoice.clientId);
                  const effectiveStatus = getEffectiveStatus(invoice);
                  const badgeVariant = statusToBadgeVariant(effectiveStatus);

                  return (
                    <div
                      key={invoice.id}
                      onClick={() => {
                        if (effectiveStatus === 'paid') {
                          setPreviewInvoice(invoice);
                        } else {
                          startEditInvoice(invoice);
                        }
                      }}
                      className={cn(
                        'group flex items-center justify-between gap-4 py-4 px-3 -mx-3 rounded-lg cursor-pointer border border-transparent active-press',
                        TABLE_ROW_HOVER,
                      )}
                    >
                      {/* Left: client + invoice number */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground truncate">
                            {client?.name || 'Unknown client'}
                          </p>
                          <Badge variant={badgeVariant} className="capitalize">
                            {effectiveStatus.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">{invoice.invoiceNumber}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                          <span>
                            Issued:{' '}
                            {invoice.issuedAt
                              ? new Date(invoice.issuedAt).toLocaleDateString('id-ID')
                              : 'Draft'}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                          <span>
                            Due {new Date(invoice.dueDate).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Middle: amount */}
                      <div className="hidden sm:block text-right shrink-0">
                        <p className="text-sm font-medium text-foreground tabular-nums">
                          {formatCurrencyIDR(invoice.total)}
                        </p>
                      </div>

                      {/* Right: actions — single 3-dot menu with labeled items */}
                      <div className="shrink-0">
                        <ActionMenu
                          ariaLabel="Invoice actions"
                          items={[
                            {
                              key: 'preview',
                              label: 'Preview invoice',
                              icon: <Eye size={14} />,
                              onSelect: () => setPreviewInvoice(invoice),
                            },
                            ...(effectiveStatus !== 'paid'
                              ? [{
                                  key: 'mark-paid',
                                  label: 'Mark as paid',
                                  icon: <Check size={14} />,
                                  onSelect: () => handleMarkAsPaid(invoice.id),
                                } as ActionMenuItem]
                              : []),
                            {
                              key: 'delete',
                              label: 'Delete invoice',
                              icon: <Trash2 size={14} />,
                              destructive: true,
                              onSelect: () => triggerDeleteConfirmation(invoice),
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

          {/* ── Create / Edit invoice modal ── */}
          {mounted && modalOpen &&
            createPortal(
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="fixed inset-0 bg-background/85 backdrop-blur-md"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                />

                <div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
                  <div className="p-6 sm:p-8">
                    <SectionHeading
                      title={editingInvoice ? `Edit ${invoiceNumber}` : 'New invoice'}
                      description="Configure the invoice header, line items, and bundled pages."
                      action={
                        <button
                          onClick={() => {
                            setModalOpen(false);
                            resetForm();
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                          aria-label="Close"
                        >
                          <X size={16} />
                        </button>
                      }
                    />

                    <form onSubmit={handleCreateOrEditInvoice} className="space-y-8">
                      {/* ── 1. Client & invoice meta ── */}
                      <section className="space-y-4">
                        <SectionHeading
                          eyebrow="01 · Client"
                          title="Client & invoice meta"
                          className="!mb-0"
                        />

                        {/* Client picker — searchable combobox */}
                        <Combobox
                          label="Client *"
                          value={selectedClientId}
                          onChange={handleClientSelect}
                          options={clients.map((c) => ({
                            value: c.id,
                            label: c.name,
                            description: c.companyName ?? c.email ?? undefined,
                            keywords: [c.email ?? '', c.companyName ?? ''],
                          }))}
                          placeholder="Choose a client"
                          searchPlaceholder="Search clients by name, email, or company…"
                          emptyMessage="No clients match"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="Invoice number *"
                            required
                            className="font-mono"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                          />
                          <Input
                            label="Due date *"
                            type="date"
                            required
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                          />
                          <Select
                            label="Status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            containerClassName="sm:col-span-2"
                          >
                            <option value="draft">Draft</option>
                            <option value="issued">Issued — awaiting payment</option>
                            <option value="paid">Paid — fully collected</option>
                          </Select>
                        </div>
                      </section>

                      <hr className="border-border" />

                      {/* ── 2. Hosting ── */}
                      <section className="space-y-4">
                        <SectionHeading
                          eyebrow="02 · Hosting"
                          title="Hosting"
                          className="!mb-0"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                          <Select
                            label="Hosting subscription"
                            value={hostingType}
                            onChange={(e) =>
                              handleHostingTypeChange(e.target.value as any)
                            }
                          >
                            <option value="none">None (no hosting billed)</option>
                            <option value="static">Static · IDR 150.000/mo</option>
                            <option value="dynamic">Dynamic · IDR 350.000/mo</option>
                          </Select>
                          <p className="text-xs text-muted-foreground leading-relaxed sm:mt-7">
                            Selecting a plan adds or updates a hosting line below at the
                            standard rate, defaulting quantity to{' '}
                            <span className="text-foreground font-medium">12 months</span>{' '}
                            (editable).
                          </p>
                        </div>
                      </section>

                      <hr className="border-border" />

                      {/* ── 3. Line items ── */}
                      <section className="space-y-4">
                        <SectionHeading
                          eyebrow="03 · Items"
                          title="Line items"
                          className="!mb-0"
                          action={
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              leftIcon={<PlusCircle size={14} />}
                              onClick={handleAddLineItem}
                            >
                              Add line item
                            </Button>
                          }
                        />

                        <div className="space-y-3">
                          {lineItems.map((item, index) => (
                            <div
                              key={index}
                              className="rounded-xl border border-border bg-muted/10 p-4 animate-fade-in-scale"
                            >
                              <div className="flex gap-3 items-end w-full">
                                {/* Item name */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.06em]">
                                      Item title *
                                    </label>
                                    {linePresets.length > 0 && (
                                      <select
                                        onChange={(e) => {
                                          const presetId = e.target.value;
                                          if (presetId) {
                                            const preset = linePresets.find(
                                              (p) => p.id === presetId
                                            );
                                            if (preset) {
                                              handleLineItemChange(
                                                index,
                                                'name',
                                                preset.name
                                              );
                                              handleLineItemChange(
                                                index,
                                                'price',
                                                preset.price
                                              );
                                              handleLineItemChange(
                                                index,
                                                'description',
                                                preset.description || ''
                                              );
                                            }
                                            e.target.value = '';
                                          }
                                        }}
                                        className="text-[10px] text-muted-foreground hover:text-foreground bg-transparent border-none focus:outline-none cursor-pointer font-medium"
                                        defaultValue=""
                                      >
                                        <option value="" disabled>
                                          Load preset
                                        </option>
                                        {linePresets.map((preset) => (
                                          <option
                                            key={preset.id}
                                            value={preset.id}
                                            className="bg-card text-foreground"
                                          >
                                            {preset.name}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. Starter Company Profile Package"
                                    value={item.name}
                                    onChange={(e) =>
                                      handleLineItemChange(index, 'name', e.target.value)
                                    }
                                    className="w-full h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-colors"
                                  />
                                </div>

                                {/* Quantity */}
                                <div className="w-20 shrink-0">
                                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.06em] mb-1 block">
                                    Qty
                                  </label>
                                  <input
                                    type="number"
                                    required
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleLineItemChange(
                                        index,
                                        'quantity',
                                        e.target.value
                                      )
                                    }
                                    className="w-full h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-colors"
                                  />
                                </div>

                                {/* Rate */}
                                <div className="w-32 shrink-0">
                                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.06em] mb-1 block">
                                    Rate (IDR)
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    inputMode="numeric"
                                    value={formatInputNumberIDR(item.price)}
                                    onChange={(e) => {
                                      const rawVal = e.target.value.replace(/[^0-9]/g, '');
                                      handleLineItemChange(
                                        index,
                                        'price',
                                        rawVal ? Number(rawVal) : 0
                                      );
                                    }}
                                    className="w-full h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-colors"
                                  />
                                </div>

                                {/* Remove */}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="!p-0 !h-9 !w-9 hover:!text-red-500"
                                  aria-label="Remove line item"
                                  onClick={() => handleRemoveLineItem(index)}
                                  disabled={lineItems.length === 1}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>

                              {/* Description textarea */}
                              <div className="w-full mt-3">
                                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.06em] mb-1 block">
                                  Description (optional — one per line)
                                </label>
                                <textarea
                                  placeholder={
                                    'e.g. Landing Page, Up to 10 Pages\nMobile Responsive\nCustom UI/UX Designs & Animations'
                                  }
                                  value={item.description || ''}
                                  onChange={(e) =>
                                    handleLineItemChange(
                                      index,
                                      'description',
                                      e.target.value
                                    )
                                  }
                                  rows={4}
                                  className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-colors resize-none"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <hr className="border-border" />

                      {/* ── 4. Discount & totals ── */}
                      <section className="space-y-4">
                        <SectionHeading
                          eyebrow="04 · Totals"
                          title="Discount & totals"
                          className="!mb-0"
                        />

                      {/* ── Totals summary ── */}
                      <div className="rounded-xl border border-border bg-muted/10 overflow-hidden">
                        <div className="flex items-center justify-between px-4 pt-4 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Subtotal</span>
                            <div className="flex items-center gap-1 ml-1">
                              <button
                                type="button"
                                title="Percentage discount"
                                onClick={() => {
                                  if (discountType === 'percentage') {
                                    setDiscountType('none');
                                    setDiscountValue(0);
                                  } else {
                                    setDiscountType('percentage');
                                    setDiscountValue(0);
                                  }
                                }}
                                className={`w-6 h-6 rounded-md text-[11px] font-medium border transition-colors cursor-pointer flex items-center justify-center ${
                                  discountType === 'percentage'
                                    ? 'bg-muted border-foreground/20 text-foreground'
                                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                %
                              </button>
                              <button
                                type="button"
                                title="Fixed IDR discount"
                                onClick={() => {
                                  if (discountType === 'fixed') {
                                    setDiscountType('none');
                                    setDiscountValue(0);
                                  } else {
                                    setDiscountType('fixed');
                                    setDiscountValue(0);
                                  }
                                }}
                                className={`w-6 h-6 rounded-md text-[10px] font-medium border transition-colors cursor-pointer flex items-center justify-center ${
                                  discountType === 'fixed'
                                    ? 'bg-muted border-foreground/20 text-foreground'
                                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                Rp
                              </button>
                            </div>
                          </div>
                          <span className="text-sm text-foreground tabular-nums">
                            {formatCurrencyIDR(subtotal)}
                          </span>
                        </div>

                        {discountType !== 'none' && (
                          <div className="flex items-center justify-between px-4 pb-3 gap-3 animate-fade-in-scale">
                            <div className="flex items-center gap-1.5 text-xs text-red-500 shrink-0">
                              <span>Discount</span>
                              <span className="text-red-500/70">
                                ({discountType === 'percentage' ? '%' : 'Rp'})
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              {discountType === 'percentage' && (
                                <span className="text-xs text-red-500 shrink-0">-</span>
                              )}
                              <input
                                type={discountType === 'percentage' ? 'number' : 'text'}
                                inputMode="numeric"
                                min="0"
                                max={discountType === 'percentage' ? '100' : undefined}
                                placeholder="0"
                                value={
                                  discountType === 'percentage'
                                    ? discountValue === 0
                                      ? ''
                                      : discountValue
                                    : discountValue === 0
                                    ? ''
                                    : formatInputNumberIDR(discountValue)
                                }
                                onChange={(e) => {
                                  if (discountType === 'percentage') {
                                    const val = Math.min(
                                      100,
                                      Math.max(0, Number(e.target.value))
                                    );
                                    setDiscountValue(val);
                                  } else {
                                    const rawVal = e.target.value.replace(/[^0-9]/g, '');
                                    setDiscountValue(rawVal ? Number(rawVal) : 0);
                                  }
                                }}
                                className="w-28 h-8 px-2.5 rounded-lg bg-background border border-border text-xs text-right text-red-500 focus:outline-none focus:border-red-500/40 transition-all tabular-nums"
                              />
                              {discountType === 'percentage' && (
                                <span className="text-xs text-red-500 shrink-0">%</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Invoice Pages inclusion toggles */}
                        <div className="border-t border-border p-4">
                          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-3">
                            Include invoice pages
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted/40 cursor-pointer transition-colors select-none">
                              <input
                                type="checkbox"
                                checked={includedPages.includes('cover')}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setIncludedPages((prev) => [...prev, 'cover']);
                                  } else {
                                    setIncludedPages((prev) =>
                                      prev.filter((p) => p !== 'cover')
                                    );
                                  }
                                }}
                                className="accent-primary"
                              />
                              <span className="text-xs text-foreground">
                                {getPageTitle('cover')}
                              </span>
                            </label>

                            {allPagePresets
                              .filter((p) => p.sectionKey === 'full_page_html')
                              .map((customPage) => {
                                const isChecked = includedPages.includes(customPage.pageKey);
                                const pageTitle = getPageTitle(customPage.pageKey);

                                return (
                                  <label
                                    key={customPage.id}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted/40 cursor-pointer transition-colors select-none capitalize"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setIncludedPages((prev) => [
                                            ...prev,
                                            customPage.pageKey,
                                          ]);
                                        } else {
                                          setIncludedPages((prev) =>
                                            prev.filter((p) => p !== customPage.pageKey)
                                          );
                                        }
                                      }}
                                      className="accent-primary"
                                    />
                                    <span className="text-xs text-foreground">
                                      {pageTitle}
                                    </span>
                                  </label>
                                );
                              })}
                          </div>
                        </div>

                        {/* Total */}
                        <div className="border-t border-border flex items-center justify-between px-4 py-4">
                          <span className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
                            Invoice total
                          </span>
                          <div className="text-right">
                            {discountAmount > 0 && (
                              <span className="block text-[10px] text-red-500 tabular-nums mb-0.5">
                                -{formatCurrencyIDR(discountAmount)}
                              </span>
                            )}
                            <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                              {formatCurrencyIDR(total)}
                            </span>
                          </div>
                        </div>
                      </div>
                      </section>

                      {/* Form actions */}
                      <div className="flex gap-2 justify-end pt-5 border-t border-border">
                        <Button
                          type="button"
                          variant="ghost"
                          size="md"
                          onClick={() => {
                            setModalOpen(false);
                            resetForm();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                          disabled={isPending}
                        >
                          {isPending
                            ? editingInvoice
                              ? 'Saving…'
                              : 'Generating…'
                            : editingInvoice
                            ? 'Save changes'
                            : 'Generate invoice'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>,
              document.body
            )}

          {/* ── Delete invoice confirmation modal ── */}
          {mounted && deleteModalOpen && invoiceToDelete &&
            createPortal(
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="fixed inset-0 bg-background/85 backdrop-blur-md"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setInvoiceToDelete(null);
                    setDeleteConfirmText('');
                  }}
                />

                <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
                  <div className="p-6">
                    <div className="flex items-start gap-3 pb-4 mb-4 border-b border-border">
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
                        <AlertTriangle size={16} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold tracking-tight text-foreground">
                          Delete invoice
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          This action cannot be undone.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Are you sure you want to delete{' '}
                        <span className="font-mono text-foreground">
                          {invoiceToDelete.invoiceNumber}
                        </span>
                        ? All line items and billing history will be permanently removed.
                      </p>

                      {invoiceToDelete.status === 'paid' && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3 animate-fade-in-scale">
                          <p className="text-xs text-red-500 leading-relaxed">
                            This invoice is marked as{' '}
                            <span className="font-medium">paid</span>. Deleting a paid
                            invoice impacts income auditing and client statement history.
                          </p>
                          <div>
                            <label className="text-[10px] font-medium uppercase tracking-[0.06em] text-red-500 mb-1.5 block">
                              Type 'CONFIRM' to authorize deletion
                            </label>
                            <input
                              type="text"
                              placeholder="CONFIRM"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              className="w-full h-9 rounded-lg bg-background border border-red-500/20 px-3 text-sm font-mono uppercase focus:border-red-500/40 focus:outline-none transition-colors text-red-500 placeholder:text-red-500/30"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
                      <Button
                        type="button"
                        variant="ghost"
                        size="md"
                        onClick={() => {
                          setDeleteModalOpen(false);
                          setInvoiceToDelete(null);
                          setDeleteConfirmText('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="md"
                        leftIcon={<Trash2 size={14} />}
                        onClick={handleDeleteInvoice}
                        disabled={
                          isPending ||
                          (invoiceToDelete.status === 'paid' &&
                            deleteConfirmText !== 'CONFIRM')
                        }
                      >
                        {isPending ? 'Deleting…' : 'Delete invoice'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  );
}
