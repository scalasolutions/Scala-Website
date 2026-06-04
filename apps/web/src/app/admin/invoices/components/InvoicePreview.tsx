'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  Printer, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Settings,
  Plus
} from 'lucide-react';
import { MockInvoice, MockClient, getInvoicePagePresets, MockInvoicePagePreset } from '@/lib/db/queries';
import { InvoiceLineItem, getClientRefCode, formatDateClean } from './invoice-types';
import { InvoiceCoverPage } from './InvoiceCoverPage';
import { InvoiceTCPage1 } from './InvoiceTCPage1';
import { InvoiceTCPage2 } from './InvoiceTCPage2';
import { InvoiceBillingPage } from './InvoiceBillingPage';

// ── Layout constants ─────────────────────────────────────────
const PAGE_W = 800;
const PAGE_H = 1130;
const PAGE_GAP = 32;

// Shared page style applied to every A4 div
const PAGE_STYLE: React.CSSProperties = {
  width: `${PAGE_W}px`,
  height: `${PAGE_H}px`,
  backgroundColor: 'white',
  padding: '56px 64px',
  fontFamily: "'Outfit','Inter',sans-serif",
  color: '#111111',
  boxSizing: 'border-box',
  overflow: 'hidden',
  position: 'relative',   // needed so the footer can be absolute-positioned inside
  flexShrink: 0,
  boxShadow: '0 20px 60px -12px rgba(0,0,0,0.18)',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
};

// ── Print CSS ────────────────────────────────────────────────
const PRINT_CSS = `
  @media print {
    @page {
      size: auto;
      margin: 0mm;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Hide all layout elements that are not part of the invoice pages */
    aside, 
    header, 
    #admin-top-header, 
    .print\\:hidden,
    main > div.absolute {
      display: none !important;
    }

    /* Reset the specific outer layout containers so they don't clip or restrict the page height */
    html, body {
      height: auto !important;
      min-height: auto !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      background-color: white !important;
    }

    /* Target the exact dashboard layout parents by matching their unique hierarchy */
    div.flex.h-screen.bg-background.overflow-hidden,
    div.flex-1.flex.flex-col.min-w-0.overflow-hidden,
    main.flex-1.overflow-y-auto,
    div.max-w-6xl.mx-auto {
      display: block !important;
      position: static !important;
      height: auto !important;
      min-height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      box-shadow: none !important;
      background: transparent !important;
      width: 100% !important;
      max-width: none !important;
    }

    /* Style the preview container and remove vertical height restrictions */
    div.animate-fade-up.flex.flex-col,
    div.relative.w-full.flex.justify-center {
      display: block !important;
      position: static !important;
      height: auto !important;
      min-height: auto !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }

    /* Target the absolute scale-wrapper and reset its transform so pages print in 100% scale A4 */
    #invoice-pages-wrapper {
      position: static !important;
      transform: none !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 0mm !important;
      width: 100% !important;
    }

    /* Enforce exact A4 size during print and avoid background shadows */
    .invoice-print-page {
      width: 210mm !important;
      height: 297mm !important;
      margin: 0 auto !important;
      padding: 20mm 20mm !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 0px !important;
      page-break-after: always !important;
      page-break-inside: avoid !important;
      background: white !important;
    }

    .invoice-print-page:last-child {
      page-break-after: avoid !important;
    }
  }
`;

// Helper to estimate height of an invoice line item in the preview page (in pixels)
const estimateItemHeight = (item: InvoiceLineItem): number => {
  let height = 22 * 2 + 14 * 1.4; // top/bottom padding + title font height = 64px
  if (item.description) {
    const descLines = item.description.split('\n').filter(Boolean);
    if (descLines.length > 0) {
      height += 12; // margin-top for description container
      height += descLines.length * 26; // line height 1.8 with size 13px plus margins
    }
  }
  return height + 4; // plus bottom margin of 4px
};

interface BillingPageChunk {
  items: InvoiceLineItem[];
  showTotals: boolean;
  pageNumber: number;
}

