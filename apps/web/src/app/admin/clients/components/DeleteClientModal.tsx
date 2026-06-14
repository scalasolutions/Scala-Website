'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface DeleteClientModalProps {
  clientName: string;
  confirmName: string;
  onConfirmNameChange: (value: string) => void;
  confirmText: string;
  onConfirmTextChange: (value: string) => void;
  isDeleting: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Confirmation modal for permanently deleting a client. Requires the operator
 * to retype the client name and the word CONFIRM before the action is enabled.
 *
 * Render only once the host page is mounted (createPortal targets document.body).
 */
export function DeleteClientModal({
  clientName,
  confirmName,
  onConfirmNameChange,
  confirmText,
  onConfirmTextChange,
  isDeleting,
  onCancel,
  onSubmit,
}: DeleteClientModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-md"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
        <div className="p-6">
          <div className="flex items-start gap-3 pb-4 mb-4 border-b border-border">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Delete client account
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">{clientName}</span>?
            Portal credentials, active SLAs, all invoices, billing history, and
            support tickets will be permanently removed.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label={`Type the client's name (${clientName}) to confirm`}
              required
              placeholder={clientName}
              value={confirmName}
              onChange={(e) => onConfirmNameChange(e.target.value)}
            />

            <Input
              label="Type CONFIRM to authorize deletion"
              required
              placeholder="CONFIRM"
              value={confirmText}
              onChange={(e) => onConfirmTextChange(e.target.value)}
              className="font-mono uppercase tracking-wider text-center"
            />

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button type="button" variant="ghost" size="md" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="md"
                disabled={
                  confirmText !== 'CONFIRM' ||
                  confirmName !== clientName ||
                  isDeleting
                }
              >
                {isDeleting ? 'Deleting…' : 'Delete permanently'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
