'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ZoomIn, ZoomOut, Printer, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MockQuotation, MockClient } from '@/lib/db/queries';
import { parseProposalSections, ProposalPackage } from '@/lib/proposal-types';
import { getPaymentModel } from '@/lib/onboarding-terms';
import ScalaLogo from '@/components/ui/ScalaLogo';

const PAGE_W = 800;
const PAGE_H = 1130;
const PAGE_GAP = 32;

const PAGE_STYLE: React.CSSProperties = {
  width: `${PAGE_W}px`,
  height: `${PAGE_H}px`,
  backgroundColor: 'white',
  padding: '64px 72px 96px 72px',
  fontFamily: "'Outfit','Inter',sans-serif",
  color: '#111111',
  boxSizing: 'border-box',
  overflow: 'hidden',
  position: 'relative',
  flexShrink: 0,
  boxShadow: '0 20px 60px -12px rgba(0,0,0,0.18)',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
};

const PRINT_CSS = `
  @media print {
    @page { size: auto; margin: 0mm; }
    body > *:not(#quotation-preview-overlay) { display: none !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    #quotation-preview-overlay {
      display: block !important; position: static !important; height: auto !important;
      overflow: visible !important; margin: 0 !important; padding: 0 !important;
      width: 100% !important; background: transparent !important;
    }
    #quotation-pages-wrapper {
      position: static !important; transform: none !important; display: flex !important;
      flex-direction: column !important; gap: 0mm !important; width: 100% !important;
    }
    .quotation-print-page {
      width: 210mm !important; height: 297mm !important; margin: 0 auto !important;
      padding: 18mm 18mm 22mm 18mm !important; border: none !important; box-shadow: none !important;
      border-radius: 0 !important; page-break-after: always !important; page-break-inside: avoid !important;
      background: white !important;
    }
    .quotation-print-page:last-child { page-break-after: avoid !important; }
  }
`;

const fmtRp = (n?: number | null) => (n != null ? `Rp ${n.toLocaleString('id-ID')}` : '—');

interface QuotationPreviewProps {
  quotation: MockQuotation;
  client?: MockClient | null;
  onClose: () => void;
}

interface LineItemLike { name: string; description?: string; price: number; quantity?: number }

const PageHeader: React.FC<{ eyebrow: string; client: string }> = ({ eyebrow, client }) => (
  <div className="flex justify-between items-start border-b border-zinc-200 pb-3 mb-5">
    <div>
      <ScalaLogo variant="full" theme="light" className="h-7 w-auto -ml-1 text-zinc-950" />
      <p className="text-[9px] text-zinc-400 mt-1.5 uppercase tracking-[0.15em] font-bold">{eyebrow}</p>
    </div>
    <span className="text-[10px] text-zinc-500 font-semibold mt-1">{client}</span>
  </div>
);

const PageFooter: React.FC<{ page: number; total: number }> = ({ page, total }) => (
  <div className="absolute bottom-12 left-[72px] right-[72px] flex justify-between items-center text-[10px] text-zinc-400 font-bold border-t border-zinc-100 pt-3">
    <span>Scala · Project Quotation</span>
    <span>Page {page} of {total}</span>
  </div>
);

