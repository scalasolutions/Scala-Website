import React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  // Lime on dark text — lime is luminous enough that dark text reads on both themes.
  primary:
    'bg-primary text-zinc-900 hover:bg-primary/90 border border-transparent',
  secondary:
    'bg-card border border-border text-foreground hover:bg-muted/40',
  ghost:
    'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent',
  danger:
    'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/15',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        // Base — note font-medium, not bold; airy radius; subtle focus ring, no glow.
        'inline-flex items-center justify-center rounded-xl font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-50 disabled:pointer-events-none',
        'cursor-pointer',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="shrink-0 inline-flex">{rightIcon}</span>}
    </button>
  );
}
