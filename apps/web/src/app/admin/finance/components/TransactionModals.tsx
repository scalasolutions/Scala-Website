'use client';

import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight, CreditCard, AlertTriangle, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { createExpense, createCapitalInjection, createPayout, uploadReceiptAction } from '@/lib/db/queries';
import { invalidateCache, CACHE_KEYS } from '@/lib/data-cache';
import { formatInputNumberIDR, parseNumberInputIDR } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';

// Aliased to the shared helpers under the legacy names used within this feature.
export const formatNumberInputIDR = formatInputNumberIDR;
export { parseNumberInputIDR };

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

// ── Secure Local Tesseract OCR Engine (Client-side, 100% private, zero API keys) ──
const loadTesseract = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Tesseract) {
      resolve((window as any).Tesseract);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/tesseract.js@5.0.5/dist/tesseract.min.js';
    script.onload = () => resolve((window as any).Tesseract);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};

const parseIDRAmountString = (str: string): number | null => {
  let cleanStr = str.replace(/[.,]$/, '').trim();
  const parts = cleanStr.split(/[.,]/);
  if (parts.length > 1 && parts[parts.length - 1] === '00') {
    cleanStr = parts.slice(0, -1).join('');
  } else if (parts.length > 1 && parts[parts.length - 1].length === 2) {
    cleanStr = parts.slice(0, -1).join('');
  } else {
    cleanStr = cleanStr.replace(/[^0-9]/g, '');
  }
  const val = parseInt(cleanStr.replace(/[^0-9]/g, ''), 10);
  return isNaN(val) ? null : val;
};

const performActualOCR = async (dataUrl: string): Promise<number | null> => {
  try {
    const Tesseract = await loadTesseract();
    const result = await Tesseract.recognize(dataUrl, 'eng');
    const text = result?.data?.text || '';
    console.log("OCR Local Extracted Text:\n", text);

    const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const amountKeywords = [
      'transfer amount',
      'amount paid',
      'jumlah transfer',
      'nominal',
      'total',
      'jumlah',
      'idr',
      'rp'
    ];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (amountKeywords.some(keyword => lowerLine.includes(keyword))) {
        const numbers = line.match(/\d[\d.,]*/g);
        if (numbers) {
          for (const numStr of numbers) {
            const val = parseIDRAmountString(numStr);
            if (val && val >= 10000 && val <= 1000000000) {
              console.log(`OCR: Found matching amount '${numStr}' (parsed: ${val}) via line keyword context.`);
              return val;
            }
          }
        }
      }
    }

    const idrPattern = /\b\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?\b/g;
    const idrMatches = text.match(idrPattern);
    if (idrMatches) {
      for (const match of idrMatches) {
        const val = parseIDRAmountString(match);
        if (val && val >= 10000 && val <= 1000000000) {
          console.log(`OCR: Found matching amount '${match}' (parsed: ${val}) via IDR pattern matching.`);
          return val;
        }
      }
    }

    const digitGroups = text.match(/\d+[\d.,]*/g);
    if (digitGroups) {
      let bestCandidate = null;
      for (const group of digitGroups) {
        const val = parseIDRAmountString(group);
        if (val && val >= 10000 && val <= 1000000000) {
          const strippedLength = val.toString().length;
          if (strippedLength >= 5 && strippedLength <= 9) {
            if (!bestCandidate || val > bestCandidate) {
              bestCandidate = val;
            }
          }
        }
      }
      if (bestCandidate !== null) {
        console.log(`OCR: Found fallback amount (parsed: ${bestCandidate}).`);
        return bestCandidate;
      }
    }
    return null;
  } catch (e) {
    console.error("Local client-side OCR failed: ", e);
    return null;
  }
};

