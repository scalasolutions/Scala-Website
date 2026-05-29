import React from 'react';

interface InvoicePageHeaderProps {
  companyName: string;
  clientRefCode: string;
  formattedDate: string;
}

export const InvoicePageHeader: React.FC<InvoicePageHeaderProps> = ({
  companyName,
  clientRefCode,
  formattedDate,
}) => {
  return (
    <div>
      {/* Top row: Logo left, INVOICE right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Green blob mark + "Scala" bold text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg
            width="44"
            height="44"
            viewBox="124 71 291 382"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M364 71C392.167 71 415 156.514 415 262C415 367.486 392.167 453 364 453C343.793 453 326.332 408.99 318.076 345.168C317.638 341.778 312.326 341.44 311.44 344.741C294.178 409.036 265.384 454.256 241.682 450.393C231.539 448.739 223.734 438.327 218.653 421.783C217.773 418.916 213.386 418.598 212.097 421.305C202.798 440.82 189.618 453 175 453C146.833 453 124 407.781 124 352C124 296.219 146.833 251 175 251C192.351 251 207.678 268.16 216.89 294.379C217.215 295.302 218.595 295.208 218.772 294.246C233.834 212.527 268.511 149.942 296.225 154.46C302.758 155.525 308.32 160.224 312.81 167.855C314.412 170.578 319.292 169.952 319.772 166.829C328.578 109.558 345.087 71 364 71Z"
              fill="#CEF84E"
            />
          </svg>
          <span
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#111111',
              letterSpacing: '-0.02em',
              fontFamily: "'Outfit','Inter',sans-serif",
            }}
          >
            Scala
          </span>
        </div>

        {/* INVOICE heading + client ref code */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 46,
              fontWeight: 300,
              color: '#111111',
              letterSpacing: '0.06em',
              lineHeight: 1,
              fontFamily: "'Outfit','Inter',sans-serif",
            }}
          >
            INVOICE
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#555555',
              marginTop: 6,
            }}
          >
            {clientRefCode}
          </div>
        </div>
      </div>

      {/* Horizontal divider */}
      <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '20px 0 18px 0' }} />

      {/* TO / DATE row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#9ca3af',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            TO:
          </div>
          <div style={{ fontSize: 14, color: '#111111' }}>{companyName}</div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#9ca3af',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            DATE
          </div>
          <div style={{ fontSize: 14, color: '#111111' }}>{formattedDate}</div>
        </div>
      </div>
    </div>
  );
};

// ── Shared page footer: divider line + "Page X of Y" ──────────
export const InvoicePageFooter: React.FC<{ pageNumber: number; totalPages: number }> = ({
  pageNumber,
  totalPages,
}) => (
  <div
    style={{
      position: 'absolute',
      bottom: 40,
      left: 64,
      right: 64,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}
  >
    <div style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
    <span
      style={{
        fontSize: 10,
        color: '#9ca3af',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontFamily: "'Outfit','Inter',sans-serif",
        whiteSpace: 'nowrap',
      }}
    >
      Page {pageNumber} of {totalPages}
    </span>
  </div>
);
