'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Receipt,
  X,
} from 'lucide-react';
import { formatCurrencyIDR } from './FinanceOverviewCards';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import FilterBar, { FilterOption } from '@/components/ui/FilterBar';

interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string | Date;
  payer: 'company' | 'fredrick' | 'nicholas';
  notes: string | null;
  receiptUrl?: string | null;
}

interface InjectionItem {
  id: string;
  founderName: 'fredrick' | 'nicholas';
  amount: number;
  date: string | Date;
  description: string | null;
}

interface PayoutItem {
  id: string;
  founderName: 'fredrick' | 'nicholas';
  amount: number;
  date: string | Date;
  description: string | null;
}

interface TransactionTabsProps {
  expenses: ExpenseItem[];
  injections: InjectionItem[];
  payouts: PayoutItem[];
  onDeleteExpense: (id: string, title: string, amount: number) => void;
  onDeleteInjection?: (id: string, founderName: string, amount: number) => void;
  onDeletePayout?: (id: string, founderName: string, amount: number) => void;
}

type TabId = 'expenses' | 'injections' | 'payouts';
type FounderFilter = 'all' | 'fredrick' | 'nicholas';

export const TransactionTabs: React.FC<TransactionTabsProps> = ({
  expenses,
  injections,
  payouts,
  onDeleteExpense,
  onDeleteInjection,
  onDeletePayout,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('expenses');
  const [expenseFilter, setExpenseFilter] = useState('all');
  const [founderFilter, setFounderFilter] = useState<FounderFilter>('all');
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);

  const getFounderNamePretty = (name: string) =>
    name === 'fredrick' ? 'Fredrick Yang' : 'Nicholas Chairnando';

  // Expense filtering — preserves the original logic verbatim
  const filteredExpenses = expenses.filter((exp) => {
    if (expenseFilter === 'all') return true;
    return (
      exp.category.toLowerCase().includes(expenseFilter.toLowerCase()) ||
      exp.payer.toLowerCase() === expenseFilter.toLowerCase()
    );
  });

  // Injection/Payout filtering
  const filterLedgerByFounder = <T extends { founderName: 'fredrick' | 'nicholas' }>(
    items: T[]
  ) => {
    if (founderFilter === 'all') return items;
    return items.filter((item) => item.founderName === founderFilter);
  };

  const tabs: { id: TabId; label: string; count: number; icon: React.ReactNode }[] = [
    {
      id: 'expenses',
      label: 'Expenses',
      count: expenses.length,
      icon: <CreditCard size={14} />,
    },
    {
      id: 'injections',
      label: 'Injections',
      count: injections.length,
      icon: <ArrowUpRight size={14} />,
    },
    {
      id: 'payouts',
      label: 'Payouts',
      count: payouts.length,
      icon: <ArrowDownRight size={14} />,
    },
  ];

  const founderOptions: FilterOption<FounderFilter>[] = [
    { value: 'all', label: 'All founders' },
    { value: 'fredrick', label: 'Fredrick' },
    { value: 'nicholas', label: 'Nicholas' },
  ];

  return (
    <div className="space-y-4">
      {/* Tab strip — calm bottom-border indicator, no pill chips */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border">
        <div className="flex gap-6">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative pb-3 -mb-px flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'text-foreground border-b-2 border-foreground'
                    : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
                }`}
              >
                <span className="text-muted-foreground">{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`text-xs tabular-nums ${
                    active ? 'text-foreground/60' : 'text-muted-foreground/70'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic filters based on active tab */}
        <div className="pb-2 sm:pb-3">
          {activeTab === 'expenses' ? (
            <select
              value={expenseFilter}
              onChange={(e) => setExpenseFilter(e.target.value)}
              className="h-9 rounded-xl bg-background border border-border px-3 text-xs text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-colors"
            >
              <option value="all">All categories & payers</option>
              <option value="Hosting & Cloud">Hosting & Cloud</option>
              <option value="API & Software">API & Software</option>
              <option value="Office & Admin">Office & Admin</option>
              <option value="Contractor">Contractor & Outsource</option>
              <option value="Marketing">Marketing & Ads</option>
              <option value="company">Paid by company</option>
              <option value="fredrick">Paid by Fredrick</option>
              <option value="nicholas">Paid by Nicholas</option>
            </select>
          ) : (
            <FilterBar<FounderFilter>
              options={founderOptions}
              value={founderFilter}
              onChange={setFounderFilter}
            />
          )}
        </div>
      </div>

      {/* Ledger lists */}
      <Card padding="sm">
        {activeTab === 'expenses' &&
          (filteredExpenses.length === 0 ? (
            <EmptyState
              icon={<Receipt size={20} />}
              title="No expenses logged"
              description="Try adjusting filters or record a new expense above."
              className="py-12"
            />
          ) : (
            <div className="divide-y divide-border">
              {filteredExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="group flex items-center justify-between gap-4 py-4 px-3 -mx-3 rounded-lg hover:bg-muted/20 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">
                        {exp.title}
                      </p>
                      <Badge variant="neutral">{exp.category}</Badge>
                      <Badge variant="neutral">
                        {exp.payer === 'company'
                          ? 'Company'
                          : getFounderNamePretty(exp.payer)}
                      </Badge>
                      {exp.receiptUrl && (
                        <button
                          type="button"
                          onClick={() => setReceiptPreviewUrl(exp.receiptUrl!)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold bg-primary-soft dark:bg-primary/15 text-primary-ink dark:text-primary border border-primary-ink/20 dark:border-primary/25 px-1.5 py-0.5 rounded transition-all hover:bg-primary/25 dark:hover:bg-primary/25 cursor-pointer select-none active:scale-95"
                          title="Click to view receipt screenshot"
                        >
                          📎 Receipt
                        </button>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(exp.date).toLocaleDateString('id-ID')}</span>
                      {exp.notes && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                          <span className="truncate max-w-md" title={exp.notes}>
                            {exp.notes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-foreground tabular-nums">
                      {formatCurrencyIDR(exp.amount)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="!p-0 !h-8 !w-8 hover:!text-red-500"
                    aria-label="Delete expense"
                    onClick={() => onDeleteExpense(exp.id, exp.title, exp.amount)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          ))}

        {activeTab === 'injections' &&
          (() => {
            const list = filterLedgerByFounder(injections);
            return list.length === 0 ? (
              <EmptyState
                icon={<ArrowUpRight size={20} />}
                title="No capital injections logged"
                description="Record a founder cash injection above to fund the treasury."
                className="py-12"
              />
            ) : (
              <div className="divide-y divide-border">
                {list.map((inj) => (
                  <div
                    key={inj.id}
                    className="flex items-center justify-between gap-4 py-4 px-3 -mx-3 rounded-lg hover:bg-muted/20 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate">
                          {getFounderNamePretty(inj.founderName)}
                        </p>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(inj.date).toLocaleDateString('id-ID')}</span>
                        {inj.description && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            <span className="truncate max-w-md">{inj.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <p className="text-sm font-medium text-foreground dark:text-primary tabular-nums">
                        +{formatCurrencyIDR(inj.amount)}
                      </p>
                      {onDeleteInjection && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!p-0 !h-8 !w-8 hover:!text-red-500"
                          aria-label="Delete injection"
                          onClick={() => onDeleteInjection(inj.id, inj.founderName, inj.amount)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

        {activeTab === 'payouts' &&
          (() => {
            const list = filterLedgerByFounder(payouts);
            return list.length === 0 ? (
              <EmptyState
                icon={<ArrowDownRight size={20} />}
                title="No payout distributions logged"
                description="Use the founder action buttons to draw allocated distributions."
                className="py-12"
              />
            ) : (
              <div className="divide-y divide-border">
                {list.map((pay) => (
                  <div
                    key={pay.id}
                    className="flex items-center justify-between gap-4 py-4 px-3 -mx-3 rounded-lg hover:bg-muted/20 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate">
                          {getFounderNamePretty(pay.founderName)}
                        </p>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(pay.date).toLocaleDateString('id-ID')}</span>
                        {pay.description && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            <span className="truncate max-w-md">{pay.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <p className="text-sm font-medium text-red-500 tabular-nums">
                        -{formatCurrencyIDR(pay.amount)}
                      </p>
                      {onDeletePayout && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!p-0 !h-8 !w-8 hover:!text-red-500"
                          aria-label="Delete payout"
                          onClick={() => onDeletePayout(pay.id, pay.founderName, pay.amount)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
      </Card>

      {/* Premium Lightbox Modal for Receipt Screenshot */}
      {receiptPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/90 backdrop-blur-md cursor-zoom-out"
            onClick={() => setReceiptPreviewUrl(null)}
          />
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-fade-in-scale flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Expense Receipt Attachment
              </span>
              <button
                onClick={() => setReceiptPreviewUrl(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto p-4 bg-muted/5 flex items-center justify-center min-h-[300px]">
              {receiptPreviewUrl.startsWith('data:application/pdf') || receiptPreviewUrl.includes('.pdf') ? (
                <iframe
                  src={receiptPreviewUrl}
                  className="w-[600px] h-[500px] border-0 rounded-xl"
                  title="PDF Receipt Viewer"
                />
              ) : (
                <img
                  src={receiptPreviewUrl}
                  alt="Expense proof of payment receipt screenshot"
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg border border-border"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
