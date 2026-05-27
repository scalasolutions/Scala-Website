'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Sparkles, AlertCircle, TrendingUp, Users, HeartHandshake, BookOpen } from 'lucide-react';

interface PartnershipSplitGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PartnershipSplitGuide: React.FC<PartnershipSplitGuideProps> = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-6 md:p-12">
      {/* Backdrop blur */}
      <div 
        className="fixed inset-0 bg-background/85 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose} 
      />

      {/* Modal Dialog container */}
      <div className="relative w-full max-w-3xl rounded-2xl bg-card border border-border p-6 md:p-8 shadow-2xl animate-fade-in-scale z-10">
        
        {/* Header row */}
        <div className="flex items-start justify-between pb-4 border-b border-border/60 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                Partnership Policy &amp; Guidelines
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold uppercase tracking-wide">
                  Active SLA
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                Official revenue sharing policy for Scala Solutions co-founders.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors active-press"
          >
            <X size={18} />
          </button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Sourced Clients Column */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Users size={16} />
                </div>
                <h4 className="font-bold text-sm text-foreground">Co-Founder Sourcing (Organic)</h4>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed mt-3">
                Since Fredrick and Nicholas operate as a unified company, all partner-sourced leads are treated as organic with no separate sourcing incentive:
              </p>
              <ul className="mt-4 space-y-2 text-[11px] text-muted-foreground font-semibold list-disc list-inside">
                <li>
                  <span className="text-foreground font-extrabold">Unified Referrals:</span> Fredrick's referral is Nicholas' referral. Sourcing by either partner is considered organic.
                </li>
                <li>
                  <span className="text-foreground font-extrabold">No Finder's Fee:</span> Sourcing commissions do not apply to co-founders, keeping incentives fully aligned.
                </li>
                <li>
                  <span className="text-foreground font-extrabold">50/50 Profit Split:</span> 100% of the client budget flows into the company pool, and net profits are split exactly equally.
                </li>
              </ul>
            </div>

            {/* Live Example calculator */}
            <div className="mt-5 p-3.5 rounded-lg bg-card border border-border/80">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mb-2.5">
                Example: Rp 10.000.000 Client Invoice
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                <div className="text-muted-foreground font-semibold">Gross Client Budget</div>
                <div className="text-right font-black text-foreground">Rp 10.000.000</div>
                
                <div className="text-muted-foreground font-semibold flex items-center gap-1">
                  Sourcing Fee (0%) <Star size={9} className="text-muted-foreground fill-muted" />
                </div>
                <div className="text-right font-black text-muted-foreground">Rp 0</div>

                <div className="text-muted-foreground font-semibold">Remaining to Company</div>
                <div className="text-right font-bold text-muted-foreground">Rp 10.000.000</div>

                <div className="text-muted-foreground font-semibold">Operating Expenses</div>
                <div className="text-right font-bold text-red-400">- Rp 1.000.000</div>

                <div className="text-muted-foreground font-bold border-t border-border/40 pt-2 mt-1">
                  Net Profit Split (50/50)
                </div>
                <div className="text-right font-black text-emerald-400 border-t border-border/40 pt-2 mt-1">
                  Rp 4.500.000 each
                </div>
              </div>
            </div>
          </div>

          {/* External Affiliates Column */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp size={16} />
                </div>
                <h4 className="font-bold text-sm text-foreground">External Affiliate Sourcing</h4>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed mt-3">
                When external contacts refer a client to Scala Solutions, they are paid a fixed **10%** commission on gross budgets, shared equally by both partners:
              </p>
              <ul className="mt-4 space-y-2 text-[11px] text-muted-foreground font-semibold list-disc list-inside">
                <li>
                  <span className="text-foreground font-extrabold">Corporate COGS:</span> The affiliate commission is deducted as a direct company operating expense (COGS).
                </li>
                <li>
                  <span className="text-foreground font-extrabold">Shared Acquisition Cost:</span> Because net profit is calculated *after* this deduction, both partners automatically share the fee 50/50.
                </li>
                <li>
                  <span className="text-foreground font-extrabold">Out-of-Pocket Protection:</span> No partner pays the affiliate directly; it is settled from the invoice receipts.
                </li>
              </ul>
            </div>

            {/* Live Example calculator */}
            <div className="mt-5 p-3.5 rounded-lg bg-card border border-border/80">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mb-2.5">
                Example: Rp 10.000.000 Client Invoice
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                <div className="text-muted-foreground font-semibold">Gross Client Budget</div>
                <div className="text-right font-black text-foreground">Rp 10.000.000</div>
                
                <div className="text-muted-foreground font-semibold flex items-center gap-1">
                  Affiliate Fee (10%) <Sparkles size={9} className="text-emerald-400 fill-emerald-400" />
                </div>
                <div className="text-right font-black text-red-400">- Rp 1.000.000</div>

                <div className="text-muted-foreground font-semibold">Net Company Revenue</div>
                <div className="text-right font-bold text-muted-foreground">Rp 9.000.000</div>

                <div className="text-muted-foreground font-semibold">Operating Expenses</div>
                <div className="text-right font-bold text-red-400">- Rp 1.000.000</div>

                <div className="text-muted-foreground font-bold border-t border-border/40 pt-2 mt-1">
                  Net Profit Split (50/50)
                </div>
                <div className="text-right font-black text-emerald-400 border-t border-border/40 pt-2 mt-1">
                  Rp 4.000.000 each
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer info box */}
        <div className="mt-6 p-3.5 rounded-xl border border-primary/10 bg-primary/5 flex items-start gap-3">
          <AlertCircle size={15} className="text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-normal font-semibold">
            <strong className="text-foreground">Symmetry Principle:</strong> This setup ensures that regardless of who is in the "sales seat" or the "delivery seat" for any given month, both founders are properly compensated for their unique, individual contributions while maintaining an exactly equal 50/50 equity structure.
          </p>
        </div>

        {/* Bottom Actions footer */}
        <div className="mt-6 pt-4 border-t border-border/60 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 active-press transition-opacity shadow-sm cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
