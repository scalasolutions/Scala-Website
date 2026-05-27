'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const formatNumberIDR = (val: number | string): string => {
    if (val === undefined || val === null || val === '') return '';
    const num = String(val).replace(/[^0-9]/g, '');
    if (!num) return '';
    return new Intl.NumberFormat('id-ID').format(Number(num));
  };

  const parseNumber = (val: string): number => {
    const rawVal = val.replace(/[^0-9]/g, '');
    return rawVal ? Number(rawVal) : 0;
  };

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
        setLinePresets(prev => [newPreset as MockInvoiceLinePreset, ...prev]);
      } else if (modalMode === 'edit' && selectedLinePreset) {
        const updated = await updateInvoiceLinePreset(selectedLinePreset.id, {
          name: lineName,
          price: linePrice,
          description: lineDescription,
        });
        setLinePresets(prev => prev.map(p => (p.id === selectedLinePreset.id ? (updated as MockInvoiceLinePreset) : p)));
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
    setModalOpen(true);
  };

  const resetForm = () => {
    setLineName('');
    setLinePrice(0);
    setLineDescription('');
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* ── Header with Back link ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/invoices"
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-card border border-border hover:bg-muted text-foreground transition-all duration-200 active-press"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              Invoices presets <Sliders size={20} className="text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure standard service modules and construct custom document pages. (Right-click tabs to edit/rename).
            </p>
          </div>
        </div>

        {/* Saved status notification */}
        {saveStatus === 'saved' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold animate-fade-in">
            <Check size={14} />
            All changes saved to cloud
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold animate-fade-in">
            <X size={14} />
            Failed to save changes
          </div>
        )}
      </div>

      {/* ── Tabs container with Dynamic Pages catalog + add custom page ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {/* Line presets */}
        <button
          onClick={() => setActiveTab('lines')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'lines'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Line Item Presets
        </button>

        {/* Dynamic Custom/Default Pages */}
        {pagePresets.map(preset => (
          <button
            key={preset.pageKey}
            onClick={() => setActiveTab(preset.pageKey)}
            onContextMenu={(e) => handleTabContextMenu(e, preset.pageKey)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize select-none ${
              activeTab === preset.pageKey
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {getPageTabLabel(preset.pageKey)}
          </button>
        ))}

        {/* Create new custom page trigger */}
        <button
          onClick={() => setPageModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-all cursor-pointer select-none"
        >
          <Plus size={13} />
          Create Custom Page
        </button>
      </div>

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
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <span className="text-xs text-muted-foreground font-semibold">Loading presets...</span>
        </div>
      ) : (
        <div className="animate-fade-up">
          {/* TAB 1: LINE ITEM PRESETS */}
          {activeTab === 'lines' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-card border border-border p-4 rounded-2xl shadow-sm">
                <div>
                  <h3 className="text-sm font-bold">Standard Services Catalog</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Predefined services that appear as autofill options inside your invoice editor.
                  </p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 active-press transition-all duration-200 cursor-pointer"
                >
                  <Plus size={14} />
                  Add Preset
                </button>
              </div>

              {linePresets.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-3xl bg-card/30">
                  <Sliders size={32} className="mx-auto text-muted-foreground/60 mb-3" />
                  <h4 className="text-sm font-bold text-foreground">No presets created</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Create your first preset to speed up your invoicing billing cycles.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {linePresets.map(preset => (
                    <div
                      key={preset.id}
                      className="bg-card border border-border hover:border-primary/45 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors">
                            {preset.name}
                          </h4>
                          <span className="text-xs font-black text-primary shrink-0 bg-primary/10 px-2.5 py-1 rounded-lg">
                            Rp {formatNumberIDR(preset.price)}
                          </span>
                        </div>
                        {preset.description && (
                          <div className="mt-3 text-xs text-muted-foreground leading-relaxed whitespace-pre-line border-t border-border/60 pt-3">
                            {preset.description}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-2 mt-4 border-t border-border/40 pt-3">
                        <button
                          onClick={() => openEditModal(preset)}
                          className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteLine(preset.id)}
                          className="p-2 rounded-xl border border-border bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 cursor-pointer border-red-500/10 hover:border-red-500/20 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
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
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                  Preset Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starter Company Profile Package"
                  value={lineName}
                  onChange={e => setLineName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border focus:border-primary/45 focus:outline-none text-sm text-foreground font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                  Standard Price (Rate in IDR) *
                </label>
                <input
                  type="text"
                  required
                  value={formatNumberIDR(linePrice)}
                  onChange={e => setLinePrice(parseNumber(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border focus:border-primary/45 focus:outline-none text-sm text-foreground font-extrabold text-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                  Preset Sub-features / Description (One per line)
                </label>
                <textarea
                  placeholder="Landing Page, Up to 10 Pages&#10;Mobile Responsive&#10;Custom UI/UX Designs & Animations"
                  value={lineDescription}
                  onChange={e => setLineDescription(e.target.value)}
                  rows={5}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border focus:border-primary/45 focus:outline-none text-sm text-foreground leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:opacity-90 transition-all cursor-pointer shadow-md"
                >
                  <Check size={14} />
                  {modalMode === 'create' ? 'Create' : 'Save'}
                </button>
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
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                  Page Title * (e.g. Service SLA, Scope details)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Service Level Agreement"
                  value={newPageTitle}
                  onChange={e => setNewPageTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border focus:border-primary/45 focus:outline-none text-sm text-foreground font-semibold"
                />
                <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                  Creating this will automatically generate a dynamic text tab sheet. You will be able to include or exclude this page on each invoice individually.
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setPageModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:opacity-90 transition-all cursor-pointer shadow-md"
                >
                  <Check size={14} />
                  Create Page
                </button>
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
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                  Page Name * (e.g. Terms of Work)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Terms of Work"
                  value={renameTitle}
                  onChange={e => setRenameTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border focus:border-primary/45 focus:outline-none text-sm text-foreground font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setRenameModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:opacity-90 transition-all cursor-pointer shadow-md"
                >
                  <Check size={14} />
                  Rename Page
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
