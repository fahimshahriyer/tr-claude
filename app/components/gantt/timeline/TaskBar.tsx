'use client';

import React, { useMemo, useEffect, useCallback } from 'react';
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

  // Calculate dates from pixel position
  const calculateDateFromX = useCallback(
    (x: number): Date => {
      const dayInMs = 24 * 60 * 60 * 1000;
      const dayOffset = x / zoomLevel.cellWidth;
      return new Date(timelineStart.getTime() + dayOffset * dayInMs);
    },
    [timelineStart, zoomLevel]
  );

  // Drag handlers
  const handleMouseDownMove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({
        type: 'START_DRAG',
        payload: {
          taskId: task.id,
          dragType: 'move',
          startX: e.clientX,
          startY: e.clientY,
        },
      });
    },
    [dispatch, task.id]
  );

  const handleMouseDownResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({
        type: 'START_DRAG',
        payload: {
          taskId: task.id,
          dragType: 'resize-start',
          startX: e.clientX,
          startY: e.clientY,
        },
      });
    },
    [dispatch, task.id]
  );

  const handleMouseDownResizeEnd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({
        type: 'START_DRAG',
        payload: {
          taskId: task.id,
          dragType: 'resize-end',
          startX: e.clientX,
          startY: e.clientY,
        },
      });
    },
    [dispatch, task.id]
  );

  // Global mouse move/up handlers
  useEffect(() => {
    if (!state.dragState.isDragging || state.dragState.taskId !== task.id) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - state.dragState.startX;
      const dayInMs = 24 * 60 * 60 * 1000;
      const dayDelta = deltaX / zoomLevel.cellWidth;
      const timeDelta = dayDelta * dayInMs;

      let ghostTask: GanttTask;

      if (state.dragState.dragType === 'move') {
        // Move entire task
        ghostTask = {
          ...task,
          startDate: new Date(task.startDate.getTime() + timeDelta),
          endDate: new Date(task.endDate.getTime() + timeDelta),
        };
      } else if (state.dragState.dragType === 'resize-start') {
        // Resize start date
        const newStartDate = new Date(task.startDate.getTime() + timeDelta);
        const newDuration = (task.endDate.getTime() - newStartDate.getTime()) / dayInMs;
        ghostTask = {
          ...task,
          startDate: newStartDate,
          duration: Math.max(newDuration, 1), // Minimum 1 day
        };
      } else {
        // Resize end date
        const newEndDate = new Date(task.endDate.getTime() + timeDelta);
        const newDuration = (newEndDate.getTime() - task.startDate.getTime()) / dayInMs;
        ghostTask = {
          ...task,
          endDate: newEndDate,
          duration: Math.max(newDuration, 1), // Minimum 1 day
        };
      }

      dispatch({
        type: 'UPDATE_DRAG',
        payload: {
          currentX: e.clientX,
          currentY: e.clientY,
          ghostTask,
        },
      });
    };

    const handleMouseUp = () => {
      dispatch({ type: 'END_DRAG' });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch({ type: 'CANCEL_DRAG' });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.dragState, task, dispatch, zoomLevel, calculateDateFromX]);

  // Different rendering based on task type
  if (task.type === 'milestone') {
    const isDragging = state.dragState.isDragging && state.dragState.taskId === task.id;

    return (
      <div
        className={`
          absolute transition-all
          ${isSelected ? 'z-20' : 'z-10'}
          ${isDragging ? 'opacity-50' : 'cursor-pointer'}
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
          onMouseDown={handleMouseDownMove}
        />
      </div>
    );
  }

  if (task.type === 'summary') {
    const isDragging = state.dragState.isDragging && state.dragState.taskId === task.id;

    return (
      <div
        className={`
          absolute transition-all
          ${isSelected ? 'z-20' : 'z-10'}
          ${isDragging ? 'opacity-50' : 'cursor-pointer'}
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
          onMouseDown={handleMouseDownMove}
        >
          {/* Top bracket */}
          <div
            className="absolute top-0 left-0 right-0 h-1 pointer-events-none"
            style={{ backgroundColor: task.color || '#3b82f6' }}
          />

          {/* Left edge */}
          <div
            className="absolute top-0 left-0 bottom-0 w-1 pointer-events-none"
            style={{ backgroundColor: task.color || '#3b82f6' }}
          />

          {/* Right edge */}
          <div
            className="absolute top-0 right-0 bottom-0 w-1 pointer-events-none"
            style={{ backgroundColor: task.color || '#3b82f6' }}
          />

          {/* Bottom bracket */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1 pointer-events-none"
            style={{ backgroundColor: task.color || '#3b82f6' }}
          />

          {/* Task name */}
          <div className="absolute inset-0 flex items-center px-2 pointer-events-none">
            <span className="text-xs text-white font-medium truncate">
              {task.name}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Regular task
  const isDragging = state.dragState.isDragging && state.dragState.taskId === task.id;

  return (
    <div
      className={`
        absolute transition-all group
        ${isSelected ? 'z-20' : 'z-10'}
        ${isDragging ? 'opacity-50' : 'cursor-pointer'}
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
        onMouseDown={handleMouseDownMove}
      >
        {/* Task name */}
        <div className="absolute inset-0 flex items-center px-2 pointer-events-none">
          <span className="text-xs text-white font-medium truncate drop-shadow-sm">
            {task.name}
          </span>
        </div>

        {/* Progress percentage */}
        {task.progress > 0 && width > 60 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="text-xs text-white/80 font-semibold">
              {task.progress}%
            </span>
          </div>
        )}

        {/* Resize handles */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-ew-resize"
          onMouseDown={handleMouseDownResizeStart}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-ew-resize"
          onMouseDown={handleMouseDownResizeEnd}
        />
      </div>
    </div>
  );
}