// Splits the billing items into chunks that fit on A4 pages without overlapping the footer
const splitBillingItems = (lineItems: InvoiceLineItem[], hasPayments: boolean): BillingPageChunk[] => {
  const chunks: BillingPageChunk[] = [];
  const USABLE_HEIGHT = 750; // safe A4 content vertical space (increased to fit more on a single page)
  const TOTALS_HEIGHT = hasPayments ? 260 : 60; // realistic space allocation for totals card

  let currentPageItems: InvoiceLineItem[] = [];
  let currentHeight = 0;

  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i];
    const itemHeight = estimateItemHeight(item);

    if (currentHeight + itemHeight > USABLE_HEIGHT) {
      chunks.push({
        items: currentPageItems,
        showTotals: false,
        pageNumber: chunks.length + 1,
      });
      currentPageItems = [item];
      currentHeight = itemHeight;
    } else {
      currentPageItems.push(item);
      currentHeight += itemHeight;
    }
  }

  // Check if totals fit on the final page, otherwise split totals into a new final page
  if (currentHeight + TOTALS_HEIGHT > USABLE_HEIGHT) {
    if (currentPageItems.length > 0) {
      chunks.push({
        items: currentPageItems,
        showTotals: false,
        pageNumber: chunks.length + 1,
      });
    }
    chunks.push({
      items: [],
      showTotals: true,
      pageNumber: chunks.length + 1,
    });
  } else {
    chunks.push({
      items: currentPageItems,
      showTotals: true,
      pageNumber: chunks.length + 1,
    });
  }

  return chunks;
};

// ── Props ─────────────────────────────────────────────────────
interface InvoicePreviewProps {
  invoice: MockInvoice;
  clients: MockClient[];
  onClose: () => void;
  onModify?: () => void;
}

