'use client';

import React from 'react';
import { Coins, TrendingUp, Landmark, ShieldAlert, HelpCircle } from 'lucide-react';

interface FinanceOverviewCardsProps {
  treasury: number;
  netProfit: number;
  totalInjected: number;
  awaitingCollection: number;
}

export const formatCurrencyIDR = (val: number): string => {
  return 'Rp ' + new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(val);
};

export const FinanceOverviewCards: React.FC<FinanceOverviewCardsProps> = ({
  treasury,
  netProfit,
  totalInjected,
  awaitingCollection,
}) => {
  const cards = [
    {
      title: 'Company Treasury',
      value: treasury,
      description: 'Available Cash Balance',
      icon: <Landmark className="text-primary" size={20} />,
      gradient: 'from-primary/10 to-transparent',
      glow: 'shadow-primary/5',
      border: 'border-primary/20',
      valueColor: 'text-primary',
      tooltipTitle: 'Company Treasury Calculation',
      tooltipText: 'Calculated as: (Paid Invoices Revenue + Personal Cash Injections) - (Operating Expenses + Payout Distributions drawn by founders). Represents the current actual cash buffer in the business.',
    },
    {
      title: 'Net Profit',
      value: netProfit,
      description: 'Revenue minus total expenses',
      icon: <TrendingUp className="text-emerald-400" size={20} />,
      gradient: 'from-emerald-500/10 to-transparent',
      glow: 'shadow-emerald-500/5',
      border: 'border-emerald-500/20',
      valueColor: 'text-emerald-400',
      tooltipTitle: 'Net Profit Calculation',
      tooltipText: 'Calculated as: Paid Invoices Revenue - Operating Expenses. Represents corporate earnings before founder payout distributions are deducted.',
    },
    {
      title: 'Capital Injected',
      value: totalInjected,
      description: 'Total founder cash contributions',
      icon: <Coins className="text-blue-400" size={20} />,
      gradient: 'from-blue-500/10 to-transparent',
      glow: 'shadow-blue-500/5',
      border: 'border-blue-500/20',
      valueColor: 'text-blue-400',
      tooltipTitle: 'Capital Injected Calculation',
      tooltipText: 'Calculated as: Cumulative sum of all personal cash contributions injected into the business treasury by both co-founders (including out-of-pocket expenses).',
    },
    {
      title: 'Awaiting Collection',
      value: awaitingCollection,
      description: 'Issued but unpaid invoices',
      icon: <ShieldAlert className="text-amber-400" size={20} />,
      gradient: 'from-amber-500/10 to-transparent',
      glow: 'shadow-amber-500/5',
      border: 'border-amber-500/20',
      valueColor: 'text-amber-400',
      tooltipTitle: 'Awaiting Collection Calculation',
      tooltipText: "Calculated as: Sum of all invoices currently in 'issued' or 'past_due' status. Represents outstanding accounts receivable awaiting client payment.",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`glow-card relative rounded-2xl bg-card border ${card.border} p-5 shadow-xl ${card.glow} transition-all duration-300 group hover:-translate-y-1`}
          style={{ overflow: 'visible' }}
        >
          {/* Subtle background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent opacity-30 pointer-events-none rounded-2xl overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
          </div>

          {/* Top header row */}
          <div className="flex items-center justify-between relative z-20">
            <div className="flex items-center gap-1.5 group/tooltip relative">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {card.title}
              </span>
              <HelpCircle size={13} className="text-muted-foreground/50 hover:text-primary transition-colors cursor-help shrink-0" />
              
              {/* Premium translucent tooltip popup */}
              <div className="absolute top-full left-0 mt-2 w-64 p-3.5 rounded-xl border border-border/85 text-[11px] text-foreground shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 transform scale-95 origin-top-left group-hover/tooltip:scale-100 z-50 pointer-events-none leading-relaxed bg-popover/95 dark:bg-card/95 backdrop-blur-md">
                <p className="font-bold border-b border-border/60 pb-1 mb-1.5 text-foreground flex items-center gap-1">
                  <span>{card.tooltipTitle}</span>
                </p>
                <p className="text-muted-foreground font-medium">{card.tooltipText}</p>
              </div>
            </div>
            
            <div className="p-2 rounded-xl bg-muted/40 border border-border/50 transition-colors group-hover:bg-muted">
              {card.icon}
            </div>
          </div>

          {/* Core numerical metric value */}
          <div className="mt-4 relative z-10">
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${card.valueColor}`}>
              {formatCurrencyIDR(card.value)}
            </h2>
            <p className="text-[11px] text-muted-foreground mt-1 leading-normal font-medium">
              {card.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
