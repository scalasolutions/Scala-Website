import React from 'react';
import { InvoicePageHeader, InvoicePageFooter } from './InvoicePageHeader';

interface InvoiceCoverPageProps {
  companyName: string;
  clientRefCode: string;
  formattedDate: string;
  pageStyle: React.CSSProperties;
  pageNumber: number;
  totalPages: number;
  preparedBy: 'nicholas' | 'fredrick' | 'both';
  websiteAddress?: string | null;
}

export const InvoiceCoverPage: React.FC<InvoiceCoverPageProps> = ({
  companyName,
  clientRefCode,
  formattedDate,
  pageStyle,
  pageNumber,
  totalPages,
  preparedBy,
  websiteAddress,
}) => {
  return (
    <div className="invoice-print-page" style={pageStyle}>
      <InvoicePageHeader
        companyName={companyName}
        clientRefCode={clientRefCode}
        formattedDate={formattedDate}
        websiteAddress={websiteAddress}
      />

      {/* Signature + Prepared By / Approved By */}
      <div style={{ marginTop: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        
        {/* Left Side: Prepared By (one or both) */}
        <div style={{ display: 'flex', gap: 48, alignItems: 'flex-end' }}>
          
          {/* Nicholas Block */}
          {(preparedBy === 'nicholas' || preparedBy === 'both') && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <img
                src="/chai-signature.png"
                alt="Nicholas Signature"
                style={{
                  height: 64,
                  width: 'auto',
                  objectFit: 'contain',
                  mixBlendMode: 'multiply',
                  display: 'block',
                  marginBottom: 8,
                }}
              />
              <div>
                <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 4 }}>Prepared By,</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111111' }}>
                  Nicholas Chairnando
                </div>
              </div>
            </div>
          )}

          {/* Fredrick Block */}
          {(preparedBy === 'fredrick' || preparedBy === 'both') && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <img
                src="/digital-signature-fred.png"
                alt="Fredrick Signature"
                style={{
                  height: 64,
                  width: 'auto',
                  objectFit: 'contain',
                  mixBlendMode: 'multiply',
                  display: 'block',
                  marginBottom: 8,
                }}
              />
              <div>
                <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 4 }}>Prepared By,</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111111' }}>
                  Fredrick Yang
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Approved By */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
          <div style={{ height: 64, marginBottom: 8 }} /> {/* spacer matching the height of signatures */}
          <div>
            <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 4 }}>Approved By,</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111111' }}>{companyName}</div>
          </div>
        </div>

      </div>

      <InvoicePageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </div>
  );
};
