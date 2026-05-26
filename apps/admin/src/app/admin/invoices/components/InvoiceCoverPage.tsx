import React from 'react';
import { InvoicePageHeader, InvoicePageFooter } from './InvoicePageHeader';

interface InvoiceCoverPageProps {
  companyName: string;
  clientRefCode: string;
  formattedDate: string;
  pageStyle: React.CSSProperties;
  pageNumber: number;
  totalPages: number;
}

export const InvoiceCoverPage: React.FC<InvoiceCoverPageProps> = ({
  companyName,
  clientRefCode,
  formattedDate,
  pageStyle,
  pageNumber,
  totalPages,
}) => {
  return (
    <div className="invoice-print-page" style={pageStyle}>
      <InvoicePageHeader
        companyName={companyName}
        clientRefCode={clientRefCode}
        formattedDate={formattedDate}
      />

      {/* Signature + Prepared By / Approved By */}
      <div style={{ marginTop: 72 }}>
        {/* Real signature image */}
        <img
          src="/chai-signature.png"
          alt="Signature"
          style={{
            height: 80,
            width: 'auto',
            objectFit: 'contain',
            mixBlendMode: 'multiply',
            display: 'block',
          }}
        />

        {/* Labels row */}
        <div
          style={{
            marginTop: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: '#333333', marginBottom: 4 }}>Prepared By,</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>
              Nicholas Chairnando
            </div>
          </div>

          <div>
            <div style={{ fontSize: 14, color: '#333333', marginBottom: 4 }}>Approved By,</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>{companyName}</div>
          </div>
        </div>
      </div>

      <InvoicePageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </div>
  );
};
