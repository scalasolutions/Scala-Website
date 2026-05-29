import React from 'react';
import { cn } from '@/lib/utils';

type CardPadding = 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  interactive?: boolean;
}

const paddingClasses: Record<CardPadding, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  padding = 'md',
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        // Flat surface, hairline border, soft radius. No shadow by default.
        'rounded-2xl border border-border bg-card',
        paddingClasses[padding],
        interactive && 'hover:border-foreground/15 transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
