'use client';

import React from 'react';
import { GanttProvider } from './core/GanttContext';
import { GanttTask, GanttDependency, GanttColumn } from './core/types';
import { TaskTree } from './tree/TaskTree';

interface GanttProps {
  tasks?: GanttTask[];
  dependencies?: GanttDependency[];
  columns?: GanttColumn[];
  className?: string;
}

export function Gantt({
  tasks = [],
  dependencies = [],
  columns,
  className = '',
}: GanttProps) {
  return (
    <GanttProvider
      initialTasks={tasks}
      initialDependencies={dependencies}
      initialColumns={columns}
    >
      <GanttInner className={className} />
    </GanttProvider>
  );
}

function GanttInner({ className }: { className: string }) {
  return (
    <div className={`h-screen flex flex-col bg-slate-900 ${className}`}>
      {/* Toolbar */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-4">
        <span className="text-white text-sm font-semibold">Gantt Chart</span>
        <div className="ml-auto flex items-center gap-2">
          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">
            + Add Task
          </button>
          <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded">
            Zoom In
          </button>
          <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded">
            Zoom Out
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Task Tree Panel (Left) */}
        <div className="w-[600px] border-r border-slate-700 overflow-hidden">
          <TaskTree />
        </div>

        {/* Timeline Panel (Right) */}
        <div className="flex-1 bg-slate-900 flex flex-col overflow-hidden">
          {/* Time Axis Header */}
          <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center justify-center">
            <span className="text-slate-300 text-xs">Timeline Header (Multi-tier)</span>
          </div>

          {/* Timeline Grid + Bars */}
          <div className="flex-1 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <span className="text-slate-400 text-sm">Timeline Panel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
