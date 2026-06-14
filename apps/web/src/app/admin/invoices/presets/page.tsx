'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  ArrowLeft,
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eraser,
  Heading2,
  Heading3,
  Sparkles,
  Save,
  FileText,
  ChevronDown,
} from 'lucide-react';
import {
  getInvoiceLinePresets,
  createInvoiceLinePreset,
  updateInvoiceLinePreset,
  deleteInvoiceLinePreset,
  getInvoicePagePresets,
  updateInvoicePagePreset,
  deleteInvoicePagePreset,
  MockInvoiceLinePreset,
  MockInvoicePagePreset,
} from '@/lib/db/queries';
import {
  type InvoiceLinePresetCategory,
  INVOICE_LINE_PRESET_CATEGORY_LABELS,
  INVOICE_LINE_PRESET_CATEGORY_ORDER,
} from '@/lib/invoice-preset-categories';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import EmptyState from '@/components/ui/EmptyState';
import ActionMenu from '@/components/ui/ActionMenu';
import { cn, TABLE_ROW_HOVER, formatInputNumberIDR as formatNumberIDR, parseNumberInputIDR as parseNumber } from '@/lib/utils';

export default function InvoicesPresetsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<string>('lines');
  const [linePresets, setLinePresets] = useState<MockInvoiceLinePreset[]>([]);
  const [pagePresets, setPagePresets] = useState<MockInvoicePagePreset[]>([]);
  const [titlePresets, setTitlePresets] = useState<MockInvoicePagePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Modal forms for line items
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedLinePreset, setSelectedLinePreset] = useState<MockInvoiceLinePreset | null>(null);
  const [lineName, setLineName] = useState('');
  const [linePrice, setLinePrice] = useState<number>(0);
  const [lineDescription, setLineDescription] = useState('');
  const [lineCategory, setLineCategory] = useState<InvoiceLinePresetCategory>('uncategorized');

  // Collapsed-state tracking for category groups + per-preset detail panels.
  // Categories default collapsed; expanded set is seeded below once data loads
  // (first non-empty category opens automatically so the page isn't blank).
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [expandedPresets, setExpandedPresets] = useState<Set<string>>(new Set());
  const initialOpenCategoryRef = useRef(false);

  // Modal forms for custom page
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');

  // Modal forms for renaming page
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTargetKey, setRenameTargetKey] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  // Floating Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    pageKey: string;
  } | null>(null);

  // Rich Text Editor HTML States
  const [editorHtml, setEditorHtml] = useState<string>('');
  const editorRef = useRef<HTMLDivElement>(null);

  // IDR Currency Formatter helper
  // Bootstrap Page
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [lines, pages] = await Promise.all([
          getInvoiceLinePresets(),
          getInvoicePagePresets(),
        ]);
        setLinePresets(lines as MockInvoiceLinePreset[]);

        // Filter and merge pages
        const fullPages = pages.filter(p => p.sectionKey === 'full_page_html');
        const titles = pages.filter(p => p.sectionKey === 'page_title');

        // Apply local storage overrides if present
        if (typeof window !== 'undefined') {
          fullPages.forEach(p => {
            const localContent = localStorage.getItem(`scala_preset_${p.pageKey}`);
            if (localContent) {
              p.content = localContent;
            }
          });
          titles.forEach(t => {
            const localTitle = localStorage.getItem(`scala_preset_title_${t.pageKey}`);
            if (localTitle) {
              t.content = localTitle;
            }
          });
        }
        setPagePresets(fullPages as MockInvoicePagePreset[]);
        setTitlePresets(titles as MockInvoicePagePreset[]);
      } catch (e) {
        console.error('Failed to load presets:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto-trigger Create Page Modal from query param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('createPage') === 'true') {
        setPageModalOpen(true);
        // Clean up URL so refresh doesn't trigger modal again
        window.history.replaceState({}, '', '/admin/invoices/presets');
      }
    }
  }, []);

  // Update editor HTML when tab changes
  useEffect(() => {
    if (activeTab === 'lines') return;

    const matchingPreset = pagePresets.find(p => p.pageKey === activeTab);
    if (matchingPreset) {
      setEditorHtml(matchingPreset.content);
    } else {
      setEditorHtml('');
    }
  }, [activeTab, pagePresets]);

  // Bucket presets by category, preserving the canonical render order.
  // DB-backed rows that predate the category column are treated as
  // 'uncategorized' so they still surface in the catalog.
  const presetsByCategory = useMemo(() => {
    const buckets = new Map<InvoiceLinePresetCategory, MockInvoiceLinePreset[]>();
    for (const cat of INVOICE_LINE_PRESET_CATEGORY_ORDER) {
      buckets.set(cat, []);
    }
    for (const preset of linePresets) {
      const cat = (preset.category ?? 'uncategorized') as InvoiceLinePresetCategory;
      const bucket = buckets.get(cat) ?? buckets.get('uncategorized')!;
      bucket.push(preset);
    }
    return buckets;
  }, [linePresets]);

  // Seed the collapsed-categories set once the first batch loads so every
  // category is closed except the first one with presets in it.
  useEffect(() => {
    if (initialOpenCategoryRef.current) return;
    if (linePresets.length === 0) return;

    const firstWithItems = INVOICE_LINE_PRESET_CATEGORY_ORDER.find(
      cat => (presetsByCategory.get(cat)?.length ?? 0) > 0
    );
    const collapsed = new Set<string>(
      INVOICE_LINE_PRESET_CATEGORY_ORDER.filter(cat => cat !== firstWithItems)
    );
    setCollapsedCategories(collapsed);
    initialOpenCategoryRef.current = true;
  }, [linePresets, presetsByCategory]);

  const toggleCategory = (cat: InvoiceLinePresetCategory) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const togglePreset = (id: string) => {
    setExpandedPresets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Handle click outside to close Context Menu
  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null);
    };
    if (contextMenu?.visible) {
      window.addEventListener('click', handleGlobalClick);
    }
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [contextMenu]);

  // Sync edits inside rich text elements with state
  const handleEditorInput = () => {
    if (editorRef.current) {
      setEditorHtml(editorRef.current.innerHTML);
    }
  };

  // Rich formatting using execCommand (standard, robust client formatting)
  const format = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setEditorHtml(editorRef.current.innerHTML);
    }
  };

  // Save changes to Server Action & localStorage
  const saveActivePagePreset = async () => {
    if (activeTab === 'lines') return;

    setSaving(true);
    setSaveStatus('idle');

    try {
      // 1. Save to Database/Memory state
      await updateInvoicePagePreset(activeTab, 'full_page_html', editorHtml);

      // 2. Mirror inside localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`scala_preset_${activeTab}`, editorHtml);
      }

      // Update local state copy
      setPagePresets(prev =>
        prev.map(p => (p.pageKey === activeTab ? { ...p, content: editorHtml } : p))
      );

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      console.error('Failed to save page preset:', e);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Delete page preset (generic for both context menu & toolbar)
  const handleDeletePagePresetByKey = async (key: string) => {
    if (key === 'lines') {
      alert('Line presets tab cannot be deleted!');
      return;
    }

    if (!confirm('Are you sure you want to delete this page preset? It will be removed from all invoices.')) return;

    setSaving(true);
    try {
      await deleteInvoicePagePreset(key);

      if (typeof window !== 'undefined') {
        localStorage.removeItem(`scala_preset_${key}`);
        localStorage.removeItem(`scala_preset_title_${key}`);
      }

      setPagePresets(prev => prev.filter(p => p.pageKey !== key));
      setTitlePresets(prev => prev.filter(p => p.pageKey !== key));
      if (activeTab === key) {
        setActiveTab('lines');
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      console.error('Failed to delete page preset:', e);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Delete active page preset
  const handleDeletePagePreset = async () => {
    await handleDeletePagePresetByKey(activeTab);
  };

  // Create new page preset
  const handleCreatePagePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;

    // Slugify to get clean pageKey
    const cleanSlug = newPageTitle
      .trim()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '_');
    const pageKey = `custom_${cleanSlug}`;

    // Verify duplication
    if (pagePresets.some(p => p.pageKey === pageKey)) {
      alert('A page with this name already exists!');
      return;
    }

    setSaving(true);
    try {
      const defaultContent = `<h2>1. ${newPageTitle}</h2>\n<p>Start writing your custom terms, scope details, or SLA conditions here...</p>`;
      
      // Save full HTML preset
      const newPage = await updateInvoicePagePreset(pageKey, 'full_page_html', defaultContent);
      
      // Save page Title preset
      const newTitlePreset = await updateInvoicePagePreset(pageKey, 'page_title', newPageTitle.trim());

      if (typeof window !== 'undefined') {
        localStorage.setItem(`scala_preset_${pageKey}`, defaultContent);
        localStorage.setItem(`scala_preset_title_${pageKey}`, newPageTitle.trim());
      }

      setPagePresets(prev => [...prev, newPage as MockInvoicePagePreset]);
      setTitlePresets(prev => [...prev, newTitlePreset as MockInvoicePagePreset]);
      setPageModalOpen(false);
      setNewPageTitle('');
      setActiveTab(pageKey); // switch to edit the new page instantly
    } catch (e) {
      console.error('Failed to create page preset:', e);
    } finally {
      setSaving(false);
    }
  };

  // Rename page preset handler
  const handleRenamePagePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTitle.trim() || !renameTargetKey) return;

    setSaving(true);
    try {
      // 1. Update database / fallback memory state
      const updatedPreset = await updateInvoicePagePreset(renameTargetKey, 'page_title', renameTitle.trim());

      // 2. Sync inside localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`scala_preset_title_${renameTargetKey}`, renameTitle.trim());
      }

      // Update state
      setTitlePresets(prev => {
        const idx = prev.findIndex(p => p.pageKey === renameTargetKey);
        if (idx !== -1) {
          return prev.map((p, i) => (i === idx ? (updatedPreset as MockInvoicePagePreset) : p));
        } else {
          return [...prev, updatedPreset as MockInvoicePagePreset];
        }
      });

      setRenameModalOpen(false);
      setRenameTitle('');
      setRenameTargetKey(null);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      console.error('Failed to rename page preset:', e);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // CRUD handlers for Line Items Presets
  const handleCreateOrUpdateLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineName.trim()) return;

    try {
      if (modalMode === 'create') {
        const newPreset = await createInvoiceLinePreset({
          name: lineName,
          price: linePrice,
          description: lineDescription,
        });
        // TODO: persist `category` server-side once the schema migration lands.
        // For now we attach it locally so the UI can group correctly.
        const patched = { ...(newPreset as MockInvoiceLinePreset), category: lineCategory };
        setLinePresets(prev => [patched, ...prev]);
      } else if (modalMode === 'edit' && selectedLinePreset) {
        const updated = await updateInvoiceLinePreset(selectedLinePreset.id, {
          name: lineName,
          price: linePrice,
          description: lineDescription,
        });
        // TODO: persist `category` server-side once the schema migration lands.
        const patched = { ...(updated as MockInvoiceLinePreset), category: lineCategory };
        setLinePresets(prev => prev.map(p => (p.id === selectedLinePreset.id ? patched : p)));
      }
      setModalOpen(false);
      resetForm();
    } catch (e) {
      console.error('Failed to update line preset:', e);
    }
  };

  const handleDeleteLine = async (id: string) => {
    if (!confirm('Are you sure you want to delete this line item preset?')) return;
    try {
      await deleteInvoiceLinePreset(id);
      setLinePresets(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error('Failed to delete preset:', e);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (preset: MockInvoiceLinePreset) => {
    setModalMode('edit');
    setSelectedLinePreset(preset);
    setLineName(preset.name);
    setLinePrice(preset.price);
    setLineDescription(preset.description || '');
    setLineCategory((preset.category ?? 'uncategorized') as InvoiceLinePresetCategory);
    setModalOpen(true);
  };

  const resetForm = () => {
    setLineName('');
    setLinePrice(0);
    setLineDescription('');
    setLineCategory('uncategorized');
    setSelectedLinePreset(null);
  };

  const getPageTabLabel = (key: string): string => {
    const customTitle = titlePresets.find(p => p.pageKey === key);
    if (customTitle && customTitle.content) return customTitle.content;

    if (key === 'tc1') return 'T&C Page 1';
    if (key === 'tc2') return 'T&C Page 2';
    if (key.startsWith('custom_')) {
      return key.replace('custom_', '').replace(/_/g, ' ');
    }
    return key;
  };

  // Open right-click context menu at fixed tab-anchored position
  const handleTabContextMenu = (e: React.MouseEvent, pageKey: string) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      visible: true,
      x: rect.left,
      y: rect.bottom + 4,
      pageKey,
    });
  };

  const openRenameModal = (pageKey: string) => {
    const currentLabel = getPageTabLabel(pageKey);
    setRenameTargetKey(pageKey);
    setRenameTitle(currentLabel);
    setRenameModalOpen(true);
  };

  // Toast-style save indicator lives in PageHeader actions. Keep the same
  // semantic states (saved / error / idle) so the existing save flow drives it.
  const saveIndicator =
    saveStatus === 'saved' ? (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/15 text-foreground border border-primary/30 text-xs font-medium animate-fade-in">
        <Check size={14} />
        All changes saved
      </div>
    ) : saveStatus === 'error' ? (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-medium animate-fade-in">
        <X size={14} />
        Failed to save
      </div>
    ) : null;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Breadcrumb-style back link (above the page header, not beside the title) */}
      <Link
        href="/admin/invoices"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        <ArrowLeft size={12} />
        Back to invoices
      </Link>

      <PageHeader
        title="Invoice presets"
        description="Configure standard service modules and construct custom document pages."
        actions={saveIndicator ?? undefined}
      />

      {/* ── Tabs container with Dynamic Pages catalog + add custom page ── */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {/* Line presets */}
        <button
          onClick={() => setActiveTab('lines')}
          className={cn(
            'relative px-3 py-2.5 -mb-px text-sm font-medium transition-colors cursor-pointer border-b-2',
            activeTab === 'lines'
              ? 'text-foreground border-primary'
              : 'text-muted-foreground hover:text-foreground border-transparent'
          )}
        >
          Line Item Presets
        </button>

        {/* Dynamic Custom/Default Pages */}
        {pagePresets.map(preset => (
          <button
            key={preset.pageKey}
            onClick={() => setActiveTab(preset.pageKey)}
            onContextMenu={(e) => handleTabContextMenu(e, preset.pageKey)}
            className={cn(
              'relative px-3 py-2.5 -mb-px text-sm font-medium transition-colors cursor-pointer capitalize select-none border-b-2',
              activeTab === preset.pageKey
                ? 'text-foreground border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            )}
          >
            {getPageTabLabel(preset.pageKey)}
          </button>
        ))}

        {/* Spacer pushes the create trigger to the right */}
        <div className="flex-1" />

        {/* Create new custom page trigger — ghost button, dashed border, not loud */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPageModalOpen(true)}
          leftIcon={<Plus size={14} />}
          className="border border-dashed border-border hover:border-foreground/30 mb-1.5"
        >
          Create Custom Page
        </Button>
      </div>

      {/* Tab hint relocated from the page title — contextual to the tabs row itself */}
      <p className="mt-2 text-[11px] text-muted-foreground">
        Right-click any custom page tab to rename or delete it.
      </p>

      {/* ── Floating Context Menu Overlay ── */}
      {mounted && contextMenu?.visible && createPortal(
        <div
          className="fixed z-50 bg-card border border-border/80 backdrop-blur-md rounded-xl p-1.5 shadow-2xl flex flex-col gap-0.5 min-w-32 animate-fade-in-scale text-foreground"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            boxShadow: '0 10px 40px -6px rgba(0,0,0,0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              openRenameModal(contextMenu.pageKey);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold hover:bg-muted hover:text-foreground flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Edit2 size={12} className="text-primary" />
            Rename
          </button>
          
          <button
            onClick={() => {
              handleDeletePagePresetByKey(contextMenu.pageKey);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-500/10 text-red-400 border border-transparent hover:border-red-500/15 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>,
        document.body
      )}

      {/* ── Main Tabbed views ── */}
      {loading ? (
        <div className="mt-10 flex flex-col items-center justify-center py-24 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <span className="text-xs text-muted-foreground font-medium">Loading presets...</span>
        </div>
      ) : (
        <div className="animate-fade-up mt-8">
          {/* TAB 1: LINE ITEM PRESETS */}
          {activeTab === 'lines' && (
            <div className="space-y-8">
              {/* Catalog header — type-driven, no surface */}
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    Standard services catalog
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    Predefined services that appear as autofill options inside your invoice editor.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={openCreateModal}
                >
                  Add preset
                </Button>
              </div>

              {linePresets.length === 0 ? (
                <EmptyState
                  icon={<Sliders size={20} />}
                  title="No presets yet"
                  description="Create your first preset to speed up your invoicing billing cycles."
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Plus size={14} />}
                      onClick={openCreateModal}
                    >
                      Add preset
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {INVOICE_LINE_PRESET_CATEGORY_ORDER.map(category => {
                    const items = presetsByCategory.get(category) ?? [];
                    if (items.length === 0) return null;
                    const isCollapsed = collapsedCategories.has(category);
                    return (
                      <section
                        key={category}
                        className="rounded-2xl border border-border bg-card overflow-hidden"
                      >
                        {/* Category header — clickable to collapse the whole table.
                            When expanded, a soft tinted strip visually fuses the
                            header with the table beneath it. */}
                        <button
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className={cn(
                            'group w-full flex items-center gap-3 px-5 py-3.5 text-left cursor-pointer transition-colors',
                            isCollapsed
                              ? 'hover:bg-muted/20'
                              : 'bg-muted/30 border-b border-border'
                          )}
                        >
                          <h3 className="text-sm font-semibold text-foreground">
                            {INVOICE_LINE_PRESET_CATEGORY_LABELS[category]}
                          </h3>
                          <Badge variant="neutral">{items.length}</Badge>
                          <span className="flex-1" />
                          <span className="text-[11px] text-muted-foreground hidden sm:inline">
                            {isCollapsed ? 'Show' : 'Hide'}
                          </span>
                          <ChevronDown
                            size={16}
                            className={cn(
                              'text-muted-foreground transition-transform duration-200 group-hover:text-foreground',
                              isCollapsed && '-rotate-90'
                            )}
                          />
                        </button>

                        {/* Category table */}
                        {!isCollapsed && (
                          <div className="overflow-x-auto animate-fade-in">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-[11px] text-muted-foreground font-medium border-b border-border align-bottom">
                                  <th className="w-10 pl-5 pr-2 py-2.5"></th>
                                  <th className="text-left py-2.5 pr-4 font-medium">Service</th>
                                  <th className="text-right py-2.5 pr-4 font-medium hidden md:table-cell">Price (IDR)</th>
                                  <th className="w-10 py-2.5 pr-4"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((preset, idx) => {
                                  const isOpen = expandedPresets.has(preset.id);
                                  const isLast = idx === items.length - 1;
                                  return (
                                    <React.Fragment key={preset.id}>
                                      <tr
                                        onClick={() => togglePreset(preset.id)}
                                        className={cn(
                                          'cursor-pointer transition-colors group/row',
                                          !isLast && 'border-b border-border/50',
                                          'hover:bg-muted/40'
                                        )}
                                      >
                                        <td className="pl-5 pr-2 py-3.5 align-middle">
                                          <ChevronDown
                                            size={14}
                                            className={cn(
                                              'text-muted-foreground transition-transform duration-200 group-hover/row:text-foreground',
                                              !isOpen && '-rotate-90'
                                            )}
                                          />
                                        </td>
                                        <td className="py-3.5 pr-4 align-middle">
                                          <span className="text-sm font-medium text-foreground">
                                            {preset.name}
                                          </span>
                                          <span className="ml-3 md:hidden text-xs text-muted-foreground tabular-nums">
                                            Rp {formatNumberIDR(preset.price)}
                                          </span>
                                        </td>
                                        <td className="hidden md:table-cell py-3.5 pr-4 text-right align-middle text-sm text-foreground tabular-nums">
                                          Rp {formatNumberIDR(preset.price)}
                                        </td>
                                        <td
                                          className="py-3.5 pr-4 align-middle text-right"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <ActionMenu
                                            ariaLabel="Preset actions"
                                            items={[
                                              {
                                                key: 'edit',
                                                label: 'Edit preset',
                                                icon: <Edit2 size={14} />,
                                                onSelect: () => openEditModal(preset),
                                              },
                                              {
                                                key: 'delete',
                                                label: 'Delete preset',
                                                icon: <Trash2 size={14} />,
                                                destructive: true,
                                                onSelect: () => handleDeleteLine(preset.id),
                                              },
                                            ]}
                                          />
                                        </td>
                                      </tr>
                                      {isOpen && (
                                        <tr className={cn(!isLast && 'border-b border-border/50')}>
                                          <td colSpan={4} className="bg-muted/20 pt-3 pb-5">
                                            <div className="mx-5 border-l-2 border-primary pl-4 py-1 text-[13px] leading-relaxed text-muted-foreground whitespace-pre-line max-w-prose">
                                              {preset.description?.trim()
                                                ? preset.description
                                                : 'No description provided.'}
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC WYSIWYG DOCUMENT EDITORS */}
          {activeTab !== 'lines' && (
            <div className="space-y-4 flex flex-col items-center">
              {/* Sticky Formatting Toolbar */}
              <div
                className="sticky top-[10px] z-10 w-full max-w-[800px] flex items-center justify-between gap-4 p-2 bg-card/90 backdrop-blur-md border border-border rounded-2xl shadow-lg"
                style={{ borderLeft: '4px solid #CEF84E' }}
              >
                <div className="flex flex-wrap items-center gap-1">
                  {/* Headings selector */}
                  <button
                    type="button"
                    onClick={() => format('formatBlock', '<h2>')}
                    className="p-2 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                    title="Heading Section"
                  >
                    <Heading2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => format('formatBlock', '<h3>')}
                    className="p-2 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                    title="Sub-heading Section"
                  >
                    <Heading3 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => format('formatBlock', '<p>')}
                    className="px-2 py-1 text-[10px] font-bold uppercase rounded-lg hover:bg-muted text-foreground cursor-pointer"
                    title="Regular Text"
                  >
                    Txt
                  </button>

                  <div className="h-4 w-px bg-border mx-1"></div>

                  {/* Inline styling */}
                  <button
                    type="button"
                    onClick={() => format('bold')}
                    className="p-2 rounded-lg hover:bg-muted text-foreground cursor-pointer font-bold"
                    title="Bold"
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => format('italic')}
                    className="p-2 rounded-lg hover:bg-muted text-foreground cursor-pointer italic"
                    title="Italic"
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => format('underline')}
                    className="p-2 rounded-lg hover:bg-muted text-foreground cursor-pointer underline"
                    title="Underline"
                  >
                    <Underline size={14} />
                  </button>

                  <div className="h-4 w-px bg-border mx-1"></div>

                  {/* Lists */}
                  <button
                    type="button"
                    onClick={() => format('insertUnorderedList')}
                    className="p-2 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                    title="Bullet List"
                  >
                    <List size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => format('insertOrderedList')}
                    className="p-2 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                    title="Numbered List"
                  >
                    <ListOrdered size={14} />
                  </button>

                  <div className="h-4 w-px bg-border mx-1"></div>

                  {/* Alignment */}
                  <button
                    type="button"
                    onClick={() => format('justifyLeft')}
                    className="p-2 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                    title="Align Left"
                  >
                    <AlignLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => format('justifyCenter')}
                    className="p-2 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                    title="Align Center"
                  >
                    <AlignCenter size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => format('justifyRight')}
                    className="p-2 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                    title="Align Right"
                  >
                    <AlignRight size={14} />
                  </button>

                  <div className="h-4 w-px bg-border mx-1"></div>

                  {/* Reset formatting */}
                  <button
                    type="button"
                    onClick={() => format('removeFormat')}
                    className="p-2 rounded-lg hover:bg-muted text-foreground cursor-pointer text-red-400 hover:text-red-300"
                    title="Clear Formatting"
                  >
                    <Eraser size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Delete trigger */}
                  <button
                    type="button"
                    onClick={handleDeletePagePreset}
                    disabled={saving}
                    className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/10 hover:border-red-500/20 cursor-pointer"
                    title="Delete Page"
                  >
                    <Trash2 size={13} />
                  </button>
                  {/* Save button */}
                  <button
                    type="button"
                    onClick={saveActivePagePreset}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:opacity-90 active-press transition-all cursor-pointer shrink-0"
                  >
                    <Save size={13} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* A4 Paper styled document editor (key={activeTab} resets DOM node automatically when tab changes, eliminating state overlaps) */}
              <div
                key={activeTab}
                className="w-full max-w-[800px] bg-white text-black border border-border shadow-2xl p-[64px] font-sans focus:outline-none min-h-[900px] rounded-[16px] relative animate-fade-in"
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  fontFamily: "'Outfit', 'Inter', sans-serif",
                }}
              >
                {/* Dynamic Inline Editor Content CSS */}
                <style>{`
                  .editor-canvas h2 {
                    font-size: 16px;
                    font-weight: 700;
                    color: #111111;
                    margin-top: 24px;
                    margin-bottom: 8px;
                    border-bottom: 1px solid #eeeeee;
                    padding-bottom: 4px;
                  }
                  .editor-canvas h2:first-of-type {
                    margin-top: 0px;
                  }
                  .editor-canvas h3 {
                    font-size: 14px;
                    font-weight: 700;
                    color: #222222;
                    margin-top: 18px;
                    margin-bottom: 6px;
                  }
                  .editor-canvas p {
                    font-size: 13px;
                    color: #333333;
                    line-height: 1.7;
                    margin-bottom: 8px;
                  }
                  .editor-canvas strong {
                    font-weight: 700;
                    color: #111111;
                  }
                  .editor-canvas ul, .editor-canvas ol {
                    margin-top: 4px;
                    margin-bottom: 14px;
                    padding-left: 20px;
                  }
                  .editor-canvas ul {
                    list-style-type: disc;
                  }
                  .editor-canvas ol {
                    list-style-type: decimal;
                  }
                  .editor-canvas li {
                    font-size: 13px;
                    color: #333333;
                    line-height: 1.7;
                    margin-bottom: 4px;
                  }
                  .editor-canvas:focus {
                    outline: none;
                  }
                `}</style>

                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleEditorInput}
                  className="editor-canvas focus:outline-none min-h-[770px]"
                  dangerouslySetInnerHTML={{ __html: editorHtml }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add/Edit Line Preset Modal ── */}
      {mounted && modalOpen && createPortal(
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-fade-in-scale text-foreground"
            style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                {modalMode === 'create' ? 'Create Preset' : 'Edit Preset'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateLine} className="space-y-4">
              <Input
                label="Preset name"
                required
                placeholder="e.g. Starter Company Profile Package"
                value={lineName}
                onChange={e => setLineName(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  value={lineCategory}
                  onChange={e => setLineCategory(e.target.value as InvoiceLinePresetCategory)}
                >
                  {INVOICE_LINE_PRESET_CATEGORY_ORDER.map(cat => (
                    <option key={cat} value={cat}>
                      {INVOICE_LINE_PRESET_CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Standard price (IDR)"
                  required
                  inputMode="numeric"
                  value={formatNumberIDR(linePrice)}
                  onChange={e => setLinePrice(parseNumber(e.target.value))}
                />
              </div>

              <Textarea
                label="Sub-features / description (one per line)"
                placeholder="Landing Page, Up to 10 Pages&#10;Mobile Responsive&#10;Custom UI/UX Designs & Animations"
                value={lineDescription}
                onChange={e => setLineDescription(e.target.value)}
                rows={5}
              />

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={<Check size={14} />}
                >
                  {modalMode === 'create' ? 'Create' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Add Custom Page Preset Modal ── */}
      {mounted && pageModalOpen && createPortal(
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-fade-in-scale text-foreground"
            style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                Create Custom Invoice Page
              </h3>
              <button
                onClick={() => setPageModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePagePreset} className="space-y-4">
              <Input
                label="Page title (e.g. Service SLA, Scope details)"
                required
                placeholder="e.g. Service Level Agreement"
                value={newPageTitle}
                onChange={e => setNewPageTitle(e.target.value)}
                hint="Creating this generates a dynamic text tab sheet. You can include or exclude this page on each invoice individually."
              />

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPageModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={<Check size={14} />}
                >
                  Create page
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Rename Page Preset Modal ── */}
      {mounted && renameModalOpen && createPortal(
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-fade-in-scale text-foreground"
            style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Edit2 size={16} className="text-primary" />
                Rename Invoice Page
              </h3>
              <button
                onClick={() => setRenameModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRenamePagePreset} className="space-y-4">
              <Input
                label="Page name (e.g. Terms of Work)"
                required
                placeholder="e.g. Terms of Work"
                value={renameTitle}
                onChange={e => setRenameTitle(e.target.value)}
              />

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRenameModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={<Check size={14} />}
                >
                  Rename page
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
