'use client';

import React, { useMemo } from 'react';
import { useGantt } from '../core/GanttContext';
import { TimeAxis } from './TimeAxis';
import { TaskBar } from './TaskBar';
import { GanttTask } from '../core/types';

export function Timeline() {
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
      {/* Time Axis Header */}
      <div className="flex-shrink-0 sticky top-0 z-10">
        <TimeAxis
          startDate={timelineStart}
          endDate={timelineEnd}
          zoomLevel={zoomLevel}
        />
      </div>

      {/* Timeline Grid + Task Bars */}
      <div className="flex-1 overflow-auto relative">
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
        </div>
      </div>
    </div>
  );
}
