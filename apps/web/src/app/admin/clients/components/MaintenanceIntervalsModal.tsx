'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';

interface MaintenanceIntervalsModalProps {
  envRotationInterval: number;
  onEnvRotationChange: (value: number) => void;
  stabilityCheckInterval: number;
  onStabilityCheckChange: (value: number) => void;
  expectationsCheckInterval: number;
  onExpectationsCheckChange: (value: number) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Modal for configuring a client's recurring maintenance intervals (in months).
 *
 * Render only once the host page is mounted (createPortal targets document.body).
 */
export function MaintenanceIntervalsModal({
  envRotationInterval,
  onEnvRotationChange,
  stabilityCheckInterval,
  onStabilityCheckChange,
  expectationsCheckInterval,
  onExpectationsCheckChange,
  onCancel,
  onSubmit,
}: MaintenanceIntervalsModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-md"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
        <div className="p-6">
          <SectionHeading
            title="Configure Maintenance Intervals"
            description="Set recurrence durations (in months) for standard operational checks."
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

          <form onSubmit={onSubmit} className="space-y-4 mt-3">
            <Input
              label="Environment Variables Rotation (Months)"
              type="number"
              min="1"
              required
              value={envRotationInterval}
              onChange={(e) => onEnvRotationChange(Number(e.target.value))}
            />

            <Input
              label="Stability & Security Check (Months)"
              type="number"
              min="1"
              required
              value={stabilityCheckInterval}
              onChange={(e) => onStabilityCheckChange(Number(e.target.value))}
            />

            <Input
              label="Expectations & Review (Months)"
              type="number"
              min="1"
              required
              value={expectationsCheckInterval}
              onChange={(e) => onExpectationsCheckChange(Number(e.target.value))}
            />

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button type="button" variant="ghost" size="md" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md">
                Save Intervals
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