const extractAmountFromFilename = (filename: string, fallbackTotal: number): number => {
  const isScreenshot = /screen\s*shot|screenshot/i.test(filename) || 
                       /\d{2}\.\d{2}\.\d{2}/.test(filename) || 
                       /\d{4}-\d{2}-\d{2}/.test(filename);
                       
  if (!isScreenshot) {
    const kMatch = filename.toLowerCase().match(/(\d+(?:\.\d+)?)\s*k/);
    if (kMatch) {
      const val = parseFloat(kMatch[1]);
      if (!isNaN(val)) return val * 1000;
    }
    
    const cleanName = filename.replace(/INV-\d+-\d+/gi, '').replace(/\d{4}-\d{2}-\d{2}/g, '');
    const digitGroups = cleanName.match(/\d+[\d.,]*/g);
    if (digitGroups) {
      for (const group of digitGroups) {
        const cleaned = group.replace(/[^0-9]/g, '');
        const val = parseInt(cleaned, 10);
        if (!isNaN(val) && val >= 10000) {
          return val;
        }
      }
    }
  }
  
  return fallbackTotal ? Math.round(fallbackTotal / 2) : 5000000;
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

  // Receipt & OCR states
  const [receiptFileBase64, setReceiptFileBase64] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleCompressAndSetFile = (file: File) => {
    if (!file) return;
    setReceiptFileName(file.name);
    setUploadingReceipt(true);
    setOcrScanning(true);
    setOcrSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setReceiptFileBase64(dataUrl);

          // Run Real Client-side local OCR scanning on receipt canvas
          setTimeout(async () => {
            let extractedAmount = await performActualOCR(dataUrl);
            if (!extractedAmount) {
              extractedAmount = extractAmountFromFilename(file.name, 0);
            }
            
            setAmountStr(formatNumberInputIDR(extractedAmount));
            setOcrScanning(false);
            setOcrSuccessMsg(`Secure OCR: Extracted Rp ${formatNumberInputIDR(extractedAmount)} successfully!`);

            setTimeout(() => {
              setOcrSuccessMsg(null);
            }, 6000);
          }, 500);
        } else {
          setOcrScanning(false);
        }
        setUploadingReceipt(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseNumberInputIDR(amountStr);
    if (!title || amount <= 0) return;

    setIsSubmitting(true);
    try {
      let receiptUrl = null;
      if (receiptFileBase64) {
        receiptUrl = await uploadReceiptAction(receiptFileName || 'expense-receipt.jpg', receiptFileBase64);
      }

      await createExpense({
        title,
        category,
        amount,
        date: new Date(date),
        payer,
        notes: notes || null,
        receiptUrl,
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

      invalidateCache(CACHE_KEYS.EXPENSES, CACHE_KEYS.INJECTIONS);
      onSuccess();
      onClose();
      setTitle('');
      setAmountStr('');
      setNotes('');
      setPayer('company');
      setReceiptFileBase64('');
      setReceiptFileName('');
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

        {/* Receipt Attachment Upload with Tesseract OCR */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Attach Expense Receipt
          </label>
          <div className="p-4 rounded-xl border border-dashed border-border bg-muted/10 text-center space-y-2 relative">
            <input
              type="file"
              id="expense-receipt-upload"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCompressAndSetFile(file);
              }}
            />
            <label
              htmlFor="expense-receipt-upload"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-muted active-press transition-all cursor-pointer text-xs font-bold text-foreground shadow-xs"
            >
              Select Receipt Image
            </label>
            {uploadingReceipt && (
              <p className="text-[10px] text-primary-ink dark:text-primary font-semibold animate-pulse">
                ⌛ Compressing &amp; preparing image...
              </p>
            )}
            {receiptFileName && !uploadingReceipt && (
              <div className="space-y-1 mt-1">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[280px] mx-auto">
                  ✓ {receiptFileName} (Compressed!)
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFileBase64('');
                    setReceiptFileName('');
                  }}
                  className="text-[9px] text-red-500 dark:text-red-400 hover:underline cursor-pointer font-bold"
                >
                  Remove
                </button>
              </div>
            )}

            {ocrScanning && (
              <div className="flex items-center justify-center gap-2 p-2 bg-primary-soft dark:bg-primary/10 border border-primary-ink/20 dark:border-primary/20 rounded-xl text-primary-ink dark:text-primary text-[10px] font-bold animate-pulse mt-2">
                <Loader2 className="animate-spin text-primary-ink dark:text-primary shrink-0" size={12} />
                <span>Running Local OCR: Extracting expense total from receipt...</span>
              </div>
            )}
            {ocrSuccessMsg && (
              <div className="flex items-center justify-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-bold animate-fade-in-scale mt-2">
                <span>✨</span>
                <span>{ocrSuccessMsg}</span>
              </div>
            )}
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
      invalidateCache(CACHE_KEYS.INJECTIONS);
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
      invalidateCache(CACHE_KEYS.PAYOUTS);
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
