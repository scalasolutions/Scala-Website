'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Search,
  FileText,
  X,
  PlusCircle,
  Trash2,
  Eye,
  Check,
  AlertTriangle,
  Loader2,
  Pencil,
  ArrowRight,
  ScrollText,
} from 'lucide-react';
import {
  createQuotation,
  updateQuotation,
  deleteQuotation,
  getInvoiceLinePresets,
  MockInvoiceLinePreset,
  getInvoicePagePresets,
  MockInvoicePagePreset,
  getClients,
  getQuotations,
  createInvoice,
  MockClient,
  MockQuotation,
} from '@/lib/db/queries';
import {
  invalidateCache,
  CACHE_KEYS,
  useAdminData,
  getCachedSync,
  getCachedLinePresets,
  getCachedPagePresets,
  getCachedQuotations,
} from '@/lib/data-cache';
import { InvoiceLineItem, formatCurrencyIDR } from '../invoices/components/invoice-types';
import { InvoicePreview } from '../invoices/components/InvoicePreview';
import { QuotationPreview } from './components/QuotationPreview';
import { ProposalSections, EMPTY_PROPOSAL_SECTIONS, parseProposalSections } from '@/lib/proposal-types';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Combobox from '@/components/ui/Combobox';
import EmptyState from '@/components/ui/EmptyState';
import { cn, TABLE_ROW_HOVER, formatInputNumberIDR } from '@/lib/utils';


type QuotationStatus = MockQuotation['status'];

const statusToBadgeVariant = (s: QuotationStatus): 'success' | 'warning' | 'danger' | 'neutral' | 'brand' => {
  switch (s) {
    case 'accepted': return 'success';
    case 'sent': return 'warning';
    case 'declined': return 'danger';
    case 'expired': return 'neutral';
    case 'converted': return 'brand';
    case 'draft':
    default: return 'neutral';
  }
};

const statusLabel: Record<QuotationStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  converted: 'Converted',
};

const parsePastedItems = (text: string): InvoiceLineItem[] => {
  const parsedItems: InvoiceLineItem[] = [];
  const lines = text.split('\n').map((l) => l.trim());
  let currentTitle = '';
  let currentDescLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const isPrice = /^(?:rp\.?|idr\.?)?\s*[\d,.-]+$/i.test(line) && /[\d]/.test(line);
    if (isPrice) {
      const priceVal = parseInt(line.replace(/[^0-9]/g, ''), 10) || 0;
      if (currentTitle) {
        parsedItems.push({ name: currentTitle, description: currentDescLines.join('\n'), price: priceVal, quantity: 1 });
        currentTitle = '';
        currentDescLines = [];
      }
    } else {
      if (!currentTitle) currentTitle = line;
      else currentDescLines.push(line);
    }
  }
  if (currentTitle) parsedItems.push({ name: currentTitle, description: currentDescLines.join('\n'), price: 0, quantity: 1 });
  return parsedItems;
};

const DEFAULT_INCLUDED_PAGES = ['cover', 'tc1', 'tc2'];

