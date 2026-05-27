'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Landmark, Plus, BookOpen, Loader2 } from 'lucide-react';
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
  MockClient,
} from '@/lib/db/queries';
import { FinanceOverviewCards } from './FinanceOverviewCards';
import { FounderSplitCards } from './FounderSplitCards';
import { PartnershipSplitGuide } from './PartnershipSplitGuide';
import { FinanceCharts } from './FinanceCharts';
import { TransactionTabs } from './TransactionTabs';
import { ExpenseModal, InjectionModal, PayoutModal } from './TransactionModals';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';

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
      {/* Page header */}
      <PageHeader
        title="Finance"
        description="Corporate treasury, business expenses, and founder distribution splits."
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<BookOpen size={16} />}
              onClick={() => setGuideOpen(true)}
            >
              Policy
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={() => setExpenseModalOpen(true)}
            >
              Record Expense
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <Loader2 className="animate-spin text-muted-foreground" size={20} />
          <p className="text-sm text-muted-foreground">Loading ledger…</p>
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
          <div className="space-y-5 pt-2">
            <SectionHeading
              icon={<Landmark size={16} />}
              title="Founder accounts & equity splits"
              description="Per-founder ledger of injections, allocations, and draws."
            />
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
          <div className="space-y-5 pt-2">
            <SectionHeading
              title="Ledger activity"
              description="Browse expenses, injections, and payout distributions."
            />
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
