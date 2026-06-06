'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  Printer, 
  X, 
  FileText, 
  CheckCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Download 
} from 'lucide-react';
import { MockClient } from '@/lib/db/queries';
import ScalaLogo from '@/components/ui/ScalaLogo';

// ── Layout constants ─────────────────────────────────────────
const PAGE_W = 800;
const PAGE_H = 1130;
const PAGE_GAP = 32;

// Shared page style applied to every A4 div
const PAGE_STYLE: React.CSSProperties = {
  width: `${PAGE_W}px`,
  height: `${PAGE_H}px`,
  backgroundColor: 'white',
  padding: '64px 72px',
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
    @page {
      size: auto;
      margin: 0mm;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Hide other fixed elements, but keep our overlay visible */
    .fixed:not(#agreement-preview-overlay) {
      display: none !important;
    }

    /* Hide all layout elements that are not part of the agreement pages */
    aside, 
    header, 
    #admin-top-header, 
    .print\\:hidden,
    main > div.absolute {
      display: none !important;
    }

    /* Reset agreement overlay for printing */
    #agreement-preview-overlay {
      display: block !important;
      position: static !important;
      height: auto !important;
      min-height: auto !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background: transparent !important;
    }

    /* Reset canvas container and inner scale-wrapper for print */
    #agreement-canvas-container,
    #agreement-canvas-unscale {
      display: block !important;
      position: static !important;
      height: auto !important;
      min-height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }

    /* Reset containers */
    html, body {
      height: auto !important;
      min-height: auto !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      background-color: white !important;
    }

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
    }

    #agreement-pages-wrapper {
      position: static !important;
      transform: none !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 0mm !important;
      width: 100% !important;
    }

    .agreement-print-page {
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

    .agreement-print-page:last-child {
      page-break-after: avoid !important;
    }
  }
