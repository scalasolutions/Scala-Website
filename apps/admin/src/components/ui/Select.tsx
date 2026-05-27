import React, { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

/**
 * Linear/Stripe-style select. Mirrors the Input component's geometry
 * (10 height, rounded-xl, hairline border, subtle 2px focus ring) so
 * forms feel uniform when select and input fields sit side-by-side.
 *
 * Uses native <select> for accessibility/keyboard support but hides the
 * default chevron with `appearance-none` and renders our own lucide
 * ChevronDown to match the rest of the design system.
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hint,
    error,
    containerClassName,
    className,
    id,
    children,
    ...props
  },
  ref
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hasError = Boolean(error);

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium text-muted-foreground mb-1.5 block"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-10 w-full appearance-none rounded-xl bg-background border pl-3.5 pr-10 text-sm text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 transition-colors cursor-pointer',
            hasError
              ? 'border-red-500/40 focus-visible:border-red-500 focus-visible:ring-red-500/25'
              : 'border-border focus-visible:border-primary focus-visible:ring-primary/35',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          aria-invalid={hasError || undefined}
          aria-describedby={
            hasError ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
          }
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>
      {hasError ? (
        <p id={`${selectId}-error`} className="text-xs text-red-500 mt-1.5">
          {error}
        </p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className="text-xs text-muted-foreground mt-1.5">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Select;
