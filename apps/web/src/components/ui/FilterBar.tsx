import React from 'react';
import { cn } from '@/lib/utils';

export type FilterOption<T extends string = string> = {
  value: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
};

interface FilterBarProps<T extends string = string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

const sizeClasses: Record<NonNullable<FilterBarProps['size']>, string> = {
  // sm — compact, fits next to a search input
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  // md — sits on its own as a primary tab strip
  md: 'px-3.5 py-2 text-sm gap-2',
};

/**
 * Calm segmented-control filter. One container, hairline border, muted bg.
 * Active option is bg-muted (NOT lime) — lime is too precious for "this is
 * the selected filter". Count appears as a smaller faded number next to label.
 */
export default function FilterBar<T extends string = string>({
  options,
  value,
  onChange,
  className,
  size = 'sm',
}: FilterBarProps<T>) {
  return (
    <div
      role="tablist"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1 max-w-full overflow-x-auto shrink-0 scrollbar-none',
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center rounded-lg font-medium transition-colors cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              sizeClasses[size],
              active
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            {option.icon && (
              <span className="shrink-0 inline-flex">{option.icon}</span>
            )}
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={cn(
                  'tabular-nums',
                  active ? 'text-foreground/60' : 'text-muted-foreground/70'
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
