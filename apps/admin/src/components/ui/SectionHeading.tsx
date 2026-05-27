import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Subsection heading for use inside cards or page sections.
 * Light weights, generous spacing — relies on size & color, not borders.
 */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  icon,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-5', className)}>
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {icon && (
          <span className="shrink-0 w-9 h-9 rounded-lg bg-muted/50 text-muted-foreground border border-border flex items-center justify-center mt-0.5">
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium mb-1.5">
              {eyebrow}
            </p>
          )}
          {/* Section title — big enough to anchor the card; size > weight. */}
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          {description && (
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
