'use client';

import React from 'react';
import { useGantt } from '../core/GanttContext';
import { GanttTask, GanttColumn } from '../core/types';

interface TaskRowProps {
  task: GanttTask;
  columns: GanttColumn[];
}

export function TaskRow({ task, columns }: TaskRowProps) {
  const { state, dispatch } = useGantt();
  const { selection } = state;

  const isSelected = selection.selectedTaskIds.includes(task.id);
  const hasChildren = task.children && task.children.length > 0;

  const handleClick = () => {
    dispatch({ type: 'SELECT_TASK', payload: task.id });
  };

  const handleExpandCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.expanded) {
      dispatch({ type: 'COLLAPSE_TASK', payload: task.id });
    } else {
      dispatch({ type: 'EXPAND_TASK', payload: task.id });
    }
  };

  return (
    <div
      className={`
        flex items-center h-10 border-b border-slate-700 cursor-pointer
        hover:bg-slate-700/50 transition-colors
        ${isSelected ? 'bg-blue-600/20 border-l-4 border-l-blue-500' : ''}
      `}
      onClick={handleClick}
    >
      {columns.map((column, index) => (
        <div
          key={column.id}
          className="px-3 text-slate-200 text-sm flex items-center border-r border-slate-600/30"
          style={{ width: column.width }}
        >
          {/* First column includes hierarchy controls */}
          {index === 0 && (
            <>
              {/* Indentation */}
              <div style={{ width: task.level * 20 }} />

              {/* Expand/collapse chevron */}
              {hasChildren ? (
                <button
                  onClick={handleExpandCollapse}
                  className="mr-2 w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  {task.expanded ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                    </svg>
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}

              {/* Task type icon */}
              <div className="mr-2 w-4 h-4 flex items-center justify-center">
                {task.type === 'milestone' && (
                  <div className="w-2 h-2 bg-teal-500 rotate-45" title="Milestone" />
                )}
                {task.type === 'summary' && (
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                )}
                {task.type === 'task' && (
                  <div className="w-3 h-3 border-2 border-slate-400 rounded-sm" title="Task" />
                )}
              </div>
            </>
          )}

          {/* Cell content */}
          {renderCellContent(column, task)}
        </div>
      ))}
    </div>
  );
}

function renderCellContent(column: GanttColumn, task: GanttTask) {
  const field = column.field as keyof GanttTask;
  const value = task[field];

  // Custom cell renderer
  if (column.renderCell) {
    return column.renderCell(task);
  }

  // Date formatting
  if (field === 'startDate' || field === 'endDate') {
    if (value instanceof Date) {
      return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return '';
  }

  // Duration formatting
  if (field === 'duration') {
    return `${value}d`;
  }

  // Progress formatting
  if (field === 'progress') {
    return (
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 w-10 text-right">{value}%</span>
      </div>
    );
  }

  // Name with color indicator
  if (field === 'name') {
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {task.color && (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: task.color }}
          />
        )}
        <span className="truncate">{String(value)}</span>
      </div>
    );
  }

  // Default: string conversion
  return String(value || '');
}
