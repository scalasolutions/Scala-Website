'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onSelect?: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  align?: 'left' | 'right';
  ariaLabel?: string;
}

export default function ActionMenu({ items, align = 'right', ariaLabel = 'Open actions' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = (item: ActionMenuItem) => {
    if (item.disabled) return;
    item.onSelect?.();
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground',
          'hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          open && 'text-foreground bg-muted/50'
        )}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full mt-1.5 z-40 min-w-[180px] py-1.5 rounded-xl border border-border bg-card shadow-lg',
            'animate-fade-in-scale origin-top',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item) => {
            const content = (
              <>
                {item.icon && <span className="shrink-0 inline-flex">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
              </>
            );

            const baseClasses = cn(
              'flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm font-medium transition-colors',
              item.disabled
                ? 'text-muted-foreground/50 cursor-not-allowed'
                : item.destructive
                  ? 'text-red-500 hover:bg-red-500/10 cursor-pointer'
                  : 'text-foreground hover:bg-muted/60 cursor-pointer'
            );

            if (item.href && !item.disabled) {
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  role="menuitem"
                  className={baseClasses}
                  onClick={() => setOpen(false)}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleSelect(item)}
                className={baseClasses}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
