'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Percent, PiggyBank } from 'lucide-react';
import { formatCurrencyIDR } from './FinanceOverviewCards';

interface FounderData {
  name: string;
  key: 'fredrick' | 'nicholas';
  fullName: string;
  avatarLetter: string;
  colorClass: string;
  bgLightClass: string;
  glowClass: string;
  injected: number;
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
  onActionClick: (actionType: 'inject' | 'draw', founderKey: 'fredrick' | 'nicholas') => void;
}

export const FounderSplitCards: React.FC<FounderSplitCardsProps> = ({
  netProfit,
  payoutsFredrick,
  payoutsNicholas,
  injectionsFredrick,
  injectionsNicholas,
  onActionClick,
}) => {
  const halfProfit = Math.max(0, netProfit / 2);

  const founders: FounderData[] = [
    {
      name: 'Fredrick',
      key: 'fredrick',
      fullName: 'Fredrick Yang',
      avatarLetter: 'F',
      colorClass: 'text-primary',
      bgLightClass: 'bg-primary/10 border-primary/20',
      glowClass: 'shadow-primary/5',
      injected: injectionsFredrick,
      profitAllocation: halfProfit,
      payoutsDrawn: payoutsFredrick,
      remainingDraw: Math.max(0, halfProfit - payoutsFredrick),
    },
    {
      name: 'Nicholas',
      key: 'nicholas',
      fullName: 'Nicholas Chairnando',
      avatarLetter: 'N',
      colorClass: 'text-blue-400',
      bgLightClass: 'bg-blue-500/10 border-blue-500/20',
      glowClass: 'shadow-blue-500/5',
      injected: injectionsNicholas,
      profitAllocation: halfProfit,
      payoutsDrawn: payoutsNicholas,
      remainingDraw: Math.max(0, halfProfit - payoutsNicholas),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {founders.map(founder => {
        // Calculate payout percentage progress
        const drawPercent = founder.profitAllocation > 0
          ? Math.min(100, Math.round((founder.payoutsDrawn / founder.profitAllocation) * 100))
          : 0;

        return (
          <div
            key={founder.key}
            className="glow-card relative rounded-2xl bg-card border border-border p-6 shadow-xl overflow-hidden transition-all duration-300 flex flex-col justify-between"
          >
            {/* Header row */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${founder.bgLightClass}`}>
                    {founder.avatarLetter}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{founder.fullName}</h3>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                      Co-Founder &amp; Equity Partner
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-muted/40 border border-border/50 px-2 py-1 rounded-lg">
                  <Percent size={11} className={founder.colorClass} />
                  <span className="text-[10px] font-black text-foreground">50% Split</span>
                </div>
              </div>

              {/* Founder financials ledger list */}
              <div className="mt-5 space-y-4">
                {/* 1. Capital contributions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
                    <PiggyBank size={14} className="opacity-80" />
                    <span>Capital Injected</span>
                  </div>
                  <span className="font-bold text-xs text-foreground">
                    {formatCurrencyIDR(founder.injected)}
                  </span>
                </div>

                {/* 2. Profit allocated */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
                    <Wallet size={14} className="opacity-80" />
                    <span>Allocated Profit Share</span>
                  </div>
                  <span className="font-bold text-xs text-foreground">
                    {formatCurrencyIDR(founder.profitAllocation)}
                  </span>
                </div>

                {/* 3. Distributions drawn */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
                    <ArrowDownRight size={14} className="opacity-80" />
                    <span>Payout Distributions Drawn</span>
                  </div>
                  <span className="font-bold text-xs text-foreground">
                    {formatCurrencyIDR(founder.payoutsDrawn)}
                  </span>
                </div>

                {/* Progress bar container */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                    <span>Draw Progress ({drawPercent}%)</span>
                    <span>Rp {new Intl.NumberFormat('id-ID').format(founder.payoutsDrawn)} / Rp {new Intl.NumberFormat('id-ID').format(founder.profitAllocation)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted/50 overflow-hidden border border-border/40">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        founder.key === 'fredrick' ? 'bg-primary' : 'bg-blue-400'
                      }`}
                      style={{ width: `${drawPercent}%` }}
                    />
                  </div>
                </div>

                {/* 4. Available draw balance */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Remaining Available Draw</span>
                  <span className={`font-black text-sm ${founder.colorClass}`}>
                    {formatCurrencyIDR(founder.remainingDraw)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions buttons */}
            <div className="mt-6 pt-4 border-t border-border/60 grid grid-cols-2 gap-3">
              <button
                onClick={() => onActionClick('inject', founder.key)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-muted-foreground transition-all cursor-pointer hover:text-foreground active-press"
              >
                <ArrowUpRight size={13} />
                Inject Cash
              </button>
              <button
                onClick={() => onActionClick('draw', founder.key)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer active-press shadow-xs hover:opacity-90 ${
                  founder.key === 'fredrick'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-blue-500 text-white'
                }`}
              >
                <ArrowDownRight size={13} />
                Draw Payout
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