export default function QuotationsPage() {
  const { data: quotationsData, loading: loadingQuotations, mutate: mutateQuotations } = useAdminData<(MockQuotation & { client?: MockClient })[]>(CACHE_KEYS.QUOTATIONS, getQuotations as any);
  const { data: clientsData, loading: loadingClients } = useAdminData<MockClient[]>(CACHE_KEYS.CLIENTS, getClients);
  const quotations = quotationsData || [];
  const clients = clientsData || [];

  const [linePresets, setLinePresets] = useState<MockInvoiceLinePreset[]>(() => getCachedSync<MockInvoiceLinePreset[]>(CACHE_KEYS.LINE_PRESETS) || []);
  const [allPagePresets, setAllPagePresets] = useState<MockInvoicePagePreset[]>(() => getCachedSync<MockInvoicePagePreset[]>(CACHE_KEYS.PAGE_PRESETS) || []);
  const [includedPages, setIncludedPages] = useState<string[]>(DEFAULT_INCLUDED_PAGES);
  const [presetsLoading, setPresetsLoading] = useState(() => {
    const hasLines = getCachedSync<MockInvoiceLinePreset[]>(CACHE_KEYS.LINE_PRESETS);
    const hasPages = getCachedSync<MockInvoicePagePreset[]>(CACHE_KEYS.PAGE_PRESETS);
    return !(hasLines && hasPages);
  });
  const loading = loadingQuotations || loadingClients || presetsLoading;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'all'>('all');
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<MockQuotation | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<MockQuotation | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [quotationToConvert, setQuotationToConvert] = useState<MockQuotation | null>(null);

  // Preview state
  const [previewQuotation, setPreviewQuotation] = useState<MockQuotation | null>(null);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [quotationNumber, setQuotationNumber] = useState('');
  const [quotationStatus, setQuotationStatus] = useState<QuotationStatus>('draft');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'none'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([{ name: '', description: '', price: 0, quantity: 1 }]);
  const [proposalSections, setProposalSections] = useState<ProposalSections>({ ...EMPTY_PROPOSAL_SECTIONS });
  const [pasteText, setPasteText] = useState('');
  const [presetSearch, setPresetSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Convert-to-invoice form state
  const [convertInvoiceNumber, setConvertInvoiceNumber] = useState('');
  const [convertDueDate, setConvertDueDate] = useState('');
  const [convertIsDp, setConvertIsDp] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    setMounted(true);
    Promise.all([getCachedLinePresets(), getCachedPagePresets()]).then(([lp, pp]) => {
      setLinePresets(lp as MockInvoiceLinePreset[]);
      setAllPagePresets(pp as MockInvoicePagePreset[]);
      setPresetsLoading(false);
    });
  }, []);

  const getNextQuotationNumber = () => {
    const existing = quotations.map(q => q.quotationNumber);
    let max = 0;
    existing.forEach(n => {
      const match = n.match(/(\d+)$/);
      if (match) max = Math.max(max, parseInt(match[1], 10));
    });
    const next = max + 1;
    const year = new Date().getFullYear();
    return `QT-${year}-${String(next).padStart(3, '0')}`;
  };

  const openCreateModal = () => {
    setEditingQuotation(null);
    setSelectedClientId('');
    setQuotationNumber(getNextQuotationNumber());
    setQuotationStatus('draft');
    setValidUntil('');
    setNotes('');
    setDiscountType('none');
    setDiscountValue(0);
    setLineItems([{ name: '', description: '', price: 0, quantity: 1 }]);
    setProposalSections({ ...EMPTY_PROPOSAL_SECTIONS });
    setPasteText('');
    setIncludedPages(DEFAULT_INCLUDED_PAGES);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (q: MockQuotation) => {
    setEditingQuotation(q);
    setSelectedClientId(q.clientId);
    setQuotationNumber(q.quotationNumber);
    setQuotationStatus(q.status);
    setValidUntil(q.validUntil ? new Date(q.validUntil).toISOString().split('T')[0] : '');
    setNotes(q.notes || '');
    setDiscountType((q.discountType || 'none') as 'percentage' | 'fixed' | 'none');
    setDiscountValue(q.discountValue || 0);
    setLineItems(JSON.parse(q.itemsJson) || [{ name: '', description: '', price: 0, quantity: 1 }]);
    setIncludedPages(q.includedPagesJson ? JSON.parse(q.includedPagesJson) : DEFAULT_INCLUDED_PAGES);
    setProposalSections(parseProposalSections(q.sectionsJson));
    setFormError('');
    setModalOpen(true);
  };

  const computeTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = 0;
    if (discountType === 'percentage' && discountValue) discountAmount = Math.round(subtotal * (discountValue / 100));
    else if (discountType === 'fixed' && discountValue) discountAmount = discountValue;
    return { subtotal, discountAmount, total: subtotal - discountAmount };
  };

  const handleSubmit = async () => {
    const { total, subtotal } = computeTotals();
    if (!selectedClientId) { setFormError('Please select a client.'); return; }
    if (!quotationNumber.trim()) { setFormError('Please enter a quotation number.'); return; }
    if (lineItems.every(i => !i.name.trim())) { setFormError('Please add at least one line item.'); return; }
    setFormError('');
    setIsSubmitting(true);

    const payload = {
      clientId: selectedClientId,
      quotationNumber: quotationNumber.trim(),
      subtotal,
      total,
      discountType: discountType === 'none' ? null : discountType,
      discountValue: discountType === 'none' ? 0 : discountValue,
      status: quotationStatus,
      itemsJson: JSON.stringify(lineItems.filter(i => i.name.trim())),
      includedPagesJson: JSON.stringify(includedPages),
      sectionsJson: JSON.stringify(proposalSections),
      validUntil: validUntil ? new Date(validUntil) : null,
      notes: notes.trim() || null,
    };

    try {
      if (editingQuotation) {
        await updateQuotation(editingQuotation.id, payload);
      } else {
        await createQuotation(payload as any);
      }
      invalidateCache(CACHE_KEYS.QUOTATIONS);
      setModalOpen(false);
      setSuccessMsg(editingQuotation ? 'Quotation updated.' : 'Quotation created.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError('Failed to save quotation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!quotationToDelete) return;
    startTransition(async () => {
      await deleteQuotation(quotationToDelete.id);
      invalidateCache(CACHE_KEYS.QUOTATIONS);
      setDeleteModalOpen(false);
      setQuotationToDelete(null);
    });
  };

  const handleConvertToInvoice = async () => {
    if (!quotationToConvert) return;
    if (!convertInvoiceNumber.trim()) return;
    if (!convertDueDate) return;
    setIsConverting(true);
    try {
      const client = clients.find(c => c.id === quotationToConvert.clientId);
      const invoiceData = {
        clientId: quotationToConvert.clientId,
        invoiceNumber: convertInvoiceNumber.trim(),
        subtotal: quotationToConvert.subtotal,
        tax: 0,
        total: quotationToConvert.total,
        amountPaid: 0,
        status: 'draft' as const,
        itemsJson: quotationToConvert.itemsJson,
        includedPagesJson: quotationToConvert.includedPagesJson || JSON.stringify(DEFAULT_INCLUDED_PAGES),
        dueDate: new Date(convertDueDate),
        discountType: quotationToConvert.discountType,
        discountValue: quotationToConvert.discountValue || 0,
        receivedBy: 'company' as const,
        isDpCollection: convertIsDp,
      };
      const newInvoice = await createInvoice(invoiceData as any);
      if (newInvoice) {
        await updateQuotation(quotationToConvert.id, {
          status: 'converted',
          convertedInvoiceId: newInvoice.id,
        });
      }
      invalidateCache(CACHE_KEYS.QUOTATIONS, CACHE_KEYS.INVOICES);
      setConvertModalOpen(false);
      setQuotationToConvert(null);
      setSuccessMsg('Quotation converted to invoice successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Convert failed:', err);
    } finally {
      setIsConverting(false);
    }
  };

  // Filtered quotations
  const filtered = quotations.filter(q => {
    const client = q.client;
    const matchesSearch = !search ||
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      client?.companyName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { total: formTotal, subtotal: formSubtotal, discountAmount: formDiscountAmount } = computeTotals();

  // --- Build a fake "invoice" object for the preview (reuse InvoicePreview) ---
  const buildPreviewInvoice = (q: MockQuotation) => {
    const client = clients.find(c => c.id === q.clientId);
    return {
      ...q,
      invoiceNumber: q.quotationNumber,
      tax: 0,
      amountPaid: 0,
      status: 'draft' as const,
      dueDate: q.validUntil || new Date(),
      receivedBy: 'company' as const,
      isDpCollection: false,
      issuedAt: q.sentAt || null,
      paidAt: null,
      dpAt: null,
      proofOfPaymentUrl: null,
      client: client || null,
    };
  };

  const allAvailablePages = [
    'cover',
    ...Array.from(new Set(allPagePresets.map(p => p.pageKey))).filter(k => k !== 'cover'),
  ];

  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      <div className="flex-1 p-6 space-y-6">
        <PageHeader
          title="Quotations"
          eyebrow={`${quotations.length} quotation${quotations.length !== 1 ? 's' : ''} total`}
          actions={
            <Button onClick={openCreateModal} size="sm" className="gap-2">
              <Plus size={16} />
              New Quotation
            </Button>
          }
        />

        {successMsg && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-300">
            <Check size={16} />
            {successMsg}
          </div>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search quotations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="min-w-[150px]"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="expired">Expired</option>
              <option value="converted">Converted</option>
            </Select>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<FileText size={32} className="text-muted-foreground/50" />}
              title="No quotations found"
              description={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Create your first quotation to get started.'}
              action={
                !search && statusFilter === 'all' ? (
                  <Button onClick={openCreateModal} size="sm" className="gap-2">
                    <Plus size={16} />
                    New Quotation
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-5 py-3 whitespace-nowrap">Quotation #</th>
                    <th className="text-left font-medium text-muted-foreground px-5 py-3">Client</th>
                    <th className="text-right font-medium text-muted-foreground px-5 py-3 whitespace-nowrap">Total</th>
                    <th className="text-center font-medium text-muted-foreground px-5 py-3">Status</th>
                    <th className="text-right font-medium text-muted-foreground px-5 py-3">Valid Until</th>
                    <th className="text-right font-medium text-muted-foreground px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(q => {
                    const client = q.client;
                    const validDate = q.validUntil ? new Date(q.validUntil) : null;
                    const isExpired = validDate && validDate < new Date() && q.status !== 'converted' && q.status !== 'accepted';
                    return (
                      <tr key={q.id} className={cn(TABLE_ROW_HOVER, 'transition-colors')}>
                        <td className="px-5 py-4 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                          {q.quotationNumber}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-foreground">{client?.companyName || client?.name || '—'}</div>
                          {client?.companyName && <div className="text-xs text-muted-foreground">{client.name}</div>}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-foreground whitespace-nowrap">
                          {formatCurrencyIDR(q.total)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Badge variant={statusToBadgeVariant(q.status)} className="text-xs">
                            {statusLabel[q.status]}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right text-xs text-muted-foreground whitespace-nowrap">
                          {validDate ? (
                            <span className={cn(isExpired && 'text-red-500 font-medium')}>
                              {validDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {isExpired && ' (expired)'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setPreviewQuotation(q)}
                              className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title="Preview"
                            >
                              <Eye size={15} />
                            </button>
                            <a
                              href={`/admin/clients/${q.clientId}`}
                              className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex"
                              title="Generate SLA (open client agreement)"
                            >
                              <ScrollText size={15} />
                            </a>
                            {q.status !== 'converted' && (
                              <button
                                onClick={() => openEditModal(q)}
                                className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                            {(q.status === 'accepted' || q.status === 'sent' || q.status === 'draft') && (
                              <button
                                onClick={() => {
                                  setQuotationToConvert(q);
                                  const now = new Date();
                                  const year = now.getFullYear();
                                  const month = String(now.getMonth() + 1).padStart(2, '0');
                                  setConvertInvoiceNumber(`INV-${year}${month}-001`);
                                  const due = new Date();
                                  due.setDate(due.getDate() + 14);
                                  setConvertDueDate(due.toISOString().split('T')[0]);
                                  setConvertIsDp(true);
                                  setConvertModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-500 transition-colors cursor-pointer"
                                title="Convert to Invoice"
                              >
                                <ArrowRight size={15} />
                              </button>
                            )}
                            <button
                              onClick={() => { setQuotationToDelete(q); setDeleteModalOpen(true); }}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      {modalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-8">
          <div className="relative w-full max-w-3xl mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-fade-in-scale">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">{editingQuotation ? 'Edit Quotation' : 'New Quotation'}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Fill in the details below to {editingQuotation ? 'update' : 'create'} a quotation</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {formError && (
                <div className="flex items-start gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  {formError}
                </div>
              )}

              {/* Client & Quotation # */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Client *</label>
                  <Combobox
                    value={selectedClientId}
                    onChange={setSelectedClientId}
                    options={clients.map(c => ({ value: c.id, label: c.companyName || c.name }))}
                    placeholder="Select client..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Quotation Number *</label>
                  <Input value={quotationNumber} onChange={e => setQuotationNumber(e.target.value)} placeholder="QT-2025-001" />
                </div>
              </div>

              {/* Status & Valid Until */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Status</label>
                  <Select value={quotationStatus} onChange={e => setQuotationStatus(e.target.value as QuotationStatus)}>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                    <option value="expired">Expired</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Valid Until</label>
                  <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                </div>
              </div>

              {/* Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Discount Type</label>
                  <Select value={discountType} onChange={e => setDiscountType(e.target.value as any)}>
                    <option value="none">No Discount</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rp)</option>
                  </Select>
                </div>
                {discountType !== 'none' && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      {discountType === 'percentage' ? 'Discount (%)' : 'Discount Amount'}
                    </label>
                    <Input
                      type={discountType === 'percentage' ? 'number' : 'text'}
                      value={discountType === 'percentage' ? discountValue : (discountValue > 0 ? formatInputNumberIDR(discountValue) : '')}
                      onChange={e => {
                        if (discountType === 'percentage') {
                          setDiscountValue(Math.min(100, Math.max(0, Number(e.target.value))));
                        } else {
                          const raw = e.target.value.replace(/\D/g, '');
                          setDiscountValue(parseInt(raw, 10) || 0);
                        }
                      }}
                      placeholder={discountType === 'percentage' ? '10' : 'Rp 500,000'}
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Notes / Cover Message</label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optional cover note for the quotation..."
                  rows={3}
                />
              </div>

              {/* Proposal Content (rich multi-page proposal) */}
              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Proposal Content
                </p>
                <p className="text-[11px] text-muted-foreground -mt-1.5 leading-relaxed">
                  Fills the multi-page proposal preview. Leave blank to auto-derive packages from the line items. Hosting & payment terms come from the client's SLA settings.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={proposalSections.title || ''}
                    onChange={e => setProposalSections(s => ({ ...s, title: e.target.value }))}
                    placeholder="Proposal title (e.g. Custom E-Commerce Website)"
                    className="bg-background border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                  <input
                    type="text"
                    value={proposalSections.subtitle || ''}
                    onChange={e => setProposalSections(s => ({ ...s, subtitle: e.target.value }))}
                    placeholder="Short subtitle / descriptor"
                    className="bg-background border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <Textarea
                  value={proposalSections.businessNeed || ''}
                  onChange={e => setProposalSections(s => ({ ...s, businessNeed: e.target.value }))}
                  placeholder="Project overview / business need..."
                  rows={3}
                />
                <Textarea
                  value={(proposalSections.requirements || []).join('\n')}
                  onChange={e => setProposalSections(s => ({ ...s, requirements: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) }))}
                  placeholder="Main requirements — one per line"
                  rows={3}
                />
                <input
                  type="text"
                  value={proposalSections.timeline || ''}
                  onChange={e => setProposalSections(s => ({ ...s, timeline: e.target.value }))}
                  placeholder="Estimated timeline (e.g. Approximately 6–8 weeks)"
                  className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
                <Textarea
                  value={(proposalSections.clientProvides || []).join('\n')}
                  onChange={e => setProposalSections(s => ({ ...s, clientProvides: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) }))}
                  placeholder="What the client provides — one per line"
                  rows={2}
                />
                <Textarea
                  value={proposalSections.scopeTerms || ''}
                  onChange={e => setProposalSections(s => ({ ...s, scopeTerms: e.target.value }))}
                  placeholder="Scope & terms (revisions, deployment, third-party fees)..."
                  rows={2}
                />
                <Textarea
                  value={proposalSections.recommendation || ''}
                  onChange={e => setProposalSections(s => ({ ...s, recommendation: e.target.value }))}
                  placeholder="Closing recommendation (optional)..."
                  rows={2}
                />
              </div>

              {/* Included Pages */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Included Pages</label>
                <div className="flex flex-wrap gap-2">
                  {allAvailablePages.map(pageKey => {
                    const isOn = includedPages.includes(pageKey);
                    return (
                      <button
                        key={pageKey}
                        onClick={() => setIncludedPages(prev => isOn ? prev.filter(k => k !== pageKey) : [...prev, pageKey])}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                          isOn
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50'
                        )}
                      >
                        {pageKey === 'cover' ? 'Cover' : pageKey === 'tc1' ? 'T&C Page 1' : pageKey === 'tc2' ? 'T&C Page 2' : pageKey}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Line Items *</label>
                  <button
                    onClick={() => setLineItems(prev => [...prev, { name: '', description: '', price: 0, quantity: 1 }])}
                    className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                  >
                    <PlusCircle size={13} /> Add Item
                  </button>
                </div>

                {/* Paste-to-parse */}
                <div className="mb-3">
                  <Textarea
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder="Paste items here (Name → Description → Price per line) then click Parse…"
                    rows={3}
                    className="text-xs"
                  />
                  {pasteText.trim() && (
                    <button
                      onClick={() => {
                        const parsed = parsePastedItems(pasteText);
                        if (parsed.length) {
                          setLineItems(prev => [...prev.filter(i => i.name.trim()), ...parsed]);
                          setPasteText('');
                        }
                      }}
                      className="mt-1 text-xs text-primary hover:underline cursor-pointer"
                    >
                      Parse &amp; Add Items
                    </button>
                  )}
                </div>

                {/* Preset Picker */}
                {linePresets.length > 0 && (
                  <div className="mb-3">
                    <Input
                      value={presetSearch}
                      onChange={e => setPresetSearch(e.target.value)}
                      placeholder="Search service presets..."
                      className="text-xs mb-2"
                    />
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {linePresets
                        .filter(p => !presetSearch || p.name.toLowerCase().includes(presetSearch.toLowerCase()))
                        .slice(0, 20)
                        .map(p => (
                          <button
                            key={p.id}
                            onClick={() => setLineItems(prev => [...prev.filter(i => i.name.trim()), { name: p.name, description: p.description, price: p.price, quantity: 1 }])}
                            className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-xs font-medium text-foreground border border-border cursor-pointer transition-colors"
                          >
                            {p.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Item rows */}
                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[2fr_1fr_80px_40px] gap-2 items-start">
                      <div className="space-y-1">
                        <Input
                          value={item.name}
                          onChange={e => setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, name: e.target.value } : li))}
                          placeholder="Item name"
                          className="text-xs"
                        />
                        <Textarea
                          value={item.description}
                          onChange={e => setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, description: e.target.value } : li))}
                          placeholder="Description (optional)"
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                      <Input
                        value={item.price > 0 ? formatInputNumberIDR(item.price) : ''}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, price: parseInt(raw, 10) || 0 } : li));
                        }}
                        placeholder="Rp 0"
                        className="text-xs"
                      />
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, quantity: parseInt(e.target.value, 10) || 1 } : li))}
                        className="text-xs"
                      />
                      <button
                        onClick={() => setLineItems(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-red-400 cursor-pointer mt-0.5"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t border-border space-y-1.5">
                  {formSubtotal !== formTotal && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrencyIDR(formSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-red-500">
                        <span>Discount</span>
                        <span>-{formatCurrencyIDR(formDiscountAmount)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span>{formatCurrencyIDR(formTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 min-w-[120px]">
                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {editingQuotation ? 'Save Changes' : 'Create Quotation'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── DELETE MODAL ── */}
      {deleteModalOpen && quotationToDelete && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-fade-in-scale p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Delete Quotation</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete quotation <span className="font-semibold text-foreground">{quotationToDelete.quotationNumber}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} disabled={isPending} className="gap-2">
                {isPending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Delete
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── CONVERT TO INVOICE MODAL ── */}
      {convertModalOpen && quotationToConvert && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-fade-in-scale p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500">
                <ArrowRight size={20} />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Convert to Invoice</h3>
                <p className="text-xs text-muted-foreground">{quotationToConvert.quotationNumber} → new invoice</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Invoice Number *</label>
                <Input value={convertInvoiceNumber} onChange={e => setConvertInvoiceNumber(e.target.value)} placeholder="INV-202506-001" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Due Date *</label>
                <Input type="date" value={convertDueDate} onChange={e => setConvertDueDate(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="convert-dp" checked={convertIsDp} onChange={e => setConvertIsDp(e.target.checked)} className="rounded" />
                <label htmlFor="convert-dp" className="text-sm text-foreground cursor-pointer">Show Down Payment (50%) breakdown on invoice</label>
              </div>
              <div className="px-4 py-3 bg-muted/40 rounded-xl text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Total</span>
                  <span className="font-semibold">{formatCurrencyIDR(quotationToConvert.total)}</span>
                </div>
                {convertIsDp && (
                  <div className="flex justify-between mt-1 text-amber-600 dark:text-amber-400">
                    <span>DP Amount Due (50%)</span>
                    <span className="font-semibold">{formatCurrencyIDR(Math.round(quotationToConvert.total * 0.5))}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setConvertModalOpen(false)}>Cancel</Button>
              <Button onClick={handleConvertToInvoice} disabled={isConverting || !convertInvoiceNumber.trim() || !convertDueDate} className="gap-2">
                {isConverting ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                Convert to Invoice
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── PREVIEW OVERLAY ── */}
      {previewQuotation && mounted && (
        <QuotationPreview
          quotation={previewQuotation}
          client={clients.find(c => c.id === previewQuotation.clientId) as any}
          onClose={() => setPreviewQuotation(null)}
        />
      )}
    </main>
  );
}
