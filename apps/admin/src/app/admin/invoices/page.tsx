'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Receipt,
  X,
  CreditCard,
  PlusCircle,
  Trash2,
  Eye,
  Download,
  Check,
  ChevronDown,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import { getInvoices, getClients, createInvoice, updateInvoiceStatus, updateInvoice, deleteInvoice, MockInvoice, MockClient, getInvoiceLinePresets, MockInvoiceLinePreset, getInvoicePagePresets, MockInvoicePagePreset } from '@/lib/db/queries';
import { InvoiceLineItem, formatCurrencyIDR, getStatusBadge } from './components/invoice-types';
import { InvoicePreview } from './components/InvoicePreview';

// ── Page component ────────────────────────────────────────────
export default function InvoicesPage() {
  const formatInputNumberIDR = (val: number | string): string => {
    if (val === undefined || val === null || val === '') return '';
    const num = String(val).replace(/[^0-9]/g, '');
    if (!num) return '';
    return new Intl.NumberFormat('id-ID').format(Number(num));
  };

  const getPageTitle = (key: string): string => {
    const titlePreset = allPagePresets.find(p => p.pageKey === key && p.sectionKey === 'page_title');
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
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
  const [status, setStatus] = useState<'draft' | 'issued' | 'paid' | 'past_due' | 'written_off'>('draft');
  const [dueDate, setDueDate] = useState('');
  const [hostingType, setHostingType] = useState<'static' | 'dynamic' | 'none'>('none');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'none'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Line items
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { name: 'Starter Company Profile Package', description: '', price: 5500000, quantity: 1 },
  ]);

  const startEditInvoice = (invoice: MockInvoice) => {
    setEditingInvoice(invoice);
    setSelectedClientId(invoice.clientId);
    setInvoiceNumber(invoice.invoiceNumber);
    setStatus(invoice.status);
    setDueDate(invoice.dueDate ? new Date(invoice.dueDate).toISOString().substring(0, 10) : '');
    
    const items = JSON.parse(invoice.itemsJson) as InvoiceLineItem[];
    setLineItems(items);

    // Auto-detect hosting type from loaded line items
    const hostingItem = items.find(item => item.name.toLowerCase().includes('hosting'));
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
      } catch (e) {
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
      // If client is cleared, remove hosting line items
      setLineItems(prev => prev.filter(item => !item.name.toLowerCase().includes('hosting')));
      return;
    }
    const client = clients.find(c => c.id === clientId);
    if (client && (client.subscriptionType === 'static' || client.subscriptionType === 'dynamic')) {
      const type = client.subscriptionType;
      setHostingType(type);
      
      const price = type === 'static' ? 150000 : 350000;
      const name = type === 'static' ? 'Static Hosting Subscription' : 'Dynamic Hosting Subscription';
      const description = `${type === 'static' ? 'Static' : 'Dynamic'} Hosting Services Plan`;

      const hostingIndex = lineItems.findIndex(item => item.name.toLowerCase().includes('hosting'));
      if (hostingIndex >= 0) {
        setLineItems(prev => prev.map((item, idx) => {
          if (idx !== hostingIndex) return item;
          return { ...item, name, price };
        }));
      } else {
        setLineItems(prev => [
          ...prev,
          { name, description, price, quantity: 12 }
        ]);
      }
    } else {
      setHostingType('none');
      // Remove hosting item if client does not have hosting subscription
      setLineItems(prev => prev.filter(item => !item.name.toLowerCase().includes('hosting')));
    }
  };

  const handleHostingTypeChange = (type: 'static' | 'dynamic' | 'none') => {
    setHostingType(type);
    
    if (type === 'none') {
      // Remove any hosting line items
      setLineItems(prev => prev.filter(item => !item.name.toLowerCase().includes('hosting')));
    } else {
      const price = type === 'static' ? 150000 : 350000;
      const name = type === 'static' ? 'Static Hosting Subscription' : 'Dynamic Hosting Subscription';
      const description = `${type === 'static' ? 'Static' : 'Dynamic'} Hosting Services Plan`;
      
      const hostingIndex = lineItems.findIndex(item => item.name.toLowerCase().includes('hosting'));
      if (hostingIndex >= 0) {
        setLineItems(prev => prev.map((item, idx) => {
          if (idx !== hostingIndex) return item;
          return { ...item, name, price };
        }));
      } else {
        setLineItems(prev => [
          ...prev,
          { name, description, price, quantity: 12 }
        ]);
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
      
      // Dynamically initialize the default pages checklist to only include existing presets
      const activeKeys = pages.filter(p => p.sectionKey === 'full_page_html').map(p => p.pageKey);
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
    setLineItems(prev => [...prev, { name: '', description: '', price: 0, quantity: 1 }]);

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (
    index: number,
    field: keyof InvoiceLineItem,
    value: string | number
  ) => {
    setLineItems(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          [field]:
            field === 'price' ? Number(value) : field === 'quantity' ? Number(value) : value,
        };
      })
    );
  };

  // ── Invoice totals ─────────────────────────────────────────
  const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = 0; // Removed VAT 11%
  let discountAmount = 0;
  if (discountType === 'percentage' && discountValue) {
    discountAmount = Math.round(subtotal * (discountValue / 100));
  } else if (discountType === 'fixed' && discountValue) {
    discountAmount = discountValue;
  }
  const total = Math.max(0, subtotal - discountAmount);

  // ── Create or Edit invoice ─────────────────────────────────────────
  const handleCreateOrEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !invoiceNumber || lineItems.some(i => !i.name || i.price <= 0))
      return;

    startTransition(async () => {
      try {
        if (editingInvoice) {
          // EDIT MODE
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
            const client = clients.find(c => c.id === selectedClientId);
            setInvoices(prev =>
              prev.map(inv =>
                inv.id === editingInvoice.id
                  ? ({ ...updatedInv, client } as any)
                  : inv
              )
            );
            setModalOpen(false);
            setEditingInvoice(null);
            setSelectedClientId('');
            setStatus('draft');
            setHostingType('none');
            setDiscountType('none');
            setDiscountValue(0);
            setLineItems([
              { name: 'Starter Company Profile Package', description: '', price: 5500000, quantity: 1 },
            ]);
            setInvoiceNumber(`INV-2026-${String(invoices.length + 2).padStart(3, '0')}`);
          }
        } else {
          // CREATE MODE
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
            const client = clients.find(c => c.id === selectedClientId);
            setInvoices(prev => [{ ...newInv, client } as any, ...prev]);
            setModalOpen(false);
            setLineItems([
              { name: 'Starter Company Profile Package', description: '', price: 5500000, quantity: 1 },
            ]);
            setSelectedClientId('');
            setStatus('draft');
            setHostingType('none');
            setDiscountType('none');
            setDiscountValue(0);
            setInvoiceNumber(`INV-2026-${String(invoices.length + 2).padStart(3, '0')}`);
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
      setInvoices(prev =>
        prev.map(inv => (inv.id === id ? { ...inv, status: 'paid', paidAt: new Date() } : inv))
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
          setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete.id));
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
  const filteredInvoices = invoices.filter(inv => {
    const client = clients.find(c => c.id === inv.clientId);
    const clientName = client?.name || '';
    const effectiveStatus = getEffectiveStatus(inv);
    const matchesClient = !clientFilterId || inv.clientId === clientFilterId;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter === 'all' || effectiveStatus === statusFilter;
    return matchesClient && matchesSearch && matchesFilter;
  });

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className={previewInvoice && mounted ? '' : 'space-y-8 animate-fade-up'}>

      {/* ── Invoice Preview (replaces page content inline, keeping sidebar layout) ── */}
      {previewInvoice && mounted ? (
        <InvoicePreview
          invoice={previewInvoice}
          clients={clients}
          onClose={() => setPreviewInvoice(null)}
        />
      ) : (
        <>

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Billing &amp; Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review accounts receivables, generate client invoices, and track payments.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start shrink-0">
          <Link
            href="/admin/invoices/presets"
            className="flex items-center justify-center h-[40px] w-[40px] rounded-xl bg-card border border-border hover:bg-muted active-press transition-all duration-200 cursor-pointer text-foreground"
            title="Invoices presets"
            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
          >
            <Sliders size={16} />
          </Link>
          <button
            onClick={() => {
              const activeKeys = allPagePresets
                .filter(p => p.sectionKey === 'full_page_html')
                .map(p => p.pageKey);
              setIncludedPages(['cover', ...activeKeys]);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 h-[40px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active-press transition-all duration-200 cursor-pointer"
            style={{ boxShadow: '0 0 15px rgba(206, 248, 78, 0.25)' }}
          >
            <Plus size={16} />
            Create Invoice
          </button>
        </div>
      </div>

      {/* ── Search + filter bar ── */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-card border border-border">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by invoice number or client name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          <div className="flex rounded-xl bg-muted/40 border border-border p-0.5">
            {['all', 'paid', 'issued', 'past_due', 'draft'].map(filt => (
              <button
                key={filt}
                onClick={() => setStatusFilter(filt)}
                className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer font-medium ${
                  statusFilter === filt
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {filt.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Client filter badge ── */}
      {clientFilterId && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary self-start animate-fade-in-scale">
          <span>Filtering invoices for client: <strong>{clients.find(c => c.id === clientFilterId)?.name}</strong></span>
          <button 
            onClick={() => {
              setClientFilterId('');
              setSelectedClientId('');
              if (typeof window !== 'undefined') {
                window.history.replaceState({}, '', '/admin/invoices');
              }
            }}
            className="p-0.5 rounded-md hover:bg-primary/20 cursor-pointer ml-1 text-primary hover:text-foreground transition-all"
            title="Clear Filter"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Invoices table ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Gathering billing ledger...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-dashed border-border bg-card">
          <Receipt className="mx-auto text-muted-foreground opacity-30 mb-3" size={32} />
          <h3 className="font-semibold text-base">No Invoices Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria, clearing filters, or creating a new client invoice.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Billing Totals</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredInvoices.map(invoice => {
                  const client = clients.find(c => c.id === invoice.clientId);
                  return (
                    <tr 
                      key={invoice.id} 
                      onClick={() => {
                        const effectiveStatus = getEffectiveStatus(invoice);
                        if (effectiveStatus === 'paid') {
                          setPreviewInvoice(invoice);
                        } else {
                          startEditInvoice(invoice);
                        }
                      }}
                      className="hover:bg-muted/10 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-xs">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Client logo next to client name */}
                          {client && client.websiteAddress ? (
                            <img 
                              src={`https://www.google.com/s2/favicons?domain=${client.websiteAddress.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}&sz=64`}
                              alt={client.name} 
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                              className="w-8 h-8 rounded-lg border border-border object-contain bg-white p-1 shrink-0 shadow-xs"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                              {client?.name ? client.name.substring(0, 2).toUpperCase() : '??'}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">
                              {client?.name || 'Unknown Client'}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {client?.companyName || 'No Company'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-foreground">{formatCurrencyIDR(invoice.total)}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <div>
                          Issued:{' '}
                          {invoice.issuedAt
                            ? new Date(invoice.issuedAt).toLocaleDateString('id-ID')
                            : 'Draft'}
                        </div>
                        <div className="font-medium text-amber-500/90 mt-0.5">
                          Due: {new Date(invoice.dueDate).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(() => {
                          const effectiveStatus = getEffectiveStatus(invoice);
                          return (
                            <span
                              className={`text-[9px] uppercase font-black px-2 py-0.75 rounded-md border tracking-wider font-mono ${getStatusBadge(effectiveStatus)}`}
                            >
                              {effectiveStatus.replace('_', ' ')}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {/* Slot 1: Preview */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewInvoice(invoice);
                            }}
                            className="relative group/btn w-9 h-9 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
                            title="Preview Invoice Details"
                          >
                            <Eye size={14} />
                            {/* Tooltip */}
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-card text-foreground text-[10px] font-bold rounded-lg border border-border opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-30">
                              Preview
                            </span>
                          </button>

                          {/* Slot 2: Mark Paid (always occupies slot, even if empty/hidden) */}
                          <div className="w-9 h-9 flex items-center justify-center shrink-0">
                            {getEffectiveStatus(invoice) !== 'paid' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsPaid(invoice.id);
                                }}
                                className="relative group/btn w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
                                title="Mark Invoice as Paid"
                              >
                                <Check size={14} />
                                {/* Tooltip */}
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-card text-foreground text-[10px] font-bold rounded-lg border border-border opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-30">
                                  Mark Paid
                                </span>
                              </button>
                            ) : (
                              <div className="w-9 h-9" />
                            )}
                          </div>

                          {/* Slot 3: Delete */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerDeleteConfirmation(invoice);
                            }}
                            className="relative group/btn w-9 h-9 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
                            title="Delete Invoice"
                          >
                            <Trash2 size={14} />
                            {/* Tooltip */}
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-card text-foreground text-[10px] font-bold rounded-lg border border-border opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-30">
                              Delete
                            </span>
                          </button>
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

      {/* ── Create invoice modal ── */}
      {mounted && modalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => {
              setModalOpen(false);
              setEditingInvoice(null);
              setSelectedClientId('');
              setStatus('draft');
              setHostingType('none');
              setDiscountType('none');
              setDiscountValue(0);
              setLineItems([{ name: 'Starter Company Profile Package', description: '', price: 5500000, quantity: 1 }]);
              const activeKeys = allPagePresets.filter(p => p.sectionKey === 'full_page_html').map(p => p.pageKey);
              setIncludedPages(['cover', ...activeKeys]);
            }}
          />

          <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border p-6 shadow-2xl animate-fade-in-scale max-h-[82vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-primary" />
                <h3 className="text-lg font-bold">
                  {editingInvoice ? `Edit Invoice ${invoiceNumber}` : 'Generate Invoice'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setEditingInvoice(null);
                  setSelectedClientId('');
                  setStatus('draft');
                  setHostingType('none');
                  setDiscountType('none');
                  setDiscountValue(0);
                  setLineItems([{ name: 'Starter Company Profile Package', description: '', price: 5500000, quantity: 1 }]);
                  setInvoiceNumber(`INV-2026-${String(invoices.length + 2).padStart(3, '0')}`);
                  const activeKeys = allPagePresets.filter(p => p.sectionKey === 'full_page_html').map(p => p.pageKey);
                  setIncludedPages(['cover', ...activeKeys]);
                }}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrEditInvoice} className="space-y-6">

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Client selector */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Select Client Account *
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={selectedClientId}
                      onChange={e => handleClientSelect(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-card">
                        -- Select Client --
                      </option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id} className="bg-card">
                          {c.name} ({c.companyName || 'No Company'})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                {/* Invoice number */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm font-mono focus:border-primary/40 focus:outline-none transition-all text-foreground"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Due date */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Invoice Status
                  </label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground appearance-none cursor-pointer"
                    >
                      <option value="draft" className="bg-card">Draft (No generation date)</option>
                      <option value="issued" className="bg-card">Issued (Awaiting Payment)</option>
                      <option value="paid" className="bg-card">Paid (Fully Collected)</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Hosting Subscription Selector Row */}
              <div className="grid gap-4 sm:grid-cols-2 bg-muted/10 p-4 rounded-xl border border-border/80 animate-fade-in-scale">
                {/* Hosting Subscription */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Hosting Subscription
                  </label>
                  <div className="relative">
                    <select
                      value={hostingType}
                      onChange={e => handleHostingTypeChange(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground appearance-none cursor-pointer"
                    >
                      <option value="none" className="bg-card">None (No hosting billed)</option>
                      <option value="static" className="bg-card">Static Hosting (IDR 150.000 / mo)</option>
                      <option value="dynamic" className="bg-card">Dynamic Hosting (IDR 350.000 / mo)</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                {/* Info Text */}
                <div className="flex items-center">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    💡 Selecting a hosting plan automatically appends or updates a hosting subscription item in your ledger below, pre-populating standard rates and defaulting the quantity to <strong>12 months</strong> (fully editable).
                  </p>
                </div>
              </div>


              {/* ── Line items ── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Line Items
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold cursor-pointer"
                  >
                    <PlusCircle size={14} />
                    Add Line Item
                  </button>
                </div>

                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-3 bg-muted/20 p-4 rounded-xl border border-border animate-fade-in-scale"
                    >
                      <div className="flex gap-3 items-end w-full">
                        {/* Item name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Item Title *
                            </label>
                            {linePresets.length > 0 && (
                              <select
                                onChange={(e) => {
                                  const presetId = e.target.value;
                                  if (presetId) {
                                    const preset = linePresets.find(p => p.id === presetId);
                                    if (preset) {
                                      handleLineItemChange(index, 'name', preset.name);
                                      handleLineItemChange(index, 'price', preset.price);
                                      handleLineItemChange(index, 'description', preset.description || '');
                                    }
                                    e.target.value = ''; // Reset select after choosing
                                  }
                                }}
                                className="text-[10px] text-primary bg-transparent border-none focus:outline-none cursor-pointer font-bold hover:underline"
                                defaultValue=""
                              >
                                <option value="" disabled>-- Load Preset --</option>
                                {linePresets.map(preset => (
                                  <option key={preset.id} value={preset.id} className="bg-card text-foreground">
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
                            onChange={e => handleLineItemChange(index, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-xs focus:outline-none text-foreground font-semibold"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="w-20 shrink-0">
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Qty
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={e => handleLineItemChange(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-xs focus:outline-none text-foreground"
                          />
                        </div>

                        {/* Rate */}
                        <div className="w-32 shrink-0">
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Rate (IDR)
                          </label>
                          <input
                            type="text"
                            required
                            inputMode="numeric"
                            value={formatInputNumberIDR(item.price)}
                            onChange={e => {
                              const rawVal = e.target.value.replace(/[^0-9]/g, '');
                              handleLineItemChange(index, 'price', rawVal ? Number(rawVal) : 0);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-xs focus:outline-none text-foreground font-semibold"
                          />
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(index)}
                          disabled={lineItems.length === 1}
                          className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-500/20 cursor-pointer shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Description textarea */}
                      <div className="w-full">
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Sub-features / Description (Optional — one per line)
                        </label>
                        <textarea
                          placeholder={
                            'e.g. Landing Page, Up to 10 Pages\nMobile Responsive\nCustom UI/UX Designs & Animations'
                          }
                          value={item.description || ''}
                          onChange={e => handleLineItemChange(index, 'description', e.target.value)}
                          rows={5}
                          className="w-full px-3 py-2 rounded-lg bg-card border border-border text-xs focus:outline-none text-foreground"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Totals summary ── */}
              <div className="rounded-xl bg-muted/20 border border-border overflow-hidden">
                {/* Subtotal row + discount toggles */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-normal">Subtotal</span>
                    {/* Discount type icon toggles */}
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
                        className={`w-6 h-6 rounded-md text-[11px] font-black transition-all cursor-pointer flex items-center justify-center border ${
                          discountType === 'percentage'
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
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
                        className={`w-6 h-6 rounded-md text-[10px] font-black transition-all cursor-pointer flex items-center justify-center border ${
                          discountType === 'fixed'
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        Rp
                      </button>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-normal tabular-nums">{formatCurrencyIDR(subtotal)}</span>
                </div>

                {/* Discount input row — only when a type is selected */}
                {discountType !== 'none' && (
                  <div className="flex items-center justify-between px-4 pb-3 gap-3 animate-fade-in-scale">
                    <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold shrink-0">
                      <span>Discount</span>
                      <span className="text-red-400/60">({discountType === 'percentage' ? '%' : 'Rp'})</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      {discountType === 'percentage' && (
                        <span className="text-xs text-red-400 font-bold shrink-0">-</span>
                      )}
                      <input
                        type={discountType === 'percentage' ? 'number' : 'text'}
                        inputMode="numeric"
                        min="0"
                        max={discountType === 'percentage' ? '100' : undefined}
                        placeholder={discountType === 'percentage' ? '0' : '0'}
                        value={discountType === 'percentage'
                          ? (discountValue === 0 ? '' : discountValue)
                          : (discountValue === 0 ? '' : formatInputNumberIDR(discountValue))}
                        onChange={e => {
                          if (discountType === 'percentage') {
                            const val = Math.min(100, Math.max(0, Number(e.target.value)));
                            setDiscountValue(val);
                          } else {
                            const rawVal = e.target.value.replace(/[^0-9]/g, '');
                            setDiscountValue(rawVal ? Number(rawVal) : 0);
                          }
                        }}
                        className="w-28 px-2.5 py-1 rounded-lg bg-red-500/5 border border-red-500/20 text-xs text-right text-red-400 font-semibold focus:outline-none focus:border-red-500/40 transition-all tabular-nums"
                      />
                      {discountType === 'percentage' && (
                        <span className="text-xs text-red-400 font-bold shrink-0">%</span>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Invoice Pages inclusion toggles ── */}
                <div className="border-t border-border/60 p-4 bg-muted/5">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
                    Include Invoice Pages
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Cover Page */}
                    <label className="flex items-center gap-2.5 p-2 rounded-xl border border-border/50 bg-card hover:bg-muted cursor-pointer transition-all select-none">
                      <input
                        type="checkbox"
                        checked={includedPages.includes('cover')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setIncludedPages(prev => [...prev, 'cover']);
                          } else {
                            setIncludedPages(prev => prev.filter(p => p !== 'cover'));
                          }
                        }}
                        className="accent-primary rounded"
                      />
                      <span className="text-xs font-semibold text-foreground">{getPageTitle('cover')}</span>
                    </label>

                    {/* Dynamic custom & standard pages checklist */}
                    {allPagePresets
                      .filter(p => p.sectionKey === 'full_page_html')
                      .map(customPage => {
                        const isChecked = includedPages.includes(customPage.pageKey);
                        const pageTitle = getPageTitle(customPage.pageKey);

                        return (
                          <label
                            key={customPage.id}
                            className="flex items-center gap-2.5 p-2 rounded-xl border border-border/50 bg-card hover:bg-muted cursor-pointer transition-all select-none capitalize"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                  if (e.target.checked) {
                                    setIncludedPages(prev => [...prev, customPage.pageKey]);
                                  } else {
                                    setIncludedPages(prev => prev.filter(p => p !== customPage.pageKey));
                                  }
                              }}
                              className="accent-primary rounded"
                            />
                            <span className="text-xs font-semibold text-foreground">{pageTitle}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Divider + total row */}
                <div className="border-t border-border/60 flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Invoice Total</span>
                  <div className="text-right">
                    {discountAmount > 0 && (
                      <span className="block text-[10px] text-red-400 font-bold tabular-nums mb-0.5">
                        -{formatCurrencyIDR(discountAmount)}
                      </span>
                    )}
                    <span
                      className="text-xl font-black text-primary tabular-nums"
                      style={{ textShadow: '0 0 5px rgba(206, 248, 78, 0.15)' }}
                    >
                      {formatCurrencyIDR(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Form actions ── */}
              <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingInvoice(null);
                    setSelectedClientId('');
                    setStatus('draft');
                    setHostingType('none');
                    setDiscountType('none');
                    setDiscountValue(0);
                    setLineItems([{ name: 'Starter Company Profile Package', description: '', price: 5500000, quantity: 1 }]);
                    setInvoiceNumber(`INV-2026-${String(invoices.length + 2).padStart(3, '0')}`);
                    const activeKeys = allPagePresets.filter(p => p.sectionKey === 'full_page_html').map(p => p.pageKey);
                    setIncludedPages(['cover', ...activeKeys]);
                  }}
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
                  {isPending ? (editingInvoice ? 'Saving...' : 'Generating...') : (editingInvoice ? 'Save Changes' : 'Generate Invoice')}
                  <Receipt size={14} />
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Delete invoice confirmation modal ── */}
      {mounted && deleteModalOpen && invoiceToDelete && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => {
              setDeleteModalOpen(false);
              setInvoiceToDelete(null);
              setDeleteConfirmText('');
            }}
          />

          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl animate-fade-in-scale">
            <div className="flex items-center gap-3 pb-3 border-b border-border mb-4">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Confirm Invoice Deletion
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Action cannot be undone
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to delete invoice <strong className="font-mono text-foreground">{invoiceToDelete.invoiceNumber}</strong>?
                All related line items and billing history will be permanently removed.
              </p>

              {invoiceToDelete.status === 'paid' && (
                <div className="bg-red-500/5 border border-red-500/10 p-3.5 rounded-xl space-y-3 animate-fade-in-scale">
                  <p className="text-[11px] text-red-400 font-medium leading-relaxed">
                    ⚠️ <strong>Warning:</strong> This invoice has been marked as <strong>PAID</strong>. Deleting a paid invoice is highly restricted as it affects income auditing and client statement history.
                  </p>
                  <div>
                    <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wide mb-1.5">
                      Type 'CONFIRM' to authorize deletion
                    </label>
                    <input
                      type="text"
                      placeholder="CONFIRM"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-red-500/20 text-xs font-mono uppercase focus:border-red-500/40 focus:outline-none transition-all text-red-400 placeholder:text-red-500/20"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setInvoiceToDelete(null);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteInvoice}
                disabled={isPending || (invoiceToDelete.status === 'paid' && deleteConfirmText !== 'CONFIRM')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  invoiceToDelete.status === 'paid' && deleteConfirmText !== 'CONFIRM'
                    ? 'bg-red-500/10 text-red-400/40 border border-red-500/10 cursor-not-allowed opacity-50'
                    : 'bg-red-500 text-white hover:opacity-90 active-press'
                }`}
                style={
                  invoiceToDelete.status === 'paid' && deleteConfirmText !== 'CONFIRM'
                    ? undefined
                    : { boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)' }
                }
              >
                {isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                Delete Invoice
              </button>
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
