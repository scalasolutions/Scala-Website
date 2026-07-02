'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { MockInvoice, deleteInvoice, syncInvoicePayoutAction } from '@/lib/db/queries';
import { isDbWriteError } from '@/lib/db/errors';
import Button from '@/components/ui/Button';

interface DeleteInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: MockInvoice;
  onDeleteCompleted: (deletedId: string) => void;
}

export function DeleteInvoiceModal({
  isOpen,
  onClose,
  invoice,
  onDeleteCompleted,
}: DeleteInvoiceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDeleteConfirmText('');
      setIsDeleting(false);
    }
  }, [isOpen, invoice]);

  const handleDelete = async () => {
    if (invoice.status === 'paid' && deleteConfirmText !== 'CONFIRM') {
      return;
    }

    setIsDeleting(true);
    try {
      const deleted = await deleteInvoice(invoice.id);
      if (isDbWriteError(deleted)) {
        console.error('Failed to delete invoice:', deleted.error);
        return;
      }
      if (deleted) {
        // Sync invoice payout action to company, 0
        await syncInvoicePayoutAction(invoice.invoiceNumber, 'company', 0);
        onDeleteCompleted(invoice.id);
        onClose();
      }
    } catch (err) {
      console.error('Failed to delete invoice', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-md"
        onClick={() => {
          if (!isDeleting) {
            onClose();
          }
        }}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
        <div className="p-6">
          <div className="flex items-start gap-3 pb-4 mb-4 border-b border-border">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Delete invoice
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete{' '}
              <span className="font-mono text-foreground">
                {invoice.invoiceNumber}
              </span>
              ? All line items and billing history will be permanently removed.
            </p>

            {invoice.status === 'paid' && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3 animate-fade-in-scale">
                <p className="text-xs text-red-500 leading-relaxed">
                  This invoice is marked as{' '}
                  <span className="font-medium">paid</span>. Deleting a paid
                  invoice impacts income auditing and client statement history.
                </p>
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-[0.06em] text-red-500 mb-1.5 block">
                    Type 'CONFIRM' to authorize deletion
                  </label>
                  <input
                    type="text"
                    placeholder="CONFIRM"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full h-9 rounded-lg bg-background border border-red-500/20 px-3 text-sm font-mono uppercase focus:border-red-500/40 focus:outline-none transition-colors text-red-500 placeholder:text-red-500/30"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={isDeleting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              leftIcon={<Trash2 size={14} />}
              onClick={handleDelete}
              disabled={
                isDeleting ||
                (invoice.status === 'paid' && deleteConfirmText !== 'CONFIRM')
              }
            >
              {isDeleting ? 'Deleting…' : 'Delete invoice'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
