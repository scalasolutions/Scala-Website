import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

/**
 * Linear/Stripe-style input: tall, airy padding, hairline border,
 * subtle 2px focus ring, no glow or heavy shadow.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    containerClassName,
    className,
    id,
    ...props
  },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hasError = Boolean(error);

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-muted-foreground mb-1.5 block"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground inline-flex pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={cn(
            'h-10 w-full rounded-xl bg-muted border px-3.5 text-sm text-foreground',
            'placeholder:text-muted-foreground/70',
            'focus-visible:outline-none focus-visible:ring-2 transition-colors',
            hasError
              ? 'border-red-500/40 focus-visible:border-red-500 focus-visible:ring-red-500/25'
              : 'border-border focus-visible:border-primary focus-visible:ring-primary/35',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            props.type === 'date' && 'cursor-pointer',
            className
          )}
          onClick={(e) => {
            if (props.type === 'date') {
              try {
                (e.target as any).showPicker();
              } catch (err) {
                console.warn(err);
              }
            }
            if (props.onClick) props.onClick(e);
          }}
          onFocus={(e) => {
            if (props.type === 'date') {
              try {
                (e.target as any).showPicker();
              } catch (err) {
                console.warn(err);
              }
            }
            if (props.onFocus) props.onFocus(e);
          }}
          aria-invalid={hasError || undefined}
          aria-describedby={
            hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
        />
        {rightIcon && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground inline-flex pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>
      {hasError ? (
        <p id={`${inputId}-error`} className="text-xs text-red-500 mt-1.5">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-muted-foreground mt-1.5">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
