'use client';

import React from 'react';
import { X, Printer } from 'lucide-react';
import { MockClientUsageReport } from '@/lib/db/queries';

const TIER_LIMITS: Record<string, {
  visits: number;
  bandwidthGb: number;
  storageGb: number;
  cpuCores: number;
  ramMb: number;
}> = {
  static: {
    visits: 50000,
    bandwidthGb: 50,
    storageGb: 5,
    cpuCores: 0,
    ramMb: 0,
  },
  dynamic_basic: {
    visits: 20000,
    bandwidthGb: 50,
    storageGb: 10,
    cpuCores: 2,
    ramMb: 2048,
  },
  dynamic_growth: {
    visits: 100000,
    bandwidthGb: 100,
    storageGb: 20,
    cpuCores: 4,
    ramMb: 4096,
  },
  business: {
    visits: 300000,
    bandwidthGb: 250,
    storageGb: 50,
    cpuCores: 8,
    ramMb: 8192,
  },
  none: {
    visits: 0,
    bandwidthGb: 0,
    storageGb: 0,
    cpuCores: 0,
    ramMb: 0,
  }
};

const formatTierName = (tier: string) => {
  switch (tier) {
    case 'static': return 'Static Hosting';
    case 'dynamic_basic': return 'Dynamic Basic';
    case 'dynamic_growth': return 'Dynamic Growth';
    case 'business': return 'Business Hosting';
    default: return 'No Hosting Tier';
  }
};

interface UsageReportPreviewProps {
  report: MockClientUsageReport;
  client: { name: string; companyName?: string | null; subscriptionType?: string | null };
  hostingTier?: string;
  theme: 'dark' | 'light';
  onClose: () => void;
}

