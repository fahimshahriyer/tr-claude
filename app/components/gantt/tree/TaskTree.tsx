'use client';

import React, { useMemo } from 'react';
import { useGantt } from '../core/GanttContext';
import { GanttTask } from '../core/types';
import { TaskRow } from './TaskRow';

interface TaskTreeProps {
  scrollRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function TaskTree({ scrollRef, onScroll }: TaskTreeProps) {
  const { state } = useGantt();
  const { tasks, columns } = state;

  // Calculate visible tasks based on hierarchy and expanded state
  const visibleTasks = useMemo(() => {
    const visible: GanttTask[] = [];

    const addVisibleTasks = (parentId: string | null, level: number) => {
      const childTasks = tasks.filter((t) => t.parentId === parentId);

      childTasks.forEach((task) => {
        visible.push(task);

        // If task is expanded and has children, recursively add them
        if (task.expanded && task.children && task.children.length > 0) {
          addVisibleTasks(task.id, level + 1);
        }
      });
    };

    // Start with root tasks (parentId === null)
    addVisibleTasks(null, 0);

    return visible;
  }, [tasks]);

  // Calculate total column width
  const totalColumnWidth = useMemo(() => {
    return columns.reduce((sum, col) => sum + col.width, 0);
  }, [columns]);

  return (
    <div className="flex flex-col h-full bg-slate-800 overflow-hidden">
      {/* Scrollable container with sticky header */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto"
        onScroll={onScroll}
      >
        {/* Column Headers - Sticky within scroll container */}
        <div
          className="sticky top-0 z-10 h-10 bg-slate-700 border-b border-slate-600 flex items-center"
          style={{ minWidth: totalColumnWidth }}
        >
          {columns.map((column) => (
            <div
              key={column.id}
              className="px-3 text-slate-200 text-xs font-semibold flex items-center border-r border-slate-600 flex-shrink-0"
              style={{ width: column.width }}
            >
              {column.title}
            </div>
          ))}
        </div>

        {/* Task Rows */}
        {visibleTasks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-slate-400 text-sm">No tasks</span>
          </div>
        ) : (
          <div style={{ minWidth: totalColumnWidth }}>
            {visibleTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                columns={columns}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
