import React from 'react';
import { InvoicePageHeader, InvoicePageFooter } from './InvoicePageHeader';

interface InvoiceTCPage1Props {
  companyName: string;
  clientRefCode: string;
  formattedDate: string;
  pageStyle: React.CSSProperties;
  pageNumber: number;
  totalPages: number;
  htmlContent?: string;
}

// Reusable T&C block: bold section title + children body
const TcSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#111111', marginBottom: 6 }}>{title}</div>
    {children}
  </div>
);

// Plain body text line
const TcBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 13, color: '#222222', lineHeight: 1.65, marginBottom: 3 }}>{children}</div>
);

// Bullet list
const TcBullets: React.FC<{ items: string[] }> = ({ items }) => (
  <div style={{ marginBottom: 3 }}>
    {items.map((item, i) => (
      <div
        key={i}
        style={{
          fontSize: 13,
          color: '#222222',
          lineHeight: 1.65,
          display: 'flex',
          gap: 7,
          marginLeft: 4,
        }}
      >
        <span style={{ flexShrink: 0 }}>•</span>
        <span>{item}</span>
      </div>
    ))}
  </div>
);

// Numbered list
const TcNumbered: React.FC<{ items: string[] }> = ({ items }) => (
  <div style={{ marginBottom: 3 }}>
    {items.map((item, i) => (
      <div
        key={i}
        style={{
          fontSize: 13,
          color: '#222222',
          lineHeight: 1.65,
          marginLeft: 4,
        }}
      >
        {i + 1}.{'\u00A0'}{item}
      </div>
    ))}
  </div>
);

export const InvoiceTCPage1: React.FC<InvoiceTCPage1Props> = ({
  companyName,
  clientRefCode,
  formattedDate,
  pageStyle,
  pageNumber,
  totalPages,
  htmlContent,
}) => {
  return (
    <div className="invoice-print-page" style={pageStyle}>
      <InvoicePageHeader
        companyName={companyName}
        clientRefCode={clientRefCode}
        formattedDate={formattedDate}
      />

      <div style={{ marginTop: 32 }}>
        {/* Main T&C heading — only appears on page 2 */}
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111111', marginBottom: 24 }}>
          Terms and Conditions
        </div>

        {htmlContent ? (
          <>
            <style>{`
              .dynamic-html-tc h2 {
                font-size: 14px;
                font-weight: 700;
                color: #111111;
                margin-top: 20px;
                margin-bottom: 6px;
              }
              .dynamic-html-tc h2:first-of-type {
                margin-top: 0px;
              }
              .dynamic-html-tc p {
                font-size: 13px;
                color: #222222;
                line-height: 1.65;
                margin-bottom: 6px;
              }
              .dynamic-html-tc strong {
                font-weight: 700;
                color: #111111;
              }
              .dynamic-html-tc ul, .dynamic-html-tc ol {
                margin-top: 4px;
                margin-bottom: 12px;
                padding-left: 4px;
              }
              .dynamic-html-tc ul {
                list-style-type: none;
              }
              .dynamic-html-tc ul li {
                font-size: 13px;
                color: #222222;
                line-height: 1.65;
                margin-bottom: 3px;
                display: flex;
                gap: 7px;
              }
              .dynamic-html-tc ul li::before {
                content: "•";
                color: #222222;
                flex-shrink: 0;
              }
              .dynamic-html-tc ol {
                list-style-type: decimal;
                padding-left: 18px;
              }
              .dynamic-html-tc ol li {
                font-size: 13px;
                color: #222222;
                line-height: 1.65;
                margin-bottom: 3px;
              }
            `}</style>
            <div 
              className="dynamic-html-tc"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </>
        ) : (
          <>
            {/* 1. Project Workflow */}
            <TcSection title="1. Project Workflow">
              <TcBody>Our standard workflow:</TcBody>
              <TcNumbered
                items={[
                  'Client Discovery',
                  'Asset Handoff',
                  'UI/UX Design',
                  'Website Development',
                  'Testing & Revisions',
                  'Launch & Handoff',
                ]}
              />
            </TcSection>

            {/* 2. Asset Handoff */}
            <TcSection title="2. Asset Handoff">
              <TcBody>
                Development can only begin after all required assets have been submitted by the client.
              </TcBody>
              <TcBody>Required assets may include:</TcBody>
              <TcBullets
                items={[
                  'Logo',
                  'Images/videos',
                  'Product data',
                  'Company profile/content',
                  'Social links',
                  'Domain/hosting access (if needed)',
                ]}
              />
              <TcBody>Delays in asset submission may affect project timeline.</TcBody>
            </TcSection>

            {/* 3. Revision Policy */}
            <TcSection title="3. Revision Policy">
              <TcBody>This project includes:</TcBody>
              <TcBullets
                items={['2 Major Review Sessions', '1 during UI/UX Design', '1 before Final Launch']}
              />
              <TcBody>
                Additional major revisions outside the agreed sessions may incur extra charges.
              </TcBody>
            </TcSection>
          </>
        )}
      </div>

      <InvoicePageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </div>
  );
};
