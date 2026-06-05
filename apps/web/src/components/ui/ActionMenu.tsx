'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

interface MenuPosition {
  top: number;
  left: number;
}

export default function ActionMenu({ items, align = 'right', ariaLabel = 'Open actions' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute and update menu position relative to the trigger button
  const computePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = items.length * 44 + 12; // approx height

    let left = align === 'right' ? rect.right - menuWidth : rect.left;
    let top = rect.bottom + 6;

    // Keep within viewport
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
    if (top + menuHeight > window.innerHeight - 8) top = rect.top - menuHeight - 6;

    setMenuPos({ top, left });
  }, [align, items.length]);

  const handleOpen = useCallback(() => {
    computePosition();
    setOpen(true);
  }, [computePosition]);

  // Close on outside interaction, scroll, resize, or Escape
  useEffect(() => {
    if (!open) return;

    const handleClose = () => setOpen(false);
    const onDocMouseDown = (e: MouseEvent) => {
      // Close only if click is outside the button
      if (!buttonRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);

    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [open]);

  const handleSelect = (item: ActionMenuItem) => {
    if (item.disabled) return;
    item.onSelect?.();
    setOpen(false);
  };

  const menuNode = open ? (
    // Invisible full-screen backdrop captures clicks outside
    <div
      className="fixed inset-0 z-[9998]"
      style={{ background: 'transparent' }}
      onMouseDown={() => setOpen(false)}
      onContextMenu={(e) => { e.preventDefault(); setOpen(false); }}
    >
      {/* Actual dropdown — stopPropagation so clicks inside don't close via backdrop */}
      <div
        role="menu"
        style={{ top: menuPos.top, left: menuPos.left, position: 'fixed' }}
        className="z-[9999] min-w-[180px] py-1.5 rounded-xl border border-border bg-card shadow-2xl animate-fade-in-scale origin-top-right"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {items.map((item) => {
          const baseClasses = cn(
            'flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left text-sm font-medium transition-colors',
            item.disabled
              ? 'text-muted-foreground/50 cursor-not-allowed'
              : item.destructive
                ? 'text-red-500 hover:bg-red-500/10 cursor-pointer'
                : 'text-foreground hover:bg-muted/60 cursor-pointer'
          );

          const content = (
            <>
              {item.icon && <span className="shrink-0 inline-flex">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
            </>
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
    </div>
  ) : null;

  return (
    <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className={cn(
          'inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground',
          'hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          open && 'text-foreground bg-muted/50'
        )}
      >
        <MoreVertical size={16} />
      </button>

      {/* Portal the menu to body so it escapes any stacking context */}
      {mounted && menuNode && createPortal(menuNode, document.body)}
    </div>
  );
}
