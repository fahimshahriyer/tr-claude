'use client';

import React, { useMemo } from 'react';
import { useGantt } from '../core/GanttContext';
import { GanttTask } from '../core/types';
import { TaskRow } from './TaskRow';

export function TaskTree() {
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
    <div className="flex flex-col h-full bg-slate-800">
      {/* Column Headers */}
      <div
        className="flex-shrink-0 h-10 bg-slate-700 border-b border-slate-600 flex items-center sticky top-0 z-10"
        style={{ width: totalColumnWidth }}
      >
        {columns.map((column) => (
          <div
            key={column.id}
            className="px-3 text-slate-200 text-xs font-semibold flex items-center border-r border-slate-600"
            style={{ width: column.width }}
          >
            {column.title}
          </div>
        ))}
      </div>

      {/* Task Rows */}
      <div className="flex-1 overflow-auto">
        {visibleTasks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-slate-400 text-sm">No tasks</span>
          </div>
        ) : (
          visibleTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              columns={columns}
            />
          ))
        )}
      </div>
    </div>
  );
}
