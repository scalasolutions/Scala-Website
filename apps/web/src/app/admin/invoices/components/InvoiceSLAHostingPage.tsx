import React from 'react';
import { InvoicePageHeader, InvoicePageFooter } from './InvoicePageHeader';

type HostingTier = 'none' | 'static' | 'dynamic_basic' | 'dynamic_growth' | 'business';

interface InvoiceSLAHostingPageProps {
  companyName: string;
  clientRefCode: string;
  formattedDate: string;
  pageStyle: React.CSSProperties;
  pageNumber: number;
  totalPages: number;
  websiteAddress?: string | null;
  hostingTier?: HostingTier | string | null;
}

const TIER_DATA: Record<Exclude<HostingTier, 'none'>, {
  name: string;
  price: string;
  resources: string;
  capacity: string;
  admins: string;
}> = {
  static: {
    name: 'Static Hosting',
    price: 'Rp150.000 / month',
    resources: 'Shared CDN · Static files only (no backend)',
    capacity: '10,000 – 50,000 visits / month',
    admins: 'N/A',
  },
  dynamic_basic: {
    name: 'Dynamic Basic',
    price: 'Rp350.000 / month',
    resources: 'Up to 2 vCPU · 2 GB RAM',
    capacity: '5,000 – 20,000 visits / month',
    admins: '1–3 admins (light CMS)',
  },
  dynamic_growth: {
    name: 'Dynamic Growth',
    price: 'Rp750.000 / month',
    resources: 'Up to 4 vCPU · 4 GB RAM',
    capacity: '20,000 – 100,000 visits / month',
    admins: '3–10 active admins / customers',
  },
  business: {
    name: 'Business Hosting',
    price: 'Rp1.000.000 / month',
    resources: 'Up to 8 vCPU · 8 GB RAM',
    capacity: '100,000 – 300,000+ visits / month',
    admins: '10–30 active users / admins',
  },
};

const OVERAGE_RATES = [
  { item: 'Additional RAM', rate: 'Rp200.000', unit: 'per extra 1 GB / month' },
  { item: 'Additional CPU', rate: 'Rp350.000', unit: 'per extra 1 vCPU / month' },
  { item: 'Additional Storage', rate: 'Rp25.000', unit: 'per extra 5 GB / month' },
  { item: 'Additional Bandwidth', rate: 'Rp25.000', unit: 'per extra 50 GB' },
  { item: 'Emergency Handling', rate: 'Rp250.000 – Rp500.000', unit: 'per incident' },
];

const SLA_LEVELS = [
  { severity: 'Urgent / Severity 1', response: '≤ 2 Business Hours', update: 'Every 4 hours' },
  { severity: 'High / Severity 2', response: '≤ 6 Business Hours', update: 'Every 12 hours' },
  { severity: 'Medium & Low / Severity 3', response: '≤ 24 Business Hours', update: 'Upon resolution' },
];

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 800, color: '#111111', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, paddingBottom: 4, borderBottom: '1.5px solid #e2e8f0' }}>
    {children}
  </div>
);

const TableHeader: React.FC<{ cols: string[] }> = ({ cols }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols.length}, 1fr)`, gap: 0, backgroundColor: '#f1f5f9', borderRadius: '6px 6px 0 0', padding: '6px 10px' }}>
    {cols.map((c, i) => (
      <div key={i} style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c}</div>
    ))}
  </div>
);

const TableRow: React.FC<{ cols: string[]; accent?: boolean }> = ({ cols, accent }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols.length}, 1fr)`, gap: 0, padding: '6px 10px', borderBottom: '1px solid #f1f5f9', backgroundColor: accent ? '#fafbfc' : '#ffffff' }}>
    {cols.map((c, i) => (
      <div key={i} style={{ fontSize: 12, color: i === 0 ? '#1e293b' : '#475569', fontWeight: i === 0 ? 600 : 400, lineHeight: 1.4 }}>{c}</div>
    ))}
  </div>
);

