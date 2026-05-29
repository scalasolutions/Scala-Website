'use client';

import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight, CreditCard, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { createExpense, createCapitalInjection, createPayout } from '@/lib/db/queries';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';

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

// Shared select className so the modals stay consistent without inventing a new primitive.
const selectClass =
  'h-10 w-full appearance-none rounded-xl bg-background border border-border pl-3.5 pr-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-colors cursor-pointer';

const ModalShell: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, description, icon, children }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
        <div className="p-6">
          <SectionHeading
            icon={icon}
            title={title}
            description={description}
            action={
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            }
          />
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── EXPENSE MODAL ─────────────────────────────────────────────
interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hosting & Cloud');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [payer, setPayer] = useState('company');
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
      await createExpense({
        title,
        category,
        amount,
        date: new Date(date),
        payer,
        notes: notes || null,
      });

      // If out-of-pocket, automatically create matching capital injection
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

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Record expense"
      description="Log a new business expense, optionally paid out-of-pocket by a founder."
      icon={<CreditCard size={16} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Expense title *"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Vercel Pro hosting"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={selectClass}
            >
              <option value="Hosting & Cloud">Hosting & Cloud</option>
              <option value="API & Software">API & Software</option>
              <option value="Office & Admin">Office & Admin</option>
              <option value="Contractor & Outsource">Contractor</option>
              <option value="Marketing & Ads">Marketing & Ads</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <Input
            label="Amount (IDR) *"
            required
            value={amountStr}
            onChange={(e) => setAmountStr(formatNumberInputIDR(e.target.value))}
            placeholder="0"
            className="text-right tabular-nums"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Paid by
            </label>
            <select
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
              className={selectClass}
            >
              <option value="company">Company</option>
              <option value="fredrick">Fredrick (out of pocket)</option>
              <option value="nicholas">Nicholas (out of pocket)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Brief context…"
            rows={2}
            className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-colors resize-none"
          />
        </div>

        {(payer === 'fredrick' || payer === 'nicholas') && (
          <div className="rounded-xl border border-border bg-muted/30 p-3.5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">Smart split credit:</span>{' '}
              Because this expense is marked as paid out-of-pocket, saving will also
              register a matching capital contribution of{' '}
              {amountStr ? `IDR ${amountStr}` : 'the equivalent value'} for the payer.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-border flex justify-end gap-2">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
            {isSubmitting ? 'Recording…' : 'Save expense'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

// ── INJECTION MODAL ─────────────────────────────────────────────
interface InjectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultFounder?: 'fredrick' | 'nicholas';
}

export const InjectionModal: React.FC<InjectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultFounder = 'fredrick',
}) => {
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
        description: description || 'Owner cash contribution injection',
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

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Inject founder capital"
      description="Record a personal cash contribution into the treasury."
      icon={<ArrowUpRight size={16} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Founder
            </label>
            <select
              value={founderName}
              onChange={(e) =>
                setFounderName(e.target.value as 'fredrick' | 'nicholas')
              }
              className={selectClass}
            >
              <option value="fredrick">Fredrick Yang</option>
              <option value="nicholas">Nicholas Chairnando</option>
            </select>
          </div>

          <Input
            label="Amount (IDR) *"
            required
            value={amountStr}
            onChange={(e) => setAmountStr(formatNumberInputIDR(e.target.value))}
            placeholder="0"
            className="text-right tabular-nums"
          />
        </div>

        <Input
          label="Date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Notes (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Q2 operational boost contribution"
            rows={2}
            className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-colors resize-none"
          />
        </div>

        <div className="pt-4 border-t border-border flex justify-end gap-2">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
            {isSubmitting ? 'Recording…' : 'Record injection'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

// ── PAYOUT MODAL ─────────────────────────────────────────────
interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultFounder?: 'fredrick' | 'nicholas';
  maxAllowedDraw?: number;
}

export const PayoutModal: React.FC<PayoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultFounder = 'fredrick',
  maxAllowedDraw = Infinity,
}) => {
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

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Draw profit payout"
      description="Withdraw an allocated profit distribution to a founder."
      icon={<ArrowDownRight size={16} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Founder
            </label>
            <select
              value={founderName}
              onChange={(e) =>
                setFounderName(e.target.value as 'fredrick' | 'nicholas')
              }
              className={selectClass}
            >
              <option value="fredrick">Fredrick Yang</option>
              <option value="nicholas">Nicholas Chairnando</option>
            </select>
          </div>

          <Input
            label="Amount (IDR) *"
            required
            value={amountStr}
            onChange={(e) => setAmountStr(formatNumberInputIDR(e.target.value))}
            placeholder="0"
            className="text-right tabular-nums"
          />
        </div>

        <Input
          label="Date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Mid-month personal distribution"
            rows={2}
            className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-colors resize-none"
          />
        </div>

        {exceedsWarning && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 flex items-start gap-2 animate-fade-in-scale">
            <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-500 leading-relaxed">
              This draw exceeds the founder's remaining allocated share. Available: Rp{' '}
              {new Intl.NumberFormat('id-ID').format(maxAllowedDraw)}. Continuing will
              result in an overdrawn profit balance.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-border flex justify-end gap-2">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
            {isSubmitting ? 'Recording…' : 'Record payout'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};
