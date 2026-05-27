import React from 'react';
import { InvoicePageHeader, InvoicePageFooter } from './InvoicePageHeader';

interface InvoiceTCPage2Props {
  companyName: string;
  clientRefCode: string;
  formattedDate: string;
  pageStyle: React.CSSProperties;
  pageNumber: number;
  totalPages: number;
  htmlContent?: string;
}

const TcSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#111111', marginBottom: 6 }}>{title}</div>
    {children}
  </div>
);

const TcBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 13, color: '#222222', lineHeight: 1.65, marginBottom: 3 }}>{children}</div>
);

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

export const InvoiceTCPage2: React.FC<InvoiceTCPage2Props> = ({
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
            {/* 4. Estimated Timeline */}
            <TcSection title="4. Estimated Timeline">
              <TcBody>Phase Estimated Time</TcBody>
              <TcBullets
                items={[
                  'Discovery & Planning 2\u20135 Working Days',
                  'UI/UX Design 5\u201310 Working Days',
                  'Development 10\u201325 Working Days',
                  'Testing & Launch 3\u20137 Working Days',
                ]}
              />
              <TcBody>
                Timeline may vary depending on project complexity and response time.
              </TcBody>
            </TcSection>

            {/* 5. Maintenance Terms */}
            <TcSection title="5. Maintenance Terms">
              <TcBody>Maintenance fees that have been paid are non-refundable.</TcBody>
              <TcBody>Maintenance covers minor updates, monitoring, and technical support only.</TcBody>
              <TcBody>Major redesigns or additional features are excluded unless agreed separately.</TcBody>
            </TcSection>

            {/* 6. Payment Terms */}
            <TcSection title="6. Payment Terms">
              <TcBody>
                50% Down Payment (DP) is required before project scheduling and development begins.
              </TcBody>
              <TcBody>
                Remaining 50% payment must be completed before final handoff and website launch.
              </TcBody>
              <TcBody>Development can only begin after:</TcBody>
              <TcNumbered
                items={[
                  'DP payment confirmation',
                  'Complete asset handoff from client',
                  'Late payments may result in project delays or temporary pause in development.',
                ]}
              />
            </TcSection>

            {/* 7. Scope Changes */}
            <TcSection title="7. Scope Changes">
              <TcBody>Any additional requests outside the agreed scope may require:</TcBody>
              <TcBody>Additional charges</TcBody>
              <TcBody>Timeline adjustments</TcBody>
            </TcSection>

            {/* 8. Client Responsibilities */}
            <TcSection title="8. Client Responsibilities">
              <TcBody>Client is responsible for:</TcBody>
              <TcBullets
                items={[
                  'Providing accurate content/assets',
                  'Giving timely feedback',
                  'Maintaining communication during development',
                ]}
              />
            </TcSection>

            {/* 9. Post Launch Support */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111111', marginBottom: 6 }}>
                9. Post Launch Support
              </div>
              <div style={{ fontSize: 13, color: '#222222', lineHeight: 1.65, marginBottom: 3 }}>
                Minor bug fixes after launch are included within the agreed support period.{' '}
                <strong>(1 Month)</strong>
              </div>
              <TcBody>Does not include third-party/server/platform related issues.</TcBody>
            </div>
          </>
        )}
      </div>

      <InvoicePageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </div>
  );
};
