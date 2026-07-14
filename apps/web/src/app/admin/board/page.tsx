/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Search,
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  Check,
} from 'lucide-react';
import {
  getClients,
  getClientTasks,
  createClientTask,
  updateClientTask,
  deleteClientTask,
  MockClient,
} from '@/lib/db/queries';
import {
  useAdminData,
  CACHE_KEYS,
  invalidateCache,
} from '@/lib/data-cache';
import { cn, isTaskUrgent } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

// Local modular board components
import { ComponentErrorBoundary } from '../clients/components/ComponentErrorBoundary';
import { BoardColumn } from './components/BoardColumn';
import { TaskCard } from './components/TaskCard';
import { DailyAchievements } from './components/DailyAchievements';
import { CreateTaskModal } from './components/CreateTaskModal';
import { ClientTaskWithClient } from './components/types';

type TaskStatus = 'to_prepare' | 'in_progress' | 'achieved';

export default function ClientBoardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Queries
  const { data: clientsData, loading: loadingClients } = useAdminData<MockClient[]>(CACHE_KEYS.CLIENTS, getClients);
  const { data: tasksData, loading: loadingTasks, mutate: mutateTasks } = useAdminData<ClientTaskWithClient[]>(CACHE_KEYS.CLIENT_TASKS, getClientTasks);

  const clients = clientsData || [];
  const tasks = tasksData || [];
  const loading = loadingClients || loadingTasks;

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [showOnlyUrgent, setShowOnlyUrgent] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // Load selected client filter from URL query param if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlClientId = params.get('client');
      if (urlClientId) {
        setSelectedClients([urlClientId]);
      }
    }
  }, []);

  const [filterSearch, setFilterSearch] = useState('');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Create Task Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Editing Task State
  const [editingTask, setEditingTask] = useState<ClientTaskWithClient | null>(null);

  // Drag and Drop active states
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    task: ClientTaskWithClient;
  } | null>(null);

  // Mobile active tab & media state
  const [activeTab, setActiveTab] = useState<TaskStatus>('to_prepare');
  const [isDesktop, setIsDesktop] = useState(true);

  // Floating sidebar drawer state for mobile viewports
  const [drawerOpen, setDrawerOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Swipe gesture detection & auto-dismiss when tapping outside on mobile viewports
  useEffect(() => {
    if (isDesktop || !mounted) return;

    const handleWindowTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleWindowTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = touchStartX.current - endX;
      const diffY = touchStartY.current - endY;

      // Swipe Left starting from the right edge region opens drawer
      if (diffX > 40 && Math.abs(diffY) < 40) {
        if (touchStartX.current > window.innerWidth - 100) {
          setDrawerOpen(true);
        }
      }

      // Swipe Right anywhere on screen closes drawer
      if (diffX < -40 && Math.abs(diffY) < 40) {
        if (drawerOpen) {
          setDrawerOpen(false);
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (!drawerOpen) return;
      const target = e.target as HTMLElement;
      if (!target.closest('[data-drawer]') && !target.closest('[data-pull-tab]')) {
        setDrawerOpen(false);
      }
    };

    window.addEventListener('touchstart', handleWindowTouchStart, { passive: true });
    window.addEventListener('touchend', handleWindowTouchEnd, { passive: true });
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      window.removeEventListener('touchstart', handleWindowTouchStart);
      window.removeEventListener('touchend', handleWindowTouchEnd);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isDesktop, drawerOpen, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const media = window.matchMedia('(min-width: 768px)');
    setIsDesktop(media.matches);
    const listener = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [mounted]);

  // Close context menu on scroll or escape
  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = () => {
      setContextMenu(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  // Click outside to close filter dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setFilterDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle Right-click Context Menu
  const handleContextMenu = (e: React.MouseEvent, task: ClientTaskWithClient) => {
    e.preventDefault();
    let x = e.clientX;
    let y = e.clientY;

    const menuWidth = 160;
    const menuHeight = 185;
    if (x + menuWidth > window.innerWidth) {
      x -= menuWidth;
    }
    if (y + menuHeight > window.innerHeight) {
      y -= menuHeight;
    }

    setContextMenu({ x, y, task });
  };

  // Handle Card Click (Mobile context menu trigger)
  const handleCardClick = (e: React.MouseEvent, task: ClientTaskWithClient) => {
    if (isDesktop) return;

    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea') ||
      target.closest('[role="menu"]')
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    let x = e.clientX || window.innerWidth / 2 - 80;
    let y = e.clientY || window.innerHeight / 2 - 45;

    const menuWidth = 180;
    const menuHeight = 185;
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 8;
    }
    if (x < 8) x = 8;
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 8;
    }
    if (y < 8) y = 8;

    setContextMenu({ x, y, task });
  };

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea') ||
      target.closest('[role="menu"]') ||
      target.closest('[role="menuitem"]')
    ) {
      e.preventDefault();
      return;
    }
    if (contextMenu || modalOpen) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent, column: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(column);
  };

  // Handle Drop
  const handleDrop = async (e: React.DragEvent, nextStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === nextStatus) return;

    // Optimistic Update
    const updatedTasks = tasks.map(t => 
      t.id === taskId 
        ? { 
            ...t, 
            status: nextStatus,
            completedAt: nextStatus === 'achieved' ? new Date() : (t.status === 'achieved' ? null : t.completedAt),
            updatedAt: new Date()
          } 
        : t
    );
    mutateTasks(updatedTasks);

    // Persist Update
    try {
      await updateClientTask(taskId, { status: nextStatus });
      invalidateCache(CACHE_KEYS.CLIENTS);
      mutateTasks();
    } catch (err) {
      console.error('Failed to update task status via drop', err);
      mutateTasks(); // rollback
    }
  };

  // Handle status update via select or button click
  const handleStatusChange = async (taskId: string, nextStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === nextStatus) return;

    // Optimistic Update
    const updatedTasks = tasks.map(t => 
      t.id === taskId 
        ? { 
            ...t, 
            status: nextStatus,
            completedAt: nextStatus === 'achieved' ? new Date() : (t.status === 'achieved' ? null : t.completedAt),
            updatedAt: new Date()
          } 
        : t
    );
    mutateTasks(updatedTasks);

    try {
      await updateClientTask(taskId, { status: nextStatus });
      invalidateCache(CACHE_KEYS.CLIENTS);
      mutateTasks();
    } catch (err) {
      console.error('Failed to update task status', err);
      mutateTasks(); // rollback on error
    }
  };

  // Handle Task Creation/Edit Form Submission
  const handleFormSubmit = async (taskData: Parameters<typeof createClientTask>[0]) => {
    startTransition(async () => {
      try {
        if (editingTask) {
          await updateClientTask(editingTask.id, taskData);
        } else {
          await createClientTask(taskData);
        }

        invalidateCache(CACHE_KEYS.CLIENTS);
        mutateTasks();

        setEditingTask(null);
        setModalOpen(false);
      } catch (err) {
        console.error('Failed to save client task', err);
      }
    });
  };

  // Handle Edit Task Button Click
  const handleEditClick = (task: ClientTaskWithClient) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  // Handle Delete Task Click
  const handleDeleteClick = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteClientTask(taskId);
      invalidateCache(CACHE_KEYS.CLIENTS);
      mutateTasks();
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      (t.client && t.client.name.toLowerCase().includes(search.toLowerCase())) ||
      (t.client && t.client.companyName && t.client.companyName.toLowerCase().includes(search.toLowerCase()));

    const matchesClient = selectedClients.length === 0 || selectedClients.includes(t.clientId);
    const matchesUrgent = !showOnlyUrgent || isTaskUrgent(t);

    return matchesSearch && matchesClient && matchesUrgent;
  });

  // Columns data setup
  const boardColumns: { id: TaskStatus; label: string; description: string }[] = [
    { id: 'to_prepare', label: 'To Prepare', description: 'Updates or prepare actions needed' },
    { id: 'in_progress', label: 'In Progress', description: 'Currently working on or waiting' },
    { id: 'achieved', label: 'Achieved Today', description: 'Completed changes today' }
  ];

  // Daily Achievements (Achieved grouped by date)
  const achievedTasks = tasks
    .filter(t => t.status === 'achieved' && t.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  // Group achieved tasks by day
  const groupedAchievements = achievedTasks.reduce((groups: Record<string, ClientTaskWithClient[]>, task) => {
    const completedDate = new Date(task.completedAt!);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let dateKey = completedDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    if (completedDate.toDateString() === today.toDateString()) {
      dateKey = 'Today';
    } else if (completedDate.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday';
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(task);
    return groups;
  }, {});

  return (
    <>
      {mounted && createPortal(
        <>
          {/* Floating Pull-tab Handle */}
          <button
            type="button"
            data-pull-tab
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={cn(
              "fixed top-[22%] -translate-y-1/2 z-50 md:hidden",
              "flex flex-col items-center justify-center w-[30px] h-20",
              "bg-primary/95 hover:bg-primary backdrop-blur-md text-primary-foreground",
              "rounded-l-2xl border border-r-0 border-border/20 shadow-2xl",
              "transition-all duration-300 ease-out cursor-pointer select-none",
              drawerOpen ? "right-[-40px] opacity-0 pointer-events-none" : "right-0 opacity-100"
            )}
            aria-label="Open board navigation"
          >
            <ChevronRight className="h-4 w-4 transform rotate-180" />
            <div className="text-[9px] font-black uppercase tracking-wider select-none mt-1 [writing-mode:vertical-lr] rotate-180">
              Tabs
            </div>
          </button>

          {/* Floating Side Drawer */}
          <div
            data-drawer
            className={cn(
              "fixed top-[22%] -translate-y-1/2 z-50 md:hidden",
              "w-[84px] bg-card/95 backdrop-blur-md rounded-l-3xl border-l border-y border-border/80 shadow-2xl p-2 flex flex-col gap-2.5",
              "transition-all duration-300 ease-out",
              drawerOpen ? "right-0 opacity-100 visible" : "right-[-120px] opacity-0 invisible pointer-events-none"
            )}
          >
            {boardColumns.map((col) => {
              const count = filteredTasks.filter(t => {
                if (t.status !== col.id) return false;
                if (col.id === 'achieved') {
                  if (!t.completedAt) return false;
                  const completedDate = new Date(t.completedAt);
                  const today = new Date();
                  return completedDate.toDateString() === today.toDateString();
                }
                return true;
              }).length;
              const isActive = activeTab === col.id;
              
              let activeColorClass = "";
              let iconColorClass = "";
              if (isActive) {
                if (col.id === 'to_prepare') {
                  activeColorClass = "bg-card text-foreground border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm";
                  iconColorClass = "text-zinc-700 dark:text-zinc-300";
                } else if (col.id === 'in_progress') {
                  activeColorClass = "bg-card text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm";
                  iconColorClass = "text-blue-500 dark:text-blue-400";
                } else {
                  activeColorClass = "bg-card text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm";
                  iconColorClass = "text-emerald-500 dark:text-emerald-400";
                }
              } else {
                activeColorClass = "text-muted-foreground hover:text-foreground hover:bg-background/25";
                iconColorClass = "text-muted-foreground/60";
              }

              const icon = col.id === 'to_prepare' ? (
                <ClipboardList size={16} className={iconColorClass} />
              ) : col.id === 'in_progress' ? (
                <Clock size={16} className={iconColorClass} />
              ) : (
                <CheckCircle2 size={16} className={iconColorClass} />
              );

              const shortLabel = col.id === 'to_prepare' ? 'Prepare' : col.id === 'in_progress' ? 'Progress' : 'Achieved';

              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(col.id);
                    setDrawerOpen(false);
                  }}
                  className={cn(
                    "w-full py-3 px-1 text-[10px] font-bold rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center relative",
                    activeColorClass
                  )}
                >
                  {icon}
                  <span className="leading-tight">{shortLabel}</span>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-bold tabular-nums",
                    isActive 
                      ? (col.id === 'to_prepare' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300" 
                         : col.id === 'in_progress' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                         : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400")
                      : "bg-muted-foreground/10 text-muted-foreground/60"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}

      <div className="space-y-8 animate-fade-up">
        {/* Page Header */}
        <PageHeader
          title="Client Board"
          description="Track progress, achievements, and follow-ups per client website."
          actions={
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={() => {
                setEditingTask(null);
                setModalOpen(true);
              }}
            >
              New Task
            </Button>
          }
        />

        {/* Filters and Toolbar */}
        <Card padding="sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 flex flex-col sm:flex-row gap-3 min-w-0">
              {/* Search */}
              <div className="flex-1 max-w-sm">
                <Input
                  placeholder="Search board tasks..."
                  leftIcon={<Search size={16} />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Client Filter Dropdown */}
              <div className="w-full sm:w-64 shrink-0 relative" ref={filterDropdownRef}>
                <div
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  className={cn(
                    "h-10 w-full rounded-xl bg-muted border border-border px-3.5 text-sm text-foreground flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/35",
                    filterDropdownOpen && "border-primary ring-2 ring-primary/35"
                  )}
                >
                  <span className="truncate">
                    {selectedClients.length === 0
                      ? "All Clients"
                      : selectedClients.length === 1
                      ? (clients.find((c) => c.id === selectedClients[0])?.companyName || clients.find((c) => c.id === selectedClients[0])?.name)
                      : `${selectedClients.length} Clients Selected`}
                  </span>
                  <ChevronRight size={14} className={cn("transform transition-transform text-muted-foreground/70", filterDropdownOpen && "rotate-90")} />
                </div>

                {filterDropdownOpen && (
                  <div className="absolute z-[100] mt-1 w-full rounded-xl border border-border bg-card shadow-lg p-2.5 space-y-2 max-h-[300px] overflow-y-auto animate-fade-in-scale">
                    {/* Search Field */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search clients..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        className="h-9 w-full rounded-lg bg-muted border border-border pl-9 pr-3 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/35"
                        autoFocus
                      />
                    </div>

                    {/* Quick Selection Actions */}
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground border-b border-border/60 pb-1.5 px-1">
                      <button
                        type="button"
                        onClick={() => setSelectedClients([])}
                        className="hover:text-primary transition-colors font-semibold cursor-pointer"
                      >
                        Reset (All)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedClients(clients.map(c => c.id))}
                        className="hover:text-primary transition-colors font-semibold cursor-pointer"
                      >
                        Select All
                      </button>
                    </div>

                    {/* Checklist Container */}
                    <div className="space-y-1 overflow-y-auto max-h-[160px] custom-scrollbar">
                      {clients.filter(c => {
                        const term = filterSearch.toLowerCase();
                        return (
                          c.name.toLowerCase().includes(term) ||
                          (c.companyName && c.companyName.toLowerCase().includes(term))
                        );
                      }).length === 0 ? (
                        <p className="text-center text-xs text-muted-foreground py-3 italic">No clients found</p>
                      ) : (
                        clients
                          .filter(c => {
                            const term = filterSearch.toLowerCase();
                            return (
                              c.name.toLowerCase().includes(term) ||
                              (c.companyName && c.companyName.toLowerCase().includes(term))
                            );
                          })
                          .map(c => {
                            const isChecked = selectedClients.includes(c.id);
                            return (
                              <label
                                key={c.id}
                                className="flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer hover:bg-muted transition-colors select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedClients(selectedClients.filter(id => id !== c.id));
                                    } else {
                                      setSelectedClients([...selectedClients, c.id]);
                                    }
                                  }}
                                  className="rounded border-border text-primary focus:ring-primary/35 h-3.5 w-3.5"
                                />
                                <span className={cn("truncate", isChecked && "text-primary font-semibold")}>
                                  {c.companyName || c.name}
                                </span>
                              </label>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Urgent Items Toggle Switch */}
            <div className="flex items-center gap-2 select-none shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyUrgent}
                  onChange={(e) => setShowOnlyUrgent(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                <span className="ml-2 text-xs font-semibold text-foreground flex items-center gap-1">
                  <AlertTriangle size={13} className={showOnlyUrgent ? 'text-red-500' : 'text-muted-foreground'} />
                  Urgent Only
                </span>
              </label>
            </div>
          </div>
        </Card>

        {/* --- KANBAN BOARD GRID --- */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 items-start">
          {boardColumns.map((col) => {
            const columnTasks = filteredTasks.filter(t => {
              if (t.status !== col.id) return false;
              if (col.id === 'achieved') {
                if (!t.completedAt) return false;
                const completedDate = new Date(t.completedAt);
                const today = new Date();
                return completedDate.toDateString() === today.toDateString();
              }
              return true;
            });

            return (
              <ComponentErrorBoundary key={col.id} componentName={`BoardColumn:${col.label}`}>
                <BoardColumn
                  col={col}
                  columnTasks={columnTasks}
                  activeTab={activeTab}
                  dragOverColumn={dragOverColumn}
                  loading={loading}
                  handleDragOver={handleDragOver}
                  handleDrop={handleDrop}
                  setDragOverColumn={setDragOverColumn}
                >
                  <div className="space-y-3.5">
                    {columnTasks.map((task) => (
                      <ComponentErrorBoundary key={task.id} componentName={`TaskCard:${task.title}`}>
                        <TaskCard
                          task={task}
                          colId={col.id}
                          isDesktop={isDesktop}
                          isContextMenuOpen={contextMenu?.task.id === task.id}
                          modalOpen={modalOpen}
                          handleDragStart={handleDragStart}
                          handleContextMenu={handleContextMenu}
                          handleCardClick={handleCardClick}
                          handleStatusChange={handleStatusChange}
                          handleEditClick={handleEditClick}
                          handleDeleteClick={handleDeleteClick}
                        />
                      </ComponentErrorBoundary>
                    ))}
                  </div>
                </BoardColumn>
              </ComponentErrorBoundary>
            );
          })}
        </div>

        {/* --- DAILY ACHIEVEMENT TIMELINE --- */}
        <ComponentErrorBoundary componentName="DailyAchievements">
          <DailyAchievements groupedAchievements={groupedAchievements} />
        </ComponentErrorBoundary>
      </div>

      {/* --- CREATE/EDIT TASK MODAL --- */}
      <ComponentErrorBoundary componentName="CreateTaskModal">
        <CreateTaskModal
          isOpen={mounted && modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingTask(null);
          }}
          onSubmit={handleFormSubmit}
          isPending={isPending}
          clients={clients}
          editingTask={editingTask}
        />
      </ComponentErrorBoundary>

      {/* --- TASK CARD CONTEXT MENU --- */}
      {mounted && contextMenu && createPortal(
        <div
          className="fixed inset-0 z-[90] cursor-default"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu(null);
          }}
        >
          <div
            className="absolute z-[100] min-w-[180px] py-1.5 rounded-xl border border-border bg-card shadow-2xl animate-fade-in-scale"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              boxShadow: '0 8px 30px -4px rgba(0,0,0,0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                handleEditClick(contextMenu.task);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <Pencil size={13} className="text-muted-foreground" />
              Edit details
            </button>

            {/* Quick status moves */}
            <div className="px-3.5 py-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider border-t border-border/60 mt-1 pt-1.5">
              Move to
            </div>
            {contextMenu.task.status !== 'to_prepare' && (
              <button
                type="button"
                onClick={() => {
                  handleStatusChange(contextMenu.task.id, 'to_prepare');
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <ClipboardList size={13} className="text-zinc-500" />
                To Prepare
              </button>
            )}
            {contextMenu.task.status !== 'in_progress' && (
              <button
                type="button"
                onClick={() => {
                  handleStatusChange(contextMenu.task.id, 'in_progress');
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <Clock size={13} className="text-blue-500" />
                In Progress
              </button>
            )}
            {contextMenu.task.status !== 'achieved' && (
              <button
                type="button"
                onClick={() => {
                  handleStatusChange(contextMenu.task.id, 'achieved');
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <Check size={13} className="text-emerald-500" />
                Achieved
              </button>
            )}

            <div className="border-t border-border/60 mt-1" />
            <button
              type="button"
              onClick={() => {
                handleDeleteClick(contextMenu.task.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 size={13} className="text-red-500" />
              Delete task
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
