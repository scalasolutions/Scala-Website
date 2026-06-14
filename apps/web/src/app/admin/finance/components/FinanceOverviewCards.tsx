'use client';

import React from 'react';
import { Coins, TrendingUp, Landmark, ShieldAlert } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { formatCurrencyIDR } from '@/lib/utils';

// Re-exported so finance components can keep importing it from here.
export { formatCurrencyIDR };

interface FinanceOverviewCardsProps {
  treasury: number;
  netProfit: number;
  totalInjected: number;
  awaitingCollection: number;
}

export const FinanceOverviewCards: React.FC<FinanceOverviewCardsProps> = ({
  treasury,
  netProfit,
  totalInjected,
  awaitingCollection,
}) => {
  // Treasury is the headline metric — accent on this card only.
  // Net profit goes green when positive (red when negative); awaiting collection is amber.
  const cards = [
    {
      label: 'Company Treasury',
      value: formatCurrencyIDR(treasury),
      description: 'Available cash balance',
      icon: <Landmark size={14} />,
      accent: true,
      tone: 'default' as const,
    },
    {
      label: 'Net Profit',
      value: formatCurrencyIDR(netProfit),
      description: 'Revenue minus expenses',
      icon: <TrendingUp size={14} />,
      accent: false,
      tone: (netProfit < 0 ? 'danger' : 'success') as 'danger' | 'success',
    },
    {
      label: 'Capital Injected',
      value: formatCurrencyIDR(totalInjected),
      description: 'Founder contributions',
      icon: <Coins size={14} />,
      accent: false,
      tone: 'default' as const,
    },
    {
      label: 'Awaiting Collection',
      value: formatCurrencyIDR(awaitingCollection),
      description: 'Outstanding receivables',
      icon: <ShieldAlert size={14} />,
      accent: false,
      tone: 'warning' as const,
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          icon={card.icon}
          accent={card.accent}
          tone={card.tone}
          delta={{ value: card.description, trend: 'neutral' }}
        />
      ))}
    </div>
  );
};
