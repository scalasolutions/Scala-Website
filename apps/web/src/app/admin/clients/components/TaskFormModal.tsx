'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import SectionHeading from '@/components/ui/SectionHeading';

type TaskStatus = 'to_prepare' | 'in_progress' | 'achieved';

interface TaskFormModalProps {
  isEditing: boolean;
  clientName: string;
  titleInputRef: React.Ref<HTMLInputElement>;
  title: string;
  onTitleChange: (value: string) => void;
  titleError: string;
  description: string;
  onDescriptionChange: (value: string) => void;
  status: TaskStatus;
  onStatusChange: (value: TaskStatus) => void;
  targetDate: string;
  onTargetDateChange: (value: string) => void;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Modal for creating or editing a client task / follow-up.
 *
 * Render only once the host page is mounted (createPortal targets document.body).
 */
export function TaskFormModal({
  isEditing,
  clientName,
  titleInputRef,
  title,
  onTitleChange,
  titleError,
  description,
  onDescriptionChange,
  status,
  onStatusChange,
  targetDate,
  onTargetDateChange,
  isSaving,
  onCancel,
  onSubmit,
}: TaskFormModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-md"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
        <div className="p-6 sm:p-8 text-left">
          <SectionHeading
            title={isEditing ? 'Edit Task Details' : 'Create Client Task'}
            description={`Task/update follow-up for ${clientName}`}
            action={
              <button
                onClick={onCancel}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            }
          />

          <form onSubmit={onSubmit} className="space-y-5 mt-4">
            <Input
              ref={titleInputRef}
              label="Task / Update Title *"
              required
              placeholder="e.g. Review environment variables"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              error={titleError || undefined}
            />

            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                Description
              </label>
              <Textarea
                placeholder="Add details, notes, or guidelines..."
                rows={3}
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Status / Column
                </label>
                <Select
                  value={status}
                  onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
                >
                  <option value="to_prepare">To Prepare</option>
                  <option value="in_progress">In Progress</option>
                  <option value="achieved">Achieved</option>
                </Select>
              </div>

              <Input
                label="Target Date / Due Date"
                type="date"
                value={targetDate}
                onChange={(e) => onTargetDateChange(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-border mt-6">
              <Button type="button" variant="ghost" size="md" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin mr-1.5" size={14} />
                    Saving...
                  </>
                ) : (
                  isEditing ? 'Save Changes' : 'Create Task'
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
