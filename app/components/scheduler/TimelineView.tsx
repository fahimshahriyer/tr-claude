'use client';

import React from 'react';
import { ScheduledTask } from './Scheduler';

interface TimelineViewProps {
  tasks: ScheduledTask[];
  selectedDate: Date;
  onUpdateTask: (id: string, updates: Partial<ScheduledTask>) => void;
  onDeleteTask: (id: string) => void;
}

export function TimelineView({
  tasks,
  selectedDate,
  onUpdateTask,
  onDeleteTask,
}: TimelineViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getTasksForHour = (hour: number) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.startTime);
      const taskHour = taskDate.getHours();
      const isSameDay =
        taskDate.getDate() === selectedDate.getDate() &&
        taskDate.getMonth() === selectedDate.getMonth() &&
        taskDate.getFullYear() === selectedDate.getFullYear();

      return isSameDay && taskHour === hour;
    });
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const getTaskDuration = (task: ScheduledTask) => {
    const start = new Date(task.startTime);
    const end = new Date(task.endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    return durationMinutes;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-500 bg-green-500/10';
      case 'in-progress': return 'border-blue-500 bg-blue-500/10';
      case 'cancelled': return 'border-red-500 bg-red-500/10';
      default: return 'border-purple-500 bg-purple-500/10';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white">
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </h2>
      </div>

      <div className="space-y-1">
        {hours.map(hour => {
          const hourTasks = getTasksForHour(hour);
          const currentHour = new Date().getHours();
          const isCurrentHour =
            hour === currentHour &&
            selectedDate.toDateString() === new Date().toDateString();

          return (
            <div
              key={hour}
              className={`
                flex gap-4 p-3 rounded-lg border transition-all
                ${isCurrentHour
                  ? 'bg-blue-500/10 border-blue-500/50'
                  : 'bg-slate-700/20 border-slate-600/50'
                }
              `}
            >
              <div className="w-24 flex-shrink-0">
                <div className={`text-sm font-semibold ${isCurrentHour ? 'text-blue-400' : 'text-slate-400'}`}>
                  {formatHour(hour)}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {hourTasks.length > 0 ? (
                  hourTasks.map(task => (
                    <div
                      key={task.id}
                      className={`p-4 rounded-lg border-2 ${getStatusColor(task.status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: task.color }}
                            />
                            <h4 className="text-white font-semibold">{task.title}</h4>
                            <span className="px-2 py-0.5 rounded text-xs bg-slate-600 text-slate-200">
                              {task.category}
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm mb-2">
                            {task.description}
                          </p>
                          <div className="flex gap-4 text-xs text-slate-400">
                            <span>
                              {new Date(task.startTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {' - '}
                              {new Date(task.endTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span>
                              Duration: {getTaskDuration(task)} min
                            </span>
                            <span className="capitalize">
                              Priority: {task.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={task.status}
                            onChange={(e) =>
                              onUpdateTask(task.id, {
                                status: e.target.value as ScheduledTask['status'],
                              })
                            }
                            className="px-2 py-1 rounded bg-slate-700 text-slate-200 text-xs border border-slate-600"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-sm italic">No tasks</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
