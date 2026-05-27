import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Top-of-page header. Decision: a thin hairline border below the row
 * (pb-6 mb-8) gives a Linear/Stripe feel — separating chrome from
 * content without feeling boxed in. Override by passing className.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('pb-6 mb-8 border-b border-border', className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium mb-2">
              {eyebrow}
            </p>
          )}
          {/* Semibold, not bold — let size carry the weight.
              text-2xl is intentionally calmer than the old text-3xl extrabold
              page headings; relies on type hierarchy + muted subtext. */}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
