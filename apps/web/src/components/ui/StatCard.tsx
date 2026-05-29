import React from 'react';
import { cn } from '@/lib/utils';
import Card from './Card';

interface Delta {
  value: string;
  trend: 'up' | 'down' | 'neutral';
}

type Tone = 'default' | 'success' | 'warning' | 'danger';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  delta?: Delta;
  icon?: React.ReactNode;
  accent?: boolean;
  tone?: Tone;
  className?: string;
}

const trendClasses: Record<Delta['trend'], string> = {
  // Positive trend uses the brand lime — emerald is eradicated per user direction.
  // Light mode renders the foreground slate so the small delta text stays readable;
  // dark mode goes full lime where contrast is fine.
  up: 'text-foreground dark:text-primary',
  down: 'text-red-500',
  neutral: 'text-muted-foreground',
};

const toneClasses: Record<Tone, string> = {
  default: 'text-foreground',
  // Success values: dark mode shows the brand lime; light mode keeps foreground
  // text for readability. Pair with `accent={true}` on the card for the lime border cue.
  success: 'text-foreground dark:text-primary',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
};

export default function StatCard({
  label,
  value,
  delta,
  icon,
  accent = false,
  tone = 'default',
  className,
}: StatCardProps) {
  return (
    <Card
      padding="md"
      className={cn(
        accent && 'border-l-2 border-l-primary',
        className
      )}
    >
      {/* Icon sits inline with the label so it never competes with the value. */}
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon && (
          <span className="shrink-0 inline-flex text-muted-foreground">{icon}</span>
        )}
        <p className="text-xs font-medium uppercase tracking-[0.06em]">{label}</p>
      </div>
      {/* Value owns the full card width — tone colors it for semantic meaning. */}
      <p className={cn('mt-3 text-2xl font-semibold tracking-tight tabular-nums break-all min-w-0', toneClasses[tone])}>
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            'mt-2 text-sm',
            trendClasses[delta.trend]
          )}
        >
          {delta.value}
        </p>
      )}
    </Card>
  );
}
