'use client';

import React, { useMemo } from 'react';
import { GanttTask, ZoomLevel } from '../core/types';
import { useGantt } from '../core/GanttContext';

interface TaskBarProps {
  task: GanttTask;
  rowIndex: number;
  rowHeight: number;
  timelineStart: Date;
  zoomLevel: ZoomLevel;
}

export function TaskBar({
  task,
  rowIndex,
  rowHeight,
  timelineStart,
  zoomLevel,
}: TaskBarProps) {
  const { state, dispatch } = useGantt();
  const { selection } = state;

  const isSelected = selection.selectedTaskIds.includes(task.id);

  // Calculate position and width
  const { left, width } = useMemo(() => {
    const dayInMs = 24 * 60 * 60 * 1000;
    const startOffset = (task.startDate.getTime() - timelineStart.getTime()) / dayInMs;
    const duration = (task.endDate.getTime() - task.startDate.getTime()) / dayInMs;

    return {
      left: startOffset * zoomLevel.cellWidth,
      width: Math.max(duration * zoomLevel.cellWidth, 10), // Minimum 10px width
    };
  }, [task, timelineStart, zoomLevel]);

  const handleClick = () => {
    dispatch({ type: 'SELECT_TASK', payload: task.id });
  };

  // Different rendering based on task type
  if (task.type === 'milestone') {
    return (
      <div
        className={`
          absolute cursor-pointer transition-all
          ${isSelected ? 'z-20' : 'z-10'}
        `}
        style={{
          left: left - 8,
          top: rowIndex * rowHeight + rowHeight / 2 - 8,
          width: 16,
          height: 16,
        }}
        onClick={handleClick}
      >
        <div
          className={`
            w-4 h-4 rotate-45 transition-all
            ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900' : ''}
          `}
          style={{ backgroundColor: task.color || '#14b8a6' }}
          title={`${task.name} - ${task.startDate.toLocaleDateString()}`}
        />
      </div>
    );
  }

  if (task.type === 'summary') {
    return (
      <div
        className={`
          absolute cursor-pointer transition-all
          ${isSelected ? 'z-20' : 'z-10'}
        `}
        style={{
          left,
          top: rowIndex * rowHeight + 8,
          width,
          height: rowHeight - 16,
        }}
        onClick={handleClick}
      >
        {/* Summary bracket bar */}
        <div
          className={`
            relative h-full transition-all
            ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900 rounded' : ''}
          `}
        >
          {/* Top bracket */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: task.color || '#3b82f6' }}
          />

          {/* Left edge */}
          <div
            className="absolute top-0 left-0 bottom-0 w-1"
            style={{ backgroundColor: task.color || '#3b82f6' }}
          />

          {/* Right edge */}
          <div
            className="absolute top-0 right-0 bottom-0 w-1"
            style={{ backgroundColor: task.color || '#3b82f6' }}
          />

          {/* Bottom bracket */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ backgroundColor: task.color || '#3b82f6' }}
          />

          {/* Task name */}
          <div className="absolute inset-0 flex items-center px-2">
            <span className="text-xs text-white font-medium truncate">
              {task.name}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Regular task
  return (
    <div
      className={`
        absolute cursor-pointer transition-all group
        ${isSelected ? 'z-20' : 'z-10'}
      `}
      style={{
        left,
        top: rowIndex * rowHeight + 8,
        width,
        height: rowHeight - 16,
      }}
      onClick={handleClick}
    >
      <div
        className={`
          relative h-full rounded transition-all overflow-hidden
          ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900' : ''}
          hover:brightness-110
        `}
        style={{
          background: `linear-gradient(to right, ${task.color || '#10b981'} ${task.progress}%, ${task.color || '#10b981'}40 ${task.progress}%)`,
        }}
      >
        {/* Task name */}
        <div className="absolute inset-0 flex items-center px-2">
          <span className="text-xs text-white font-medium truncate drop-shadow-sm">
            {task.name}
          </span>
        </div>

        {/* Progress percentage */}
        {task.progress > 0 && width > 60 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <span className="text-xs text-white/80 font-semibold">
              {task.progress}%
            </span>
          </div>
        )}

        {/* Resize handles (for future drag/resize) */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-ew-resize" />
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-ew-resize" />
      </div>
    </div>
  );
}
