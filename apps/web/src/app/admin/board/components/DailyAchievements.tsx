'use client';

import React from 'react';
import { CheckCircle2, Clock, Building } from 'lucide-react';
import Card from '@/components/ui/Card';
import SectionHeading from '@/components/ui/SectionHeading';
import Badge from '@/components/ui/Badge';

import { ClientTaskWithClient } from './types';

interface DailyAchievementsProps {
  groupedAchievements: Record<string, ClientTaskWithClient[]>;
}

export function DailyAchievements({ groupedAchievements }: DailyAchievementsProps) {
  return (
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
            <span>No updates achieved yet. Start moving items to &apos;Achieved&apos;!</span>
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
  );
}
