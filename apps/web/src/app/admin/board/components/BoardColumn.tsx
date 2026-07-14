'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';

import { ClientTaskWithClient } from './types';

type TaskStatus = 'to_prepare' | 'in_progress' | 'achieved';

interface BoardColumnProps {
  col: { id: TaskStatus; label: string; description: string };
  columnTasks: ClientTaskWithClient[];
  activeTab: TaskStatus;
  dragOverColumn: TaskStatus | null;
  loading: boolean;
  handleDragOver: (e: React.DragEvent, colId: TaskStatus) => void;
  handleDrop: (e: React.DragEvent, colId: TaskStatus) => void;
  setDragOverColumn: (colId: TaskStatus | null) => void;
  children: React.ReactNode;
}

export function BoardColumn({
  col,
  columnTasks,
  activeTab,
  dragOverColumn,
  loading,
  handleDragOver,
  handleDrop,
  setDragOverColumn,
  children,
}: BoardColumnProps) {
  const isOver = dragOverColumn === col.id;

  const getColumnHeaderBg = (status: TaskStatus) => {
    if (status === 'to_prepare') return 'border-t-2 border-t-zinc-400 bg-zinc-500/5 dark:bg-zinc-400/5';
    if (status === 'in_progress') return 'border-t-2 border-t-blue-500 bg-blue-500/5 dark:bg-blue-400/5';
    return 'border-t-2 border-t-emerald-500 bg-emerald-500/5 dark:bg-emerald-400/5';
  };

  return (
    <div
      onDragOver={(e) => handleDragOver(e, col.id)}
      onDrop={(e) => handleDrop(e, col.id)}
      onDragLeave={() => setDragOverColumn(null)}
      className={cn(
        'rounded-2xl border border-border bg-card/60 backdrop-blur-sm transition-all duration-300 min-h-[500px] flex flex-col',
        activeTab !== col.id ? 'hidden md:flex' : 'flex',
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
          children
        )}
      </div>
    </div>
  );
}
