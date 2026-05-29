'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ZoomIn, ZoomOut, Printer, X } from 'lucide-react';
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
  const [zoomPercent, setZoomPercent] = useState(100);
  const [currentPage, setCurrentPage] = useState(0);
  const [preparedBy, setPreparedBy] = useState<'nicholas' | 'fredrick' | 'both'>('nicholas');
  const [pagePresets, setPagePresets] = useState<MockInvoicePagePreset[]>([]);
  const [titlePresets, setTitlePresets] = useState<MockInvoicePagePreset[]>([]);

  const outerPagesRef = useRef<HTMLDivElement>(null);
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

  // Auto-fit scale on mount / resize
  useEffect(() => {
    const computeScale = () => {
      const availH = window.innerHeight - (window.innerWidth < 640 ? 160 : 200);
      const availW = window.innerWidth - (window.innerWidth < 640 ? 48 : 120);
      const rawScale = Math.max(0.2, Math.min(availH / PAGE_H, availW / PAGE_W, 1.2));
      // Set initial zoom percent as a rounded 10% multiple (e.g. rawScale * 2 * 100 rounded to nearest 10)
      const roundedPercent = Math.round((rawScale * 2) * 10) * 10;
      setZoomPercent(roundedPercent);
    };
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, []);

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

  const includedPageKeys = getIncludedPageKeys();

  // Composing dynamic pages catalog
  const activePages: Array<{ key: string; label: string; content?: string }> = [];
  
  // 1. Billing is always included
  activePages.push({ key: 'billing', label: 'Billing' });

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
      const scrolledPast = mainRect.top - outerRect.top;
      const scaledPageSize = (PAGE_H + PAGE_GAP) * effectiveScale;
      const page = Math.max(0, Math.min(numPages - 1, Math.floor(scrolledPast / scaledPageSize)));
      setCurrentPage(page);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomPercent, numPages]);

  // Scroll main to a specific page index
  const scrollToPage = (pageIndex: number) => {
    const outer = outerPagesRef.current;
    const mainEl = document.querySelector('main');
    if (!outer || !mainEl) return;

    const mainRect = mainEl.getBoundingClientRect();
    const outerRect = outer.getBoundingClientRect();
    const outerTopInMain = outerRect.top - mainRect.top + mainEl.scrollTop;
    const scaledPageSize = (PAGE_H + PAGE_GAP) * effectiveScale;

    mainEl.scrollTo({ top: outerTopInMain + pageIndex * scaledPageSize, behavior: 'smooth' });
    setCurrentPage(pageIndex);
  };

  // Resolve client details
  const client = clients.find(c => c.id === invoice.clientId);
  const clientName = client?.name || 'Unknown Client';
  const companyName = client?.companyName || 'No Company';
  const parsedItems = JSON.parse(invoice.itemsJson) as InvoiceLineItem[];
  const clientRefCode = getClientRefCode(companyName || clientName, invoice.invoiceNumber);
  const formattedDate = formatDateClean(invoice.createdAt || invoice.issuedAt || new Date());

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative w-full flex flex-col gap-6 select-none animate-fade-up">
      {/* Dynamic Print styles block */}
      <style>{PRINT_CSS}</style>

      {/* ── Sticky Toolbar ── */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between p-4 bg-background/90 backdrop-blur border-b border-border print:hidden"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-card border border-border hover:bg-muted text-foreground cursor-pointer transition-all"
            title="Back to Invoices"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-base font-extrabold flex items-center gap-2">
              Preview Invoice
              <span className="text-[10px] uppercase font-black tracking-widest text-primary shrink-0 bg-primary/10 px-2 py-0.5 rounded">
                Rp {invoice.total.toLocaleString('id-ID')}
              </span>
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Ref: <span className="font-mono">{invoice.invoiceNumber}</span> • {clientName}
            </p>
          </div>
        </div>

        {/* Toolbar Center Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center rounded-xl bg-muted/40 border border-border p-0.5">
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

          {/* Action Print button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all cursor-pointer"
            style={{ boxShadow: '0 0 12px rgba(206, 248, 78, 0.2)' }}
          >
            <Printer size={13} />
            Print / PDF
          </button>

          {/* Close button */}
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
        style={{ height: totalUnscaledHeight * effectiveScale }}
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
          {activePages.map((page, index) => {
            const pageNo = index + 1;
            const sharedProps = {
              companyName: companyName || clientName,
              clientRefCode,
              formattedDate,
              pageStyle: PAGE_STYLE,
              pageNumber: pageNo,
              totalPages: numPages,
            };

            if (page.key === 'billing') {
              return (
                <InvoiceBillingPage
                  key="billing"
                  {...sharedProps}
                  lineItems={parsedItems}
                  total={invoice.total}
                  discountType={invoice.discountType}
                  discountValue={invoice.discountValue}
                />
              );
            }
            if (page.key === 'cover') {
              return (
                <InvoiceCoverPage
                  key="cover"
                  {...sharedProps}
                  preparedBy={preparedBy}
                />
              );
            }
            if (page.key === 'tc1') {
              return (
                <InvoiceTCPage1
                  key="tc1"
                  {...sharedProps}
                  htmlContent={page.content}
                />
              );
            }
            if (page.key === 'tc2') {
              return (
                <InvoiceTCPage2
                  key="tc2"
                  {...sharedProps}
                  htmlContent={page.content}
                />
              );
            }

            // Custom dynamic HTML pages use the responsive TCPage1 renderer
            return (
              <InvoiceTCPage1
                key={page.key}
                {...sharedProps}
                htmlContent={page.content}
              />
            );
          })}
        </div>
      </div>

      {/* ── Sticky right controls panel (Signature Selector & Page Navigator) ── */}
      <div
        className="sticky bottom-6 self-end mr-[15px] z-20 print:hidden flex flex-col gap-3 pointer-events-auto w-36 lg:w-40 shrink-0"
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
        )}

        {/* Dynamic Page Navigator */}
        <div
          className="group bg-card border border-border rounded-2xl p-1.5 shadow-xl flex flex-col gap-0 group-hover:gap-1.5 transition-all duration-300"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          {pageLabels.map((label, i) => (
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
              {/* Label */}
              <span className="hidden lg:block text-[11px] font-bold pr-0.5 truncate">{label}</span>
            </button>
          ))}

          {/* Divider line, only visible when hovered */}
          <div className="h-px bg-border/60 mx-1.5 hidden group-hover:block transition-all duration-300" />

          {/* (+/-) Modify Button and Hover Flyout */}
          <div className="relative group/modify">
            <Link
              href="/admin/invoices/presets"
              title="Modify page inclusions or presets"
              className="w-full flex items-center gap-2 px-2.5 rounded-xl text-left transition-all duration-300 text-primary hover:bg-primary/10 h-0 min-h-0 max-h-0 py-0 overflow-hidden pointer-events-none group-hover:h-9 group-hover:min-h-[36px] group-hover:max-h-12 group-hover:opacity-100 group-hover:py-2 group-hover:pointer-events-auto border border-dashed border-primary/30 cursor-pointer font-extrabold text-xs"
            >
              <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 bg-primary/15 text-primary">
                ±
              </span>
              <span className="hidden lg:block">Modify</span>
            </Link>

            {/* Modify Flyout Options Menu */}
            <div 
              className="absolute bottom-11 right-0 bg-card border border-border backdrop-blur-md rounded-xl p-1.5 shadow-2xl flex flex-col gap-0.5 min-w-[160px] z-30 transition-all duration-200 opacity-0 pointer-events-none scale-95 origin-bottom-right group-hover/modify:opacity-100 group-hover/modify:pointer-events-auto group-hover/modify:scale-100 text-foreground text-[11px] font-semibold"
              style={{ boxShadow: '0 10px 40px -6px rgba(0,0,0,0.3)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {onModify && (
                <button
                  onClick={() => {
                    onModify();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors font-bold"
                >
                  ⚙️ Include / Exclude
                </button>
              )}

              <Link
                href="/admin/invoices/presets"
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors font-bold"
              >
                ➕ Add New Preset
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
