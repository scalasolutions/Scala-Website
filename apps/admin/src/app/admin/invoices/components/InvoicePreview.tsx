'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, Printer, X } from 'lucide-react';
import { MockInvoice, MockClient } from '@/lib/db/queries';
import { InvoiceLineItem, getClientRefCode, formatDateClean } from './invoice-types';
import { InvoiceCoverPage } from './InvoiceCoverPage';
import { InvoiceTCPage1 } from './InvoiceTCPage1';
import { InvoiceTCPage2 } from './InvoiceTCPage2';
import { InvoiceBillingPage } from './InvoiceBillingPage';

// ── Layout constants ─────────────────────────────────────────
const PAGE_W = 800;
const PAGE_H = 1130;
const PAGE_GAP = 32;
const NUM_PAGES = 4;
const TOTAL_UNSCALED_HEIGHT = PAGE_H * NUM_PAGES + PAGE_GAP * (NUM_PAGES - 1);

const PAGE_LABELS = ['Billing', 'Cover', 'T&C (I)', 'T&C (II)'];

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
    }

    /* Position the pages wrapper in the center of the print flow at actual 100% size */
    #invoice-pages-wrapper {
      position: relative !important;
      width: 800px !important;
      margin: 0 auto !important;
      padding: 0 !important;
      transform: none !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 0 !important;
      background: white !important;
      visibility: visible !important;
    }

    /* Perfect A4 styling for each page */
    .invoice-print-page {
      width: 800px !important;
      height: 1130px !important;
      min-height: 1130px !important;
      max-height: 1130px !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      border: none !important;
      margin: 0 auto !important;
      padding: 56px 64px !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      position: relative !important;
      page-break-after: always !important;
      page-break-inside: avoid !important;
      background: white !important;
    }

    .invoice-print-page:last-child {
      page-break-after: avoid !important;
    }
  }
