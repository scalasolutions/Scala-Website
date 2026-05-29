import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

/**
 * Linear/Stripe-style textarea. Same hairline border + 2px focus ring as
 * Input, but with multi-line padding (py-2.5) and resize-none by default —
 * encourages a fixed visual rhythm. Users can pass `rows` to control height.
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hint,
    error,
    containerClassName,
    className,
    id,
    rows = 3,
    ...props
  },
  ref
) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const hasError = Boolean(error);

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-medium text-muted-foreground mb-1.5 block"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={cn(
          'w-full rounded-xl bg-background border px-3.5 py-2.5 text-sm text-foreground',
          'placeholder:text-muted-foreground/70',
          'focus-visible:outline-none focus-visible:ring-2 transition-colors resize-none',
          hasError
            ? 'border-red-500/40 focus-visible:border-red-500 focus-visible:ring-red-500/25'
            : 'border-border focus-visible:border-primary focus-visible:ring-primary/35',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        aria-invalid={hasError || undefined}
        aria-describedby={
          hasError ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
        }
        {...props}
      />
      {hasError ? (
        <p id={`${textareaId}-error`} className="text-xs text-red-500 mt-1.5">
          {error}
        </p>
      ) : hint ? (
        <p id={`${textareaId}-hint`} className="text-xs text-muted-foreground mt-1.5">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Textarea;
