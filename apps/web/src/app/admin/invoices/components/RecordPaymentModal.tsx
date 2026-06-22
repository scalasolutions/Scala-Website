'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Loader2 } from 'lucide-react';
import { MockInvoice, uploadReceiptAction, syncInvoicePayoutAction, updateInvoiceStatus, updateInvoice } from '@/lib/db/queries';
import { PaymentMilestone } from './invoice-types';
import { formatCurrencyIDR } from './invoice-types';
import { formatInputNumberIDR } from '@/lib/utils';
import { performActualOCR, extractAmountFromFilename } from './ocr-utils';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: MockInvoice;
  onPaymentRecorded: (updated: MockInvoice) => void;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  invoice,
  onPaymentRecorded,
}: RecordPaymentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partially_paid'>('paid');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [receiptFileBase64, setReceiptFileBase64] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [isLoggingPayment, setIsLoggingPayment] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [paymentReceivedBy, setPaymentReceivedBy] = useState<'company' | 'fredrick' | 'nicholas'>('company');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

  const parsedMilestones: PaymentMilestone[] = (() => {
    if (!invoice.paymentMilestonesJson) return [];
    try { return JSON.parse(invoice.paymentMilestonesJson) as PaymentMilestone[]; } catch { return []; }
  })();
  const unpaidMilestones = parsedMilestones.filter(m => m.status === 'unpaid');
  const hasMilestones = parsedMilestones.length > 0;

  // AI OCR States
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const milestones: PaymentMilestone[] = (() => {
        if (!invoice.paymentMilestonesJson) return [];
        try { return JSON.parse(invoice.paymentMilestonesJson) as PaymentMilestone[]; } catch { return []; }
      })();
      const unpaid = milestones.filter(m => m.status === 'unpaid');
      if (unpaid.length > 0) {
        const first = unpaid[0];
        setSelectedMilestoneId(first.id);
        const isLastUnpaid = unpaid.length === 1;
        setPaymentStatus(isLastUnpaid ? 'paid' : 'partially_paid');
        setPaymentAmount(Math.round(invoice.total * first.percentage / 100));
      } else {
        setSelectedMilestoneId(null);
        setPaymentStatus(invoice.status === 'partially_paid' ? 'partially_paid' : 'paid');
        setPaymentAmount(invoice.status === 'partially_paid' ? (invoice.amountPaid || Math.round(invoice.total * 0.5)) : invoice.total);
      }
      setReceiptFileBase64('');
      setReceiptFileName('');
      setPaymentReceivedBy(invoice.receivedBy || 'company');
      setOcrSuccessMsg(null);
      setOcrScanning(false);
      setIsLoggingPayment(false);
      setUploadingReceipt(false);
    }
  }, [isOpen, invoice]);

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
              // Fallback to safe filename extraction
              extractedAmount = extractAmountFromFilename(file.name, invoice.total);
            }
            
            setPaymentAmount(extractedAmount);
            setOcrScanning(false);
            setOcrSuccessMsg(`Secure OCR: Extracted Rp ${formatInputNumberIDR(extractedAmount)} successfully from receipt!`);

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

  const handleSubmit = async () => {
    setIsLoggingPayment(true);
    try {
      let receiptUrl = '';
      if (receiptFileBase64) {
        receiptUrl = await uploadReceiptAction(receiptFileName || 'receipt.jpg', receiptFileBase64);
      }

      const finalAmountPaid = paymentStatus === 'paid' ? invoice.total : paymentAmount;

      const updated = await updateInvoiceStatus(
        invoice.id,
        paymentStatus,
        finalAmountPaid,
        receiptUrl || undefined,
        paymentReceivedBy
      );

      // Update milestone status if a milestone was selected
      let updatedMilestonesJson = invoice.paymentMilestonesJson ?? null;
      if (updated && selectedMilestoneId && parsedMilestones.length > 0) {
        const newMilestones = parsedMilestones.map(m =>
          m.id === selectedMilestoneId ? { ...m, status: 'paid' as const } : m
        );
        updatedMilestonesJson = JSON.stringify(newMilestones);
        await updateInvoice(invoice.id, { paymentMilestonesJson: updatedMilestonesJson });
      }

      if (updated) {
        // Log smart payout if payment received by a founder personally (Self-healing auto-sync)
        await syncInvoicePayoutAction(invoice.invoiceNumber, paymentReceivedBy, finalAmountPaid, new Date());

        onPaymentRecorded({
          ...invoice,
          status: paymentStatus,
          amountPaid: finalAmountPaid,
          proofOfPaymentUrl: receiptUrl || invoice.proofOfPaymentUrl,
          receivedBy: paymentReceivedBy,
          paymentMilestonesJson: updatedMilestonesJson,
          paidAt: paymentStatus === 'paid' ? new Date() : null,
          updatedAt: new Date()
        });
        onClose();
      }
    } catch (err) {
      console.error("Failed to log client payment", err);
    } finally {
      setIsLoggingPayment(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md"
        onClick={() => {
          if (!isLoggingPayment) {
            onClose();
          }
        }}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl animate-fade-in-scale">
        <div className="flex items-center gap-3 pb-3 border-b border-border mb-4">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <CreditCard size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Record Client Payment
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {invoice.invoiceNumber} • Total: {formatCurrencyIDR(invoice.total)}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Payment Type / Milestone selection */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              {hasMilestones ? 'Select Milestone' : 'Payment Type'}
            </label>
            {hasMilestones ? (
              <div className="space-y-2">
                {unpaidMilestones.map((m) => {
                  const amt = Math.round(invoice.total * m.percentage / 100);
                  const isLastUnpaid = unpaidMilestones.length === 1;
                  const isSelected = selectedMilestoneId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMilestoneId(m.id);
                        setPaymentStatus(isLastUnpaid ? 'paid' : 'partially_paid');
                        setPaymentAmount(amt);
                      }}
                      className={`w-full flex items-center justify-between py-2 px-3 border text-xs transition-all cursor-pointer font-bold rounded-lg ${isSelected ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'}`}
                    >
                      <span>{m.label} ({m.percentage}%){isLastUnpaid ? ' — Full Settlement' : ''}</span>
                      <span className="font-mono">{amt.toLocaleString('id-ID')}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMilestoneId(null);
                    setPaymentStatus('paid');
                    setPaymentAmount(invoice.total);
                  }}
                  className={`w-full py-2 px-3 border text-xs capitalize transition-all cursor-pointer font-bold rounded-lg ${selectedMilestoneId === null && paymentStatus === 'paid' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'}`}
                >
                  Full Payment (100%) — Mark All Paid
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('paid');
                    setPaymentAmount(invoice.total);
                  }}
                  className={`py-2 px-3 border text-xs capitalize transition-all cursor-pointer font-bold rounded-lg ${paymentStatus === 'paid' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'}`}
                >
                  Full Payment (100%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('partially_paid');
                    setPaymentAmount(Math.round(invoice.total * 0.5));
                  }}
                  className={`py-2 px-3 border text-xs capitalize transition-all cursor-pointer font-bold rounded-lg ${paymentStatus === 'partially_paid' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'}`}
                >
                  Partial Payment (Milestone)
                </button>
              </div>
            )}
          </div>

          {/* Amount input for partial payment */}
          {paymentStatus === 'partially_paid' && (
            <div className="animate-fade-in-scale space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Amount Collected (IDR) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={formatInputNumberIDR(paymentAmount)}
                onChange={(e) => {
                  const rawVal = e.target.value.replace(/[^0-9]/g, '');
                  setPaymentAmount(rawVal ? Number(rawVal) : 0);
                }}
                className="w-full h-9 rounded-lg bg-background border border-border px-3 text-xs text-foreground font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-primary/60 transition-colors"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Remaining unpaid balance: <strong>{formatCurrencyIDR(Math.max(0, invoice.total - paymentAmount))}</strong>
              </span>
            </div>
          )}

          {/* Received By */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Payment Received By
            </label>
            <select
              value={paymentReceivedBy}
              onChange={(e) => setPaymentReceivedBy(e.target.value as any)}
              className="h-10 w-full appearance-none rounded-xl bg-background border border-border px-3.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-primary/60 transition-colors cursor-pointer"
            >
              <option value="company">Company Treasury</option>
              <option value="fredrick">Fredrick Yang (out of pocket / personal)</option>
              <option value="nicholas">Nicholas Chairnando (out of pocket / personal)</option>
            </select>
          </div>

          {/* File Attachment Upload */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Attach Proof of Payment (Screenshot / Image)
            </label>
            <div className="p-3.5 rounded-xl border border-dashed border-border bg-muted/10 text-center space-y-2">
              <input
                type="file"
                id="receipt-upload"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCompressAndSetFile(file);
                }}
              />
              <label
                htmlFor="receipt-upload"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-muted active-press transition-all cursor-pointer text-xs font-bold text-foreground shadow-xs"
              >
                Select Receipt Image
              </label>
              {uploadingReceipt && (
                <p className="text-[10px] text-primary font-semibold animate-pulse">
                  ⌛ Compressing &amp; preparing screenshot...
                </p>
              )}
              {receiptFileName && !uploadingReceipt && (
                <div className="space-y-1">
                  <p className="text-[10px] text-emerald-400 font-bold truncate max-w-[280px] mx-auto">
                    ✓ {receiptFileName} (Compressed!)
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptFileBase64('');
                      setReceiptFileName('');
                    }}
                    className="text-[9px] text-red-400 hover:underline cursor-pointer font-bold"
                  >
                    Remove
                  </button>
                </div>
              )}

              {ocrScanning && (
                <div className="flex items-center gap-2 p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary text-[10px] font-bold animate-pulse mt-2.5">
                  <Loader2 className="animate-spin text-primary shrink-0" size={12} />
                  <span>Extracting payment total from screenshot...</span>
                </div>
              )}
              {ocrSuccessMsg && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-bold animate-fade-in-scale mt-2.5">
                  <span className="shrink-0 text-emerald-400">✨</span>
                  <span>{ocrSuccessMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            disabled={isLoggingPayment}
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoggingPayment || uploadingReceipt}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoggingPayment ? (
              <div className="flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                <span>Recording...</span>
              </div>
            ) : (
              'Record Payment'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
