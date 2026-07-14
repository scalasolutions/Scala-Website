/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, ChevronRight, Check, Loader2 } from 'lucide-react';
import { MockClient } from '@/lib/db/queries';
import { cn } from '@/lib/utils';
import SectionHeading from '@/components/ui/SectionHeading';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { ClientTaskWithClient } from './types';

type TaskStatus = 'to_prepare' | 'in_progress' | 'achieved';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string | null;
    clientId: string;
    status: TaskStatus;
    targetDate: Date | null;
  }) => void;
  isPending: boolean;
  clients: MockClient[];
  editingTask: ClientTaskWithClient | null;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  clients,
  editingTask,
}: CreateTaskModalProps) {
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetForm = () => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskClientId('');
    setTaskStatus('to_prepare');
    setTaskTargetDate('');
    setClientSearch('');
    setClientDropdownOpen(false);
  };

  // Sync/Reset states on open/change
  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        setTaskTitle(editingTask.title || '');
        setTaskDescription(editingTask.description || '');
        setTaskClientId(editingTask.clientId || '');
        setTaskStatus(editingTask.status || 'to_prepare');
        setTaskTargetDate(
          editingTask.targetDate
            ? new Date(editingTask.targetDate).toISOString().substring(0, 10)
            : ''
        );
      } else {
        resetForm();
      }
      document.body.style.overflow = 'hidden';
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.style.overflow = 'hidden';
    } else {
      resetForm();
      document.body.style.overflow = '';
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.style.overflow = '';
    };
  }, [isOpen, editingTask]);

  // Click outside to close client dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setClientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskClientId) return;

    onSubmit({
      title: taskTitle.trim(),
      description: taskDescription.trim() || null,
      clientId: taskClientId,
      status: taskStatus,
      targetDate: taskTargetDate ? new Date(taskTargetDate) : null,
    });
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
        <div className="p-6 sm:p-8">
          <SectionHeading
            title={editingTask ? 'Edit Task Details' : 'Create New Task'}
            description="Set updates, prepared tasks, or follow-ups for clients."
            action={
              <button
                onClick={onClose}
                type="button"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            }
          />

          <form onSubmit={handleFormSubmit} className="space-y-5 mt-4">
            {/* Select Client (Searchable) */}
            <div className="relative" ref={clientDropdownRef}>
              <label className="block text-xs font-semibold text-foreground mb-2">
                Target Client *
              </label>
              <div
                onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                className={cn(
                  'h-10 w-full rounded-xl bg-muted border border-border px-3.5 text-sm text-foreground flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/35',
                  clientDropdownOpen && 'border-primary ring-2 ring-primary/35'
                )}
              >
                <span className={cn(!taskClientId && 'text-muted-foreground/70')}>
                  {taskClientId
                    ? clients.find((c) => c.id === taskClientId)?.companyName ||
                      clients.find((c) => c.id === taskClientId)?.name
                    : 'Select a client...'}
                </span>
                <ChevronRight
                  size={14}
                  className={cn(
                    'transform transition-transform text-muted-foreground/70',
                    clientDropdownOpen && 'rotate-90'
                  )}
                />
              </div>

              {/* Hidden input for form integrity */}
              <input type="hidden" required value={taskClientId} readOnly />

              {clientDropdownOpen && (
                <div className="absolute z-[100] mt-1 w-full rounded-xl border border-border bg-card shadow-lg p-2.5 space-y-2 max-h-[260px] overflow-y-auto animate-fade-in-scale">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
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
                    {clients.filter((c) => {
                      const term = clientSearch.toLowerCase();
                      return (
                        c.name.toLowerCase().includes(term) ||
                        (c.companyName && c.companyName.toLowerCase().includes(term))
                      );
                    }).length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-3 italic">
                        No clients found
                      </p>
                    ) : (
                      clients
                        .filter((c) => {
                          const term = clientSearch.toLowerCase();
                          return (
                            c.name.toLowerCase().includes(term) ||
                            (c.companyName && c.companyName.toLowerCase().includes(term))
                          );
                        })
                        .map((c) => {
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
                                'flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer hover:bg-muted transition-colors',
                                isSelected && 'bg-primary/10 text-primary hover:bg-primary/15 font-semibold'
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
              <label className="block text-xs font-semibold text-foreground mb-2">Description</label>
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
              <Button type="button" variant="ghost" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin mr-1.5" size={14} />
                    Saving...
                  </>
                ) : editingTask ? (
                  'Save Changes'
                ) : (
                  'Create Task'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
