'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import { PAYMENT_MODELS, PaymentModelKey } from '@/lib/onboarding-terms';

interface AgreementTermsModalProps {
  tcStatus: 'pending' | 'signed';
  onTcStatusChange: (status: 'pending' | 'signed') => void;
  tcCustomTerms: string;
  onTcCustomTermsChange: (value: string) => void;
  slaCustomTerms: string;
  onSlaCustomTermsChange: (value: string) => void;
  // Hosting & overage disclosure (rendered in the SLA)
  hostingPlanLabel: string;
  onHostingPlanLabelChange: (value: string) => void;
  hostingMonthlyFee: string;
  onHostingMonthlyFeeChange: (value: string) => void;
  hostingIncludedHours: string;
  onHostingIncludedHoursChange: (value: string) => void;
  hostingSupportOverageRate: string;
  onHostingSupportOverageRateChange: (value: string) => void;
  hostingFreeLaunch: boolean;
  onHostingFreeLaunchChange: (value: boolean) => void;
  hostingOverageNotes: string;
  onHostingOverageNotesChange: (value: string) => void;
  paymentModel: string;
  onPaymentModelChange: (value: string) => void;
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
  hostingPlanLabel,
  onHostingPlanLabelChange,
  hostingMonthlyFee,
  onHostingMonthlyFeeChange,
  hostingIncludedHours,
  onHostingIncludedHoursChange,
  hostingSupportOverageRate,
  onHostingSupportOverageRateChange,
  hostingFreeLaunch,
  onHostingFreeLaunchChange,
  hostingOverageNotes,
  onHostingOverageNotesChange,
  paymentModel,
  onPaymentModelChange,
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

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Payment model
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(PAYMENT_MODELS) as PaymentModelKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onPaymentModelChange(k)}
                    title={PAYMENT_MODELS[k].bestFor}
                    className={`px-2 py-2 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer text-center ${
                      paymentModel === k
                        ? 'border-primary bg-primary text-primary-foreground font-extrabold'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {PAYMENT_MODELS[k].name.split('(')[0].trim()}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                {(PAYMENT_MODELS[(paymentModel as PaymentModelKey)] || PAYMENT_MODELS.A).stages
                  .map((s) => `${s.percent}% ${s.stage}`)
                  .join(' · ')} — {(PAYMENT_MODELS[(paymentModel as PaymentModelKey)] || PAYMENT_MODELS.A).bestFor}
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Hosting & Overage Disclosure
                </p>
                <p className="text-[11px] text-muted-foreground -mt-2 leading-relaxed">
                  Printed in the SLA so the hosting plan and overage terms match the quotation and invoice.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Hosting plan label</label>
                    <input
                      type="text"
                      placeholder="e.g. Standard E-Commerce Hosting & Maintenance"
                      value={hostingPlanLabel}
                      onChange={(e) => onHostingPlanLabelChange(e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Monthly fee (Rp)</label>
                      <input
                        type="number"
                        placeholder="450000"
                        value={hostingMonthlyFee}
                        onChange={(e) => onHostingMonthlyFeeChange(e.target.value)}
                        className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Included hrs/mo</label>
                      <input
                        type="number"
                        placeholder="4"
                        value={hostingIncludedHours}
                        onChange={(e) => onHostingIncludedHoursChange(e.target.value)}
                        className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Overage Rp/hr</label>
                      <input
                        type="number"
                        placeholder="150000"
                        value={hostingSupportOverageRate}
                        onChange={(e) => onHostingSupportOverageRateChange(e.target.value)}
                        className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onHostingFreeLaunchChange(!hostingFreeLaunch)}
                    className={`w-full px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-left flex items-center justify-between ${
                      hostingFreeLaunch
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>Free hosting during early-launch period</span>
                    <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${hostingFreeLaunch ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {hostingFreeLaunch ? 'On' : 'Off'}
                    </span>
                  </button>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Infrastructure overage notes</label>
                    <textarea
                      placeholder="Infra overage pricing / triggers (RAM, CPU, storage, bandwidth, abuse handling)..."
                      value={hostingOverageNotes}
                      onChange={(e) => onHostingOverageNotesChange(e.target.value)}
                      rows={3}
                      className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>
                </div>
              </div>

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
