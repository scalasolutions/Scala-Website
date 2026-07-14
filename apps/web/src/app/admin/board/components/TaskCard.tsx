'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building,
  Calendar,
  Check,
  ChevronRight,
  Pencil,
  ClipboardList,
  Clock,
  Trash2,
} from 'lucide-react';
import { cn, isTaskUrgent } from '@/lib/utils';
import ActionMenu from '@/components/ui/ActionMenu';
import { ClientTaskWithClient } from './types';

type TaskStatus = 'to_prepare' | 'in_progress' | 'achieved';

interface TaskCardProps {
  task: ClientTaskWithClient;
  colId: TaskStatus;
  isDesktop: boolean;
  isContextMenuOpen: boolean;
  modalOpen: boolean;
  handleDragStart: (e: React.DragEvent, taskId: string) => void;
  handleContextMenu: (e: React.MouseEvent, task: ClientTaskWithClient) => void;
  handleCardClick: (e: React.MouseEvent, task: ClientTaskWithClient) => void;
  handleStatusChange: (taskId: string, nextStatus: TaskStatus) => void;
  handleEditClick: (task: ClientTaskWithClient) => void;
  handleDeleteClick: (taskId: string) => void;
}

export function TaskCard({
  task,
  colId,
  isDesktop,
  isContextMenuOpen,
  modalOpen,
  handleDragStart,
  handleContextMenu,
  handleCardClick,
  handleStatusChange,
  handleEditClick,
  handleDeleteClick,
}: TaskCardProps) {
  const urgent = isTaskUrgent(task);
  const now = React.useMemo(() => new Date(), []);

  // Calculate days remaining/overdue
  let dateLabel = '';
  let dateColorClass = 'text-muted-foreground bg-muted/20 border-border/60';
  if (task.targetDate) {
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
      draggable={isDesktop && !isContextMenuOpen && !modalOpen}
      onDragStart={(e) => handleDragStart(e, task.id)}
      onContextMenu={(e) => handleContextMenu(e, task)}
      onClick={(e) => handleCardClick(e, task)}
      className={cn(
        'group relative bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 select-none',
        isDesktop ? 'cursor-grab active:cursor-grabbing active:scale-[0.98]' : 'cursor-pointer active:bg-muted/30',
        urgent && 'border-red-500/20 dark:border-red-500/30 ring-1 ring-red-500/10 dark:ring-red-500/20 bg-red-500/[0.01]',
        isContextMenuOpen && 'border-primary ring-1 ring-primary/20 bg-primary/[0.02]'
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
          {colId !== 'achieved' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(task.id, 'achieved');
              }}
              title="Mark Achieved"
              className="p-1 rounded text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
            >
              <Check size={11} />
            </button>
          )}
          {colId === 'to_prepare' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(task.id, 'in_progress');
              }}
              title="Move to In Progress"
              className="p-1 rounded text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"
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
                ...(task.status !== 'to_prepare' ? [{
                  key: 'to_prepare',
                  label: 'Move to To Prepare',
                  icon: <ClipboardList size={12} className="text-zinc-500" />,
                  onSelect: () => handleStatusChange(task.id, 'to_prepare'),
                }] : []),
                ...(task.status !== 'in_progress' ? [{
                  key: 'in_progress',
                  label: 'Move to In Progress',
                  icon: <Clock size={12} className="text-blue-500" />,
                  onSelect: () => handleStatusChange(task.id, 'in_progress'),
                }] : []),
                ...(task.status !== 'achieved' ? [{
                  key: 'achieved',
                  label: 'Move to Achieved',
                  icon: <Check size={12} className="text-emerald-500" />,
                  onSelect: () => handleStatusChange(task.id, 'achieved'),
                }] : []),
                {
                  key: 'delete',
                  label: 'Delete task',
                  icon: <Trash2 size={12} className="text-red-500" />,
                  onSelect: () => handleDeleteClick(task.id),
                  destructive: true,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
