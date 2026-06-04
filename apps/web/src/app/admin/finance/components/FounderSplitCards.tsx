'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, PiggyBank } from 'lucide-react';
import { formatCurrencyIDR } from './FinanceOverviewCards';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface FounderData {
  name: string;
  key: 'fredrick' | 'nicholas';
  fullName: string;
  avatarLetter: string;
  injected: number;
  baseProfit: number;
  commission: number;
  profitAllocation: number;
  payoutsDrawn: number;
  remainingDraw: number;
}

interface FounderSplitCardsProps {
  netProfit: number;
  payoutsFredrick: number;
  payoutsNicholas: number;
  injectionsFredrick: number;
  injectionsNicholas: number;
  baseProfitShare: number;
  commissionFredrick: number;
  commissionNicholas: number;
  onActionClick: (
    actionType: 'inject' | 'draw',
    founderKey: 'fredrick' | 'nicholas'
  ) => void;
}

export const FounderSplitCards: React.FC<FounderSplitCardsProps> = ({
  payoutsFredrick,
  payoutsNicholas,
  injectionsFredrick,
  injectionsNicholas,
  baseProfitShare,
  commissionFredrick,
  commissionNicholas,
  onActionClick,
}) => {
  const positionFredrick = injectionsFredrick + baseProfitShare + commissionFredrick - payoutsFredrick;
  const positionNicholas = injectionsNicholas + baseProfitShare + commissionNicholas - payoutsNicholas;

  const positionDiff = Math.abs(positionFredrick - positionNicholas);
  const settlementAmount = Math.round(positionDiff / 2);

  const debtor = positionFredrick > positionNicholas ? 'nicholas' : 'fredrick';
  const creditor = positionFredrick > positionNicholas ? 'fredrick' : 'nicholas';

  const founders: FounderData[] = [
    {
      name: 'Fredrick',
      key: 'fredrick',
      fullName: 'Fredrick Yang',
      avatarLetter: 'F',
      injected: injectionsFredrick,
      baseProfit: baseProfitShare,
      commission: commissionFredrick,
      profitAllocation: baseProfitShare + commissionFredrick,
      payoutsDrawn: payoutsFredrick,
      remainingDraw: Math.max(
        0,
        baseProfitShare + commissionFredrick - payoutsFredrick
      ),
    },
    {
      name: 'Nicholas',
      key: 'nicholas',
      fullName: 'Nicholas Chairnando',
      avatarLetter: 'N',
      injected: injectionsNicholas,
      baseProfit: baseProfitShare,
      commission: commissionNicholas,
      profitAllocation: baseProfitShare + commissionNicholas,
      payoutsDrawn: payoutsNicholas,
      remainingDraw: Math.max(
        0,
        baseProfitShare + commissionNicholas - payoutsNicholas
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Smart Settlement Console */}
      <Card padding="md" className="relative overflow-hidden border-primary/20 bg-primary/5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-primary-ink dark:text-primary uppercase tracking-[0.08em]">
              Smart Balance Settlement
            </span>
            <h4 className="text-sm font-semibold text-foreground mt-1">
              {settlementAmount === 0 ? (
                "🎉 Co-founder accounts are perfectly balanced!"
              ) : (
                <>
                  🤝 <strong>{debtor === 'fredrick' ? 'Fredrick Yang' : 'Nicholas Chairnando'}</strong> owes{" "}
                  <strong>{creditor === 'fredrick' ? 'Fredrick Yang' : 'Nicholas Chairnando'}</strong> exactly{" "}
                  <span className="text-primary-ink dark:text-primary font-bold">{formatCurrencyIDR(settlementAmount)}</span> to settle the accounts.
                </>
              )}
            </h4>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-2xl">
              {settlementAmount === 0 ? (
                "All out-of-pocket expenses and personally received client payments are completely squared away."
              ) : (
                `To reconcile the accounts, ${debtor === 'fredrick' ? 'Fredrick' : 'Nicholas'} can transfer ${formatCurrencyIDR(settlementAmount)} personally to ${creditor === 'fredrick' ? 'Fredrick' : 'Nicholas'}. Once transferred, log a Capital Injection for the payer and a matching Payout for the recipient to balance this ledger.`
              )}
            </p>
          </div>
          {settlementAmount > 0 && (
            <div className="shrink-0 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary-soft dark:bg-primary/20 text-primary-ink dark:text-primary border border-primary-ink/20 dark:border-primary/30 animate-pulse">
                Reconciliation Needed
              </span>
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
      {founders.map((founder) => {
        const drawPercent =
          founder.profitAllocation > 0
            ? Math.min(
                100,
                Math.round((founder.payoutsDrawn / founder.profitAllocation) * 100)
              )
            : 0;

        return (
          <Card key={founder.key} padding="md" className="flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-sm font-medium text-muted-foreground">
                    {founder.avatarLetter}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {founder.fullName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Co-founder &amp; equity partner
                    </p>
                  </div>
                </div>
                <Badge variant="neutral">50% split</Badge>
              </div>

              {/* Ledger lines */}
              <div className="mt-5 space-y-4">
                <Row
                  icon={<PiggyBank size={14} />}
                  label="Capital injected"
                  value={formatCurrencyIDR(founder.injected)}
                />
                <Row
                  icon={<Wallet size={14} />}
                  label="Base profit share (50%)"
                  value={formatCurrencyIDR(founder.baseProfit)}
                />

                {founder.commission > 0 && (
                  <Row
                    icon={<TrendIcon />}
                    label="Sales commission (10%)"
                    value={`+ ${formatCurrencyIDR(founder.commission)}`}
                  />
                )}

                {/* Total allocated */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm font-medium text-foreground">
                    Total allocated payout
                  </span>
                  <span className="text-sm font-medium text-foreground tabular-nums">
                    {formatCurrencyIDR(founder.profitAllocation)}
                  </span>
                </div>

                <Row
                  icon={<ArrowDownRight size={14} />}
                  label="Distributions drawn"
                  value={formatCurrencyIDR(founder.payoutsDrawn)}
                />

                <Row
                  icon={<Wallet size={14} />}
                  label="Net Equity Position"
                  value={formatCurrencyIDR(founder.key === 'fredrick' ? positionFredrick : positionNicholas)}
                />

                {/* Progress */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Draw progress · {drawPercent}%</span>
                    <span className="tabular-nums">
                      Rp {new Intl.NumberFormat('id-ID').format(founder.payoutsDrawn)} /
                      Rp {new Intl.NumberFormat('id-ID').format(founder.profitAllocation)}
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground/30 transition-all duration-500"
                      style={{ width: `${drawPercent}%` }}
                    />
                  </div>
                </div>

                {/* Remaining */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Remaining available draw
                  </span>
                  <span className="text-base font-semibold text-foreground tabular-nums">
                    {formatCurrencyIDR(founder.remainingDraw)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-border grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowUpRight size={14} />}
                onClick={() => onActionClick('inject', founder.key)}
              >
                Inject cash
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ArrowDownRight size={14} />}
                onClick={() => onActionClick('draw', founder.key)}
              >
                Draw payout
              </Button>
            </div>
          </Card>
        );
      })}
      </div>
    </div>
  );
};

// Tiny internal row helper — keeps the JSX in the main component readable.
const Row: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="text-muted-foreground/70">{icon}</span>
      <span>{label}</span>
    </div>
    <span className="text-xs text-foreground tabular-nums">{value}</span>
  </div>
);

// Tiny icon stand-in for the commission row (kept simple, no extra import overhead).
const TrendIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </svg>
);
