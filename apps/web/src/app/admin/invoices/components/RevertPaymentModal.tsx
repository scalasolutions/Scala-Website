'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, Check } from 'lucide-react';
import { MockInvoice, updateInvoice, syncInvoicePayoutAction } from '@/lib/db/queries';
import { formatCurrencyIDR } from './invoice-types';
import { formatInputNumberIDR } from '@/lib/utils';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';

interface RevertPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: MockInvoice;
  onRevertCompleted: (updated: MockInvoice) => void;
}

export function RevertPaymentModal({
  isOpen,
  onClose,
  invoice,
  onRevertCompleted,
}: RevertPaymentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [revertStatusSelection, setRevertStatusSelection] = useState<
    'draft' | 'issued' | 'partially_paid' | 'past_due' | 'written_off'
  >('issued');
  const [revertAmountPaid, setRevertAmountPaid] = useState<number>(0);
  const [keepReceipt, setKeepReceipt] = useState<boolean>(true);
  const [isRevertingStatus, setIsRevertingStatus] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setRevertStatusSelection('issued');
      setRevertAmountPaid(invoice.amountPaid || 0);
      setKeepReceipt(!!invoice.proofOfPaymentUrl);
      setIsRevertingStatus(false);
    }
  }, [isOpen, invoice]);

  const handleRevertStatus = async () => {
    setIsRevertingStatus(true);
    try {
      const finalAmountPaid = revertStatusSelection === 'partially_paid' ? revertAmountPaid : 0;
      const receiptUrl = keepReceipt ? (invoice.proofOfPaymentUrl || null) : null;
      
      const updated = await updateInvoice(invoice.id, {
        status: revertStatusSelection,
        amountPaid: finalAmountPaid,
        proofOfPaymentUrl: receiptUrl,
        paidAt: null, // clear paid date
      });

      if (updated) {
        await syncInvoicePayoutAction(invoice.invoiceNumber, invoice.receivedBy, finalAmountPaid, new Date());
        
        onRevertCompleted({
          ...invoice,
          status: revertStatusSelection,
          amountPaid: finalAmountPaid,
          proofOfPaymentUrl: receiptUrl,
          paidAt: null,
          updatedAt: new Date(),
        });
        onClose();
      }
    } catch (err) {
      console.error('Failed to revert invoice status', err);
    } finally {
      setIsRevertingStatus(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-md"
        onClick={() => {
          if (!isRevertingStatus) {
            onClose();
          }
        }}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
        <div className="p-6">
          <div className="flex items-start gap-3 pb-4 mb-4 border-b border-border">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <RotateCcw size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Revert Paid Status
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                Switch invoice {invoice.invoiceNumber} back to unpaid.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Audit Warning */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 flex gap-2">
              <span className="text-amber-500 shrink-0 text-xs">⚠️</span>
              <div className="text-[11px] leading-relaxed text-amber-500">
                <p className="font-bold text-[10px] tracking-wider uppercase">FINANCIAL AUDIT CAUTION</p>
                <p className="mt-0.5 text-amber-500/90 font-medium">
                  Reverting a paid invoice will adjust monthly income charts, ledger totals, and mark the invoice as unpaid in client statements.
                </p>
              </div>
            </div>

            {/* Status Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Select New Status *
              </label>
              <Select
                value={revertStatusSelection}
                onChange={(e) => {
                  const newStatus = e.target.value as any;
                  setRevertStatusSelection(newStatus);
                  if (newStatus === 'partially_paid' && revertAmountPaid === 0) {
                    setRevertAmountPaid(Math.round(invoice.total * 0.5));
                  }
                }}
              >
                <option value="issued">Issued (Unpaid)</option>
                <option value="draft">Draft</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="past_due">Past Due</option>
                <option value="written_off">Written Off</option>
              </Select>
            </div>

            {/* Partially Paid Details */}
            {revertStatusSelection === 'partially_paid' && (
              <div className="space-y-1.5 animate-fade-up">
                <label className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  Amount Paid (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    type="text"
                    className="pl-9"
                    value={formatInputNumberIDR(revertAmountPaid)}
                    onChange={(e) => {
                      const val = Number(e.target.value.replace(/[^0-9]/g, ''));
                      setRevertAmountPaid(val);
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground leading-normal block">
                  Milestone split total: {formatCurrencyIDR(invoice.total - revertAmountPaid)} outstanding
                </span>
              </div>
            )}

            {/* Keep Receipts (if invoice has one) */}
            {invoice.proofOfPaymentUrl && (
              <div className="flex items-center gap-2 py-1 select-none animate-fade-in-scale">
                <input
                  type="checkbox"
                  id="keepReceipt"
                  checked={keepReceipt}
                  onChange={(e) => setKeepReceipt(e.target.checked)}
                  className="rounded border-border bg-muted/40 text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                />
                <label
                  htmlFor="keepReceipt"
                  className="text-xs font-semibold text-foreground/80 cursor-pointer"
                >
                  Keep uploaded proof of payment receipts
                </label>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-border">
            <button
              type="button"
              disabled={isRevertingStatus}
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isRevertingStatus}
              onClick={handleRevertStatus}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active-press transition-all cursor-pointer flex items-center gap-1.5"
              style={{ boxShadow: '0 0 10px rgba(206, 248, 78, 0.15)' }}
            >
              {isRevertingStatus ? (
                <div className="w-3.5 h-3.5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Check size={13} />
              )}
              Confirm Revert
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