export const InvoiceSLAHostingPage: React.FC<InvoiceSLAHostingPageProps> = ({
  companyName,
  clientRefCode,
  formattedDate,
  pageStyle,
  pageNumber,
  totalPages,
  websiteAddress,
  hostingTier,
}) => {
  const tier = (hostingTier && hostingTier !== 'none' ? hostingTier : null) as Exclude<HostingTier, 'none'> | null;
  const tierData = tier ? TIER_DATA[tier] : null;

  return (
    <div className="invoice-print-page" style={pageStyle}>
      <InvoicePageHeader
        companyName={companyName}
        clientRefCode={clientRefCode}
        formattedDate={formattedDate}
        websiteAddress={websiteAddress}
      />

      <div style={{ marginTop: 18, paddingBottom: '70px' }}>
        {/* Page title */}
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111111', marginBottom: 6 }}>
          SLA &amp; Hosting Agreement
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
          This page outlines the hosting resource allocation and service-level commitments applicable to this engagement.
        </div>

        {/* Section 1: Hosting Tier */}
        <div style={{ marginBottom: 20 }}>
          <SectionTitle>1. Hosting Plan</SectionTitle>
          {tierData ? (
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '4px solid #CEF84E', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111111' }}>{tierData.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{tierData.resources}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', textAlign: 'right' }}>{tierData.price}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ fontSize: 11, color: '#475569' }}>
                  <span style={{ fontWeight: 700, color: '#334155' }}>Monthly Capacity: </span>
                  {tierData.capacity}
                </div>
                <div style={{ fontSize: 11, color: '#475569' }}>
                  <span style={{ fontWeight: 700, color: '#334155' }}>Active Admins: </span>
                  {tierData.admins}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', color: '#94a3b8', fontSize: 12 }}>
              No active hosting plan contracted on this invoice.
            </div>
          )}
        </div>

        {/* Section 2: Overage Pricing */}
        <div style={{ marginBottom: 20 }}>
          <SectionTitle>2. Overage Pricing (Temporary Scaling)</SectionTitle>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <TableHeader cols={['Resource', 'Rate', 'Unit']} />
            {OVERAGE_RATES.map((r, i) => (
              <TableRow key={r.item} cols={[r.item, r.rate, r.unit]} accent={i % 2 === 1} />
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 5, fontStyle: 'italic' }}>
            Overage charges apply only upon written pre-approval by both parties.
          </div>
        </div>

        {/* Section 3: SLA Commitments */}
        <div style={{ marginBottom: 20 }}>
          <SectionTitle>3. SLA Response Commitments</SectionTitle>
          <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>
            Network Uptime Target: <strong style={{ color: '#111111' }}>99.99%</strong>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <TableHeader cols={['Severity Level', 'Response Time', 'Update Frequency']} />
            {SLA_LEVELS.map((l, i) => (
              <TableRow key={l.severity} cols={[l.severity, l.response, l.update]} accent={i % 2 === 1} />
            ))}
          </div>
        </div>

        {/* Section 4: Service Credits */}
        <div style={{ marginBottom: 16 }}>
          <SectionTitle>4. Service Credits</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 12, color: '#222222', lineHeight: 1.45 }}>
              • Monthly downtime exceeding <strong>10 minutes</strong>: <strong>15% credit</strong> applied to the next billing cycle.
            </div>
            <div style={{ fontSize: 12, color: '#222222', lineHeight: 1.45 }}>
              • Monthly downtime exceeding <strong>1 hour</strong>: <strong>50% credit</strong> applied to the next billing cycle.
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' }}>
              Credits are automatically calculated and applied; no claim required.
            </div>
          </div>
        </div>

        {/* Signature line */}
        <div style={{ marginTop: 28, paddingTop: 14, borderTop: '1.5px solid #e2e8f0', display: 'flex', gap: 40 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 24 }}>Client Signature &amp; Acknowledgement</div>
            <div style={{ borderBottom: '1px solid #94a3b8', width: '80%', marginBottom: 4 }} />
            <div style={{ fontSize: 10, color: '#94a3b8' }}>Signature · Date</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 24 }}>Scala Solutions Representative</div>
            <div style={{ borderBottom: '1px solid #94a3b8', width: '80%', marginBottom: 4 }} />
            <div style={{ fontSize: 10, color: '#94a3b8' }}>Signature · Date</div>
          </div>
        </div>
      </div>

      <InvoicePageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </div>
  );
};