// ── Component ─────────────────────────────────────────────────
export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  clients,
  onClose,
  onModify,
}) => {
  const [mounted, setMounted] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [currentPage, setCurrentPage] = useState(0);
  const [preparedBy, setPreparedBy] = useState<'nicholas' | 'fredrick' | 'both'>('nicholas');
  const [pagePresets, setPagePresets] = useState<MockInvoicePagePreset[]>([]);
  const [titlePresets, setTitlePresets] = useState<MockInvoicePagePreset[]>([]);
  const [modifyMenuOpen, setModifyMenuOpen] = useState(false);

  const outerPagesRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const modifyMenuRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveScale = zoomPercent / 100;

  // Bootstrap page presets
  useEffect(() => {
    async function loadPagePresets() {
      try {
        const presets = await getInvoicePagePresets();
        const fullPages = presets.filter(p => p.sectionKey === 'full_page_html');
        const titles = presets.filter(p => p.sectionKey === 'page_title');

        // Apply local storage overrides if present
        if (typeof window !== 'undefined') {
          fullPages.forEach(p => {
            const localContent = localStorage.getItem(`scala_preset_${p.pageKey}`);
            if (localContent) {
              p.content = localContent;
            }
          });
          titles.forEach(t => {
            const localTitle = localStorage.getItem(`scala_preset_title_${t.pageKey}`);
            if (localTitle) {
              t.content = localTitle;
            }
          });
        }
        setPagePresets(fullPages);
        setTitlePresets(titles);
      } catch (e) {
        console.warn("Failed to load page presets inside preview:", e);
      }
    }
    loadPagePresets();
  }, [invoice]);

  // Auto-fit scale on mount / resize & lock body scroll
  useEffect(() => {
    setMounted(true);
    const computeScale = () => {
      const availH = window.innerHeight - (window.innerWidth < 640 ? 160 : 200);
      const availW = window.innerWidth - (window.innerWidth < 640 ? 48 : 120);
      const rawScale = Math.max(0.2, Math.min(availH / PAGE_H, availW / PAGE_W, 1.2));
      const roundedPercent = Math.round((rawScale * 2) * 10) * 10;
      setZoomPercent(roundedPercent);
    };
    computeScale();
    window.addEventListener('resize', computeScale);

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('resize', computeScale);
      document.body.style.overflow = originalStyle;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Click outside listener for modify presets dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modifyMenuRef.current && !modifyMenuRef.current.contains(event.target as Node)) {
        setModifyMenuOpen(false);
      }
    }
    if (modifyMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modifyMenuOpen]);

  // Reset zoom and scroll to top when invoice changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const availH = window.innerHeight - (window.innerWidth < 640 ? 160 : 200);
      const availW = window.innerWidth - (window.innerWidth < 640 ? 48 : 120);
      const rawScale = Math.max(0.2, Math.min(availH / PAGE_H, availW / PAGE_W, 1.2));
      const roundedPercent = Math.round((rawScale * 2) * 10) * 10;
      setZoomPercent(roundedPercent);
      setCurrentPage(0);
    }, 0);
    const container = scrollContainerRef.current;
    if (container) container.scrollTop = 0;
    return () => clearTimeout(timer);
  }, [invoice]);

  // Parse included page keys from invoice
  const getIncludedPageKeys = (): string[] => {
    if (invoice.includedPagesJson) {
      try {
        return JSON.parse(invoice.includedPagesJson) as string[];
      } catch (e) {
        return ['cover', 'tc1', 'tc2'];
      }
    }
    return ['cover', 'tc1', 'tc2'];
  };

  const getPageTitle = (key: string): string => {
    if (key === 'billing') return 'Billing';
    if (key === 'cover') return 'Cover';

    const customTitle = titlePresets.find(t => t.pageKey === key);
    if (customTitle && customTitle.content) return customTitle.content;

    if (key === 'tc1') return 'T&C Page 1';
    if (key === 'tc2') return 'T&C Page 2';
    if (key.startsWith('custom_')) {
      return key.replace('custom_', '').replace(/_/g, ' ');
    }
    return key;
  };

  // Resolve client details
  const client = clients.find(c => c.id === invoice.clientId);
  const clientName = client?.name || 'Unknown Client';
  const companyName = client?.companyName || 'No Company';
  const parsedItems = JSON.parse(invoice.itemsJson) as InvoiceLineItem[];
  const clientRefCode = getClientRefCode(companyName || clientName, invoice.invoiceNumber);
  const formattedDate = formatDateClean(invoice.createdAt || invoice.issuedAt || new Date());

  const includedPageKeys = getIncludedPageKeys();

  // Composing dynamic pages catalog
  const activePages: Array<{ key: string; label: string; content?: string; chunk?: BillingPageChunk }> = [];
  
  // 1. Billing is always included (split into pages dynamically if needed to prevent overlap)
  const hasPayments = invoice.status === 'paid' || invoice.status === 'partially_paid';
  const billingChunks = splitBillingItems(parsedItems, hasPayments);
  
  billingChunks.forEach(chunk => {
    activePages.push({
      key: `billing_${chunk.pageNumber}`,
      label: billingChunks.length > 1 ? `Billing - Page ${chunk.pageNumber}` : 'Billing',
      chunk,
    });
  });

  // 2. Cover is optional
  if (includedPageKeys.includes('cover')) {
    activePages.push({ key: 'cover', label: 'Cover' });
  }

  // 3. Page Presets (Default + Custom) are optional
  pagePresets.forEach(preset => {
    if (includedPageKeys.includes(preset.pageKey)) {
      activePages.push({
        key: preset.pageKey,
        label: getPageTitle(preset.pageKey),
        content: preset.content,
      });
    }
  });

  const numPages = activePages.length;
  const totalUnscaledHeight = PAGE_H * numPages + PAGE_GAP * (numPages - 1);
  const pageLabels = activePages.map(p => p.label);

  const scrollToPage = (pageIndex: number) => {
    const container = scrollContainerRef.current;
    if (container) {
      isProgrammaticScroll.current = true;
      setCurrentPage(pageIndex);
      
      const paddingTop = 32; // pt-8 top padding of #invoice-canvas-container
      const pageOffset = pageIndex * (PAGE_H + PAGE_GAP);
      const targetScrollTop = paddingTop + pageOffset * effectiveScale;
      
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 800);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScroll.current) return;
    
    const container = e.currentTarget;
    const containerRect = container.getBoundingClientRect();

    let activePage = 0;
    let maxVisibleHeight = 0;

    pageRefs.current.forEach((page, index) => {
      if (!page) return;
      const rect = page.getBoundingClientRect();
      
      const visibleTop = Math.max(rect.top, containerRect.top);
      const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);

      if (visibleHeight > maxVisibleHeight) {
        maxVisibleHeight = visibleHeight;
        activePage = index;
      }
    });

    if (activePage !== currentPage) {
      setCurrentPage(activePage);
    }
  };



  const handlePrint = () => {
    window.print();
  };

  if (!mounted) return null;

  return createPortal(
    <div 
      id="invoice-preview-overlay" 
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col select-none"
    >
      {/* Dynamic Print styles block */}
      <style>{PRINT_CSS}</style>

      {/* ── Sticky Toolbar ── */}
      <div className="flex items-center justify-between p-4 bg-background/90 backdrop-blur border-b border-border print:hidden w-full gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-card border border-border hover:bg-muted text-foreground cursor-pointer transition-all shrink-0"
            title="Back to Invoices"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm md:text-base font-extrabold text-foreground truncate">
              Preview Invoice
            </h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px] sm:max-w-none">
                Ref: <span className="font-mono">{invoice.invoiceNumber}</span> • {clientName}
              </p>
              <span className="text-[10px] uppercase font-black tracking-widest text-primary-ink dark:text-primary shrink-0 bg-primary-soft dark:bg-primary/10 px-2.5 py-0.5 rounded border border-primary-ink/10 dark:border-transparent font-bold">
                Rp {invoice.total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar Center Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Page navigation */}
          <div className="flex items-center rounded-xl bg-muted/40 border border-border p-0.5">
            <button
              onClick={() => scrollToPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-1.5 rounded-lg hover:bg-muted hover:text-foreground text-muted-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              title="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] font-black text-foreground w-16 sm:w-20 text-center select-none tabular-nums">
              Page {currentPage + 1} of {numPages}
            </span>
            <button
              onClick={() => scrollToPage(Math.min(numPages - 1, currentPage + 1))}
              disabled={currentPage === numPages - 1}
              className="p-1.5 rounded-lg hover:bg-muted hover:text-foreground text-muted-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              title="Next Page"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="hidden md:flex items-center rounded-xl bg-muted/40 border border-border p-0.5">
            <button
              onClick={() => setZoomPercent(prev => Math.max(40, prev - 10))}
              className="p-1.5 rounded-lg hover:bg-muted hover:text-foreground text-muted-foreground cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[10px] font-black text-foreground w-12 text-center select-none tabular-nums">
              {zoomPercent}%
            </span>
            <button
              onClick={() => setZoomPercent(prev => Math.min(300, prev + 10))}
              className="p-1.5 rounded-lg hover:bg-muted hover:text-foreground text-muted-foreground cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Action Download button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all cursor-pointer shadow-sm hover:shadow-md"
            title="Download PDF"
          >
            <Download size={13} />
            <span className="hidden lg:inline">Download</span>
          </button>

          {/* Action Print button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-foreground font-semibold text-xs hover:bg-muted transition-all cursor-pointer"
            title="Print SLA Document"
          >
            <Printer size={13} />
            <span className="hidden lg:inline">Print</span>
          </button>

          <div className="h-6 w-[1px] bg-border/60 mx-1 hidden sm:block" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
            title="Close Preview"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Scrollable content container ── */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto print:overflow-visible"
        onScroll={handleScroll}
      >
        {/* Pages Canvas */}
        <div id="invoice-canvas-container" className="flex justify-center pt-8 pb-[80vh]">
          <div
            ref={outerPagesRef}
            id="invoice-canvas-unscale"
            className="relative"
            style={{
              height: `${totalUnscaledHeight * effectiveScale}px`,
              width: `${PAGE_W * effectiveScale}px`,
            }}
          >
            <div
              id="invoice-pages-wrapper"
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: `translate(-50%, 0) scale(${effectiveScale})`,
                transformOrigin: 'top center',
                width: `${PAGE_W}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: `${PAGE_GAP}px`,
              }}
            >
          {activePages.map((page, index) => {
            const pageNo = index + 1;
            const sharedProps = {
              companyName: companyName || clientName,
              clientRefCode,
              formattedDate,
              pageStyle: PAGE_STYLE,
              pageNumber: pageNo,
              totalPages: numPages,
              websiteAddress: client?.websiteAddress,
            };

            let pageComponent = null;
            if (page.key.startsWith('billing')) {
              const chunk = page.chunk!;
              pageComponent = (
                <InvoiceBillingPage
                  {...sharedProps}
                  lineItems={chunk.items}
                  total={invoice.total}
                  discountType={invoice.discountType}
                  discountValue={invoice.discountValue}
                  status={invoice.status}
                  amountPaid={invoice.amountPaid}
                  paidAt={invoice.paidAt}
                  dpAt={invoice.dpAt}
                  showTotals={chunk.showTotals}
                />
              );
            } else if (page.key === 'cover') {
              pageComponent = (
                <InvoiceCoverPage
                  {...sharedProps}
                  preparedBy={preparedBy}
                />
              );
            } else if (page.key === 'tc1') {
              pageComponent = (
                <InvoiceTCPage1
                  {...sharedProps}
                  htmlContent={page.content}
                />
              );
            } else if (page.key === 'tc2') {
              pageComponent = (
                <InvoiceTCPage2
                  {...sharedProps}
                  htmlContent={page.content}
                />
              );
            } else {
              pageComponent = (
                <InvoiceTCPage1
                  {...sharedProps}
                  htmlContent={page.content}
                />
              );
            }

            return (
              <div 
                key={page.key} 
                ref={el => { pageRefs.current[index] = el; }}
              >
                {pageComponent}
              </div>
            );
          })}
        </div>
      </div>

      </div>

      {/* Close scrollable content container */}
      </div>

      {/* ── Floating right controls panel (Prepared By Signature & Pages Navigator) ── */}
      <div
        className="absolute bottom-6 right-[15px] z-20 print:hidden flex flex-col gap-3 pointer-events-auto w-36 lg:w-40 shrink-0"
      >
        {/* Prepared By Selector */}
        {includedPageKeys.includes('cover') && (
          <div 
            className="group bg-card border border-border rounded-2xl p-3 shadow-xl flex flex-col gap-2 transition-all duration-300 animate-fade-in"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/80 pb-1 mb-0.5">
              Prepared By
            </span>
            <div className="flex flex-col gap-0 group-hover:gap-1 transition-all duration-300">
              {[
                { id: 'nicholas', label: 'Nicholas' },
                { id: 'fredrick', label: 'Fredrick' },
                { id: 'both', label: 'Both' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setPreparedBy(opt.id as any)}
                  className={`w-full px-2.5 rounded-lg text-left text-[10px] font-black transition-all duration-300 origin-top flex items-center cursor-pointer ${
                    preparedBy === opt.id
                      ? 'bg-primary text-primary-foreground py-1.5 h-7 min-h-[28px]'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground h-0 min-h-0 max-h-0 py-0 overflow-hidden pointer-events-none group-hover:h-7 group-hover:min-h-[28px] group-hover:max-h-12 group-hover:opacity-100 group-hover:py-1.5 group-hover:pointer-events-auto'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Page Block Navigator */}
        <div
          className="bg-card border border-border rounded-2xl p-3 shadow-xl flex flex-col gap-2.5 w-full animate-fade-in"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          <div className="flex flex-col gap-1 mx-0.5 border-b border-border/60 pb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Pages {activePages[currentPage] ? `(${activePages[currentPage].label})` : ''}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 justify-items-center">
            {pageLabels.map((label, i) => (
              <button
                key={i}
                onClick={() => scrollToPage(i)}
                title={`Go to ${label}`}
                className={`w-9 h-9 aspect-square rounded-full flex flex-col items-center justify-center text-xs font-black transition-all cursor-pointer border ${
                  currentPage === i
                    ? 'bg-primary border-primary text-primary-foreground font-black shadow-sm'
                    : 'bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border'
                }`}
              >
                {i + 1}
              </button>
            ))}

            {/* Dash block button for modify / add preset */}
            <div ref={modifyMenuRef} className="relative">
              <button
                onClick={() => setModifyMenuOpen(!modifyMenuOpen)}
                title="Modify page inclusions or presets"
                className={`w-9 h-9 aspect-square rounded-full flex items-center justify-center text-sm font-semibold transition-all cursor-pointer border border-dashed ${
                  modifyMenuOpen
                    ? 'bg-primary-soft border-primary text-primary-ink'
                    : 'bg-card border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Plus size={14} />
              </button>

              {/* Flyout Menu (aligned left because navigator is on the right of screen) */}
              {modifyMenuOpen && (
                <div 
                  className="absolute bottom-0 right-11 bg-card border border-border backdrop-blur-md rounded-xl p-1.5 shadow-2xl flex flex-col gap-0.5 min-w-[160px] z-30 animate-fade-in text-foreground text-[11px] font-semibold"
                  style={{ boxShadow: '0 10px 40px -6px rgba(0,0,0,0.3)' }}
                >
                  {onModify && (
                    <button
                      onClick={() => {
                        onModify();
                        setModifyMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors font-bold"
                    >
                      <Settings size={13} className="text-muted-foreground shrink-0" />
                      Include / Exclude
                    </button>
                  )}

                  <Link
                    href="/admin/invoices/presets"
                    onClick={() => setModifyMenuOpen(false)}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors font-bold"
                  >
                    <Plus size={13} className="text-muted-foreground shrink-0" />
                    Add New Preset
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
