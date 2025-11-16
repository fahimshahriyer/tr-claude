'use client';

import React from 'react';
import { ScheduledTask } from './Scheduler';

interface CalendarViewProps {
  tasks: ScheduledTask[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onUpdateTask: (id: string, updates: Partial<ScheduledTask>) => void;
  onDeleteTask: (id: string) => void;
}

export function CalendarView({
  tasks,
  selectedDate,
  onSelectDate,
  onUpdateTask,
  onDeleteTask,
}: CalendarViewProps) {
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  const getTasksForDay = (day: number) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.startTime);
      return (
        taskDate.getDate() === day &&
        taskDate.getMonth() === selectedDate.getMonth() &&
        taskDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-slate-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {emptyDays.map(i => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {days.map(day => {
          const dayTasks = getTasksForDay(day);
          const today = isToday(day);

          return (
            <div
              key={day}
              className={`
                aspect-square p-2 rounded-lg border transition-all cursor-pointer
                ${today
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50'
                }
              `}
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(day);
                onSelectDate(newDate);
              }}
            >
              <div className={`text-sm font-semibold mb-1 ${today ? 'text-blue-400' : 'text-slate-300'}`}>
                {day}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    className="text-xs p-1 rounded truncate"
                    style={{ backgroundColor: task.color || '#6b7280' }}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-slate-400">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Tasks */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">
          Tasks for {selectedDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </h3>
        <div className="space-y-3">
          {getTasksForDay(selectedDate.getDate()).map(task => (
            <div
              key={task.id}
              className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                    <h4 className="text-white font-semibold">{task.title}</h4>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">{task.description}</p>
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
                    <span className="px-2 py-0.5 rounded bg-slate-600">
                      {task.category}
                    </span>
                  </div>
                </div>
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
          ))}
          {getTasksForDay(selectedDate.getDate()).length === 0 && (
            <div className="text-center text-slate-400 py-8">
              No tasks scheduled for this day
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
