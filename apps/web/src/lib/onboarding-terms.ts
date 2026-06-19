// ============================================================================
// Canonical onboarding terms — SINGLE SOURCE OF TRUTH
// ----------------------------------------------------------------------------
// Payment models and shared clauses defined ONCE here, then rendered at three
// depths: Quotation (summary), Invoice (amount + due date), SLA (enforcement).
// This prevents the documents from drifting apart.
// ============================================================================

export type PaymentModelKey = 'A' | 'B' | 'C';

export interface PaymentStage {
  stage: string;
  percent: number; // 0 = "remaining balance" / split, handled by note
  trigger: string;
}

export interface PaymentModel {
  key: PaymentModelKey;
  name: string;
  bestFor: string;
  stages: PaymentStage[];
  note?: string;
}

export const PAYMENT_MODELS: Record<PaymentModelKey, PaymentModel> = {
  A: {
    key: 'A',
    name: 'Standard Milestone (50 / 30 / 20)',
    bestFor: 'Normal projects (≈ Rp20M and above)',
    stages: [
      { stage: 'Down Payment', percent: 50, trigger: 'Before the project starts' },
      { stage: 'Progress Payment', percent: 30, trigger: 'After design approval & core development progress' },
      { stage: 'Final Payment', percent: 20, trigger: 'Before launch, handover, or source-code release' },
    ],
    note: 'Monthly hosting & maintenance begin after launch unless stated otherwise.',
  },
  B: {
    key: 'B',
    name: 'Simple Split (50 / 50)',
    bestFor: 'Smaller or discounted projects',
    stages: [
      { stage: 'Down Payment', percent: 50, trigger: 'Before the project starts' },
      { stage: 'Final Payment', percent: 50, trigger: 'Before launch / handover' },
    ],
    note: 'Monthly hosting & maintenance begin after launch unless stated otherwise.',
  },
  C: {
    key: 'C',
    name: 'Monthly Split',
    bestFor: 'Budget-sensitive clients',
    stages: [
      { stage: 'Down Payment', percent: 40, trigger: 'Before the project starts' },
      { stage: 'Balance', percent: 60, trigger: 'Split across 2–3 monthly instalments' },
    ],
    note: 'Launch, handover, and source-code access only after full payment. Late payment pauses development and support. Hosting billed separately.',
  },
};

export const DEFAULT_PAYMENT_MODEL: PaymentModelKey = 'A';

export function getPaymentModel(key?: string | null, customStagesJson?: string | null): PaymentModel {
  if (key === 'CUSTOM' && customStagesJson) {
    try {
      const parsed = JSON.parse(customStagesJson) as { stages: PaymentStage[]; note?: string };
      if (parsed.stages && parsed.stages.length > 0) {
        return {
          key: 'A' as PaymentModelKey,
          name: 'Custom Payment Terms',
          bestFor: 'Client-specific agreement',
          stages: parsed.stages,
          note: parsed.note,
        };
      }
    } catch {
      // Fall through to default
    }
  }
  if (key && (key === 'A' || key === 'B' || key === 'C')) return PAYMENT_MODELS[key];
  return PAYMENT_MODELS[DEFAULT_PAYMENT_MODEL];
}

/** One-line commercial summary for the Quotation (e.g. "50% to start · 30% after design · 20% before launch"). */
export function paymentSummaryLine(key?: string | null, customStagesJson?: string | null): string {
  const model = getPaymentModel(key, customStagesJson);
  return model.stages.map((s) => `${s.percent}% ${s.stage.toLowerCase()}`).join(' · ');
}

/** Standard third-party exclusions, shared across Quotation and Invoice. */
export const THIRD_PARTY_EXCLUSIONS =
  'Third-party fees are not included: domain registration/renewal, payment-gateway transaction & registration fees, logistics/shipping API, email service, SMS/WhatsApp API, premium plugins, paid analytics, and other external subscriptions.';

/** Document precedence — also rendered in the SLA "Order of Precedence" clause. */
export const ORDER_OF_PRECEDENCE =
  'In the event of any inconsistency between the Quotation, Invoice, and this Agreement, the following order of priority applies: (1) the signed SLA / Service Agreement; (2) the latest issued Invoice; (3) the latest accepted Quotation; (4) prior discussions, chats, calls, or informal messages.';
