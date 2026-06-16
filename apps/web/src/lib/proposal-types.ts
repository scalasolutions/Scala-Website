// ============================================================================
// Structured rich-proposal content. Stored as JSON in quotations.sections_json
// and proposal_templates.sections_json, rendered by QuotationPreview.
// ============================================================================

export interface ProposalPackage {
  name: string;          // "Custom E-Commerce Website"
  tagline?: string;      // "Launching efficiently"
  buildFee?: number;     // one-time build fee (Rp)
  monthlyFee?: number;   // hosting & maintenance / month (Rp)
  includedHours?: number;// support hours / month
  bestFor?: string;      // "Long-term growth"
  features: string[];    // bullet list of inclusions
  recommended?: boolean;
}

export interface ProposalSections {
  // Cover / document info
  title?: string;            // "Custom E-Commerce Website"
  subtitle?: string;         // short descriptor under the title
  validityNote?: string;     // "Valid for 30 days from issue."

  // Overview
  businessNeed?: string;     // the project-scope narrative
  requirements?: string[];   // "Main requirements" checklist

  // Packages / options
  packages?: ProposalPackage[];

  // Hosting & maintenance (defaults pulled from the client's hosting fields)
  hostingNote?: string;

  // Timeline & client-provided materials & scope
  timeline?: string;         // "Approximately 6–8 weeks…"
  clientProvides?: string[]; // materials the client prepares
  scopeTerms?: string;       // revisions / deployment / third-party notes

  // Free-form closing recommendation
  recommendation?: string;
}

export const EMPTY_PROPOSAL_SECTIONS: ProposalSections = {
  title: '',
  subtitle: '',
  validityNote: 'Valid for 30 days from issue.',
  businessNeed: '',
  requirements: [],
  packages: [],
  hostingNote: '',
  timeline: '',
  clientProvides: [],
  scopeTerms: '',
  recommendation: '',
};

export function parseProposalSections(json?: string | null): ProposalSections {
  if (!json) return { ...EMPTY_PROPOSAL_SECTIONS };
  try {
    const parsed = JSON.parse(json);
    return { ...EMPTY_PROPOSAL_SECTIONS, ...parsed };
  } catch {
    return { ...EMPTY_PROPOSAL_SECTIONS };
  }
}
