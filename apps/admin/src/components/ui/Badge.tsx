import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-muted/40 text-muted-foreground border-border',
  success: 'bg-primary text-primary-foreground border-primary',
  warning:
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  danger:
    'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  brand: 'bg-primary text-primary-foreground border-primary',
};

const dotClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-muted-foreground',
  success: 'bg-primary',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  brand: 'bg-primary',
};

export default function Badge({
  variant = 'neutral',
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        // Not bold, not uppercase by default — calmer than current badges.
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotClasses[variant])}
        />
      )}
      {children}
    </span>
  );
}