export const QuotationPreview: React.FC<QuotationPreviewProps> = ({ quotation, client, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sections = parseProposalSections(quotation.sectionsJson);
  const businessName = client?.companyName || client?.name || 'Client';
  const effectiveScale = zoomPercent / 100;

  // Line items (fallback content source)
  let lineItems: LineItemLike[] = [];
  try { lineItems = JSON.parse(quotation.itemsJson || '[]'); } catch { lineItems = []; }

  // Packages — from sections, or a single fallback built from line items
  const packages: ProposalPackage[] =
    sections.packages && sections.packages.length > 0
      ? sections.packages
      : [{
          name: sections.title || 'Project Package',
          buildFee: quotation.total,
          monthlyFee: client?.hostingMonthlyFee ?? undefined,
          includedHours: client?.hostingIncludedHours ?? undefined,
          features: lineItems.map((i) => i.name).filter(Boolean),
          recommended: true,
        }];

  const paymentModel = getPaymentModel(client?.paymentModel, client?.paymentCustomStagesJson);
  const title = sections.title || 'Project Quotation';

  // Build page list dynamically
  const pages: ('cover' | 'overview' | 'packages' | 'hosting' | 'terms')[] = ['cover'];
  if (sections.businessNeed || (sections.requirements && sections.requirements.length)) pages.push('overview');
  pages.push('packages');
  if (sections.hostingNote || client?.hostingMonthlyFee != null || client?.hostingFreeLaunch) pages.push('hosting');
  pages.push('terms');
  const totalPages = pages.length;

  useEffect(() => {
    setMounted(true);
    const computeScale = () => {
      const availH = window.innerHeight - (window.innerWidth < 640 ? 160 : 200);
      const availW = window.innerWidth - (window.innerWidth < 640 ? 24 : 120);
      setZoomPercent(Math.round(Math.max(0.2, Math.min(availH / PAGE_H, availW / PAGE_W, 1.2)) * 100));
    };
    computeScale();
    window.addEventListener('resize', computeScale);
    const original = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('resize', computeScale);
      document.body.style.overflow = original;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const original = document.title;
    document.title = `Quotation - ${businessName}`;
    return () => { document.title = original; };
  }, [businessName]);

  const totalUnscaledHeight = PAGE_H * totalPages + PAGE_GAP * (totalPages - 1);

  const scrollToPage = (idx: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    isProgrammaticScroll.current = true;
    setCurrentPage(idx);
    container.scrollTo({ top: 32 + idx * (PAGE_H + PAGE_GAP) * effectiveScale, behavior: 'smooth' });
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => { isProgrammaticScroll.current = false; }, 800);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScroll.current) return;
    const container = e.currentTarget;
    const cRect = container.getBoundingClientRect();
    let active = 0, maxVisible = 0;
    pageRefs.current.forEach((p, i) => {
      if (!p) return;
      const r = p.getBoundingClientRect();
      const visible = Math.max(0, Math.min(r.bottom, cRect.bottom) - Math.max(r.top, cRect.top + 80));
      if (visible > maxVisible) { maxVisible = visible; active = i; }
    });
    if (active !== currentPage) setCurrentPage(active);
  };

  if (!mounted) return null;

  const renderPage = (key: string, index: number) => {
    const pageNum = index + 1;
    let body: React.ReactNode = null;

    if (key === 'cover') {
      body = (
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start">
            <ScalaLogo variant="full" theme="light" className="h-9 w-auto -ml-1 text-zinc-950" />
            <span className="text-[10px] bg-zinc-100 text-zinc-700 border border-zinc-200 px-2.5 py-1 rounded font-black tracking-widest uppercase">Project Quotation</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-bold mb-3">Prepared for {businessName}</p>
            <h1 className="text-5xl font-extrabold text-zinc-950 leading-[1.05] tracking-tight">{title}</h1>
            {sections.subtitle && <p className="text-base text-zinc-500 mt-5 max-w-md leading-relaxed">{sections.subtitle}</p>}
            <div className="mt-8 flex items-baseline gap-3">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">Estimated total</span>
              <span className="text-2xl font-extrabold text-zinc-900">{fmtRp(quotation.total)}</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 border-t border-zinc-100 pt-3">
            All prices in Indonesian Rupiah (Rp). · {sections.validityNote || 'Valid for 30 days from issue.'}
          </p>
        </div>
      );
    } else if (key === 'overview') {
      body = (
        <>
          <PageHeader eyebrow="Overview · Project Scope" client={businessName} />
          <h2 className="text-2xl font-extrabold text-zinc-950 mb-3">Project Overview</h2>
          {sections.businessNeed && <p className="text-[12px] text-zinc-700 leading-relaxed whitespace-pre-wrap mb-5">{sections.businessNeed}</p>}
          {sections.requirements && sections.requirements.length > 0 && (
            <>
              <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider mb-2">Main Requirements</h3>
              <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
                {sections.requirements.map((r, i) => (
                  <div key={i} className="flex gap-2 text-[11px] text-zinc-700">
                    <span className="text-emerald-600 font-bold">✓</span><span>{r}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      );
    } else if (key === 'packages') {
      body = (
        <>
          <PageHeader eyebrow="Your Options · At a Glance" client={businessName} />
          <h2 className="text-2xl font-extrabold text-zinc-950 mb-1">Package Options</h2>
          <p className="text-[11px] text-zinc-500 mb-4">Compare the available packages, then review the detailed inclusions.</p>
          <div className={`grid gap-3 ${packages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {packages.map((pkg, i) => (
              <div key={i} className={`rounded-xl border p-4 ${pkg.recommended ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-extrabold text-zinc-950">{pkg.name}</h3>
                  {pkg.recommended && <span className="text-[8px] bg-zinc-900 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Recommended</span>}
                </div>
                {pkg.tagline && <p className="text-[10px] text-zinc-500 mb-2">{pkg.tagline}</p>}
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-lg font-extrabold text-zinc-900">{fmtRp(pkg.buildFee)}</span>
                  <span className="text-[9px] text-zinc-400 font-medium">one-time build</span>
                </div>
                {pkg.monthlyFee != null && (
                  <p className="text-[10px] text-zinc-600 mb-2">+ {fmtRp(pkg.monthlyFee)}/mo hosting{pkg.includedHours != null ? ` · up to ${pkg.includedHours} hrs/mo` : ''}</p>
                )}
                <div className="border-t border-zinc-200 pt-2 mt-2 space-y-1">
                  {pkg.features.slice(0, 12).map((f, j) => (
                    <div key={j} className="flex gap-1.5 text-[10px] text-zinc-700"><span className="text-emerald-600">✓</span><span>{f}</span></div>
                  ))}
                </div>
                {pkg.bestFor && <p className="text-[9px] text-zinc-500 italic mt-2 pt-2 border-t border-zinc-100">Best for: {pkg.bestFor}</p>}
              </div>
            ))}
          </div>
        </>
      );
    } else if (key === 'hosting') {
      body = (
        <>
          <PageHeader eyebrow="After Launch · Hosting & Maintenance" client={businessName} />
          <h2 className="text-2xl font-extrabold text-zinc-950 mb-3">Hosting & Maintenance</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
              <span className="block text-[8px] uppercase tracking-wider text-zinc-400 font-extrabold mb-1">Plan</span>
              <span className="text-[11px] font-bold text-zinc-900">{client?.hostingPlanLabel || 'Standard Hosting & Maintenance'}</span>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
              <span className="block text-[8px] uppercase tracking-wider text-zinc-400 font-extrabold mb-1">Monthly</span>
              <span className="text-[11px] font-bold text-zinc-900">{client?.hostingFreeLaunch ? 'Free (early launch)' : fmtRp(client?.hostingMonthlyFee)}</span>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
              <span className="block text-[8px] uppercase tracking-wider text-zinc-400 font-extrabold mb-1">Included Support</span>
              <span className="text-[11px] font-bold text-zinc-900">{client?.hostingIncludedHours != null ? `${client.hostingIncludedHours} hrs/mo` : '—'}</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {sections.hostingNote ||
              (client?.hostingFreeLaunch
                ? 'Hosting & maintenance are provided free of charge during the early-launch period while usage stays within normal operating levels. Billing begins only when higher traffic or infrastructure usage requires additional resources, with prior notice. Full hosting and overage terms are set out in the SLA.'
                : 'Hosting keeps the website online; maintenance keeps the system working properly. Work beyond the included monthly support hours, and infrastructure usage beyond the standard allocation, are billed per the rates disclosed in the SLA.')}
          </p>
          <p className="text-[10px] text-zinc-500 italic mt-3 border-l-2 border-zinc-300 pl-2">
            Full hosting tiers, overage rates, support response times and uptime targets are detailed in the Service Level Agreement (SLA).
          </p>
        </>
      );
    } else if (key === 'terms') {
      body = (
        <>
          <PageHeader eyebrow="Project · Timeline, Payment & Terms" client={businessName} />
          <h2 className="text-2xl font-extrabold text-zinc-950 mb-3">Timeline & Payment</h2>
          {sections.timeline && (
            <p className="text-[11px] text-zinc-700 leading-relaxed mb-3"><strong className="text-zinc-950">Estimated timeline:</strong> {sections.timeline}</p>
          )}
          <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider mb-2">Payment — {paymentModel.name}</h3>
          <div className="space-y-1.5 mb-4">
            {paymentModel.stages.map((s) => (
              <div key={s.stage} className="flex items-center gap-3 text-[11px]">
                <span className="w-12 text-right font-extrabold text-zinc-900">{s.percent}%</span>
                <span className="font-semibold text-zinc-800 w-28">{s.stage}</span>
                <span className="text-zinc-500">{s.trigger}</span>
              </div>
            ))}
          </div>
          {paymentModel.note && <p className="text-[10px] text-zinc-500 italic mb-4">{paymentModel.note}</p>}

          {sections.clientProvides && sections.clientProvides.length > 0 && (
            <>
              <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider mb-2">What {businessName} Provides</h3>
              <div className="grid grid-cols-2 gap-x-5 gap-y-1 mb-4">
                {sections.clientProvides.map((c, i) => (
                  <div key={i} className="flex gap-2 text-[10px] text-zinc-700"><span className="text-emerald-600">✓</span><span>{c}</span></div>
                ))}
              </div>
            </>
          )}

          {sections.scopeTerms && (
            <>
              <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider mb-2">Scope & Terms</h3>
              <p className="text-[10px] text-zinc-600 leading-relaxed whitespace-pre-wrap mb-3">{sections.scopeTerms}</p>
            </>
          )}
          {sections.recommendation && (
            <p className="text-[11px] text-zinc-700 leading-relaxed bg-zinc-50 border border-zinc-200 rounded-lg p-3">{sections.recommendation}</p>
          )}
        </>
      );
    }

    return (
      <div
        key={key}
        ref={(el) => { pageRefs.current[index] = el; }}
        className="quotation-print-page"
        style={PAGE_STYLE}
      >
        {body}
        {key !== 'cover' && <PageFooter page={pageNum} total={totalPages} />}
      </div>
    );
  };

  return createPortal(
    <div id="quotation-preview-overlay" className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col select-none">
      <style>{PRINT_CSS}</style>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-background/90 backdrop-blur border-b border-border print:hidden w-full gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="flex items-center justify-center h-10 w-10 rounded-xl bg-card border border-border hover:bg-muted text-foreground cursor-pointer transition-all shrink-0" title="Back">
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm md:text-base font-extrabold text-foreground truncate">Quotation Preview</h2>
            <p className="text-[10px] text-muted-foreground font-mono truncate">{quotation.quotationNumber} · {businessName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="hidden md:flex items-center rounded-xl bg-muted/40 border border-border p-0.5">
            <button onClick={() => scrollToPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30 cursor-pointer"><ChevronLeft size={14} /></button>
            <span className="text-[10px] font-black text-foreground w-20 text-center tabular-nums">Page {currentPage + 1} of {totalPages}</span>
            <button onClick={() => scrollToPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage === totalPages - 1} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30 cursor-pointer"><ChevronRight size={14} /></button>
          </div>
          <div className="hidden md:flex items-center rounded-xl bg-muted/40 border border-border p-0.5">
            <button onClick={() => setZoomPercent((p) => Math.max(40, p - 10))} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"><ZoomOut size={14} /></button>
            <span className="text-[10px] font-black text-foreground w-12 text-center tabular-nums">{zoomPercent}%</span>
            <button onClick={() => setZoomPercent((p) => Math.min(250, p + 10))} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"><ZoomIn size={14} /></button>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 p-2.5 md:px-3 md:py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 cursor-pointer shadow-sm" title="Download PDF">
            <Download size={13} /><span className="hidden lg:inline">Download</span>
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 p-2.5 md:px-3 md:py-2 rounded-xl bg-card border border-border text-foreground font-semibold text-xs hover:bg-muted cursor-pointer" title="Print">
            <Printer size={13} /><span className="hidden lg:inline">Print</span>
          </button>
          <button onClick={onClose} className="hidden md:block p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer" title="Close"><X size={18} /></button>
        </div>
      </div>

      {/* Pages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto print:overflow-visible" onScroll={handleScroll}>
        <div className="flex justify-center pt-8 pb-[80vh]">
          <div className="relative" style={{ height: `${totalUnscaledHeight * effectiveScale}px`, width: `${PAGE_W * effectiveScale}px` }}>
            <div
              id="quotation-pages-wrapper"
              style={{
                position: 'absolute', top: 0, left: '50%',
                transform: `translate(-50%, 0) scale(${effectiveScale})`,
                transformOrigin: 'top center', width: `${PAGE_W}px`,
                display: 'flex', flexDirection: 'column', gap: `${PAGE_GAP}px`,
              }}
            >
              {pages.map((p, i) => renderPage(p, i))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
