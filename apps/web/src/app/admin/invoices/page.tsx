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
  CreditCard,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import {
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
  uploadReceiptAction,
  createPayout,
  syncInvoicePayoutAction,
} from '@/lib/db/queries';
import {
  invalidateCache,
  CACHE_KEYS,
  getCachedClients,
  getCachedInvoices,
} from '@/lib/data-cache';
import { InvoiceLineItem, formatCurrencyIDR, getStatusBadge } from './components/invoice-types';
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

type InvoiceStatusFilter = 'all' | 'draft' | 'issued' | 'partially_paid' | 'past_due' | 'paid';
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

// ── Copy-paste parser helper ──────────────────────────────────
const parsePastedItems = (text: string): InvoiceLineItem[] => {
  const parsedItems: InvoiceLineItem[] = [];
  const lines = text.split('\n').map((line) => line.trim());

  let currentTitle = '';
  let currentDescLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Detect price: starts with Rp/IDR/Rp./IDR. (optional), followed by numbers and dots/commas
    const isPrice = /^(?:rp\.?|idr\.?)?\s*[\d,.-]+$/i.test(line) && /[\d]/.test(line);

    if (isPrice) {
      const priceVal = parseInt(line.replace(/[^0-9]/g, ''), 10) || 0;
      if (currentTitle) {
        parsedItems.push({
          name: currentTitle,
          description: currentDescLines.join('\n'),
          price: priceVal,
          quantity: 1,
        });
        currentTitle = '';
        currentDescLines = [];
      }
    } else {
      if (!currentTitle) {
        currentTitle = line;
      } else {
        currentDescLines.push(line);
      }
    }
  }

  if (currentTitle) {
    parsedItems.push({
      name: currentTitle,
      description: currentDescLines.join('\n'),
      price: 0,
      quantity: 1,
    });
  }

  return parsedItems;
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
    'draft' | 'issued' | 'paid' | 'partially_paid' | 'past_due' | 'written_off'
  >('draft');
  const [dueDate, setDueDate] = useState('');
  const [hostingType, setHostingType] = useState<'static' | 'dynamic' | 'none'>('none');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'none'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Partially paid fields
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [proofOfPaymentUrl, setProofOfPaymentUrl] = useState<string>('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receivedBy, setReceivedBy] = useState<'company' | 'fredrick' | 'nicholas'>('company');
  const [paymentReceivedBy, setPaymentReceivedBy] = useState<'company' | 'fredrick' | 'nicholas'>('company');

  // Record Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<MockInvoice | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partially_paid'>('paid');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [receiptFileBase64, setReceiptFileBase64] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [isLoggingPayment, setIsLoggingPayment] = useState(false);

  // Image/PDF previewer state
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [activeReceiptIdx, setActiveReceiptIdx] = useState<number>(0);

  // AI OCR States
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string | null>(null);

  // Revert status from paid modal state
  const [revertModalOpen, setRevertModalOpen] = useState(false);
  const [invoiceToRevert, setInvoiceToRevert] = useState<MockInvoice | null>(null);
  const [revertStatusSelection, setRevertStatusSelection] = useState<
    'draft' | 'issued' | 'partially_paid' | 'past_due' | 'written_off'
  >('issued');
  const [revertAmountPaid, setRevertAmountPaid] = useState<number>(0);
  const [keepReceipt, setKeepReceipt] = useState<boolean>(true);
  const [isRevertingStatus, setIsRevertingStatus] = useState(false);

  // Line items
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      name: 'Starter Company Profile Package',
      description: '',
      price: 5500000,
      quantity: 1,
    },
  ]);

  // Copy-paste parser states
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const startEditInvoice = (invoice: MockInvoice) => {
    setEditingInvoice(invoice);
    setSelectedClientId(invoice.clientId);
    setInvoiceNumber(invoice.invoiceNumber);
    setStatus(invoice.status);
    setDueDate(
      invoice.dueDate ? new Date(invoice.dueDate).toISOString().substring(0, 10) : ''
    );
    setAmountPaid(invoice.amountPaid || 0);
    setProofOfPaymentUrl(invoice.proofOfPaymentUrl || '');
    setReceivedBy(invoice.receivedBy || 'company');

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

    setPasteMode(false);
    setPastedText('');
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

      const price = type === 'static' ? 200000 : 350000;
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
      const price = type === 'static' ? 200000 : 350000;
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
        getCachedInvoices(),
        getCachedClients(),
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

  const handleImportPastedText = () => {
    if (!pastedText.trim()) return;

    const parsed = parsePastedItems(pastedText);
    if (parsed.length === 0) return;

    const isDefaultSingleItem =
      lineItems.length === 1 &&
      lineItems[0].name === 'Starter Company Profile Package' &&
      lineItems[0].price === 5500000 &&
      lineItems[0].description === '';

    if (isDefaultSingleItem) {
      setLineItems(parsed);
    } else {
      setLineItems((prev) => [...prev, ...parsed]);
    }

    setPasteMode(false);
    setPastedText('');
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

  // Hosting line item reference (shared with the line-items list below)
  const hostingIndex = lineItems.findIndex((item) =>
    item.name.toLowerCase().includes('hosting')
  );
  const hostingItem = hostingIndex >= 0 ? lineItems[hostingIndex] : null;

  const resetForm = () => {
    setEditingInvoice(null);
    setSelectedClientId('');
    setStatus('draft');
    setHostingType('none');
    setDiscountType('none');
    setDiscountValue(0);
    setAmountPaid(0);
    setProofOfPaymentUrl('');
    setReceiptFileName('');
    setReceivedBy('company');
    setLineItems([
      {
        name: 'Starter Company Profile Package',
        description: '',
        price: 5500000,
        quantity: 1,
      },
    ]);
    setPasteMode(false);
    setPastedText('');
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
            amountPaid,
            proofOfPaymentUrl: proofOfPaymentUrl || null,
            receivedBy,
          });

          if (updatedInv) {
            invalidateCache(CACHE_KEYS.INVOICES, CACHE_KEYS.PAYOUTS);
            const client = clients.find((c) => c.id === selectedClientId);
            setInvoices((prev) =>
              prev.map((inv) =>
                inv.id === editingInvoice.id
                  ? ({ ...updatedInv, client } as any)
                  : inv
              )
            );

            // Log smart payout if payment received by a founder personally (Self-healing auto-sync)
            const finalPayoutAmount = (status === 'paid' || status === 'partially_paid') ? (status === 'paid' ? total : amountPaid) : 0;
            await syncInvoicePayoutAction(invoiceNumber, receivedBy, finalPayoutAmount, dueDate ? new Date(dueDate) : new Date());

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
            amountPaid,
            proofOfPaymentUrl: proofOfPaymentUrl || null,
            receivedBy,
          });

          if (newInv) {
            invalidateCache(CACHE_KEYS.INVOICES, CACHE_KEYS.PAYOUTS);
            const client = clients.find((c) => c.id === selectedClientId);
            setInvoices((prev) => [{ ...newInv, client } as any, ...prev]);

            // Log smart payout if payment received by a founder personally (Self-healing auto-sync)
            const finalPayoutAmount = (status === 'paid' || status === 'partially_paid') ? (status === 'paid' ? total : amountPaid) : 0;
            await syncInvoicePayoutAction(invoiceNumber, receivedBy, finalPayoutAmount, dueDate ? new Date(dueDate) : new Date());

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
  const handleMarkAsPaid = (invoice: MockInvoice) => {
    setPaymentInvoice(invoice);
    setPaymentStatus(invoice.status === 'partially_paid' ? 'partially_paid' : 'paid');
    setPaymentAmount(invoice.status === 'partially_paid' ? (invoice.amountPaid || Math.round(invoice.total * 0.5)) : invoice.total);
    setReceiptFileBase64('');
    setReceiptFileName('');
    setPaymentReceivedBy(invoice.receivedBy || 'company');
    setPaymentModalOpen(true);
  };

  const triggerRevertPaidStatus = (invoice: MockInvoice) => {
    setInvoiceToRevert(invoice);
    setRevertStatusSelection('issued');
    setRevertAmountPaid(invoice.amountPaid || 0);
    setKeepReceipt(!!invoice.proofOfPaymentUrl);
    setRevertModalOpen(true);
  };

  const handleRevertStatus = async () => {
    if (!invoiceToRevert) return;
    setIsRevertingStatus(true);
    try {
      const finalAmountPaid = revertStatusSelection === 'partially_paid' ? revertAmountPaid : 0;
      const receiptUrl = keepReceipt ? (invoiceToRevert.proofOfPaymentUrl || null) : null;
      
      const updated = await updateInvoice(invoiceToRevert.id, {
        status: revertStatusSelection,
        amountPaid: finalAmountPaid,
        proofOfPaymentUrl: receiptUrl,
        paidAt: null, // clear paid date
      });

      if (updated) {
        await syncInvoicePayoutAction(invoiceToRevert.invoiceNumber, invoiceToRevert.receivedBy, finalAmountPaid, new Date());
        invalidateCache(CACHE_KEYS.INVOICES, CACHE_KEYS.PAYOUTS);
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === invoiceToRevert.id
              ? ({
                  ...inv,
                  status: revertStatusSelection,
                  amountPaid: finalAmountPaid,
                  proofOfPaymentUrl: receiptUrl,
                  paidAt: null,
                  updatedAt: new Date(),
                } as any)
              : inv
          )
        );
        setRevertModalOpen(false);
        setInvoiceToRevert(null);
      }
    } catch (err) {
      console.error('Failed to revert invoice status', err);
    } finally {
      setIsRevertingStatus(false);
    }
  };

  // ── Secure Local Tesseract OCR Engine (Client-side, 100% private, zero API keys) ──
  const loadTesseract = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).Tesseract) {
        resolve((window as any).Tesseract);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/tesseract.js@5.0.5/dist/tesseract.min.js';
      script.onload = () => resolve((window as any).Tesseract);
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  };

  const parseIDRAmountString = (str: string): number | null => {
    // Remove trailing dot/comma or spaces
    let cleanStr = str.replace(/[.,]$/, '').trim();
    
    // Split by dots and commas to analyze the decimal / thousands structure
    const parts = cleanStr.split(/[.,]/);
    
    // If it ends with .00 or ,00 (cents), remove it
    if (parts.length > 1 && parts[parts.length - 1] === '00') {
      cleanStr = parts.slice(0, -1).join('');
    } else if (parts.length > 1 && parts[parts.length - 1].length === 2) {
      // If the last part has length 2 (e.g. .50 or ,00 cents), strip it as cents
      cleanStr = parts.slice(0, -1).join('');
    } else {
      // Otherwise, it's just thousands separators, strip all non-digits
      cleanStr = cleanStr.replace(/[^0-9]/g, '');
    }
    
    const val = parseInt(cleanStr.replace(/[^0-9]/g, ''), 10);
    return isNaN(val) ? null : val;
  };

  const performActualOCR = async (dataUrl: string): Promise<number | null> => {
    try {
      const Tesseract = await loadTesseract();
      const result = await Tesseract.recognize(dataUrl, 'eng');
      const text = result?.data?.text || '';
      console.log("OCR Local Extracted Text:\n", text);

      // 1. Split text into lines to look for contextual keywords
      const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
      const amountKeywords = [
        'transfer amount',
        'amount paid',
        'jumlah transfer',
        'nominal',
        'total',
        'jumlah',
        'idr',
        'rp'
      ];

      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        // If this line contains an amount indicator keyword
        if (amountKeywords.some(keyword => lowerLine.includes(keyword))) {
          // Look for any number groups in the line (e.g. 2,750,000.00 or 161.107)
          const numbers = line.match(/\d[\d.,]*/g);
          if (numbers) {
            for (const numStr of numbers) {
              const val = parseIDRAmountString(numStr);
              if (val && val >= 10000 && val <= 1000000000) {
                console.log(`OCR: Found matching amount '${numStr}' (parsed: ${val}) via line keyword context.`);
                return val;
              }
            }
          }
        }
      }

      // 2. Look for strong IDR pattern matches (e.g. 2,750,000 or 161.107) anywhere in the text
      const idrPattern = /\b\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?\b/g;
      const idrMatches = text.match(idrPattern);
      if (idrMatches) {
        for (const match of idrMatches) {
          const val = parseIDRAmountString(match);
          if (val && val >= 10000 && val <= 1000000000) {
            console.log(`OCR: Found matching amount '${match}' (parsed: ${val}) via IDR pattern matching.`);
            return val;
          }
        }
      }

      // 3. Fallback to scanning all numeric groups for the first plausible amount (between 10k and 1B IDR)
      const digitGroups = text.match(/\d+[\d.,]*/g);
      if (digitGroups) {
        let bestCandidate = null;
        for (const group of digitGroups) {
          const val = parseIDRAmountString(group);
          if (val && val >= 10000 && val <= 1000000000) {
            const strippedLength = val.toString().length;
            // Plausible amount length check
            if (strippedLength >= 5 && strippedLength <= 9) {
              if (!bestCandidate || val > bestCandidate) {
                bestCandidate = val;
              }
            }
          }
        }
        if (bestCandidate !== null) {
          console.log(`OCR: Found fallback amount (parsed: ${bestCandidate}).`);
          return bestCandidate;
        }
      }
      return null;
    } catch (e) {
      console.error("Local client-side OCR failed: ", e);
      return null;
    }
  };

  // ── AI OCR Amount Extractor Fallback Helper ────────────────────────
  const extractAmountFromFilename = (filename: string, fallbackTotal: number): number => {
    // If the filename contains typical macOS/Windows screenshot markers, ignore numbers inside
    const isScreenshot = /screen\s*shot|screenshot/i.test(filename) || 
                         /\d{2}\.\d{2}\.\d{2}/.test(filename) || 
                         /\d{4}-\d{2}-\d{2}/.test(filename);
                         
    if (!isScreenshot) {
      // 1. Check for 'k' notation, e.g. 150k -> 150000
      const kMatch = filename.toLowerCase().match(/(\d+(?:\.\d+)?)\s*k/);
      if (kMatch) {
        const val = parseFloat(kMatch[1]);
        if (!isNaN(val)) return val * 1000;
      }
      
      // 2. Extract any sequence of digits, filtering out invoice ref and date patterns
      const cleanName = filename.replace(/INV-\d+-\d+/gi, '').replace(/\d{4}-\d{2}-\d{2}/g, '');
      const digitGroups = cleanName.match(/\d+[\d.,]*/g);
      if (digitGroups) {
        for (const group of digitGroups) {
          const cleaned = group.replace(/[^0-9]/g, '');
          const val = parseInt(cleaned, 10);
          // Plausible IDR amount checks
          if (!isNaN(val) && val >= 10000) {
            return val;
          }
        }
      }
    }
    
    // 3. Milestone standard fallback (50% Down Payment or 5M default)
    return fallbackTotal ? Math.round(fallbackTotal / 2) : 5000000;
  };

  // ── Client-side image compressor & drawer uploader ───────────
  const handleCompressAndSetFile = (file: File) => {
    if (!file) return;
    setReceiptFileName(file.name);
    setUploadingReceipt(true);
    setOcrScanning(true);
    setOcrSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setReceiptFileBase64(dataUrl);

          // Run Real Client-side local OCR scanning on receipt canvas
          setTimeout(async () => {
            let extractedAmount = await performActualOCR(dataUrl);
            if (!extractedAmount) {
              // Fallback to safe filename extraction
              extractedAmount = extractAmountFromFilename(file.name, paymentInvoice ? paymentInvoice.total : 0);
            }
            
            setPaymentAmount(extractedAmount);
            setOcrScanning(false);
            setOcrSuccessMsg(`Secure OCR: Extracted Rp ${formatInputNumberIDR(extractedAmount)} successfully from receipt!`);

            setTimeout(() => {
              setOcrSuccessMsg(null);
            }, 6000);
          }, 500);
        } else {
          setOcrScanning(false);
        }
        setUploadingReceipt(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCompressAndUploadForDrawer = (file: File) => {
    if (!file) return;
    setReceiptFileName(file.name);
    setUploadingReceipt(true);
    setOcrScanning(true);
    setOcrSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);

          try {
            const url = await uploadReceiptAction(file.name, dataUrl);
            setProofOfPaymentUrl((prev) => (prev ? `${prev}|${url}` : url));

            // Run Real Client-side local OCR scanning on receipt canvas
            setTimeout(async () => {
              let extractedAmount = await performActualOCR(dataUrl);
              if (!extractedAmount) {
                // Fallback to safe filename extraction
                extractedAmount = extractAmountFromFilename(file.name, total || 0);
              }
              
              setAmountPaid(extractedAmount);
              setOcrScanning(false);
              setOcrSuccessMsg(`Secure OCR: Extracted Rp ${formatInputNumberIDR(extractedAmount)} successfully from receipt!`);

              setTimeout(() => {
                setOcrSuccessMsg(null);
              }, 6000);
            }, 500);
          } catch (err) {
            console.error("Failed to upload drawer receipt: ", err);
            setOcrScanning(false);
          }
        }
        setUploadingReceipt(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
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
          await syncInvoicePayoutAction(invoiceToDelete.invoiceNumber, 'company', 0);
          invalidateCache(CACHE_KEYS.INVOICES, CACHE_KEYS.PAYOUTS);
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
    partially_paid: invoices.filter((i) => i.status === 'partially_paid').length,
    past_due: invoices.filter((i) => getEffectiveStatus(i) === 'past_due').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
  };

  const statusOptions: FilterOption<InvoiceStatusFilter>[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'draft', label: 'Draft', count: counts.draft },
    { value: 'issued', label: 'Issued', count: counts.issued },
    { value: 'partially_paid', label: 'Partially paid', count: counts.partially_paid },
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
                  const invDomain = client?.websiteAddress ? client.websiteAddress.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : null;
                  const invFavicon = invDomain ? `https://www.google.com/s2/favicons?domain=${invDomain}&sz=64` : null;
                  const effectiveStatus = getEffectiveStatus(invoice);

                  return (
                    <div
                      key={invoice.id}
                      className={cn(
                        'group flex items-center justify-between gap-4 py-4 px-3 -mx-3 rounded-lg border border-transparent',
                        TABLE_ROW_HOVER,
                      )}
                    >
                      {/* Left + Middle Clickable Region */}
                      <div
                        onClick={() => {
                          if (effectiveStatus === 'draft') {
                            startEditInvoice(invoice);
                          } else {
                            setPreviewInvoice(invoice);
                          }
                        }}
                        className="min-w-0 flex-1 flex items-center justify-between gap-4 cursor-pointer active-press"
                      >
                        {/* Left: client + invoice number */}
                        <div className="min-w-0 flex-1 flex items-center gap-3">
                          {/* Logo avatar container */}
                          <div className="w-8 h-8 rounded-full border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                            {invFavicon ? (
                              <>
                                <img
                                  src={invFavicon}
                                  alt={client?.name || ''}
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
                                <span className="text-[10px] font-bold text-muted-foreground" style={{ display: 'none' }}>
                                  {(client?.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {(client?.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground truncate">
                              {client?.name || 'Unknown client'}
                            </p>
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border capitalize select-none",
                              getStatusBadge(effectiveStatus)
                            )}>
                              {effectiveStatus.replace('_', ' ')}
                            </span>
                            {((effectiveStatus === 'paid' || effectiveStatus === 'partially_paid') && !invoice.proofOfPaymentUrl) && (
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsPaid(invoice);
                                }}
                                className="inline-flex items-center gap-0.5 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-bold select-none animate-pulse-subtle hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 active:scale-95 transition-all duration-150 cursor-pointer"
                                title="Click to quickly upload receipt or log payment"
                              >
                                ⚠️ Missing Receipt
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="font-mono">{invoice.invoiceNumber}</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                            <span>
                              Issued:{' '}
                              {invoice.issuedAt
                                ? new Date(invoice.issuedAt).toLocaleDateString('id-ID')
                                : 'Draft'}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                            <span>
                              Due {new Date(invoice.dueDate).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          </div>
                        </div>

                        {/* Middle: amount */}
                        <div className="hidden sm:block text-right shrink-0">
                          {invoice.status === 'partially_paid' ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xs line-through text-muted-foreground tabular-nums">
                                {formatCurrencyIDR(invoice.total)}
                              </span>
                              <span className="text-sm font-bold text-primary tabular-nums">
                                {formatCurrencyIDR(invoice.total - (invoice.amountPaid || 0))} left
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-foreground tabular-nums">
                              {formatCurrencyIDR(invoice.total)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: actions — single 3-dot menu with labeled items */}
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
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
                                key: 'edit',
                                label: 'Edit invoice',
                                icon: <Pencil size={14} />,
                                onSelect: () => startEditInvoice(invoice),
                              } as ActionMenuItem]
                              : []),
                            ...(effectiveStatus !== 'paid'
                              ? [{
                                key: 'mark-paid',
                                label: 'Mark as paid',
                                icon: <Check size={14} />,
                                onSelect: () => handleMarkAsPaid(invoice),
                              } as ActionMenuItem]
                              : []),
                            ...(effectiveStatus === 'paid'
                              ? [{
                                key: 'revert-paid',
                                label: 'Change status',
                                icon: <RotateCcw size={14} />,
                                onSelect: () => triggerRevertPaidStatus(invoice),
                              } as ActionMenuItem]
                              : []),
                            ...(invoice.proofOfPaymentUrl
                              ? [{
                                key: 'receipt',
                                label: 'View receipt',
                                icon: <CreditCard size={14} />,
                                onSelect: () => {
                                  setActiveReceiptIdx(0);
                                  setReceiptPreviewUrl(invoice.proofOfPaymentUrl!);
                                },
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

                        {/* Client logo preview — only shown when selected client has a websiteAddress */}
                        {(() => {
                          const selClient = clients.find(c => c.id === selectedClientId);
                          if (!selClient?.websiteAddress) return null;
                          const selDomain = selClient.websiteAddress.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
                          const selFavicon = `https://www.google.com/s2/favicons?domain=${selDomain}&sz=64`;
                          return (
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-muted/20 animate-fade-in-scale">
                              <div className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                <img
                                  src={selFavicon}
                                  alt={selClient.name}
                                  className="w-5 h-5 object-contain"
                                  onLoad={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    if (img.naturalWidth <= 16) {
                                      img.parentElement!.style.display = 'none';
                                    }
                                  }}
                                  onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{selClient.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{selDomain}</p>
                              </div>
                            </div>
                          );
                        })()}

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
                            <option value="partially_paid">Partially paid — milestone collection</option>
                            <option value="paid">Paid — fully collected</option>
                          </Select>

                          {status === 'partially_paid' && (
                            <div className="sm:col-span-2 animate-fade-in-scale">
                              <Input
                                label="Amount Paid (IDR) *"
                                type="text"
                                inputMode="numeric"
                                required
                                value={formatInputNumberIDR(amountPaid)}
                                onChange={(e) => {
                                  const rawVal = e.target.value.replace(/[^0-9]/g, '');
                                  setAmountPaid(rawVal ? Number(rawVal) : 0);
                                }}
                              />
                            </div>
                          )}

                          {(status === 'partially_paid' || status === 'paid') && (
                            <>
                              <div className="sm:col-span-2 animate-fade-in-scale">
                                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                  Payment Received By
                                </label>
                                <select
                                  value={receivedBy}
                                  onChange={(e) => setReceivedBy(e.target.value as any)}
                                  className="h-10 w-full appearance-none rounded-xl bg-background border border-border px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-colors cursor-pointer"
                                >
                                  <option value="company">Company Treasury</option>
                                  <option value="fredrick">Fredrick Yang (out of pocket / personal)</option>
                                  <option value="nicholas">Nicholas Chairnando (out of pocket / personal)</option>
                                </select>
                              </div>

                              <div className="sm:col-span-2 flex flex-col justify-end animate-fade-in-scale">
                                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                  Proof of Payment Attachment
                                </label>
                              <div className="flex items-center gap-2 border border-border rounded-xl p-2 bg-muted/10 h-[42px] mb-2.5">
                                <input
                                  type="file"
                                  id="drawer-receipt-upload"
                                  accept="image/*,application/pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleCompressAndUploadForDrawer(file);
                                  }}
                                />
                                <label
                                  htmlFor="drawer-receipt-upload"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-muted active-press transition-all cursor-pointer text-xs font-bold text-foreground shadow-xs shrink-0"
                                >
                                  Upload Receipt
                                </label>
                                {uploadingReceipt ? (
                                  <span className="text-[10px] text-primary font-semibold animate-pulse">
                                    ⌛ Compressing...
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground truncate">
                                    Attach payment receipts (down payment, final billing, etc.)
                                  </span>
                                )}
                              </div>

                              {ocrScanning && (
                                <div className="flex items-center gap-2 p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary text-[10px] font-bold animate-pulse mb-2.5">
                                  <Loader2 className="animate-spin text-primary shrink-0" size={12} />
                                  <span>Secure Local OCR: Scanning receipt to extract payment amount...</span>
                                </div>
                              )}
                              {ocrSuccessMsg && (
                                <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-bold animate-fade-in-scale mb-2.5">
                                  <span className="shrink-0 text-emerald-400">✨</span>
                                  <span>{ocrSuccessMsg}</span>
                                </div>
                              )}

                              {/* Receipt Attachments List in Drawer */}
                              {proofOfPaymentUrl && (
                                <div className="space-y-1.5 mt-1.5">
                                  {proofOfPaymentUrl.split('|').filter(Boolean).map((url, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-muted/20 border border-border px-3 py-1.5 rounded-xl text-xs">
                                      <span className="truncate text-muted-foreground max-w-[200px]">
                                        📎 Receipt #{idx + 1} {idx === 0 && status === 'paid' ? "(Down Payment)" : ""} {idx === 1 && status === 'paid' ? "(Final Payment)" : ""}
                                      </span>
                                      <div className="flex items-center gap-2 font-bold shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveReceiptIdx(idx);
                                            setReceiptPreviewUrl(url);
                                          }}
                                          className="text-primary hover:underline cursor-pointer"
                                        >
                                          View
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = proofOfPaymentUrl.split('|').filter((_, i) => i !== idx).join('|');
                                            setProofOfPaymentUrl(updated);
                                          }}
                                          className="text-red-400 hover:text-red-500 cursor-pointer"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            </>
                          )}
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
                            <option value="static">Static · IDR 200.000/mo</option>
                            <option value="dynamic">Dynamic · IDR 350.000/mo</option>
                          </Select>
                          <p className="text-xs text-muted-foreground leading-relaxed sm:mt-7">
                            Selecting a plan adds a hosting line below at the standard
                            rate (qty defaults to{' '}
                            <span className="text-foreground font-medium">12 months</span>
                            ). Override the monthly price and number of months below.
                          </p>
                        </div>

                        {hostingType !== 'none' && hostingItem && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start rounded-xl border border-border bg-muted/10 p-4 animate-fade-in-scale">
                            {/* Custom monthly price */}
                            <div>
                              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.06em] mb-1 block">
                                Custom price / month (IDR)
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formatInputNumberIDR(hostingItem.price)}
                                onChange={(e) => {
                                  const rawVal = e.target.value.replace(/[^0-9]/g, '');
                                  handleLineItemChange(
                                    hostingIndex,
                                    'price',
                                    rawVal ? Number(rawVal) : 0
                                  );
                                }}
                                className="w-full h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-colors"
                              />
                            </div>
                            {/* Quantity (months) */}
                            <div>
                              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.06em] mb-1 block">
                                Quantity (months)
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={hostingItem.quantity}
                                onChange={(e) =>
                                  handleLineItemChange(
                                    hostingIndex,
                                    'quantity',
                                    e.target.value
                                  )
                                }
                                className="w-full h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-colors"
                              />
                            </div>
                          </div>
                        )}
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

                          {/* Elegant Ghost Card UI */}
                          <div className="rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/5 hover:bg-muted/10 p-5 transition-all duration-300 group flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                              <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                  <PlusCircle size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                  Add invoice items
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Add empty items or paste list to auto-parse multiple items.
                                </p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleAddLineItem}
                                  className="border border-border bg-background hover:bg-muted/50 text-xs"
                                  leftIcon={<Plus size={14} />}
                                >
                                  Add empty item
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setPasteMode(!pasteMode)}
                                  className={cn(
                                    "text-xs transition-colors",
                                    pasteMode ? "bg-primary/10 border-primary text-primary" : ""
                                  )}
                                  leftIcon={<Sliders size={14} />}
                                >
                                  {pasteMode ? "Cancel Paste" : "Quick Paste Parser"}
                                </Button>
                              </div>
                            </div>

                            {pasteMode && (
                              <div className="space-y-3 pt-4 border-t border-border/50 animate-fade-in-scale">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.06em] block">
                                    Paste text list (Format: Title, Description [can be multi-line], Price)
                                  </label>
                                  <span className="text-[10px] text-muted-foreground/80 leading-relaxed block bg-muted/20 rounded-md p-2 border border-border/30">
                                    💡 <strong>Tip:</strong> Copy-paste the exact milestone list. We will auto-detect prices like <code>Rp 1,500,000</code> or <code>500,000</code> and separate titles and multi-line descriptions!
                                  </span>
                                </div>
                                
                                <textarea
                                  placeholder={`Discovery & Basic System Planning\nRequirement mapping, page structure planning...\nRp 1,500,000\n\nCustom UI/UX Design\nHomepage design, catalog page design...\nRp 3,500,000`}
                                  value={pastedText}
                                  onChange={(e) => setPastedText(e.target.value)}
                                  rows={8}
                                  className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-colors resize-y font-mono"
                                />
                                
                                <div className="flex justify-end gap-2">
                                  {pastedText.trim() && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setPastedText('')}
                                      className="text-xs hover:text-red-500"
                                    >
                                      Clear text
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    disabled={!pastedText.trim()}
                                    onClick={handleImportPastedText}
                                    className="text-xs px-4"
                                  >
                                    Parse & Import {pastedText.trim() && parsePastedItems(pastedText).length > 0 ? `(${parsePastedItems(pastedText).length} items)` : ''}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
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
                                  className={`w-6 h-6 rounded-md text-[11px] font-medium border transition-colors cursor-pointer flex items-center justify-center ${discountType === 'percentage'
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
                                  className={`w-6 h-6 rounded-md text-[10px] font-medium border transition-colors cursor-pointer flex items-center justify-center ${discountType === 'fixed'
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

          {/* ── Record Payment Modal ── */}
          {mounted && paymentModalOpen && paymentInvoice && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-background/80 backdrop-blur-md"
                onClick={() => {
                  if (!isLoggingPayment) {
                    setPaymentModalOpen(false);
                    setPaymentInvoice(null);
                  }
                }}
              />

              <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl animate-fade-in-scale">
                <div className="flex items-center gap-3 pb-3 border-b border-border mb-4">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Record Client Payment
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {paymentInvoice.invoiceNumber} • Total: {formatCurrencyIDR(paymentInvoice.total)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Payment Type selection */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Payment Type
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentStatus('paid');
                          setPaymentAmount(paymentInvoice.total);
                        }}
                        className={`py-2 px-3 border text-xs capitalize transition-all cursor-pointer font-bold rounded-lg ${paymentStatus === 'paid'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                          }`}
                      >
                        Full Payment (100%)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentStatus('partially_paid');
                          setPaymentAmount(Math.round(paymentInvoice.total * 0.5)); // Default to 50% Down Payment
                        }}
                        className={`py-2 px-3 border text-xs capitalize transition-all cursor-pointer font-bold rounded-lg ${paymentStatus === 'partially_paid'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                          }`}
                      >
                        Partial Payment (Milestone)
                      </button>
                    </div>
                  </div>

                  {/* Amount input for partial payment */}
                  {paymentStatus === 'partially_paid' && (
                    <div className="animate-fade-in-scale space-y-2">
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Amount Collected (IDR) *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={formatInputNumberIDR(paymentAmount)}
                        onChange={(e) => {
                          const rawVal = e.target.value.replace(/[^0-9]/g, '');
                          setPaymentAmount(rawVal ? Number(rawVal) : 0);
                        }}
                        className="w-full h-9 rounded-lg bg-background border border-border px-3 text-xs text-foreground font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-colors"
                      />
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        Remaining unpaid balance: <strong>{formatCurrencyIDR(Math.max(0, paymentInvoice.total - paymentAmount))}</strong>
                      </span>
                    </div>
                  )}

                  {/* Received By */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Payment Received By
                    </label>
                    <select
                      value={paymentReceivedBy}
                      onChange={(e) => setPaymentReceivedBy(e.target.value as any)}
                      className="h-10 w-full appearance-none rounded-xl bg-background border border-border px-3.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-colors cursor-pointer"
                    >
                      <option value="company">Company Treasury</option>
                      <option value="fredrick">Fredrick Yang (out of pocket / personal)</option>
                      <option value="nicholas">Nicholas Chairnando (out of pocket / personal)</option>
                    </select>
                  </div>

                  {/* File Attachment Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      Attach Proof of Payment (Screenshot / Image)
                    </label>
                    <div className="p-3.5 rounded-xl border border-dashed border-border bg-muted/10 text-center space-y-2">
                      <input
                        type="file"
                        id="receipt-upload"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCompressAndSetFile(file);
                        }}
                      />
                      <label
                        htmlFor="receipt-upload"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-muted active-press transition-all cursor-pointer text-xs font-bold text-foreground shadow-xs"
                      >
                        Select Receipt Image
                      </label>
                      {uploadingReceipt && (
                        <p className="text-[10px] text-primary font-semibold animate-pulse">
                          ⌛ Compressing &amp; preparing screenshot...
                        </p>
                      )}
                      {receiptFileName && !uploadingReceipt && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-emerald-400 font-bold truncate max-w-[280px] mx-auto">
                            ✓ {receiptFileName} (Compressed!)
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setReceiptFileBase64('');
                              setReceiptFileName('');
                            }}
                            className="text-[9px] text-red-400 hover:underline cursor-pointer font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      {ocrScanning && (
                        <div className="flex items-center gap-2 p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary text-[10px] font-bold animate-pulse mt-2.5">
                          <Loader2 className="animate-spin text-primary shrink-0" size={12} />
                          <span>Extracting payment total from screenshot...</span>
                        </div>
                      )}
                      {ocrSuccessMsg && (
                        <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-bold animate-fade-in-scale mt-2.5">
                          <span className="shrink-0 text-emerald-400">✨</span>
                          <span>{ocrSuccessMsg}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-border">
                  <button
                    type="button"
                    disabled={isLoggingPayment}
                    onClick={() => {
                      setPaymentModalOpen(false);
                      setPaymentInvoice(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isLoggingPayment || uploadingReceipt}
                    onClick={async () => {
                      setIsLoggingPayment(true);
                      try {
                        let receiptUrl = '';
                        if (receiptFileBase64) {
                          receiptUrl = await uploadReceiptAction(receiptFileName || 'receipt.jpg', receiptFileBase64);
                        }

                        const finalAmountPaid = paymentStatus === 'paid' ? paymentInvoice.total : paymentAmount;

                        const updated = await updateInvoiceStatus(
                          paymentInvoice.id,
                          paymentStatus,
                          finalAmountPaid,
                          receiptUrl || undefined,
                          paymentReceivedBy
                        );

                        if (updated) {
                          // Log smart payout if payment received by a founder personally (Self-healing auto-sync)
                          await syncInvoicePayoutAction(paymentInvoice.invoiceNumber, paymentReceivedBy, finalAmountPaid, new Date());
                          invalidateCache(CACHE_KEYS.INVOICES, CACHE_KEYS.PAYOUTS);
                          setInvoices(prev =>
                            prev.map(inv =>
                              inv.id === paymentInvoice.id
                                ? ({
                                  ...inv,
                                  status: paymentStatus,
                                  amountPaid: finalAmountPaid,
                                  proofOfPaymentUrl: receiptUrl || inv.proofOfPaymentUrl,
                                  receivedBy: paymentReceivedBy,
                                  paidAt: paymentStatus === 'paid' ? new Date() : null,
                                  updatedAt: new Date()
                                } as any)
                                : inv
                            )
                          );
                          setPaymentModalOpen(false);
                          setPaymentInvoice(null);
                        }
                      } catch (err) {
                        console.error("Failed to log client payment", err);
                      } finally {
                        setIsLoggingPayment(false);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active-press transition-all cursor-pointer flex items-center gap-1.5"
                    style={{ boxShadow: '0 0 10px rgba(206, 248, 78, 0.15)' }}
                  >
                    {isLoggingPayment ? (
                      <div className="w-3.5 h-3.5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <Check size={13} />
                    )}
                    Save Receipt &amp; Log Payment
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* ── Receipt Image Secure Popup Viewer Modal ── */}
          {mounted && receiptPreviewUrl && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-background/90 backdrop-blur-md"
                onClick={() => setReceiptPreviewUrl(null)}
              />

              <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border p-4 shadow-2xl animate-fade-in-scale flex flex-col items-center">
                {/* Header / Dismiss */}
                <div className="w-full flex items-center justify-between pb-3 border-b border-border mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-semibold">
                    Proof of Payment Receipt Attachment
                  </span>
                  <button
                    onClick={() => setReceiptPreviewUrl(null)}
                    className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Tab Switched for Multiple Receipts */}
                {(() => {
                  const urls = receiptPreviewUrl.split('|').filter(Boolean);
                  const activeUrl = urls[activeReceiptIdx] || urls[0] || '';

                  return (
                    <>
                      {urls.length > 1 && (
                        <div className="flex gap-2 mb-3.5 w-full">
                          {urls.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveReceiptIdx(idx)}
                              className={cn(
                                "flex-1 py-1.5 border text-xs font-bold rounded-lg transition-all cursor-pointer",
                                activeReceiptIdx === idx
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                              )}
                            >
                              Receipt #{idx + 1} {idx === 0 ? "(Down Payment)" : idx === 1 ? "(Final Payment)" : ""}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Content preview */}
                      <div className="w-full overflow-hidden flex items-center justify-center min-h-[250px] max-h-[70vh] bg-muted/20 border border-border/80 rounded-xl relative p-1">
                        {activeUrl.startsWith('data:application/pdf') ? (
                          <div className="text-center p-6 space-y-3">
                            <CreditCard size={48} className="text-primary mx-auto animate-pulse" />
                            <p className="text-xs font-semibold">PDF Receipt Document</p>
                            <a
                              href={activeUrl}
                              download={`receipt-${activeReceiptIdx + 1}.pdf`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active-press transition-all"
                            >
                              Download PDF Receipt
                            </a>
                          </div>
                        ) : (
                          <img
                            src={activeUrl}
                            alt="Proof of payment receipt screenshot"
                            className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
                          />
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>,
            document.body
          )}

          {/* ── Revert paid status confirmation modal ── */}
          {mounted && revertModalOpen && invoiceToRevert &&
            createPortal(
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="fixed inset-0 bg-background/85 backdrop-blur-md"
                  onClick={() => {
                    if (!isRevertingStatus) {
                      setRevertModalOpen(false);
                      setInvoiceToRevert(null);
                    }
                  }}
                />

                <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
                  <div className="p-6">
                    <div className="flex items-start gap-3 pb-4 mb-4 border-b border-border">
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                        <RotateCcw size={16} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold tracking-tight text-foreground">
                          Revert Paid Status
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Switch invoice {invoiceToRevert.invoiceNumber} back to unpaid.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Audit Warning */}
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 flex gap-2">
                        <span className="text-amber-500 shrink-0 text-xs">⚠️</span>
                        <div className="text-[11px] leading-relaxed text-amber-500">
                          <p className="font-bold">FINANCIAL AUDIT CAUTION</p>
                          <p className="mt-0.5 text-amber-500/90">
                            Reverting a paid invoice will adjust monthly income charts, ledger totals, and mark the invoice as unpaid in client statements.
                          </p>
                        </div>
                      </div>

                      {/* Status Selection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                          Select New Status *
                        </label>
                        <Select
                          value={revertStatusSelection}
                          onChange={(e) => {
                            const newStatus = e.target.value as any;
                            setRevertStatusSelection(newStatus);
                            if (newStatus === 'partially_paid' && revertAmountPaid === 0) {
                              setRevertAmountPaid(Math.round(invoiceToRevert.total * 0.5));
                            }
                          }}
                        >
                          <option value="issued">Issued (Unpaid)</option>
                          <option value="draft">Draft</option>
                          <option value="partially_paid">Partially Paid</option>
                          <option value="past_due">Past Due</option>
                          <option value="written_off">Written Off</option>
                        </Select>
                      </div>

                      {/* Partially Paid Details */}
                      {revertStatusSelection === 'partially_paid' && (
                        <div className="space-y-1.5 animate-fade-up">
                          <label className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                            Amount Paid (Rp)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                              Rp
                            </span>
                            <Input
                              type="text"
                              className="pl-9"
                              value={formatInputNumberIDR(revertAmountPaid)}
                              onChange={(e) => {
                                const val = Number(e.target.value.replace(/[^0-9]/g, ''));
                                setRevertAmountPaid(val);
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground leading-normal block">
                            Milestone split total: {formatCurrencyIDR(invoiceToRevert.total - revertAmountPaid)} outstanding
                          </span>
                        </div>
                      )}

                      {/* Keep Receipts (if invoice has one) */}
                      {invoiceToRevert.proofOfPaymentUrl && (
                        <div className="flex items-center gap-2 py-1 select-none animate-fade-in-scale">
                          <input
                            type="checkbox"
                            id="keepReceipt"
                            checked={keepReceipt}
                            onChange={(e) => setKeepReceipt(e.target.checked)}
                            className="rounded border-border bg-muted/40 text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                          />
                          <label
                            htmlFor="keepReceipt"
                            className="text-xs font-semibold text-foreground/80 cursor-pointer"
                          >
                            Keep uploaded proof of payment receipts
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-border">
                      <button
                        type="button"
                        disabled={isRevertingStatus}
                        onClick={() => {
                          setRevertModalOpen(false);
                          setInvoiceToRevert(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isRevertingStatus}
                        onClick={handleRevertStatus}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active-press transition-all cursor-pointer flex items-center gap-1.5"
                        style={{ boxShadow: '0 0 10px rgba(206, 248, 78, 0.15)' }}
                      >
                        {isRevertingStatus ? (
                          <div className="w-3.5 h-3.5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}
                        Confirm Revert
                      </button>
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
