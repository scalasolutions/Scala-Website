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
  showPayments?: boolean;
  receivedBy?: 'company' | 'fredrick' | 'nicholas';
  invoiceSubtotal?: number;
}

const renderBankDetailsTable = (bank: 'BCA' | 'BNI', amount: number) => {
  const isBCA = bank === 'BCA';
  const logoUrl = isBCA ? '/bca-logo.png' : '/bni-logo.png';
  const accountName = isBCA ? 'Nicholas Chairnando' : 'Sdr Fredrick';
  const accountNumber = isBCA ? '0828222280' : '1934433334';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Bank Row */}
      <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 8, borderBottom: '1px dashed #e2e8f0' }}>
        <span style={{ width: 80, fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank:</span>
        <span style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <img src={logoUrl} alt={bank} style={{ height: 22, width: 'auto', objectFit: 'contain' }} />
        </span>
      </div>
      {/* Nama Row */}
      <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 8, borderBottom: '1px dashed #e2e8f0' }}>
        <span style={{ width: 80, fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name:</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
          {accountName}
        </span>
      </div>
      {/* Rekening Row */}
      <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 8, borderBottom: '1px dashed #e2e8f0' }}>
        <span style={{ width: 80, fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account:</span>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 800, color: '#1e293b', fontFamily: 'monospace', letterSpacing: '0.03em' }}>
          {accountNumber}
        </span>
      </div>
      {/* Nominal Row */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ width: 80, fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount:</span>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 800, color: '#16a34a' }}>
          {formatCurrencyIDR(amount)}
        </span>
      </div>
    </div>
  );
};

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
  showPayments = true,
  receivedBy = 'company',
  invoiceSubtotal,
}) => {
  const subtotal = invoiceSubtotal !== undefined ? invoiceSubtotal : lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
          </>
        )}

        {/* Centered Texts and Cards Block */}
        {showPayments !== false && (
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Header texts */}
            <div style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', textAlign: 'center', marginBottom: 8 }}>
              Thank you for your business!
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111111', textAlign: 'center', marginBottom: 6 }}>
              VAT/PPN not included.
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', maxWidth: 480, marginBottom: 24, lineHeight: 1.5 }}>
              This invoice is only for services offered by Scala Solutions. API fees and other expenses are not included.
            </div>

            {/* PAID STATE: Green Badge Card */}
            {status === 'paid' && (
              <div
                style={{
                  width: '450px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderTop: '4px solid #10b981',
                  borderRadius: '12px',
                  padding: '24px 32px',
                  boxShadow: '0 4px 20px -2px rgba(16,185,129,0.05), 0 2px 8px -1px rgba(16,185,129,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: '#15803d', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  PAID
                </div>
                <div style={{ fontSize: 13, color: '#166534', fontWeight: 500, textAlign: 'center', lineHeight: 1.5 }}>
                  Thank you, payment for this invoice has been received in full.
                </div>
              </div>
            )}

            {/* UNPAID STATE: Centered Bank Details Card */}
            {status !== 'paid' && status !== 'written_off' && status !== 'partially_paid' && (
              <div
                style={{
                  width: receivedBy === 'company' ? '660px' : '450px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderTop: '4px solid #CEF84E',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 8px -1px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 10, marginBottom: 4 }}>
                  Payment Instructions
                </div>

                <div style={{ fontSize: 12.5, color: '#475569', lineHeight: '1.6', textAlign: 'left' }}>
                  If you cannot make an online payment, you can transfer to the following account and send the transfer receipt to our <strong style={{ fontWeight: 700 }}>Finance Team (+628 1881 5037)</strong>:
                </div>

                {receivedBy === 'company' ? (
                  <div style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
                    <div style={{ flex: 1 }}>
                      {renderBankDetailsTable('BCA', total)}
                    </div>
                    <div style={{ width: 1, backgroundColor: '#e2e8f0' }} />
                    <div style={{ flex: 1 }}>
                      {renderBankDetailsTable('BNI', total)}
                    </div>
                  </div>
                ) : (
                  <div>
                    {receivedBy === 'nicholas' ? renderBankDetailsTable('BCA', total) : renderBankDetailsTable('BNI', total)}
                  </div>
                )}
              </div>
            )}

            {/* PARTIALLY PAID STATE: Side-by-side cards */}
            {status === 'partially_paid' && (() => {
              const dpAmount = amountPaid || Math.round(total * 0.5);
              const balanceDue = total - dpAmount;
              const dpDateStr = dpAt ? formatDateClean(dpAt) : (paidAt ? formatDateClean(paidAt) : formattedDate);

              return (
                <div style={{ display: 'flex', gap: 24, width: '100%', alignItems: 'stretch', justifyContent: 'center' }}>
                  {/* Left Side: Bank Details Card */}
                  <div
                    style={{
                      flex: 7,
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderTop: '4px solid #CEF84E',
                      borderRadius: '12px',
                      padding: '18px 20px',
                      boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 8px -1px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 4 }}>
                      Payment Instructions
                    </div>

                    <div style={{ fontSize: 11.5, color: '#475569', lineHeight: '1.5' }}>
                      If you cannot make an online payment, you can transfer to the following account:
                    </div>
                    {receivedBy === 'company' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {renderBankDetailsTable('BCA', balanceDue)}
                        <div style={{ height: 1, backgroundColor: '#e2e8f0', border: 'none', borderTop: '1px dashed #e2e8f0' }} />
                        {renderBankDetailsTable('BNI', balanceDue)}
                      </div>
                    ) : (
                      <div>
                        {receivedBy === 'nicholas' ? renderBankDetailsTable('BCA', balanceDue) : renderBankDetailsTable('BNI', balanceDue)}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Payment Details Card */}
                  <div
                    style={{
                      flex: 5,
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderTop: '4px solid #475569',
                      borderRadius: '12px',
                      padding: '18px 20px',
                      boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 8px -1px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>
                      Payment Details
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* DP Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 12.5 }}>
                        <span style={{ color: '#334155', fontWeight: 600 }}>
                          Down Payment (DP)
                          <span style={{ display: 'block', fontSize: 10, color: '#64748b', fontWeight: 400, marginTop: 2 }}>
                            Received on {dpDateStr}
                          </span>
                        </span>
                        <span style={{ color: '#1e293b', fontWeight: 700 }}>
                          {formatCurrencyIDR(dpAmount)}
                        </span>
                      </div>

                      {/* Balance Due Row */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 12.5,
                          borderTop: '1px solid #cbd5e1',
                          paddingTop: 10,
                          marginTop: 4,
                        }}
                      >
                        <span style={{ color: '#1e293b', fontWeight: 800, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em' }}>
                          Balance Due
                        </span>
                        <span style={{ color: balanceDue > 0 ? '#ef4444' : '#10b981', fontWeight: 800, fontSize: 14 }}>
                          {formatCurrencyIDR(balanceDue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Footnotes */}
            <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginTop: 24 }}>
              * All billed monthly are billed at the end of the month
            </div>
          </div>
        )}

        <InvoicePageFooter pageNumber={pageNumber} totalPages={totalPages} />
      </div>
    </div>
  );
};
