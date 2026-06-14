'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';

interface AgreementTermsModalProps {
  tcStatus: 'pending' | 'signed';
  onTcStatusChange: (status: 'pending' | 'signed') => void;
  tcCustomTerms: string;
  onTcCustomTermsChange: (value: string) => void;
  slaCustomTerms: string;
  onSlaCustomTermsChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Modal for customizing a client's SLA & T&C terms and signature status.
 *
 * Render only once the host page is mounted (createPortal targets document.body).
 */
export function AgreementTermsModal({
  tcStatus,
  onTcStatusChange,
  tcCustomTerms,
  onTcCustomTermsChange,
  slaCustomTerms,
  onSlaCustomTermsChange,
  onCancel,
  onSubmit,
}: AgreementTermsModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-md"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
        <div className="p-6 sm:p-8">
          <SectionHeading
            title="Customize SLA & T&C"
            description="Modify specific contractual agreements and signature sign-off."
            action={
              <button
                onClick={onCancel}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            }
          />

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Signature status
              </label>
              <div className="flex gap-2">
                {(['pending', 'signed'] as const).map((stat) => (
                  <button
                    key={stat}
                    type="button"
                    onClick={() => onTcStatusChange(stat)}
                    className={`flex-1 px-3 py-2.5 rounded-lg border text-xs font-semibold capitalize transition-all cursor-pointer ${
                      tcStatus === stat
                        ? 'border-primary bg-primary text-primary-foreground font-extrabold'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {stat === 'signed' ? '✓ Signed & Executed' : 'Awaiting Signature'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Custom Clauses & Riders
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Special Terms & Conditions</label>
                    <textarea
                      placeholder="Add specific terms, data requirements, or liability modifications..."
                      value={tcCustomTerms}
                      onChange={(e) => onTcCustomTermsChange(e.target.value)}
                      rows={3}
                      className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Custom SLA Adjustments</label>
                    <textarea
                      placeholder="Add specific support response times, uptime targets, or escalation chains..."
                      value={slaCustomTerms}
                      onChange={(e) => onSlaCustomTermsChange(e.target.value)}
                      rows={3}
                      className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button type="button" variant="ghost" size="md" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md">
                Save Agreements
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
