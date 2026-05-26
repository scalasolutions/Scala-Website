'use client';

import React, { useState } from 'react';
import { CreditCard, ArrowUpRight, ArrowDownRight, Trash2, Filter, Receipt } from 'lucide-react';
import { formatCurrencyIDR } from './FinanceOverviewCards';

interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string | Date;
  payer: 'company' | 'fredrick' | 'nicholas';
  notes: string | null;
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
  onDeleteExpense: (id: string) => void;
}

export const TransactionTabs: React.FC<TransactionTabsProps> = ({
  expenses,
  injections,
  payouts,
  onDeleteExpense,
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'injections' | 'payouts'>('expenses');
  const [expenseFilter, setExpenseFilter] = useState('all');
  const [founderFilter, setFounderFilter] = useState('all');

  const getPayerBadge = (payer: string) => {
    switch (payer) {
      case 'company':
        return 'bg-muted border-border/80 text-muted-foreground';
      case 'fredrick':
        return 'bg-primary/10 border-primary/20 text-primary';
      case 'nicholas':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      default:
        return 'bg-muted border-border/80 text-muted-foreground';
    }
  };

  const getFounderNamePretty = (name: string) => {
    return name === 'fredrick' ? 'Fredrick Yang' : 'Nicholas Chairnando';
  };

  // 1. Expense filtering
  const filteredExpenses = expenses.filter(exp => {
    if (expenseFilter === 'all') return true;
    return exp.category.toLowerCase().includes(expenseFilter.toLowerCase()) || 
           exp.payer.toLowerCase() === expenseFilter.toLowerCase();
  });

  // 2. Injection/Payout filtering
  const filterLedgerByFounder = <T extends { founderName: 'fredrick' | 'nicholas' }>(items: T[]) => {
    if (founderFilter === 'all') return items;
    return items.filter(item => item.founderName === founderFilter);
  };

  const tabs = [
    { id: 'expenses', label: 'Company Expenses', count: expenses.length, icon: <CreditCard size={14} /> },
    { id: 'injections', label: 'Capital Injections', count: injections.length, icon: <ArrowUpRight size={14} /> },
    { id: 'payouts', label: 'Payout Draws', count: payouts.length, icon: <ArrowDownRight size={14} /> },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Tab selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div className="flex p-1 rounded-xl bg-muted/40 border border-border/80 self-start">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`text-[9px] px-1.5 py-0.25 rounded-md font-black ${
                activeTab === tab.id ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Dynamic filters based on active tab */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Filter size={13} className="text-muted-foreground" />
          {activeTab === 'expenses' ? (
            <select
              value={expenseFilter}
              onChange={e => setExpenseFilter(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground cursor-pointer focus:outline-none"
            >
              <option value="all">All Categories &amp; Payers</option>
              <option value="Hosting & Cloud">Hosting &amp; Cloud</option>
              <option value="API & Software">API &amp; Software</option>
              <option value="Office & Admin">Office &amp; Admin</option>
              <option value="Contractor">Contractor &amp; Outsource</option>
              <option value="Marketing">Marketing &amp; Ads</option>
              <option value="company">Paid by Company Card</option>
              <option value="fredrick">Paid by Fredrick Yang</option>
              <option value="nicholas">Paid by Nicholas</option>
            </select>
          ) : (
            <select
              value={founderFilter}
              onChange={e => setFounderFilter(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground cursor-pointer focus:outline-none"
            >
              <option value="all">All Founders</option>
              <option value="fredrick">Fredrick Yang</option>
              <option value="nicholas">Nicholas Chairnando</option>
            </select>
          )}
        </div>
      </div>

      {/* Ledger lists rendering */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'expenses' && (
            filteredExpenses.length === 0 ? (
              <div className="p-16 text-center">
                <Receipt className="mx-auto text-muted-foreground opacity-30 mb-3" size={32} />
                <h4 className="font-bold text-sm text-foreground">No Expenses Logged</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Try adjusting filters or record a new expense item above.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Expense Title</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Paid By (Payer)</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs text-muted-foreground">
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(exp.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        <div>{exp.title}</div>
                        {exp.notes && (
                          <div className="text-[10px] text-muted-foreground font-normal mt-0.5 max-w-sm line-clamp-1" title={exp.notes}>
                            {exp.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-muted px-2 py-0.75 rounded-md border border-border/80 text-[10px] font-semibold text-foreground uppercase tracking-wider font-mono">
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.75 rounded-md border text-[9px] font-black uppercase tracking-wider font-mono ${getPayerBadge(exp.payer)}`}>
                          {exp.payer === 'company' ? 'Company Card' : getFounderNamePretty(exp.payer)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-foreground font-mono text-sm whitespace-nowrap">
                        {formatCurrencyIDR(exp.amount)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer"
                          title="Delete Expense Entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {activeTab === 'injections' && (
            (() => {
              const list = filterLedgerByFounder(injections);
              return list.length === 0 ? (
                <div className="p-16 text-center">
                  <ArrowUpRight className="mx-auto text-muted-foreground opacity-30 mb-3" size={32} />
                  <h4 className="font-bold text-sm text-foreground">No Capital Injections Logged</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Record a founder cash injection above to fund the treasury balance.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Founder Account</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4 text-right">Injected Cash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs text-muted-foreground">
                    {list.map(inj => (
                      <tr key={inj.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(inj.date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-foreground">
                          {getFounderNamePretty(inj.founderName)}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {inj.description}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-emerald-400 font-mono text-sm whitespace-nowrap">
                          +{formatCurrencyIDR(inj.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()
          )}

          {activeTab === 'payouts' && (
            (() => {
              const list = filterLedgerByFounder(payouts);
              return list.length === 0 ? (
                <div className="p-16 text-center">
                  <ArrowDownRight className="mx-auto text-muted-foreground opacity-30 mb-3" size={32} />
                  <h4 className="font-bold text-sm text-foreground">No Payout Distributions Logged</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Use payout actions to draw allocated dividends/distribution draws.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Founder Account</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4 text-right">Payout Drawn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs text-muted-foreground">
                    {list.map(pay => (
                      <tr key={pay.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(pay.date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-foreground">
                          {getFounderNamePretty(pay.founderName)}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {pay.description}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-red-400 font-mono text-sm whitespace-nowrap">
                          -{formatCurrencyIDR(pay.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
};