`;

// ── Props ─────────────────────────────────────────────────────
interface InvoicePreviewProps {
  invoice: MockInvoice;
  clients: MockClient[];
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────
export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  clients,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState(2);
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [preparedBy, setPreparedBy] = useState<'nicholas' | 'fredrick' | 'both'>('nicholas');

  const outerPagesRef = useRef<HTMLDivElement>(null);

  const effectiveScale = scale * zoomLevel;

  // Auto-fit scale on mount / resize
  useEffect(() => {
    const computeScale = () => {
      const availH = window.innerHeight - (window.innerWidth < 640 ? 160 : 200);
      const availW = window.innerWidth - (window.innerWidth < 640 ? 48 : 120);
      const s = Math.max(0.2, Math.min(availH / PAGE_H, availW / PAGE_W, 1.2));
      setScale(s);
    };
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, []);

  // Reset zoom and scroll to top when invoice changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setZoomLevel(2);
      setCurrentPage(0);
    }, 0);
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
    return () => clearTimeout(timer);
  }, [invoice]);

  // Track current page from scroll position
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    const handleScroll = () => {
      const outer = outerPagesRef.current;
      if (!outer) return;
      const mainRect = mainEl.getBoundingClientRect();
      const outerRect = outer.getBoundingClientRect();
      // How far we've scrolled past the top of the pages area
      const scrolledPast = mainRect.top - outerRect.top;
      const scaledPageSize = (PAGE_H + PAGE_GAP) * effectiveScale;
      const page = Math.max(0, Math.min(NUM_PAGES - 1, Math.floor(scrolledPast / scaledPageSize)));
      setCurrentPage(page);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, zoomLevel]);

  // Scroll main to a specific page index
  const scrollToPage = (pageIndex: number) => {
    const outer = outerPagesRef.current;
    const mainEl = document.querySelector('main');
    if (!outer || !mainEl) return;

    const mainRect = mainEl.getBoundingClientRect();
    const outerRect = outer.getBoundingClientRect();
    // Absolute top of the outer pages container within the main scroll area
    const outerTopInMain = outerRect.top - mainRect.top + mainEl.scrollTop;
    const scaledPageSize = (PAGE_H + PAGE_GAP) * effectiveScale;

    mainEl.scrollTo({ top: outerTopInMain + pageIndex * scaledPageSize, behavior: 'smooth' });
    setCurrentPage(pageIndex);
  };

  // Resolve client data
  const client = clients.find(c => c.id === invoice.clientId);
  const clientName = client?.name || 'Unknown Client';
  const companyName = client?.companyName || 'No Company';
  const parsedItems = JSON.parse(invoice.itemsJson) as InvoiceLineItem[];
  const clientRefCode = getClientRefCode(companyName || clientName, invoice.invoiceNumber);
  const formattedDate = formatDateClean(invoice.createdAt || invoice.issuedAt || new Date());

  const sharedPageProps = {
    companyName: companyName || clientName,
    clientRefCode,
    formattedDate,
    pageStyle: PAGE_STYLE,
    totalPages: NUM_PAGES,
  };

  return (
    <div className="animate-fade-up flex flex-col">

      {/* ── Print styles ── */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* ── Sticky top toolbar ── */}
      <div className="sticky top-0 z-10 w-full flex items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-lg print:hidden mb-6">

        {/* Back button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to Invoices</span>
          <span className="inline sm:hidden">Back</span>
        </button>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/60">
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.4, parseFloat((prev - 0.1).toFixed(1))))}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="text-[11px] font-bold text-foreground min-w-[40px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel(prev => Math.min(2.0, parseFloat((prev + 0.1).toFixed(1))))}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer border-l border-border/40 pl-2 ml-1"
          >
            <span className="text-[10px] font-bold tracking-wider uppercase">Reset</span>
          </button>
        </div>

        {/* Print + Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 cursor-pointer"
            style={{ boxShadow: '0 0 10px rgba(206, 248, 78, 0.2)' }}
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Print Invoice</span>
            <span className="inline sm:hidden">Print</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/*
        Outer div: provides the exact visual (scaled) height so the
        scroll container can scroll correctly.
        Inner wrapper: position:absolute + CSS scale.
      */}
      <div
        ref={outerPagesRef}
        className="relative w-full flex justify-center"
        style={{ height: TOTAL_UNSCALED_HEIGHT * effectiveScale }}
      >
        <div
          id="invoice-pages-wrapper"
          style={{
            position: 'absolute',
            top: 0,
            transform: `scale(${effectiveScale})`,
            transformOrigin: 'top center',
            width: `${PAGE_W}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: `${PAGE_GAP}px`,
          }}
        >
          <InvoiceBillingPage
            {...sharedPageProps}
            pageNumber={1}
            lineItems={parsedItems}
            total={invoice.total}
            discountType={invoice.discountType}
            discountValue={invoice.discountValue}
          />
          <InvoiceCoverPage {...sharedPageProps} pageNumber={2} preparedBy={preparedBy} />
          <InvoiceTCPage1  {...sharedPageProps} pageNumber={3} />
          <InvoiceTCPage2  {...sharedPageProps} pageNumber={4} />
        </div>
      </div>

      {/* ── Sticky right controls panel (Signature Selector & Page Navigator) ── */}
      <div
        className="sticky bottom-6 self-end mr-[15px] z-20 print:hidden flex flex-col gap-3 pointer-events-auto w-36 lg:w-40 shrink-0"
      >
        {/* Prepared By Selector */}
        <div 
          className="group bg-card border border-border rounded-2xl p-3 shadow-xl flex flex-col gap-2 transition-all duration-300"
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
                className={`w-full px-2.5 rounded-lg text-left text-[10px] font-black transition-all duration-300 origin-top flex items-center ${
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

        {/* Page Navigator */}
        <div
          className="group bg-card border border-border rounded-2xl p-1.5 shadow-xl flex flex-col gap-0 group-hover:gap-1.5 transition-all duration-300"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          {PAGE_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => scrollToPage(i)}
              title={`Go to ${label}`}
              className={`flex items-center gap-2 px-2.5 rounded-xl text-left transition-all duration-300 group/nav ${
                currentPage === i
                  ? 'bg-primary text-primary-foreground py-2 h-9 min-h-[36px]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground h-0 min-h-0 max-h-0 py-0 overflow-hidden pointer-events-none group-hover:h-9 group-hover:min-h-[36px] group-hover:max-h-12 group-hover:opacity-100 group-hover:py-2 group-hover:pointer-events-auto'
              }`}
            >
              {/* Page number badge */}
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${
                  currentPage === i
                    ? 'bg-white/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground group-hover/nav:text-foreground'
                }`}
              >
                {i + 1}
              </span>
              {/* Label — only on wider screens */}
              <span className="hidden lg:block text-[11px] font-bold pr-0.5">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