export function UsageReportPreview({ report, client, hostingTier, theme, onClose }: UsageReportPreviewProps) {
  const monthLabel = new Date(`${report.month}-01`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  const handlePrint = () => {
    window.print();
  };

  const resolvedTier = hostingTier || (client.subscriptionType === 'static' ? 'static' : client.subscriptionType === 'dynamic' ? 'dynamic_basic' : 'none');
  const limits = TIER_LIMITS[resolvedTier] || TIER_LIMITS.none;

  const metrics = [
    {
      label: 'Total Visits',
      value: report.visits,
      limit: limits.visits,
      formattedValue: report.visits.toLocaleString(),
      formattedLimit: limits.visits.toLocaleString(),
      unit: 'requests',
      note: 'Unique page requests served during this period'
    },
    {
      label: 'Bandwidth Used',
      value: report.bandwidthGb,
      limit: limits.bandwidthGb,
      formattedValue: `${report.bandwidthGb.toFixed(2)} GB`,
      formattedLimit: `${limits.bandwidthGb.toFixed(2)} GB`,
      unit: 'data transfer',
      note: 'Outbound data delivered to end users'
    },
    {
      label: 'Storage Used',
      value: report.storageGb,
      limit: limits.storageGb,
      formattedValue: `${report.storageGb.toFixed(2)} GB`,
      formattedLimit: `${limits.storageGb.toFixed(2)} GB`,
      unit: 'disk space',
      note: 'Files, assets, and database storage consumed'
    },
    {
      label: 'Peak CPU Load',
      value: report.peakCpuCores,
      limit: limits.cpuCores,
      formattedValue: `${report.peakCpuCores.toFixed(2)} vCPU`,
      formattedLimit: `${limits.cpuCores.toFixed(2)} vCPU`,
      unit: 'cores',
      note: 'Highest recorded CPU allocation during peak hours'
    },
    {
      label: 'Peak RAM Usage',
      value: report.peakRamMb,
      limit: limits.ramMb,
      formattedValue: `${report.peakRamMb} MB`,
      formattedLimit: `${limits.ramMb} MB`,
      unit: 'memory',
      note: 'Maximum memory footprint observed during period'
    },
  ];

  return (
    <>
      {/* Print styles — A4, hides everything except the report */}
      <style>{`
        @media print {
          body > *:not(#usage-report-print-root) { display: none !important; }
          #usage-report-print-root { display: block !important; position: fixed; inset: 0; z-index: 9999; background: white; }
          .usage-report-no-print { display: none !important; }
          .usage-report-page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm 18mm;
            margin: 0 auto;
            background: white;
            color: #0f172a;
            font-family: system-ui, -apple-system, sans-serif;
          }
          @page { size: A4 portrait; margin: 0; }
          .print-progress-bg { background-color: #f1f5f9 !important; border: 1px solid #cbd5e1 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-progress-fill { background-color: #0f172a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-progress-fill-amber { background-color: #d97706 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-progress-fill-rose { background-color: #dc2626 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Overlay container */}
      <div id="usage-report-print-root" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 print:p-0 print:block">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm usage-report-no-print"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className={`relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl print:rounded-none print:shadow-none print:max-h-none print:overflow-visible print:max-w-none print:w-full print:fixed print:inset-0 ${
          theme === 'dark' ? 'bg-[#0e1117] text-white' : 'bg-white text-slate-900'
        }`}>

          {/* Toolbar — hidden on print */}
          <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b usage-report-no-print ${
            theme === 'dark' ? 'bg-[#0e1117]/95 border-white/10 backdrop-blur-md' : 'bg-white/95 border-slate-200 backdrop-blur-md'
          }`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Usage Report Preview</p>
              <h3 className="text-sm font-black">{monthLabel} · {client.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all cursor-pointer shadow-md"
                style={{ boxShadow: '0 4px 15px rgba(206,248,78,0.25)' }}
              >
                <Printer size={14} />
                Download PDF
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  theme === 'dark' ? 'border-white/10 hover:bg-white/10' : 'border-slate-200 hover:bg-slate-100'
                }`}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* A4 Report Content */}
          <div className="usage-report-page p-10 print:p-0">

            {/* Report Header */}
            <div className="flex items-start justify-between mb-10 pb-6 border-b-2 border-[#CEF84E]/60 print:border-black/20">
              <div>
                {/* Scala wordmark */}
                <svg width="90" height="28" viewBox="0 0 1312 539" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto mb-3">
                  <path d="M364 71C392.167 71 415 156.514 415 262C415 367.486 392.167 453 364 453C343.793 453 326.332 408.99 318.076 345.168C317.638 341.778 312.326 341.44 311.44 344.741C294.178 409.036 265.384 454.256 241.682 450.393C231.539 448.739 223.734 438.327 218.653 421.783C217.773 418.916 213.386 418.598 212.097 421.305C202.798 440.82 189.618 453 175 453C146.833 453 124 407.781 124 352C124 296.219 146.833 251 175 251C192.351 251 207.678 268.16 216.89 294.379C217.215 295.302 218.595 295.208 218.772 294.246C233.834 212.527 268.511 149.942 296.225 154.46C302.758 155.525 308.32 160.224 312.81 167.855C314.412 170.578 319.292 169.952 319.772 166.829C328.578 109.558 345.087 71 364 71Z" fill="#CEF84E"/>
                  <path d="M563 365.5C519 365.5 492 342.5 492 306.25H531C531 323 543.5 332.75 562.75 332.75C579.25 332.75 589.75 326 589.75 314.25C589.75 302 578.5 294.75 553.75 289.5C512.75 280.75 493.5 263.75 493.5 235.25C493.5 203.25 518.5 183.5 558.75 183.5C600.25 183.5 626.75 206 626.75 241.25H588.5C588.5 225.5 577.5 216 559.25 216C542.5 216 532.25 223 532.25 234.5C532.25 245.25 541.5 252 568.25 258.25C611.75 268.5 630 285 630 312.75C630 345.75 604.5 365.5 563 365.5ZM722.656 365.5C680.406 365.5 650.906 336.75 650.906 296.25C650.906 256 680.656 227.25 722.656 227.25C759.156 227.25 787.156 248.5 793.156 281H756.656C750.406 267.75 738.156 259.75 723.156 259.75C702.656 259.75 688.406 274.75 688.406 296.25C688.406 317.75 702.656 332.75 722.656 332.75C739.156 332.75 752.156 323.5 757.406 309.25H794.406C787.406 343.75 759.656 365.5 722.656 365.5ZM865.283 364.5C834.283 364.5 815.033 349 815.033 323.75C815.033 299.5 832.533 283.75 859.783 283.75H907.283V277.75C907.283 264.75 897.033 256.25 882.033 256.25C869.783 256.25 860.283 262.5 858.033 271.75H821.533C826.283 243.25 848.283 227.25 881.783 227.25C921.033 227.25 944.533 248.25 944.533 283V362H916.283L912.033 346.75C900.783 358.25 884.783 364.5 865.283 364.5ZM852.533 322.25C852.533 331.25 861.033 337.25 874.033 337.25C893.033 337.25 906.783 325.25 907.533 307.5H871.533C860.033 307.5 852.533 313.25 852.533 322.25ZM979.98 362V177H1017.98V362H979.98ZM1099.66 364.5C1068.66 364.5 1049.41 349 1049.41 323.75C1049.41 299.5 1066.91 283.75 1094.16 283.75H1141.66V277.75C1141.66 264.75 1131.41 256.25 1116.41 256.25C1104.16 256.25 1094.66 262.5 1092.41 271.75H1055.91C1060.66 243.25 1082.66 227.25 1116.16 227.25C1155.41 227.25 1178.91 248.25 1178.91 283V362H1150.66L1146.41 346.75C1135.16 358.25 1119.16 364.5 1099.66 364.5ZM1086.91 322.25C1086.91 331.25 1095.41 337.25 1108.41 337.25C1127.41 337.25 1141.16 325.25 1141.91 307.5H1105.91C1094.41 307.5 1086.91 313.25 1086.91 322.25Z" fill="currentColor"/>
                </svg>
                <h1 className="text-2xl font-black tracking-tight">Monthly Infrastructure Report</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{monthLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prepared for</p>
                <p className="text-sm font-black">{client.name}</p>
                {client.companyName && <p className="text-xs text-muted-foreground">{client.companyName}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">
                  Hosting: <span className="font-bold">{formatTierName(resolvedTier)}</span>
                </p>
              </div>
            </div>

            {/* Status Banner */}
            {report.statusNote && (
              <div className="mb-8 p-4 rounded-xl bg-[#CEF84E]/10 border border-[#CEF84E]/30 print:bg-gray-50 print:border-gray-300">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">System Status</p>
                <p className="text-sm font-semibold">{report.statusNote}</p>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Resource Utilization Summary</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((m) => {
                  const hasLimit = m.limit > 0;
                  const ratio = hasLimit ? m.value / m.limit : 0;
                  
                  let textClass = 'text-foreground';
                  let progressFillClass = 'bg-[#CEF84E] print-progress-fill';
                  
                  if (hasLimit) {
                    if (ratio >= 1.0) {
                      textClass = 'text-rose-500 font-extrabold print:text-rose-600';
                      progressFillClass = 'bg-rose-500 print-progress-fill-rose';
                    } else if (ratio >= 0.85) {
                      textClass = 'text-amber-500 font-bold print:text-amber-600';
                      progressFillClass = 'bg-amber-500 print-progress-fill-amber';
                    }
                  }

                  return (
                    <div
                      key={m.label}
                      className={`p-5 rounded-xl border flex flex-col justify-between ${
                        theme === 'dark' ? 'bg-[#151824]/40 border-white/10' : 'bg-slate-50 border-slate-200'
                      } print:bg-gray-50 print:border-gray-200`}
                    >
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{m.label}</p>
                        <p className={`text-2xl font-black tabular-nums mt-1 ${textClass}`}>{m.formattedValue}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{m.unit}</p>
                      </div>

                      {hasLimit ? (
                        <div className="mt-4 pt-3 border-t border-border/10">
                          <div className="flex justify-between items-center text-[10px] mb-1.5">
                            <span className="text-muted-foreground/80">Capacity Limit</span>
                            <span className={`font-semibold ${textClass}`}>
                              {Math.round(ratio * 100)}% of {m.formattedLimit}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 print-progress-bg overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progressFillClass}`}
                              style={{ width: `${Math.min(100, ratio * 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 pt-3 border-t border-border/10 text-[9px] text-muted-foreground/60 italic">
                          No capacity limit (Unlimited)
                        </div>
                      )}
                      
                      <p className="text-[9px] text-muted-foreground/60 mt-2 leading-relaxed">{m.note}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/40 print:border-gray-300 mb-6" />

            {/* SLA Commitments */}
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">SLA Commitments This Period</p>
              <div className="space-y-2 text-xs">
                {[
                  'Premium CDN node caching active — global low-latency delivery maintained.',
                  'Automated uptime monitoring and failover routing active throughout the period.',
                  'Secure daily offsite database backups completed without interruption.',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-[#CEF84E]/20 border border-[#CEF84E]/40 flex items-center justify-center shrink-0 mt-0.5 print:border-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CEF84E] print:bg-gray-700" />
                    </span>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className={`pt-6 border-t border-border/40 print:border-gray-300 flex justify-between items-end text-[10px] text-muted-foreground`}>
              <div>
                <p className="font-semibold text-foreground">Scala Solutions</p>
                <p>Infrastructure &amp; Digital Hosting Report</p>
                <p className="mt-0.5">Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="text-right">
                <p>This document is confidential and intended solely for the named recipient.</p>
                <p className="mt-0.5">© {new Date().getFullYear()} Scala Solutions. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
