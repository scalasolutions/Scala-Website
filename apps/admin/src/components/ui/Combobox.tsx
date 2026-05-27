'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  keywords?: string[];
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  allowClear?: boolean;
  containerClassName?: string;
  className?: string;
}

// Searchable single-select combobox. Native <select> is replaced with a
// pop-over panel that filters its options as the user types. Designed to
// match Input/Select geometry (h-10, rounded-xl, hairline border) and uses
// the lime accent for the selected item.
export default function Combobox({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No matches',
  label,
  hint,
  error,
  disabled = false,
  allowClear = false,
  containerClassName,
  className,
}: ComboboxProps) {
  const autoId = useId();
  const triggerId = autoId;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const hay = [o.label, o.description ?? '', ...(o.keywords ?? [])]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, options, value]);

  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [filtered.length, activeIndex]);

  const selectOption = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) selectOption(opt.value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  const hasError = Boolean(error);

  return (
    <div className={cn('w-full', containerClassName)} ref={rootRef}>
      {label && (
        <label htmlFor={triggerId} className="text-xs font-medium text-muted-foreground mb-1.5 block">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          id={triggerId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={cn(
            'h-10 w-full rounded-xl bg-background border pl-3.5 pr-10 text-sm text-left transition-colors cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2',
            hasError
              ? 'border-red-500/40 focus-visible:border-red-500 focus-visible:ring-red-500/25'
              : open
                ? 'border-primary ring-2 ring-primary/35'
                : 'border-border focus-visible:border-primary focus-visible:ring-primary/35 hover:border-border',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            selected ? 'text-foreground' : 'text-muted-foreground/80',
            className,
          )}
        >
          <span className="block truncate">{selected ? selected.label : placeholder}</span>
        </button>

        {allowClear && selected && !disabled && (
          <button
            type="button"
            aria-label="Clear selection"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="absolute right-9 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
          >
            ×
          </button>
        )}

        <ChevronDown
          size={16}
          className={cn(
            'absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-transform duration-200',
            open && 'rotate-180'
          )}
        />

        {open && (
          <div
            ref={listRef}
            className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-card shadow-2xl shadow-black/10 overflow-hidden animate-fade-in-scale origin-top"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/70 bg-muted/30">
              <Search size={14} className="text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKey}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
              />
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {emptyMessage}
                </p>
              ) : (
                filtered.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => selectOption(opt.value)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        'w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : isActive
                            ? 'bg-primary/15 text-foreground'
                            : 'text-foreground hover:bg-muted/50'
                      )}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium truncate">{opt.label}</span>
                        {opt.description && (
                          <span
                            className={cn(
                              'block text-xs truncate mt-0.5',
                              isSelected ? 'text-primary-foreground/75' : 'text-muted-foreground'
                            )}
                          >
                            {opt.description}
                          </span>
                        )}
                      </span>
                      {isSelected && <Check size={14} className="shrink-0 mt-0.5" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {hasError ? (
        <p className="text-xs text-red-500 mt-1.5">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}
