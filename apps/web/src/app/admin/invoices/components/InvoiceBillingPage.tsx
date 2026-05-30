import React from 'react';
import { InvoicePageHeader, InvoicePageFooter } from './InvoicePageHeader';
import { InvoiceLineItem, formatCurrencyIDR, formatDateClean } from './invoice-types';

interface InvoiceBillingPageProps {
  companyName: string;
  clientRefCode: string;
  formattedDate: string;
  lineItems: InvoiceLineItem[];
  total: number;
  pageStyle: React.CSSProperties;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number;
  pageNumber: number;
  totalPages: number;
  status?: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'past_due' | 'written_off';
  amountPaid?: number;
  paidAt?: Date | string | null;
  dpAt?: Date | string | null;
  websiteAddress?: string | null;
  showTotals?: boolean;
}

export const InvoiceBillingPage: React.FC<InvoiceBillingPageProps> = ({
  companyName,
  clientRefCode,
  formattedDate,
  lineItems,
  total,
  pageStyle,
  discountType,
  discountValue,
  pageNumber,
  totalPages,
  status,
  amountPaid,
  paidAt,
  dpAt,
  websiteAddress,
  showTotals = true,
}) => {
  const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discountAmount = 0;
  if (discountType === 'percentage' && discountValue) {
    discountAmount = Math.round(subtotal * (discountValue / 100));
  } else if (discountType === 'fixed' && discountValue) {
    discountAmount = discountValue;
  }

  return (
    <div className="invoice-print-page" style={pageStyle}>
      <InvoicePageHeader
        companyName={companyName}
        clientRefCode={clientRefCode}
        formattedDate={formattedDate}
        websiteAddress={websiteAddress}
      />

      <div style={{ marginTop: 32, paddingBottom: '80px' }}>

        {/* Table header bar — black rounded pill */}
        {lineItems.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#111111',
              color: 'white',
              borderRadius: '8px',
              padding: '14px 20px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <div style={{ flex: 7 }}>Description</div>
            <div style={{ flex: 2, textAlign: 'center' }}>Qty</div>
            <div style={{ flex: 3, textAlign: 'right' }}>Price</div>
          </div>
        )}

        {/* Line item rows */}
        <div style={{ marginTop: 6 }}>
          {lineItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '22px 20px',
                // Alternating zebra background
                backgroundColor: idx % 2 === 1 ? '#f4f4f4' : 'white',
                borderRadius: '6px',
                marginBottom: 4,
              }}
            >
              {/* Description column */}
              <div style={{ flex: 7, paddingRight: 16 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#111111',
                    lineHeight: 1.4,
                  }}
                >
                  {item.name}
                </div>
                {item.description ? (
                  <div style={{ marginTop: 12 }}>
                    {item.description
                      .split('\n')
                      .filter(Boolean)
                      .map((line, lIdx) => (
                        <div
                          key={lIdx}
                          style={{
                            fontSize: 13,
                            color: '#555555',
                            lineHeight: 1.8,
                            marginBottom: 2,
                          }}
                        >
                          {line.trim()}
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>

              {/* Qty column */}
              <div
                style={{
                  flex: 2,
                  textAlign: 'center',
                  fontSize: 14,
                  color: '#333333',
                  paddingTop: 2,
                }}
              >
                {item.quantity}
              </div>

              {/* Price column — unit price × qty */}
              <div
                style={{
                  flex: 3,
                  textAlign: 'right',
                  fontSize: 14,
                  color: '#111111',
                  paddingTop: 2,
                }}
              >
                {formatCurrencyIDR(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {showTotals !== false && (
          <>
            {/* Subtotal & Discount summary rows if discount is present */}
            {discountAmount > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12, marginBottom: 6 }}>
                {/* Subtotal row */}
                <div style={{ display: 'flex' }}>
                  <div style={{ flex: 7 }} />
                  <div style={{ flex: 5, display: 'flex', justifyContent: 'space-between', padding: '4px 20px', fontSize: 13, color: '#666666' }}>
                    <span style={{ fontWeight: 600 }}>Subtotal</span>
                    <span>{formatCurrencyIDR(subtotal)}</span>
                  </div>
                </div>
                {/* Discount row */}
                <div style={{ display: 'flex' }}>
                  <div style={{ flex: 7 }} />
                  <div style={{ flex: 5, display: 'flex', justifyContent: 'space-between', padding: '4px 20px', fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                    <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'})</span>
                    <span>-{formatCurrencyIDR(discountAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Total — lime green pill spanning Qty + Price columns */}
            <div style={{ display: 'flex', marginTop: 6 }}>
              {/* Spacer matching Description column width */}
              <div style={{ flex: 7 }} />

              {/* Lime pill */}
              <div
                style={{
                  flex: 5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#CEF84E',
                  color: '#111111',
                  borderRadius: '8px',
                  padding: '14px 20px',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Total
                </span>
                <span style={{ fontSize: 14, fontWeight: 800 }}>{formatCurrencyIDR(total)}</span>
              </div>
            </div>

            {/* Payment History and Balance Details */}
            {(status === 'paid' || status === 'partially_paid') && (() => {
              const dpAmount = status === 'partially_paid' ? (amountPaid || Math.round(total * 0.5)) : Math.round(total * 0.5);
              const finalPaymentAmount = total - dpAmount;
              const balanceDue = status === 'paid' ? 0 : total - (amountPaid || 0);

              const dpDateStr = dpAt ? formatDateClean(dpAt) : (paidAt ? formatDateClean(paidAt) : formattedDate);
              const finalDateStr = paidAt ? formatDateClean(paidAt) : '';

              return (
                <div style={{ display: 'flex', marginTop: 16 }}>
                  {/* Spacer matching Description column width */}
                  <div style={{ flex: 7 }} />
                  
                  {/* Premium Payment Details card */}
                  <div
                    style={{
                      flex: 5,
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '14px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Payment Details
                    </div>
                    
                    {/* DP Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 13 }}>
                      <span style={{ color: '#334155', fontWeight: 600 }}>
                        50% Down Payment (DP)
                        <span style={{ display: 'block', fontSize: 10, color: '#64748b', fontWeight: 400, marginTop: 2 }}>
                          Received on {dpDateStr}
                        </span>
                      </span>
                      <span style={{ color: '#0f172a', fontWeight: 700, paddingTop: 1 }}>
                        {formatCurrencyIDR(dpAmount)}
                      </span>
                    </div>

                    {/* Final Payment Row (if fully paid) */}
                    {status === 'paid' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 13, borderTop: '1px dashed #e2e8f0', paddingTop: 10 }}>
                        <span style={{ color: '#334155', fontWeight: 600 }}>
                          50% Final Payment
                          <span style={{ display: 'block', fontSize: 10, color: '#64748b', fontWeight: 400, marginTop: 2 }}>
                            Received on {finalDateStr}
                          </span>
                        </span>
                        <span style={{ color: '#0f172a', fontWeight: 700, paddingTop: 1 }}>
                          {formatCurrencyIDR(finalPaymentAmount)}
                        </span>
                      </div>
                    )}

                    {/* Balance Due Row */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 13,
                        borderTop: '1px solid #cbd5e1',
                        paddingTop: 10,
                        marginTop: 2,
                      }}
                    >
                      <span style={{ color: '#0f172a', fontWeight: 800, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em' }}>
                        Balance Due
                      </span>
                      <span style={{ color: balanceDue > 0 ? '#ef4444' : '#10b981', fontWeight: 800 }}>
                        {formatCurrencyIDR(balanceDue)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        <InvoicePageFooter pageNumber={pageNumber} totalPages={totalPages} />
      </div>
    </div>
  );
};
