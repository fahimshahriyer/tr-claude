'use client';

import React, { useState } from 'react';
import { CalendarView } from './CalendarView';
import { TimelineView } from './TimelineView';
import { ScheduleControls } from './ScheduleControls';

export interface ScheduledTask {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  category: string;
  color?: string;
}

export type ViewMode = 'calendar' | 'timeline';

export function Scheduler() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [tasks, setTasks] = useState<ScheduledTask[]>([
    {
      id: '1',
      title: 'Team Meeting',
      description: 'Weekly sync with the development team',
      startTime: new Date(2025, 10, 17, 10, 0),
      endTime: new Date(2025, 10, 17, 11, 0),
      priority: 'high',
      status: 'scheduled',
      category: 'Meetings',
      color: '#3b82f6',
    },
    {
      id: '2',
      title: 'Code Review',
      description: 'Review pull requests for the new feature',
      startTime: new Date(2025, 10, 17, 14, 0),
      endTime: new Date(2025, 10, 17, 15, 30),
      priority: 'medium',
      status: 'scheduled',
      category: 'Development',
      color: '#8b5cf6',
    },
    {
      id: '3',
      title: 'Project Planning',
      description: 'Plan next sprint deliverables',
      startTime: new Date(2025, 10, 18, 9, 0),
      endTime: new Date(2025, 10, 18, 10, 30),
      priority: 'high',
      status: 'scheduled',
      category: 'Planning',
      color: '#10b981',
    },
  ]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const addTask = (task: Omit<ScheduledTask, 'id'>) => {
    const newTask: ScheduledTask = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (id: string, updates: Partial<ScheduledTask>) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Task Scheduler
          </h1>
          <p className="text-slate-300 text-lg">
            Organize and manage your tasks with precision
          </p>
        </header>

        <ScheduleControls
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onAddTask={addTask}
        />

        <div className="mt-8">
          {viewMode === 'calendar' ? (
            <CalendarView
              tasks={tasks}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
            />
          ) : (
            <TimelineView
              tasks={tasks}
              selectedDate={selectedDate}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
            />
          )}
        </div>
      </div>
    </div>
  );
}
