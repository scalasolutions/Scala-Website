'use client';

import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { createPortal } from 'react-dom';
import { createExpense, createCapitalInjection, createPayout } from '@/lib/db/queries';

// Format dynamic currency entry formatting helper
export const formatNumberInputIDR = (val: number | string): string => {
  if (val === undefined || val === null || val === '') return '';
  const num = String(val).replace(/[^0-9]/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(Number(num));
};

export const parseNumberInputIDR = (formattedVal: string): number => {
  return Number(formattedVal.replace(/[^0-9]/g, ''));
};

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hosting & Cloud');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [payer, setPayer] = useState('company'); // 'company' | 'fredrick' | 'nicholas'
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseNumberInputIDR(amountStr);
    if (!title || amount <= 0) return;

    setIsSubmitting(true);
    try {
      // 1. Create the expense entry
      await createExpense({
        title,
        category,
        amount,
        date: new Date(date),
        payer,
        notes: notes || null,
      });

      // 2. If out-of-pocket, automatically create matching capital injection
      if (payer === 'fredrick' || payer === 'nicholas') {
        await createCapitalInjection({
          founderName: payer,
          amount,
          date: new Date(date),
          description: `Out-of-pocket expense payment: ${title}`,
        });
      }

      onSuccess();
      onClose();
      // Reset form
      setTitle('');
      setAmountStr('');
      setNotes('');
      setPayer('company');
    } catch (err) {
      console.error('Failed to create expense', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/85 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl animate-fade-in-scale">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div className="flex items-center gap-2 text-red-400">
            <CreditCard size={18} />
            <h3 className="font-bold text-base text-foreground">Record Expense</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Expense Item Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Vercel Pro Hosting"
              className="w-full px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground appearance-none cursor-pointer"
              >
                <option value="Hosting & Cloud">Hosting & Cloud</option>
                <option value="API & Software">API & Software</option>
                <option value="Office & Admin">Office & Admin</option>
                <option value="Contractor & Outsource">Contractor</option>
                <option value="Marketing & Ads">Marketing & Ads</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Amount (IDR) *
              </label>
              <input
                type="text"
                required
                value={amountStr}
                onChange={e => setAmountStr(formatNumberInputIDR(e.target.value))}
                placeholder="0"
                className="w-full px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-sm font-semibold focus:border-primary/40 focus:outline-none transition-all text-foreground text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Paid By (Payer)
              </label>
              <select
                value={payer}
                onChange={e => setPayer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground appearance-none cursor-pointer"
              >
                <option value="company">Company Card/Cash</option>
                <option value="fredrick">Fredrick (Out of pocket)</option>
                <option value="nicholas">Nicholas (Out of pocket)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Provide a brief context..."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground resize-none"
            />
          </div>

          {(payer === 'fredrick' || payer === 'nicholas') && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
              <p className="text-[11px] text-primary leading-normal">
                💡 <strong>Smart Split Credit:</strong> Because this expense is marked as paid out-of-pocket by a founder, clicking Save will automatically register this as both a **Business Expense** and a **Capital Contribution** of {amountStr ? 'IDR ' + amountStr : 'equivalent value'} for the payer.
              </p>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-muted-foreground transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-500 text-white hover:opacity-90 active-press transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? 'Recording...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

interface InjectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultFounder?: 'fredrick' | 'nicholas';
}

export const InjectionModal: React.FC<InjectionModalProps> = ({ isOpen, onClose, onSuccess, defaultFounder = 'fredrick' }) => {
  const [mounted, setMounted] = useState(false);
  const [founderName, setFounderName] = useState<'fredrick' | 'nicholas'>(defaultFounder);
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Sync state if defaultFounder changes
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setFounderName(defaultFounder);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultFounder]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseNumberInputIDR(amountStr);
    if (amount <= 0) return;

    setIsSubmitting(true);
    try {
      await createCapitalInjection({
        founderName,
        amount,
        date: new Date(date),
        description: description || 'Owner Cash Contribution Injection',
      });
      onSuccess();
      onClose();
      setAmountStr('');
      setDescription('');
    } catch (err) {
      console.error('Failed to record capital injection', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/85 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl animate-fade-in-scale">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <ArrowUpRight size={18} />
            <h3 className="font-bold text-base text-foreground">Inject Founder Capital</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Founder Account
              </label>
              <select
                value={founderName}
                onChange={e => setFounderName(e.target.value as 'fredrick' | 'nicholas')}
                className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground appearance-none cursor-pointer"
              >
                <option value="fredrick">Fredrick Yang</option>
                <option value="nicholas">Nicholas Chairnando</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Injected Amount (IDR) *
              </label>
              <input
                type="text"
                required
                value={amountStr}
                onChange={e => setAmountStr(formatNumberInputIDR(e.target.value))}
                placeholder="0"
                className="w-full px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-sm font-semibold focus:border-primary/40 focus:outline-none transition-all text-foreground text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Contribution Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Q2 operational boost contribution"
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-muted-foreground transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 text-white hover:opacity-90 active-press transition-all cursor-pointer"
            >
              {isSubmitting ? 'Recording...' : 'Record Injection'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultFounder?: 'fredrick' | 'nicholas';
  maxAllowedDraw?: number;
}

export const PayoutModal: React.FC<PayoutModalProps> = ({ isOpen, onClose, onSuccess, defaultFounder = 'fredrick', maxAllowedDraw = Infinity }) => {
  const [mounted, setMounted] = useState(false);
  const [founderName, setFounderName] = useState<'fredrick' | 'nicholas'>(defaultFounder);
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Sync state
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setFounderName(defaultFounder);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultFounder]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseNumberInputIDR(amountStr);
    if (amount <= 0) return;

    setIsSubmitting(true);
    try {
      await createPayout({
        founderName,
        amount,
        date: new Date(date),
        description: description || 'Founder profit share draw payout',
      });
      onSuccess();
      onClose();
      setAmountStr('');
      setDescription('');
    } catch (err) {
      console.error('Failed to record profit draw', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const exceedsWarning = parseNumberInputIDR(amountStr) > maxAllowedDraw;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/85 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl animate-fade-in-scale">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div className="flex items-center gap-2 text-primary">
            <ArrowDownRight size={18} />
            <h3 className="font-bold text-base text-foreground">Draw Profit Payout</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Founder Account
              </label>
              <select
                value={founderName}
                onChange={e => setFounderName(e.target.value as 'fredrick' | 'nicholas')}
                className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground appearance-none cursor-pointer"
              >
                <option value="fredrick">Fredrick Yang</option>
                <option value="nicholas">Nicholas Chairnando</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Draw Amount (IDR) *
              </label>
              <input
                type="text"
                required
                value={amountStr}
                onChange={e => setAmountStr(formatNumberInputIDR(e.target.value))}
                placeholder="0"
                className="w-full px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-sm font-semibold focus:border-primary/40 focus:outline-none transition-all text-foreground text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Draw Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Mid-month personal distribution"
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground resize-none"
            />
          </div>

          {exceedsWarning && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-bounce-subtle">
              <p className="text-[11px] text-red-400 font-bold leading-normal">
                ⚠️ Warning: The requested draw exceeds the founder&apos;s remaining allocated 50% Net Profit share (Available: Rp {new Intl.NumberFormat('id-ID').format(maxAllowedDraw)}). This will result in an overdrawn profit balance!
              </p>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-muted-foreground transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 active-press transition-all cursor-pointer"
            >
              {isSubmitting ? 'Recording...' : 'Record Payout'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
