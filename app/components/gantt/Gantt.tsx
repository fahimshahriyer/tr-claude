'use client';

import React from 'react';
import { GanttProvider, useGantt } from './core/GanttContext';
import { GanttTask, GanttDependency, GanttColumn } from './core/types';
import { TaskTree } from './tree/TaskTree';
import { Timeline } from './timeline/Timeline';

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
  const { state, dispatch } = useGantt();
  const treeScrollRef = React.useRef<HTMLDivElement>(null);
  const timelineScrollRef = React.useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    dispatch({ type: 'ZOOM_IN' });
  };

  const handleZoomOut = () => {
    dispatch({ type: 'ZOOM_OUT' });
  };

  // Sync vertical scroll between tree and timeline
  const handleTreeScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (treeScrollRef.current) {
      treeScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className={`h-screen flex flex-col bg-slate-900 ${className}`}>
      {/* Toolbar */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-4">
        <span className="text-white text-sm font-semibold">Gantt Chart</span>
        <div className="ml-4 flex items-center gap-2">
          <span className="text-slate-400 text-xs">Zoom: {state.zoomLevel.name}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
            + Add Task
          </button>
          <button
            onClick={handleZoomIn}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
          >
            🔍+ Zoom In
          </button>
          <button
            onClick={handleZoomOut}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
          >
            🔍− Zoom Out
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Task Tree Panel (Left) */}
        <div className="w-[600px] border-r border-slate-700 overflow-hidden">
          <TaskTree
            scrollRef={treeScrollRef}
            onScroll={handleTreeScroll}
          />
        </div>

        {/* Timeline Panel (Right) */}
        <div className="flex-1 overflow-hidden">
          <Timeline
            scrollRef={timelineScrollRef}
            onScroll={handleTimelineScroll}
          />
        </div>
      </div>
    </div>
  );
}