`;

interface ClientAgreementPreviewProps {
  client: MockClient;
  onClose: () => void;
}

export const ClientAgreementPreview: React.FC<ClientAgreementPreviewProps> = ({
  client,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [preparedBy, setPreparedBy] = useState<'nicholas' | 'fredrick' | 'both'>('nicholas');
  const [currentPage, setCurrentPage] = useState(0);
  const [mobilePreparedOpen, setMobilePreparedOpen] = useState(false);
  const [mobilePageJumpOpen, setMobilePageJumpOpen] = useState(false);

  const outerPagesRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const mobilePreparedRef = useRef<HTMLDivElement>(null);
  const mobilePageJumpRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveScale = zoomPercent / 100;
  const numPages = 2;
  const totalUnscaledHeight = PAGE_H * numPages + PAGE_GAP * (numPages - 1);

  // Auto-fit scale on mount / resize & lock body scroll
  useEffect(() => {
    setMounted(true);
    const computeScale = () => {
      const availH = window.innerHeight - (window.innerWidth < 640 ? 160 : 200);
      const availW = window.innerWidth - (window.innerWidth < 640 ? 24 : 120);
      const rawScale = Math.max(0.2, Math.min(availH / PAGE_H, availW / PAGE_W, 1.2));
      const roundedPercent = Math.round(rawScale * 100);
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

  // Click outside listener for mobile HUD popovers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (mobilePreparedRef.current && !mobilePreparedRef.current.contains(target)) {
        setMobilePreparedOpen(false);
      }
      if (mobilePageJumpRef.current && !mobilePageJumpRef.current.contains(target)) {
        setMobilePageJumpOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Dynamically set document title when the preview is active to control the tab name and PDF filename
  useEffect(() => {
    const originalTitle = document.title;
    const businessName = client.companyName || client.name;
    document.title = `SLA Agreement - ${businessName}`;

    return () => {
      document.title = originalTitle;
    };
  }, [client.name, client.companyName]);

  const scrollToPage = (pageIndex: number) => {
    const container = scrollContainerRef.current;
    if (container) {
      isProgrammaticScroll.current = true;
      setCurrentPage(pageIndex);
      
      const paddingTop = 32; // pt-8 top padding of #agreement-canvas-container
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
      }, 800); // 800ms duration covers standard smooth scrolls
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScroll.current) return;
    
    const container = e.currentTarget;
    const containerRect = container.getBoundingClientRect();
    const toolbarHeight = 80;

    let activePage = 0;
    let maxVisibleHeight = 0;

    pageRefs.current.forEach((page, index) => {
      if (!page) return;
      const rect = page.getBoundingClientRect();
      
      const visibleTop = Math.max(rect.top, containerRect.top + toolbarHeight);
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

  const formattedDate = new Date(client.subscriptionStartDate || client.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const signedDateFormatted = client.tcSignedAt
    ? new Date(client.tcSignedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  if (!mounted) return null;

  return createPortal(
    <div 
      id="agreement-preview-overlay" 
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col select-none"
    >
      <style>{PRINT_CSS}</style>

      {/* ── Sticky Toolbar ── */}
      <div className="flex items-center justify-between p-4 bg-background/90 backdrop-blur border-b border-border print:hidden w-full gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-card border border-border hover:bg-muted text-foreground cursor-pointer transition-all shrink-0"
            title="Back to Clients"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm md:text-base font-extrabold text-foreground truncate">
              <span className="hidden sm:inline">T&C & SLA </span>Agreement Preview
            </h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px] sm:max-w-none">
                Ref: SLA • {client.companyName || client.name}
              </p>
              <span className={`text-[9px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 ${
                client.tcStatus === 'signed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
              }`}>
                {client.tcStatus === 'signed' ? (
                  <>
                    <CheckCircle size={10} />
                    Signed
                  </>
                ) : (
                  <>
                    <Clock size={10} />
                    Pending Signature
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar Center Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Page navigation */}
          <div className="hidden md:flex items-center rounded-xl bg-muted/40 border border-border p-0.5">
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
              onClick={() => setZoomPercent(prev => Math.min(250, prev + 10))}
              className="p-1.5 rounded-lg hover:bg-muted hover:text-foreground text-muted-foreground cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Action Download button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 p-2.5 md:px-3 md:py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all cursor-pointer shadow-sm hover:shadow-md"
            title="Download PDF"
          >
            <Download size={13} />
            <span className="hidden lg:inline">Download</span>
          </button>

          {/* Action Print button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 p-2.5 md:px-3 md:py-2 rounded-xl bg-card border border-border text-foreground font-semibold text-xs hover:bg-muted transition-all cursor-pointer"
            title="Print SLA Document"
          >
            <Printer size={13} />
            <span className="hidden lg:inline">Print</span>
          </button>

          <div className="h-6 w-[1px] bg-border/60 mx-1 hidden md:block" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="hidden md:block p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
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
        <div id="agreement-canvas-container" className="flex justify-center pt-8 pb-[80vh]">
        <div
          ref={outerPagesRef}
          id="agreement-canvas-unscale"
          className="relative"
          style={{
            height: `${totalUnscaledHeight * effectiveScale}px`,
            width: `${PAGE_W * effectiveScale}px`,
          }}
        >
          <div
            id="agreement-pages-wrapper"
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
            {/* ────────────────────────────────────────────────────────── */}
            {/* PAGE 1: TERMS & CONDITIONS                                 */}
            {/* ────────────────────────────────────────────────────────── */}
            <div ref={el => { pageRefs.current[0] = el; }} className="agreement-print-page" style={PAGE_STYLE}>
              {/* Cover Header */}
              <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-6 mb-8">
                <div>
                  <ScalaLogo variant="full" theme="light" className="h-8 w-auto -ml-1 text-zinc-950" />
                  <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-wider font-semibold">Web Infrastructure & Hosting Agreements</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-zinc-100 text-zinc-800 border border-zinc-200 px-2.5 py-0.5 rounded font-black tracking-wider uppercase">Contractual SLA</span>
                </div>
              </div>

              {/* Title Section */}
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-zinc-950 uppercase tracking-tight leading-none mb-2">Master Services Agreement</h1>
                <p className="text-sm text-zinc-500">Effective as of <span className="font-semibold text-zinc-800">{formattedDate}</span>, between Scala Solutions and the client named below.</p>
              </div>

              {/* Client Info InfoBox */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-50 border border-zinc-200 rounded-xl p-5 mb-8 text-xs">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-extrabold block mb-1">Contractor</span>
                  <p className="font-bold text-zinc-900">Scala Solutions (Indonesia)</p>
                  <p className="text-zinc-600 mt-0.5">Email: admin@scala.sh</p>
                  <p className="text-zinc-600 mt-0.5">Website: www.scalapremier.com</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-extrabold block mb-1">Client Entity</span>
                  <p className="font-bold text-zinc-900">{client.companyName || client.name}</p>
                  <p className="text-zinc-600 mt-0.5">Contact: {client.name}</p>
                  <p className="text-zinc-600 mt-0.5">Email: {client.email}</p>
                </div>
              </div>

              {/* T&C Core Content */}
              <div className="text-zinc-800 space-y-3 leading-relaxed text-[11px] font-medium">
                <div>
                  <h3 className="font-bold text-zinc-950 text-xs mb-1 uppercase tracking-wider">1. Scope of Work, Revisions & Delivery Acceptance</h3>
                  <p>
                    Scala Solutions provides services, deliverables, and infrastructure management as itemized in the client's Invoice or Statement of Work (SOW), currently configured as <span className="font-semibold capitalize text-zinc-900">{client.subscriptionType || 'No Active Plan'} Hosting</span> with a service quota of <span className="font-semibold text-zinc-900">{client.subscriptionMonths || 12} Months</span> starting from the subscription start date. Any included revision cycles are strictly limited to those explicitly itemized in the Invoice or SOW. If no revision cycles are explicitly listed, the Client is entitled to a maximum of one (1) round of minor cosmetic revisions within five (5) business days of delivery. All further revisions, late feedback, or functional modifications are outside the original scope and will be billed separately at Scala Solutions' standard hourly rate.
                  </p>
                  <p className="mt-1">
                    All deliverables or milestones are deemed accepted five (5) business days after delivery unless the Client submits detailed written feedback. Payment milestones are triggered automatically upon acceptance.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-zinc-950 text-xs mb-1 uppercase tracking-wider">2. Billing, Payments & Service Suspension</h3>
                  <p>
                    The Client shall pay Scala Solutions all recurring subscription fees and development costs as itemized in the invoices. All payments are strictly net-14 from the date of invoice issuance. Invoices unpaid after fourteen (14) calendar days will result in immediate suspension of all services (including hosting, Client Portal access, support, and custom applications). A reactivation fee of IDR 1,500,000 / $100 USD will apply to resume services. Overdue accounts forfeit all rights to SLA guarantees and uptime credits.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-zinc-950 text-xs mb-1 uppercase tracking-wider">3. Intellectual Property Rights & Code Reuse</h3>
                  <p>
                    Scala Solutions retains 100% ownership of all source code, database structures, designs, and files until all outstanding invoices related to the project are paid in full. Staging, hosting, or production deployment of unpaid deliverables is strictly prohibited and constitutes copyright infringement.
                  </p>
                  <p className="mt-1">
                    Unless an exclusive IP buyout is explicitly agreed upon in writing, Scala Solutions retains all rights to reuse standard code modules, architectural frameworks, and design libraries developed during the project for other clients or internal products.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-zinc-950 text-xs mb-1 uppercase tracking-wider">4. Client Portal & Account Operations</h3>
                  <p>
                    Scala Solutions provides the Client with secure access to the Scala Client Portal (portal.scala.sh). The Client shall utilize the Portal as the primary digital environment for account operations: (i) opening and communicating on technical support tickets; (ii) viewing and paying outstanding invoices; (iii) monitoring cloud infrastructure resources and uptime SLA reports; and (iv) digitally reviewing and signing authorized service contracts or addendums. Any support requests, ticket actions, or signature authorizations submitted under verified Client credentials will be deemed fully authorized and legally binding on the Client.
                  </p>
                </div>

                {client.tcCustomTerms ? (
                  <div className="bg-zinc-50/50 border border-dashed border-zinc-300 rounded-xl p-4 mt-2">
                    <h3 className="font-bold text-zinc-950 text-xs mb-1 uppercase tracking-wider text-primary">★ Special Rider & Custom Clauses</h3>
                    <p className="italic text-zinc-700">{client.tcCustomTerms}</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-zinc-950 text-xs mb-1 uppercase tracking-wider">5. Governing Law & Dispute Resolution</h3>
                    <p>
                      This Master Services Agreement is governed and construed in accordance with the laws of the Republic of Indonesia. Both parties submit to the exclusive jurisdiction of the court chambers located in Jakarta for any legal actions arising under this contract.
                    </p>
                  </div>
                )}
              </div>

              {/* Page Footer */}
              <div className="absolute bottom-16 left-16 right-16 flex justify-between items-center text-[10px] text-zinc-400 font-bold border-t border-zinc-100 pt-3">
                <span>Scala Master Services Agreement</span>
                <span>Page 1 of 2</span>
              </div>
            </div>

            {/* ────────────────────────────────────────────────────────── */}
            {/* PAGE 2: SLA AGREEMENT & SIGNATURES                        */}
            {/* ────────────────────────────────────────────────────────── */}
            <div ref={el => { pageRefs.current[1] = el; }} className="agreement-print-page" style={PAGE_STYLE}>
              {/* Mini Header */}
              <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-6 text-[10px] font-bold text-zinc-400">
                <span>SCALA SOLUTIONS &bull; SLA SCHEDULE</span>
              </div>

              {/* Title */}
              <div className="mb-6">
                <h2 className="text-xl font-extrabold text-zinc-950 uppercase tracking-tight">Service Level Agreement (SLA)</h2>
                <p className="text-[11px] text-zinc-500 mt-1">This Schedule outlines network availability targets, support tickets resolution times, and the signature sign-off.</p>
              </div>

              {/* SLA Details */}
              <div className="space-y-4 text-[11px] text-zinc-800 leading-relaxed font-medium mb-8">
                <div>
                  <h3 className="font-bold text-zinc-950 text-xs mb-1 uppercase tracking-wider">1. Uptime Commitment & Exclusions</h3>
                  <p>
                    Scala Solutions commits to delivering a monthly network availability uptime target for all hosting services:
                  </p>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-[10px] text-zinc-700">
                    <li><strong className="text-zinc-950">Standard Cloud Hosting Plan</strong>: <span className="font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">99.99% Network Availability Target</span></li>
                  </ul>
                  <p className="mt-1">
                    Uptime targets exclude scheduled maintenance windows (announced 24 hours in advance), Force Majeure events, client-side domain/DNS configuration failures, third-party API or upstream service outages, or periods where the client account is in payment default.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-zinc-950 text-xs mb-1 uppercase tracking-wider">2. Technical Support Response Tiers & Scope Boundaries</h3>
                  <p>
                    Scala Support handles tickets with a priority-tiered response target clock as below:
                  </p>
                  <table className="w-full border-collapse border border-zinc-200 rounded-xl overflow-hidden mt-2 text-[10px]">
                    <thead>
                      <tr className="bg-zinc-50 text-zinc-900 font-extrabold border-b border-zinc-200">
                        <th className="border border-zinc-200 p-2 text-left">Priority Tier</th>
                        <th className="border border-zinc-200 p-2 text-left">Initial Response Time</th>
                        <th className="border border-zinc-200 p-2 text-left">Target Update Cycle</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-zinc-200 p-2 font-bold text-red-600 bg-red-50/20">🚨 Urgent / Severity 1</td>
                        <td className="border border-zinc-200 p-2">&le; 2 Business Hours</td>
                        <td className="border border-zinc-200 p-2">Every 4 Hours</td>
                      </tr>
                      <tr>
                        <td className="border border-zinc-200 p-2 font-bold text-amber-600 bg-amber-50/20">⚠️ High / Severity 2</td>
                        <td className="border border-zinc-200 p-2">&le; 6 Business Hours</td>
                        <td className="border border-zinc-200 p-2">Every 12 Hours</td>
                      </tr>
                      <tr>
                        <td className="border border-zinc-200 p-2 text-zinc-700">💬 Medium & Low / Severity 3</td>
                        <td className="border border-zinc-200 p-2">&le; 24 Business Hours</td>
                        <td className="border border-zinc-200 p-2">Upon Resolution</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-2 text-[10px] text-zinc-500 italic">
                    Support is strictly limited to infrastructure stability, network availability, and server configurations. Support explicitly excludes custom application coding, design revisions, database tuning, training, or code modified by the client or third parties without Scala Solutions' explicit written approval.
                  </p>
                </div>

                {client.slaCustomTerms && (
                  <div className="bg-zinc-50/50 border border-dashed border-zinc-300 rounded-xl p-4 mt-2">
                    <h3 className="font-bold text-zinc-950 text-xs mb-1 uppercase tracking-wider text-primary">★ Custom SLA Commitments</h3>
                    <p className="italic text-zinc-700">{client.slaCustomTerms}</p>
                  </div>
                )}
              </div>

              {/* Sign-Off Authorization */}
              <div className="border-t border-zinc-200 pt-6 mt-8">
                <h3 className="font-bold text-zinc-950 text-xs mb-1 uppercase tracking-wider">3. Execution & Authorization</h3>
                <p className="text-[10px] text-zinc-500 leading-relaxed mb-8">
                  By signing below, or by authorization signature status verified in the Scala Solutions Admin Console, both the Contractor (Scala Solutions) and the Client (Entity listed) agree to be legally bound by this Master Services Agreement and Uptime SLA.
                </p>

                {/* Signatures Dual Box */}
                <div className="grid grid-cols-2 gap-8 text-[11px]">
                  {/* Scala Side */}
                  <div className="border border-zinc-200 rounded-xl p-4 relative flex flex-col justify-between min-h-[145px]">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-extrabold block mb-1">Authorized Contractor Signature</span>
                      
                      <div className="flex gap-4 items-end mt-1.5">
                        {(preparedBy === 'nicholas' || preparedBy === 'both') && (
                          <div className="flex flex-col">
                            <img
                              src="/chai-signature.png"
                              alt="Nicholas Signature"
                              className="h-10 w-auto object-contain mix-blend-multiply block"
                              style={{ maxHeight: '40px' }}
                            />
                            <div className="mt-1">
                              <div className="text-[9px] font-black text-zinc-900 leading-tight">Nicholas Chairnando</div>
                              <div className="text-[8px] text-zinc-400 leading-none">Co-Founder, Scala</div>
                            </div>
                          </div>
                        )}

                        {(preparedBy === 'fredrick' || preparedBy === 'both') && (
                          <div className="flex flex-col">
                            <img
                              src="/digital-signature-fred.png"
                              alt="Fredrick Signature"
                              className="h-10 w-auto object-contain mix-blend-multiply block"
                              style={{ maxHeight: '40px' }}
                            />
                            <div className="mt-1">
                              <div className="text-[9px] font-black text-zinc-900 leading-tight">Fredrick Yang</div>
                              <div className="text-[8px] text-zinc-400 leading-none">Co-Founder, Scala</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Contractor Signature Footer */}
                    <div className="mt-3 border-t border-zinc-100 pt-2 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-wider">✓ Approved & Verified</span>
                    </div>
                  </div>

                  {/* Client Side */}
                  <div className="border border-zinc-200 rounded-xl p-4 relative flex flex-col justify-between min-h-[145px]">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-extrabold block">Authorized Client Representative</span>
                      <p className="font-bold text-zinc-900 mt-2">{client.name}</p>
                      <p className="text-zinc-500 text-[10px]">{client.companyName || 'Representative'}</p>
                    </div>

                    <div className="mt-3 border-t border-zinc-100 pt-2 flex flex-col gap-1.5">
                      <div className="flex justify-between gap-4">
                        <div className="flex-1 border-b border-zinc-300 h-8"></div>
                        <div className="w-24 border-b border-zinc-300 h-8"></div>
                      </div>
                      <div className="flex justify-between text-[7px] text-zinc-400 font-mono uppercase tracking-wider">
                        <span>Signature</span>
                        <span>Date</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page Footer */}
              <div className="absolute bottom-16 left-16 right-16 flex justify-between items-center text-[10px] text-zinc-400 font-bold border-t border-zinc-100 pt-3">
                <span>Scala Master Services Agreement</span>
                <span>Page 2 of 2</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Close scrollable content container */}
      </div>

      {/* ── Floating right controls panel (Prepared By Signature Selector) ── */}
      <div
        className="hidden md:flex absolute bottom-6 right-[15px] z-20 print:hidden flex-col gap-3 pointer-events-auto w-36 lg:w-40 shrink-0"
      >
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
      </div>

      {/* ── Mobile Bottom HUD ── */}
      <div
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-card/85 dark:bg-card/85 backdrop-blur-md border border-border/80 px-4 py-2 rounded-full shadow-2xl print:hidden pointer-events-auto shrink-0 select-none"
        style={{ boxShadow: '0 10px 32px rgba(0,0,0,0.15)' }}
      >
        {/* Page navigation: Prev */}
        <button
          onClick={() => scrollToPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="p-1.5 rounded-full hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page indicator & Tap to Jump Trigger */}
        <div ref={mobilePageJumpRef} className="relative">
          <button
            onClick={() => setMobilePageJumpOpen(!mobilePageJumpOpen)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide cursor-pointer transition-all border ${
              mobilePageJumpOpen
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-muted/55 border-border/60 text-foreground hover:bg-muted hover:border-border'
            }`}
          >
            {currentPage + 1} / {numPages}
          </button>

          {/* Page Jump Grid Popover */}
          {mobilePageJumpOpen && (
            <div
              className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-card border border-border backdrop-blur-md rounded-2xl p-3 shadow-2xl flex flex-col gap-2 min-w-[150px] z-40 animate-fade-in"
              style={{ boxShadow: '0 10px 40px -6px rgba(0,0,0,0.25)' }}
            >
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center block border-b border-border/60 pb-1 mb-0.5">
                Jump to Page
              </span>
              <div className="grid grid-cols-2 gap-1.5 justify-items-center">
                {Array.from({ length: numPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      scrollToPage(i);
                      setMobilePageJumpOpen(false);
                    }}
                    title={`Page ${i + 1}`}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all cursor-pointer border ${
                      currentPage === i
                        ? 'bg-primary border-primary text-primary-foreground font-black'
                        : 'bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Page navigation: Next */}
        <button
          onClick={() => scrollToPage(Math.min(numPages - 1, currentPage + 1))}
          disabled={currentPage === numPages - 1}
          className="p-1.5 rounded-full hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>

        {/* Divider */}
        <div className="h-4 w-[1px] bg-border/60" />

        {/* Prepared By Initials Selector */}
        <div ref={mobilePreparedRef} className="relative">
          <button
            onClick={() => setMobilePreparedOpen(!mobilePreparedOpen)}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border transition-all cursor-pointer ${
              mobilePreparedOpen
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-muted/55 border-border/60 text-foreground hover:bg-muted hover:border-border'
            }`}
            title={`Prepared by: ${preparedBy}`}
          >
            {preparedBy === 'nicholas' ? 'N' : preparedBy === 'fredrick' ? 'F' : 'N&F'}
          </button>

          {/* Prepared By Touch Popover */}
          {mobilePreparedOpen && (
            <div
              className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-card border border-border backdrop-blur-md rounded-2xl p-1.5 shadow-2xl flex flex-col gap-0.5 min-w-[130px] z-40 animate-fade-in text-[10px] font-bold"
              style={{ boxShadow: '0 10px 40px -6px rgba(0,0,0,0.25)' }}
            >
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center block border-b border-border/60 pb-1 mb-1">
                Prepared By
              </span>
              {[
                { id: 'nicholas', label: 'Nicholas' },
                { id: 'fredrick', label: 'Fredrick' },
                { id: 'both', label: 'Both' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setPreparedBy(opt.id as any);
                    setMobilePreparedOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center cursor-pointer font-black ${
                    preparedBy === opt.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
