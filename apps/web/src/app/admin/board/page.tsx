'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Building,
  X,
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  CheckCircle2,
  Clock,
  Loader2,
  Pencil,
  Trash2,
  Calendar,
  ChevronRight,
  Filter,
  Check,
  MoreHorizontal
} from 'lucide-react';
import {
  getClients,
  getClientTasks,
  createClientTask,
  updateClientTask,
  deleteClientTask,
  MockClient,
  MockClientTask
} from '@/lib/db/queries';
import {
  useAdminData,
  CACHE_KEYS,
  invalidateCache
} from '@/lib/data-cache';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import EmptyState from '@/components/ui/EmptyState';
import SectionHeading from '@/components/ui/SectionHeading';
import ActionMenu from '@/components/ui/ActionMenu';

type TaskStatus = 'to_prepare' | 'in_progress' | 'achieved';

export default function ClientBoardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Queries
  const { data: clientsData, loading: loadingClients } = useAdminData<MockClient[]>(CACHE_KEYS.CLIENTS, getClients);
  const { data: tasksData, loading: loadingTasks, mutate: mutateTasks } = useAdminData<any[]>(CACHE_KEYS.CLIENT_TASKS, getClientTasks);

  const clients = clientsData || [];
  const tasks = tasksData || [];
  const loading = loadingClients || loadingTasks;

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [showOnlyUrgent, setShowOnlyUrgent] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Create Task Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form Fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskClientId, setTaskClientId] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('to_prepare');
  const [taskTargetDate, setTaskTargetDate] = useState('');

  // Searchable client dropdown states
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Editing Task State
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // Drag and Drop active states
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (modalOpen) {
      if (mainEl) mainEl.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      if (mainEl) mainEl.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      if (mainEl) mainEl.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  // Click outside to close client dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setClientDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Click outside to close filter dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Urgency check function
  const isTaskUrgent = (task: any) => {
    if (task.status === 'achieved') return false;

    const now = new Date();
    if (task.targetDate) {
      const dueDate = new Date(task.targetDate);
      if (dueDate < now) return true;
    }

    const updatedDate = new Date(task.updatedAt || task.createdAt);
    const timeDiff = now.getTime() - updatedDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    if (daysDiff > 7) return true;

    return false;
  };

  // Get status column styling
  const getColumnHeaderBg = (status: TaskStatus) => {
    if (status === 'to_prepare') return 'border-t-2 border-t-zinc-400 bg-zinc-500/5 dark:bg-zinc-400/5';
    if (status === 'in_progress') return 'border-t-2 border-t-blue-500 bg-blue-500/5 dark:bg-blue-400/5';
    return 'border-t-2 border-t-emerald-500 bg-emerald-500/5 dark:bg-emerald-400/5';
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
      invalidateCache(CACHE_KEYS.CLIENTS); // status updates could change dashboard indicators
      mutateTasks(); // Re-validate cache from server
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
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskClientId) return;

    startTransition(async () => {
      try {
        if (editingTask) {
          await updateClientTask(editingTask.id, {
            title: taskTitle,
            description: taskDescription || null,
            clientId: taskClientId,
            status: taskStatus,
            targetDate: taskTargetDate ? new Date(taskTargetDate) : null,
          });
        } else {
          await createClientTask({
            clientId: taskClientId,
            title: taskTitle,
            description: taskDescription || null,
            status: taskStatus,
            targetDate: taskTargetDate ? new Date(taskTargetDate) : null,
          });
        }
        
        invalidateCache(CACHE_KEYS.CLIENTS);
        mutateTasks();
        
        // Reset form fields
        setTaskTitle('');
        setTaskDescription('');
        setTaskClientId('');
        setTaskStatus('to_prepare');
        setTaskTargetDate('');
        setEditingTask(null);
        setModalOpen(false);
      } catch (err) {
        console.error('Failed to save client task', err);
      }
    });
  };

  // Handle Edit Task Button Click
  const handleEditClick = (task: any) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskClientId(task.clientId);
    setTaskStatus(task.status);
    setTaskTargetDate(task.targetDate ? new Date(task.targetDate).toISOString().substring(0, 10) : '');
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
  const groupedAchievements = achievedTasks.reduce((groups: Record<string, any[]>, task) => {
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
                setTaskTitle('');
                setTaskDescription('');
                setTaskClientId('');
                setTaskStatus('to_prepare');
                setTaskTargetDate('');
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

              {/* Client Filter Dropdown (Searchable Checklist) */}
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
                        className="hover:text-primary transition-colors font-semibold"
                      >
                        Reset (All)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedClients(clients.map(c => c.id))}
                        className="hover:text-primary transition-colors font-semibold"
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
        <div className="grid gap-6 md:grid-cols-3 items-start">
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
            const isOver = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                onDragLeave={() => setDragOverColumn(null)}
                className={cn(
                  'rounded-2xl border border-border bg-card/60 backdrop-blur-sm transition-all duration-300 min-h-[500px] flex flex-col',
                  isOver && 'border-primary ring-2 ring-primary/10 bg-primary/5',
                  getColumnHeaderBg(col.id)
                )}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-border/80 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      {col.label}
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold tabular-nums">
                        {columnTasks.length}
                      </span>
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{col.description}</p>
                  </div>
                </div>

                {/* Column Body / Cards List */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3.5 max-h-[600px] min-h-[300px]">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-5/6" />
                        <div className="flex justify-between items-center pt-2">
                          <Skeleton className="h-5 w-16" rounded="lg" />
                          <Skeleton className="h-5 w-12" rounded="lg" />
                        </div>
                      </div>
                    ))
                  ) : columnTasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-12 px-4 border border-dashed border-border/60 rounded-xl bg-muted/5">
                      <p className="text-xs text-muted-foreground text-center italic">No tasks here</p>
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const urgent = isTaskUrgent(task);
                      
                      // Calculate days remaining/overdue
                      let dateLabel = '';
                      let dateColorClass = 'text-muted-foreground bg-muted/20 border-border/60';
                      if (task.targetDate) {
                        const now = new Date();
                        const due = new Date(task.targetDate);
                        const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        
                        if (days < 0) {
                          dateLabel = `Overdue by ${Math.abs(days)}d`;
                          dateColorClass = 'text-red-500 dark:text-red-400 bg-red-500/10 border-red-500/20';
                        } else if (days === 0) {
                          dateLabel = 'Due Today';
                          dateColorClass = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
                        } else if (days === 1) {
                          dateLabel = 'Due Tomorrow';
                          dateColorClass = 'text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
                        } else {
                          dateLabel = `Due in ${days}d`;
                          dateColorClass = 'text-muted-foreground bg-muted/30 border-border/80';
                        }
                      }

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className={cn(
                            'group relative bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] cursor-grab active:cursor-grabbing',
                            urgent && 'border-red-500/20 dark:border-red-500/30 ring-1 ring-red-500/10 dark:ring-red-500/20 bg-red-500/[0.01]'
                          )}
                        >
                          {/* Card header: client details */}
                          <div className="flex items-center justify-between gap-2">
                            {task.client && (
                              <Link 
                                href={`/admin/clients/${task.clientId}`}
                                className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                              >
                                <Building size={9} />
                                <span className="truncate max-w-[120px]">
                                  {task.client.companyName || task.client.name}
                                </span>
                              </Link>
                            )}

                            {/* Urgent Flag badge */}
                            {urgent && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 px-1 rounded font-black uppercase tracking-wider animate-pulse-subtle">
                                Urgent
                              </span>
                            )}
                          </div>

                          {/* Task title & desc */}
                          <h4 className="text-xs font-semibold text-foreground mt-1.5 leading-snug group-hover:text-primary transition-colors">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Card Footer: dates & actions */}
                          <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-border/40 shrink-0">
                            {/* Target/Due date indicator */}
                            {task.targetDate ? (
                              <span className={cn('inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full border', dateColorClass)}>
                                <Calendar size={9} />
                                {dateLabel}
                              </span>
                            ) : (
                              <span className="text-[9px] text-muted-foreground/50 italic">No deadline</span>
                            )}

                            {/* Dropdown/Quick Actions */}
                            <div className="flex items-center gap-1">
                              {col.id !== 'achieved' && (
                                <button
                                  onClick={() => handleStatusChange(task.id, 'achieved')}
                                  title="Mark Achieved"
                                  className="p-1 rounded text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                >
                                  <Check size={11} />
                                </button>
                              )}
                              {col.id === 'to_prepare' && (
                                <button
                                  onClick={() => handleStatusChange(task.id, 'in_progress')}
                                  title="Move to In Progress"
                                  className="p-1 rounded text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                                >
                                  <ChevronRight size={11} />
                                </button>
                              )}
                              
                              {/* 3-dot ActionMenu */}
                              <div className="relative">
                                <ActionMenu
                                  ariaLabel="Task actions"
                                  items={[
                                    {
                                      key: 'edit',
                                      label: 'Edit details',
                                      icon: <Pencil size={12} />,
                                      onSelect: () => handleEditClick(task),
                                    },
                                    {
                                      key: 'delete',
                                      label: 'Delete task',
                                      icon: <Trash2 size={12} className="text-red-500" />,
                                      onSelect: () => handleDeleteClick(task.id),
                                    },
                                  ]}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* --- DAILY ACHIEVEMENT TIMELINE --- */}
        <Card padding="md">
          <SectionHeading
            icon={<CheckCircle2 className="text-emerald-500" size={16} />}
            title="Daily Achievement Timeline"
            description="Timeline log of completed tasks and updates per client."
          />

          <div className="mt-6 space-y-6">
            {Object.keys(groupedAchievements).length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground italic flex flex-col items-center gap-1.5">
                <Clock size={16} className="text-muted-foreground/60" />
                <span>No updates achieved yet. Start moving items to 'Achieved'!</span>
              </div>
            ) : (
              Object.keys(groupedAchievements).map((dateKey) => (
                <div key={dateKey} className="relative pl-6 border-l border-border/80 space-y-3">
                  {/* Timeline dot */}
                  <span className="absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full bg-emerald-500 border border-background ring-4 ring-emerald-500/10" />

                  {/* Group header */}
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {dateKey}
                  </h4>

                  {/* Tasks in group */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {groupedAchievements[dateKey].map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-muted/20 border border-border/60 hover:border-border rounded-xl text-xs flex items-start justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{task.title}</p>
                          {task.description && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                          {task.client && (
                            <p className="text-[10px] text-muted-foreground font-medium mt-1 flex items-center gap-1">
                              <Building size={9} />
                              {task.client.companyName || task.client.name}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <Badge variant="success" className="text-[8px] uppercase tracking-wider px-1.5">
                            Achieved
                          </Badge>
                          {task.completedAt && (
                            <p className="text-[9px] text-muted-foreground font-mono mt-1">
                              {new Date(task.completedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* --- CREATE/EDIT TASK MODAL --- */}
      {mounted &&
        modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-background/85 backdrop-blur-md"
              onClick={() => setModalOpen(false)}
            />

            <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
              <div className="p-6 sm:p-8">
                <SectionHeading
                  title={editingTask ? 'Edit Task Details' : 'Create New Task'}
                  description="Set updates, prepared tasks, or follow-ups for clients."
                  action={
                    <button
                      onClick={() => setModalOpen(false)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  }
                />

                <form onSubmit={handleSubmitTask} className="space-y-5 mt-4">
                  {/* Select Client (Searchable) */}
                  <div className="relative" ref={clientDropdownRef}>
                    <label className="block text-xs font-semibold text-foreground mb-2">
                      Target Client *
                    </label>
                    <div
                      onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                      className={cn(
                        "h-10 w-full rounded-xl bg-muted border border-border px-3.5 text-sm text-foreground flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/35",
                        clientDropdownOpen && "border-primary ring-2 ring-primary/35"
                      )}
                    >
                      <span className={cn(!taskClientId && "text-muted-foreground/70")}>
                        {taskClientId
                          ? (clients.find((c) => c.id === taskClientId)?.companyName || clients.find((c) => c.id === taskClientId)?.name)
                          : "Select a client..."}
                      </span>
                      <ChevronRight size={14} className={cn("transform transition-transform text-muted-foreground/70", clientDropdownOpen && "rotate-90")} />
                    </div>

                    {/* Hidden input for form integrity */}
                    <input type="hidden" required value={taskClientId} readOnly />

                    {clientDropdownOpen && (
                      <div className="absolute z-[100] mt-1 w-full rounded-xl border border-border bg-card shadow-lg p-2.5 space-y-2 max-h-[260px] overflow-y-auto animate-fade-in-scale">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search client names..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="h-9 w-full rounded-lg bg-muted border border-border pl-9 pr-3 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/35"
                            autoFocus
                          />
                        </div>
                        <div className="space-y-1 overflow-y-auto max-h-[160px] custom-scrollbar">
                          {clients.filter(c => {
                            const term = clientSearch.toLowerCase();
                            return (
                              c.name.toLowerCase().includes(term) ||
                              (c.companyName && c.companyName.toLowerCase().includes(term))
                            );
                          }).length === 0 ? (
                            <p className="text-center text-xs text-muted-foreground py-3 italic">No clients found</p>
                          ) : (
                            clients
                              .filter(c => {
                                const term = clientSearch.toLowerCase();
                                return (
                                  c.name.toLowerCase().includes(term) ||
                                  (c.companyName && c.companyName.toLowerCase().includes(term))
                                );
                              })
                              .map(c => {
                                const isSelected = c.id === taskClientId;
                                return (
                                  <div
                                    key={c.id}
                                    onClick={() => {
                                      setTaskClientId(c.id);
                                      setClientSearch('');
                                      setClientDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer hover:bg-muted transition-colors",
                                      isSelected && "bg-primary/10 text-primary hover:bg-primary/15 font-semibold"
                                    )}
                                  >
                                    <span className="truncate">
                                      {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                                    </span>
                                    {isSelected && <Check size={12} className="text-primary shrink-0" />}
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Task Title */}
                  <Input
                    label="Task / Update Title *"
                    required
                    placeholder="e.g. Run NPM audits and fix vulnerabilities"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                  />

                  {/* Task Description */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">
                      Description
                    </label>
                    <Textarea
                      placeholder="Add details, notes, or preparation guidelines..."
                      rows={3}
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                    />
                  </div>

                  {/* Status & Target Date */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-2">
                        Status / Column
                      </label>
                      <Select
                        value={taskStatus}
                        onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                      >
                        <option value="to_prepare">To Prepare</option>
                        <option value="in_progress">In Progress</option>
                        <option value="achieved">Achieved</option>
                      </Select>
                    </div>

                    <Input
                      label="Target Date / Due Date"
                      type="date"
                      value={taskTargetDate}
                      onChange={(e) => setTaskTargetDate(e.target.value)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-border mt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="animate-spin mr-1.5" size={14} />
                          Saving...
                        </>
                      ) : (
                        editingTask ? 'Save Changes' : 'Create Task'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
