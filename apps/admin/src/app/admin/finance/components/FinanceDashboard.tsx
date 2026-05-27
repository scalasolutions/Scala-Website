'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Landmark, Plus, BookOpen } from 'lucide-react';
import { 
  getExpenses, 
  getCapitalInjections, 
  getPayouts, 
  getInvoices, 
  deleteExpense,
  MockExpense,
  MockCapitalInjection,
  MockPayout,
  MockInvoice,
  MockClient
} from '@/lib/db/queries';
import { FinanceOverviewCards } from './FinanceOverviewCards';
import { FounderSplitCards } from './FounderSplitCards';
import { PartnershipSplitGuide } from './PartnershipSplitGuide';
import { FinanceCharts } from './FinanceCharts';
import { TransactionTabs } from './TransactionTabs';
import { ExpenseModal, InjectionModal, PayoutModal } from './TransactionModals';

export const FinanceDashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<MockExpense[]>([]);
  const [injections, setInjections] = useState<MockCapitalInjection[]>([]);
  const [payouts, setPayouts] = useState<MockPayout[]>([]);
  const [invoices, setInvoices] = useState<(MockInvoice & { client?: MockClient })[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Transitions for deleting/actions
  const [, startTransition] = useTransition();

  // Modals state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [injectionModalOpen, setInjectionModalOpen] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [selectedFounder, setSelectedFounder] = useState<'fredrick' | 'nicholas'>('fredrick');
  const [guideOpen, setGuideOpen] = useState(false);

  // Master fetch ledger records
  const loadFinanceLedger = async () => {
    try {
      const [exp, inj, pay, inv] = await Promise.all([
        getExpenses(),
        getCapitalInjections(),
        getPayouts(),
        getInvoices(),
      ]);
      
      // Defer state updates to avoid synchronous cascading renders inside useEffect hooks
      setTimeout(() => {
        setExpenses(exp as MockExpense[]);
        setInjections(inj as MockCapitalInjection[]);
        setPayouts(pay as MockPayout[]);
        setInvoices(inv as (MockInvoice & { client?: MockClient })[]);
        setLoading(false);
      }, 0);
    } catch (err) {
      console.error('Failed to load financial records ledger', err);
      setTimeout(() => {
        setLoading(false);
      }, 0);
    }
  };

  useEffect(() => {
    loadFinanceLedger();
  }, []);

  // Quick action modal trigger
  const handleFounderAction = (actionType: 'inject' | 'draw', founderKey: 'fredrick' | 'nicholas') => {
    setSelectedFounder(founderKey);
    if (actionType === 'inject') {
      setInjectionModalOpen(true);
    } else {
      setPayoutModalOpen(true);
    }
  };

  // Delete expense helper
  const handleDeleteExpense = async (id: string) => {
    startTransition(async () => {
      try {
        await deleteExpense(id);
        await loadFinanceLedger();
      } catch (err) {
        console.error('Failed to delete expense entry', err);
      }
    });
  };

  // Financial Split Arithmetic Calculations
  const totalPaidRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const awaitingCollection = invoices
    .filter(inv => inv.status === 'issued' || inv.status === 'past_due')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalOperatingCosts = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const netProfit = Math.max(0, totalPaidRevenue - totalOperatingCosts);

  const totalCapitalInjections = injections.reduce((sum, inj) => sum + inj.amount, 0);
  
  const totalPayoutsDrawn = payouts.reduce((sum, pay) => sum + pay.amount, 0);

  // Available cash = (Paid Invoices Revenue + Personal Cash Injected) - (Operating Costs + Payout Distributions)
  const treasuryCash = Math.max(0, (totalPaidRevenue + totalCapitalInjections) - (totalOperatingCosts + totalPayoutsDrawn));

  // Partner splits
  const payoutsFredrick = payouts
    .filter(p => p.founderName === 'fredrick')
    .reduce((sum, p) => sum + p.amount, 0);

  const payoutsNicholas = payouts
    .filter(p => p.founderName === 'nicholas')
    .reduce((sum, p) => sum + p.amount, 0);

  const injectionsFredrick = injections
    .filter(i => i.founderName === 'fredrick')
    .reduce((sum, i) => sum + i.amount, 0);

  const injectionsNicholas = injections
    .filter(i => i.founderName === 'nicholas')
    .reduce((sum, i) => sum + i.amount, 0);

  // Sourcing Commissions arithmetic logic (Deprecated co-founder commission, now unified organic company profit)
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  
  const commissionsFredrick = 0;
  const commissionsNicholas = 0;

  const totalSourcingCommissions = 0;
  
  const splittableNetProfit = netProfit;
  const halfSplittableProfit = Math.max(0, splittableNetProfit / 2);
  
  const allocationFredrick = halfSplittableProfit;
  const allocationNicholas = halfSplittableProfit;

  const remainingAllowedDraw = selectedFounder === 'fredrick'
    ? Math.max(0, allocationFredrick - payoutsFredrick)
    : Math.max(0, allocationNicholas - payoutsNicholas);

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Dashboard Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">Finance &amp; Partner Splits</h1>
            <button
              onClick={() => setGuideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 active-press transition-all duration-200 font-bold text-xs cursor-pointer shadow-sm mt-1"
              title="View Partnership & Referral Guidelines"
            >
              <BookOpen size={13} className="text-primary animate-pulse" />
              Partnership Policy
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Available corporate treasury, business expenses, and personal distribution splits for Fredrick &amp; Nicholas.
          </p>
        </div>

        <button
          onClick={() => setExpenseModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:opacity-90 active-press transition-all duration-200 text-white font-semibold text-sm cursor-pointer self-start"
          style={{ boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)' }}
        >
          <Plus size={16} />
          Record Expense
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-28 gap-3">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Reconciling company ledger accounts...</p>
        </div>
      ) : (
        <>
          {/* 1. Core KPIs Overview Cards */}
          <FinanceOverviewCards
            treasury={treasuryCash}
            netProfit={netProfit}
            totalInjected={totalCapitalInjections}
            awaitingCollection={awaitingCollection}
          />

          {/* 2. Co-Founder splitting details panels */}
          <div className="space-y-3 pt-2">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Landmark size={18} className="text-primary" />
              Founder Accounts &amp; Equity Splits
            </h3>
            <FounderSplitCards
              netProfit={netProfit}
              payoutsFredrick={payoutsFredrick}
              payoutsNicholas={payoutsNicholas}
              injectionsFredrick={injectionsFredrick}
              injectionsNicholas={injectionsNicholas}
              baseProfitShare={halfSplittableProfit}
              commissionFredrick={commissionsFredrick}
              commissionNicholas={commissionsNicholas}
              onActionClick={handleFounderAction}
            />
            <PartnershipSplitGuide isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
          </div>

          {/* 3. Recharts Cash Flow Analytics Visualizers */}
          <FinanceCharts
            invoices={invoices}
            expenses={expenses}
            treasury={treasuryCash}
            payoutsFredrick={payoutsFredrick}
            payoutsNicholas={payoutsNicholas}
          />

          {/* 4. Filterable Transactions tabs index lists */}
          <div className="space-y-3 pt-2">
            <h3 className="text-lg font-bold text-foreground">Ledger Activity</h3>
            <TransactionTabs
              expenses={expenses}
              injections={injections}
              payouts={payouts}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>
        </>
      )}

      {/* Transaction Modals components */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSuccess={loadFinanceLedger}
      />
      <InjectionModal
        isOpen={injectionModalOpen}
        onClose={() => setInjectionModalOpen(false)}
        onSuccess={loadFinanceLedger}
        defaultFounder={selectedFounder}
      />
      <PayoutModal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        onSuccess={loadFinanceLedger}
        defaultFounder={selectedFounder}
        maxAllowedDraw={remainingAllowedDraw}
      />
    </div>
  );
};
