'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  BookOpen,
  TrendingUp,
  Users,
  AlertCircle,
} from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface PartnershipSplitGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PartnershipSplitGuide: React.FC<PartnershipSplitGuideProps> = ({
  isOpen,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-6 md:p-12">
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale z-10">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <SectionHeading
            icon={<BookOpen size={16} />}
            title="Partnership policy & guidelines"
            description="Official revenue sharing policy for Scala Solutions co-founders."
            action={
              <div className="flex items-center gap-2">
                <Badge variant="success">
                  Active SLA
                </Badge>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            }
          />

          {/* Two-column layout */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Sourced Clients Column */}
            <Card padding="md" className="bg-muted/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-muted-foreground">
                    <Users size={14} />
                  </div>
                  <h4 className="text-sm font-medium text-foreground">
                    Co-founder sourcing (organic)
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-3">
                  Since Fredrick and Nicholas operate as a unified company, all
                  partner-sourced leads are treated as organic with no separate sourcing
                  incentive:
                </p>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground list-disc list-inside leading-relaxed">
                  <li>
                    <span className="text-foreground font-medium">Unified referrals:</span>{' '}
                    Fredrick's referral is Nicholas' referral. Sourcing by either partner
                    is considered organic.
                  </li>
                  <li>
                    <span className="text-foreground font-medium">No finder's fee:</span>{' '}
                    Sourcing commissions do not apply to co-founders, keeping incentives
                    aligned.
                  </li>
                  <li>
                    <span className="text-foreground font-medium">50/50 profit split:</span>{' '}
                    100% of the client budget flows into the company pool, and net profits
                    are split exactly equally.
                  </li>
                </ul>
              </div>

              {/* Live example */}
              <Card padding="sm" className="mt-5 bg-card">
                <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-3">
                  Example · Rp 10.000.000 client invoice
                </p>
                <ExampleGrid
                  rows={[
                    ['Gross client budget', 'Rp 10.000.000', 'foreground'],
                    ['Sourcing fee (0%)', 'Rp 0', 'muted'],
                    ['Remaining to company', 'Rp 10.000.000', 'muted'],
                    ['Operating expenses', '- Rp 1.000.000', 'danger'],
                  ]}
                  total={['Net profit split (50/50)', 'Rp 4.500.000 each']}
                />
              </Card>
            </Card>

            {/* External Affiliates Column */}
            <Card padding="md" className="bg-muted/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-muted-foreground">
                    <TrendingUp size={14} />
                  </div>
                  <h4 className="text-sm font-medium text-foreground">
                    External affiliate sourcing
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-3">
                  When external contacts refer a client to Scala Solutions, they are paid a
                  fixed <span className="text-foreground font-medium">10% commission</span>{' '}
                  on gross budgets, shared equally by both partners:
                </p>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground list-disc list-inside leading-relaxed">
                  <li>
                    <span className="text-foreground font-medium">Corporate COGS:</span>{' '}
                    The affiliate commission is deducted as a direct company operating
                    expense.
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      Shared acquisition cost:
                    </span>{' '}
                    Because net profit is calculated after this deduction, both partners
                    share the fee 50/50.
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      Out-of-pocket protection:
                    </span>{' '}
                    No partner pays the affiliate directly; it is settled from the invoice
                    receipts.
                  </li>
                </ul>
              </div>

              <Card padding="sm" className="mt-5 bg-card">
                <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-3">
                  Example · Rp 10.000.000 client invoice
                </p>
                <ExampleGrid
                  rows={[
                    ['Gross client budget', 'Rp 10.000.000', 'foreground'],
                    ['Affiliate fee (10%)', '- Rp 1.000.000', 'danger'],
                    ['Net company revenue', 'Rp 9.000.000', 'muted'],
                    ['Operating expenses', '- Rp 1.000.000', 'danger'],
                  ]}
                  total={['Net profit split (50/50)', 'Rp 4.000.000 each']}
                />
              </Card>
            </Card>
          </div>

          {/* Footer info box */}
          <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4 flex items-start gap-3">
            <AlertCircle size={15} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">Symmetry principle:</span>{' '}
              This setup ensures that regardless of who is in the "sales seat" or the
              "delivery seat" for any given month, both founders are compensated for
              their contributions while maintaining an exactly equal 50/50 equity
              structure.
            </p>
          </div>

          {/* Bottom actions */}
          <div className="mt-6 pt-4 border-t border-border flex justify-end">
            <Button variant="primary" size="md" onClick={onClose}>
              I understand
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Tiny helper for the example calc rows. Keeps the layout consistent without
// reinventing a table for two cells.
type RowTone = 'foreground' | 'muted' | 'danger';
const toneClasses: Record<RowTone, string> = {
  foreground: 'text-foreground',
  muted: 'text-muted-foreground',
  danger: 'text-red-500',
};

const ExampleGrid: React.FC<{
  rows: Array<[string, string, RowTone]>;
  total: [string, string];
}> = ({ rows, total }) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
    {rows.map(([label, value, tone]) => (
      <React.Fragment key={label}>
        <div className="text-muted-foreground">{label}</div>
        <div className={`text-right tabular-nums ${toneClasses[tone]}`}>{value}</div>
      </React.Fragment>
    ))}
    <div className="text-foreground font-medium border-t border-border pt-2 mt-1 col-span-1">
      {total[0]}
    </div>
    <div className="text-right text-foreground font-medium tabular-nums border-t border-border pt-2 mt-1 col-span-1">
      {total[1]}
    </div>
  </div>
);
