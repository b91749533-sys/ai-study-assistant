'use client';

import * as React from 'react';
import { toggleTaskCompleteAction } from '@/app/actions/plannerActions';
import { CheckSquare, Square, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  isCompleted: boolean;
}

interface DashboardTasksListProps {
  initialTasks: Task[];
}

export function DashboardTasksList({ initialTasks }: DashboardTasksListProps) {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const handleToggle = async (taskId: string) => {
    setLoadingId(taskId);
    const res = await toggleTaskCompleteAction(taskId);
    if (res.success && res.task) {
      setTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, isCompleted: res.task.isCompleted } : t)
      );
    }
    setLoadingId(null);
  };

  const activeTasks = tasks.filter(t => !t.isCompleted).slice(0, 5);

  return (
    <div className="space-y-4">
      {activeTasks.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
          No upcoming study tasks. Generate a plan!
        </div>
      ) : (
        <div className="divide-y border rounded-xl overflow-hidden bg-card">
          {activeTasks.map(task => {
            const isToggling = loadingId === task.id;
            const dateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date';
            return (
              <div key={task.id} className="flex items-start justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleToggle(task.id)}
                    disabled={isToggling}
                    className="mt-0.5 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-50"
                  >
                    {isToggling ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin text-indigo-500" />
                    ) : task.isCompleted ? (
                      <CheckSquare className="h-4.5 w-4.5 text-indigo-500" />
                    ) : (
                      <Square className="h-4.5 w-4.5" />
                    )}
                  </button>
                  <div>
                    <h4 className="text-xs font-semibold">{task.title}</h4>
                    {task.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 max-w-sm line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full border whitespace-nowrap">
                  <Calendar className="h-3 w-3" />
                  <span>{dateStr}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
