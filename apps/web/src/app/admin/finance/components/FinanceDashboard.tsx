'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Landmark, Plus, BookOpen, Loader2, AlertTriangle } from 'lucide-react';
import {
  deleteExpense,
  deleteCapitalInjection,
  deletePayout,
  getExpenses,
  getCapitalInjections,
  getPayouts,
  getInvoices,
  MockExpense,
  MockCapitalInjection,
  MockPayout,
  MockInvoice,
  MockClient,
} from '@/lib/db/queries';
import { isDbWriteError } from '@/lib/db/errors';
import {
  invalidateCache,
  CACHE_KEYS,
  useAdminData,
} from '@/lib/data-cache';
import { FinanceOverviewCards } from './FinanceOverviewCards';
import { FounderSplitCards } from './FounderSplitCards';
import { PartnershipSplitGuide } from './PartnershipSplitGuide';
import { FinanceCharts } from './FinanceCharts';
import { TransactionTabs } from './TransactionTabs';
import { ExpenseModal, InjectionModal, PayoutModal } from './TransactionModals';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import Skeleton from '@/components/ui/Skeleton';

export const FinanceDashboard: React.FC = () => {
  const { data: expensesData, loading: loadingExpenses } = useAdminData<MockExpense[]>(CACHE_KEYS.EXPENSES, getExpenses as any);
  const { data: injectionsData, loading: loadingInjections } = useAdminData<MockCapitalInjection[]>(CACHE_KEYS.INJECTIONS, getCapitalInjections as any);
  const { data: payoutsData, loading: loadingPayouts } = useAdminData<MockPayout[]>(CACHE_KEYS.PAYOUTS, getPayouts as any);
  const { data: invoicesData, loading: loadingInvoices } = useAdminData<(MockInvoice & { client?: MockClient })[]>(CACHE_KEYS.INVOICES, getInvoices as any);

  const expenses = expensesData || [];
  const injections = injectionsData || [];
  const payouts = payoutsData || [];
  const invoices = invoicesData || [];
  const loading = loadingExpenses || loadingInjections || loadingPayouts || loadingInvoices;
  
  // Transitions for deleting/actions
  const [, startTransition] = useTransition();

  // Confirmation delete modal state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: 'expense' | 'injection' | 'payout';
    title: string;
    amount: number;
  } | null>(null);

  // Modals state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<MockExpense | null>(null);
  const [injectionModalOpen, setInjectionModalOpen] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [selectedFounder, setSelectedFounder] = useState<'fredrick' | 'nicholas'>('fredrick');
  const [guideOpen, setGuideOpen] = useState(false);

  const triggerEditExpense = (expense: MockExpense) => {
    setEditingExpense(expense);
    setExpenseModalOpen(true);
  };

  // Quick action modal trigger
  const handleFounderAction = (actionType: 'inject' | 'draw', founderKey: 'fredrick' | 'nicholas') => {
    setSelectedFounder(founderKey);
    if (actionType === 'inject') {
      setInjectionModalOpen(true);
    } else {
      setPayoutModalOpen(true);
    }
  };

  // Trigger delete helpers to open confirmation modal
  const triggerDeleteExpense = (id: string, title: string, amount: number) => {
    setDeleteTarget({ id, type: 'expense', title, amount });
    setConfirmDeleteOpen(true);
  };

  const triggerDeleteInjection = (id: string, founderName: string, amount: number) => {
    const namePretty = founderName === 'fredrick' ? 'Fredrick Yang' : 'Nicholas Chairnando';
    setDeleteTarget({
      id,
      type: 'injection',
      title: `Capital Injection for ${namePretty}`,
      amount,
    });
    setConfirmDeleteOpen(true);
  };

  const triggerDeletePayout = (id: string, founderName: string, amount: number) => {
    const namePretty = founderName === 'fredrick' ? 'Fredrick Yang' : 'Nicholas Chairnando';
    setDeleteTarget({
      id,
      type: 'payout',
      title: `Profit Draw Payout for ${namePretty}`,
      amount,
    });
    setConfirmDeleteOpen(true);
  };

  // Unified deletion confirmation execution
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, type } = deleteTarget;

    startTransition(async () => {
      try {
        let result: unknown = null;
        if (type === 'expense') {
          result = await deleteExpense(id);
          invalidateCache(CACHE_KEYS.EXPENSES, CACHE_KEYS.INJECTIONS);
        } else if (type === 'injection') {
          result = await deleteCapitalInjection(id);
          invalidateCache(CACHE_KEYS.INJECTIONS);
        } else if (type === 'payout') {
          result = await deletePayout(id);
          invalidateCache(CACHE_KEYS.PAYOUTS);
        }
        if (isDbWriteError(result)) {
          console.error(`Failed to delete ${type} entry:`, result.error);
          return;
        }
        setConfirmDeleteOpen(false);
        setDeleteTarget(null);
      } catch (err) {
        console.error(`Failed to delete ${type} entry`, err);
      }
    });
  };

  // Financial Split Arithmetic Calculations
  const totalPaidRevenue = invoices
    .reduce((sum, inv) => {
      if (inv.status === 'paid') return sum + inv.total;
      if (inv.status === 'partially_paid') return sum + (inv.amountPaid || 0);
      return sum;
    }, 0);

  const awaitingCollection = invoices
    .reduce((sum, inv) => {
      if (inv.status === 'issued' || inv.status === 'past_due') return sum + inv.total;
      if (inv.status === 'partially_paid') return sum + Math.max(0, inv.total - (inv.amountPaid || 0));
      return sum;
    }, 0);

  const totalOperatingCosts = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const netProfit = Math.max(0, totalPaidRevenue - totalOperatingCosts);

  const totalCapitalInjections = injections.reduce((sum, inj) => sum + inj.amount, 0);
  
  const totalPayoutsDrawn = payouts.reduce((sum, pay) => sum + pay.amount, 0);

  // 1. Operating Model Toggle State
  const [bothPayoutsForCompanyRevenue, setBothPayoutsForCompanyRevenue] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scala:finance:both_payouts_revenue');
      return saved === 'true';
    }
    return false;
  });

  const handleToggleModel = (checked: boolean) => {
    setBothPayoutsForCompanyRevenue(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('scala:finance:both_payouts_revenue', String(checked));
    }
  };

  // Available cash = (Paid Invoices Revenue + Personal Cash Injected) - Operating Costs
  // In standard model, Payout Distributions are also subtracted. In no-company-card model, payouts are company revenue held personally by founders, so they are not subtracted from treasuryCash.
  const treasuryCash = bothPayoutsForCompanyRevenue
    ? Math.max(0, (totalPaidRevenue + totalCapitalInjections) - totalOperatingCosts)
    : Math.max(0, (totalPaidRevenue + totalCapitalInjections) - (totalOperatingCosts + totalPayoutsDrawn));

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

      {/* Modern Premium Model Toggle Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-3xl border border-border/70 bg-card/65 backdrop-blur-md relative overflow-hidden animate-fade-in-scale">
        {/* Glow */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            💼 Co-Founder Revenue Split Model
          </h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-2xl">
            Toggle how payout drawings affect corporate cash. Enable <strong>"both pay outs are for the company revenue"</strong> if there is no company card, and all cash drawn/distributed remains part of accumulated company treasury assets.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {bothPayoutsForCompanyRevenue ? 'both pay outs are for the company revenue' : 'Standard Central Treasury'}
          </span>
          <button
            type="button"
            onClick={() => handleToggleModel(!bothPayoutsForCompanyRevenue)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${bothPayoutsForCompanyRevenue ? "bg-primary" : "bg-muted-foreground/30"}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow-lg ring-0 transition duration-200 ease-in-out ${bothPayoutsForCompanyRevenue ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8 animate-pulse">
          {/* KPI Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>

          {/* Split Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-44" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="rounded-2xl border border-border bg-card p-6 h-80 space-y-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-full w-full" rounded="xl" />
          </div>
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
            bothPayoutsForCompanyRevenue={bothPayoutsForCompanyRevenue}
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
              onDeleteExpense={triggerDeleteExpense}
              onEditExpense={triggerEditExpense}
              onDeleteInjection={triggerDeleteInjection}
              onDeletePayout={triggerDeletePayout}
            />
          </div>
        </>
      )}

      {/* Transaction Modals components */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSuccess={() => {}}
        editingExpense={editingExpense}
      />
      <InjectionModal
        isOpen={injectionModalOpen}
        onClose={() => setInjectionModalOpen(false)}
        onSuccess={() => {}}
        defaultFounder={selectedFounder}
      />
      <PayoutModal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        onSuccess={() => {}}
        defaultFounder={selectedFounder}
        maxAllowedDraw={remainingAllowedDraw}
      />

      {/* Unified Destructive Action Confirmation Modal */}
      {confirmDeleteOpen && deleteTarget && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/85 backdrop-blur-md"
            onClick={() => setConfirmDeleteOpen(false)}
          />

          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl animate-fade-in-scale relative z-50">
            <div className="p-6">
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Confirm deletion
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    This destructive action cannot be undone and will permanently remove this record from the financial ledger.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/10 p-3.5 space-y-1.5">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                  {deleteTarget.type === 'expense' ? 'Expense item' : deleteTarget.type === 'injection' ? 'Capital injection credit' : 'Profit draw payout'}
                </p>
                <div className="flex items-start justify-between gap-3 text-xs">
                  <span className="text-foreground font-semibold truncate max-w-[200px]" title={deleteTarget.title}>
                    {deleteTarget.title}
                  </span>
                  <span className="font-bold text-foreground tabular-nums shrink-0">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(deleteTarget.amount)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDeleteOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="!bg-red-500 hover:!bg-red-600 !text-white border-none shadow-sm shadow-red-500/10 active-press animate-none"
                  onClick={handleConfirmDelete}
                >
                  Yes, delete record
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
