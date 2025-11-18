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
  const [showAddTaskModal, setShowAddTaskModal] = React.useState(false);

  const handleZoomIn = () => {
    dispatch({ type: 'ZOOM_IN' });
  };

  const handleZoomOut = () => {
    dispatch({ type: 'ZOOM_OUT' });
  };

  const handleAddTask = () => {
    setShowAddTaskModal(true);
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

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const selectedTaskId = state.selection.selectedTaskIds[0];

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (selectedTaskId) {
            e.preventDefault();
            dispatch({ type: 'DELETE_TASK', payload: selectedTaskId });
          }
          break;

        case 'Escape':
          e.preventDefault();
          dispatch({ type: 'CLEAR_SELECTION' });
          break;

        case 'ArrowUp':
        case 'ArrowDown': {
          e.preventDefault();
          const currentIndex = state.tasks.findIndex((t) => t.id === selectedTaskId);

          if (e.key === 'ArrowUp' && currentIndex > 0) {
            dispatch({ type: 'SELECT_TASK', payload: state.tasks[currentIndex - 1].id });
          } else if (e.key === 'ArrowDown' && currentIndex < state.tasks.length - 1) {
            dispatch({ type: 'SELECT_TASK', payload: state.tasks[currentIndex + 1].id });
          } else if (!selectedTaskId && state.tasks.length > 0) {
            // If nothing selected, select first task
            dispatch({ type: 'SELECT_TASK', payload: state.tasks[0].id });
          }
          break;
        }

        case '+':
        case 'Insert':
          e.preventDefault();
          setShowAddTaskModal(true);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.selection.selectedTaskIds, state.tasks, dispatch]);

  return (
    <div className={`h-screen flex flex-col bg-slate-900 ${className}`}>
      {/* Toolbar */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-4">
        <span className="text-white text-sm font-semibold">Gantt Chart</span>
        <div className="ml-4 flex items-center gap-2">
          <span className="text-slate-400 text-xs">Zoom: {state.zoomLevel.name}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleAddTask}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
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

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <AddTaskModal
          onClose={() => setShowAddTaskModal(false)}
          onAdd={(task) => {
            dispatch({ type: 'ADD_TASK', payload: task });
            setShowAddTaskModal(false);
          }}
        />
      )}
    </div>
  );
}

interface AddTaskModalProps {
  onClose: () => void;
  onAdd: (task: GanttTask) => void;
}

function AddTaskModal({ onClose, onAdd }: AddTaskModalProps) {
  const [name, setName] = React.useState('');
  const [startDate, setStartDate] = React.useState(
    new Date().toISOString().split('T')[0]
  );
  const [duration, setDuration] = React.useState('5');
  const [type, setType] = React.useState<'task' | 'milestone' | 'summary'>('task');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const start = new Date(startDate);
    const durationNum = parseInt(duration, 10);
    const end = new Date(start);
    end.setDate(end.getDate() + (type === 'milestone' ? 0 : durationNum));

    const newTask: GanttTask = {
      id: `task-${Date.now()}`,
      name: name || 'New Task',
      type,
      startDate: start,
      endDate: end,
      duration: type === 'milestone' ? 0 : durationNum,
      progress: 0,
      parentId: null,
      children: [],
      level: 0,
      expanded: false,
      color: type === 'milestone' ? '#14b8a6' : type === 'summary' ? '#3b82f6' : '#10b981',
    };

    onAdd(newTask);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-96 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Add New Task</h2>

        <form onSubmit={handleSubmit}>
          {/* Task Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Task Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task name"
              autoFocus
            />
          </div>

          {/* Task Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Task Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'task' | 'milestone' | 'summary')}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="task">Task</option>
              <option value="milestone">Milestone</option>
              <option value="summary">Summary</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Duration */}
          {type !== 'milestone' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Duration (days)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
