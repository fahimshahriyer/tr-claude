'use client';

import React, { useMemo } from 'react';
import { useGantt } from '../core/GanttContext';
import { TimeAxis } from './TimeAxis';
import { TaskBar } from './TaskBar';
import { DependencyLines } from '../dependencies/DependencyLines';
import { GanttTask } from '../core/types';

interface TimelineProps {
  scrollRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function Timeline({ scrollRef, onScroll }: TimelineProps) {
  const { state } = useGantt();
  const { tasks, zoomLevel } = state;

  // Calculate visible tasks (matching task tree)
  const visibleTasks = useMemo(() => {
    const visible: GanttTask[] = [];

    const addVisibleTasks = (parentId: string | null) => {
      const childTasks = tasks.filter((t) => t.parentId === parentId);

      childTasks.forEach((task) => {
        visible.push(task);

        // If task is expanded and has children, recursively add them
        if (task.expanded && task.children && task.children.length > 0) {
          addVisibleTasks(task.id);
        }
      });
    };

    // Start with root tasks
    addVisibleTasks(null);

    return visible;
  }, [tasks]);

  // Calculate timeline dimensions
  const timelineStart = useMemo(() => {
    if (tasks.length === 0) return new Date();
    const dates = tasks.map((t) => t.startDate.getTime());
    return new Date(Math.min(...dates) - 7 * 24 * 60 * 60 * 1000); // 1 week before
  }, [tasks]);

  const timelineEnd = useMemo(() => {
    if (tasks.length === 0) return new Date();
    const dates = tasks.map((t) => t.endDate.getTime());
    return new Date(Math.max(...dates) + 7 * 24 * 60 * 60 * 1000); // 1 week after
  }, [tasks]);

  const timelineDuration = timelineEnd.getTime() - timelineStart.getTime();
  const dayInMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.ceil(timelineDuration / dayInMs);
  const totalWidth = totalDays * zoomLevel.cellWidth;

  const rowHeight = 40; // Match task tree row height

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Timeline Grid + Task Bars with sticky header */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto relative"
        onScroll={onScroll}
      >
        {/* Time Axis Header - Sticky, scrolls horizontally with content */}
        <div className="sticky top-0 z-20 bg-slate-900">
          <TimeAxis
            startDate={timelineStart}
            endDate={timelineEnd}
            zoomLevel={zoomLevel}
          />
        </div>

        {/* Timeline content */}
        <div
          className="relative"
          style={{
            width: totalWidth,
            height: visibleTasks.length * rowHeight,
          }}
        >
          {/* Vertical grid lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: totalWidth, height: visibleTasks.length * rowHeight }}
          >
            {Array.from({ length: totalDays }).map((_, i) => (
              <line
                key={i}
                x1={i * zoomLevel.cellWidth}
                y1={0}
                x2={i * zoomLevel.cellWidth}
                y2={visibleTasks.length * rowHeight}
                stroke="#334155"
                strokeWidth={1}
                opacity={0.3}
              />
            ))}

            {/* Horizontal grid lines */}
            {visibleTasks.map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * rowHeight}
                x2={totalWidth}
                y2={i * rowHeight}
                stroke="#334155"
                strokeWidth={1}
                opacity={0.3}
              />
            ))}
          </svg>

          {/* Dependency Lines */}
          <DependencyLines
            visibleTasks={visibleTasks}
            timelineStart={timelineStart}
            zoomLevel={zoomLevel}
            rowHeight={rowHeight}
          />

          {/* Task Bars */}
          {visibleTasks.map((task, index) => (
            <TaskBar
              key={task.id}
              task={task}
              rowIndex={index}
              rowHeight={rowHeight}
              timelineStart={timelineStart}
              zoomLevel={zoomLevel}
            />
          ))}

          {/* Today Marker */}
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayOffset = (today.getTime() - timelineStart.getTime()) / dayInMs;
            const todayX = todayOffset * zoomLevel.cellWidth;

            // Only show if today is within the timeline range
            if (todayX >= 0 && todayX <= totalWidth) {
              return (
                <>
                  {/* Vertical line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-30"
                    style={{ left: todayX }}
                  />
                  {/* Label at top */}
                  <div
                    className="absolute top-0 px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-b pointer-events-none z-30"
                    style={{ left: todayX - 20, transform: 'translateX(-50%)' }}
                  >
                    Today
                  </div>
                </>
              );
            }
            return null;
          })()}

          {/* Ghost Task Bar (during drag) */}
          {state.dragState.isDragging && state.dragState.ghostTask && (() => {
            const ghostTask = state.dragState.ghostTask;
            const taskIndex = visibleTasks.findIndex(t => t.id === ghostTask.id);

            if (taskIndex === -1) return null;

            const dayInMs = 24 * 60 * 60 * 1000;
            const startOffset = (ghostTask.startDate.getTime() - timelineStart.getTime()) / dayInMs;
            const duration = (ghostTask.endDate.getTime() - ghostTask.startDate.getTime()) / dayInMs;
            const left = startOffset * zoomLevel.cellWidth;
            const width = Math.max(duration * zoomLevel.cellWidth, 10);

            return (
              <div
                className="absolute pointer-events-none"
                style={{
                  left,
                  top: taskIndex * rowHeight + 8,
                  width,
                  height: rowHeight - 16,
                }}
              >
                <div
                  className="h-full rounded border-2 border-blue-400 bg-blue-400/20"
                  style={{
                    borderStyle: 'dashed',
                  }}
                >
                  <div className="absolute inset-0 flex items-center px-2">
                    <span className="text-xs text-blue-300 font-medium truncate">
                      {ghostTask.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
