'use client';

import React, { createContext, useContext, useReducer, useMemo } from 'react';
import {
  GanttTask,
  GanttDependency,
  GanttColumn,
  GanttState,
  DEFAULT_COLUMNS,
  DEFAULT_CALENDAR,
  DEFAULT_ZOOM_LEVELS,
} from './types';

// Action types
type GanttAction =
  | { type: 'ADD_TASK'; payload: GanttTask }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<GanttTask> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'EXPAND_TASK'; payload: string }
  | { type: 'COLLAPSE_TASK'; payload: string }
  | { type: 'SELECT_TASK'; payload: string }
  | { type: 'DESELECT_TASK'; payload: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_ZOOM'; payload: string }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'START_DRAG'; payload: { taskId: string; dragType: 'move' | 'resize-start' | 'resize-end'; startX: number; startY: number } }
  | { type: 'UPDATE_DRAG'; payload: { currentX: number; currentY: number; ghostTask: GanttTask } }
  | { type: 'END_DRAG' }
  | { type: 'CANCEL_DRAG' };

// Reducer
function ganttReducer(state: GanttState, action: GanttAction): GanttState {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates }
            : task
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
        dependencies: state.dependencies.filter(
          (dep) => dep.fromTaskId !== action.payload && dep.toTaskId !== action.payload
        ),
      };

    case 'EXPAND_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload ? { ...task, expanded: true } : task
        ),
      };

    case 'COLLAPSE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload ? { ...task, expanded: false } : task
        ),
      };

    case 'SELECT_TASK':
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedTaskIds: [action.payload],
        },
      };

    case 'DESELECT_TASK':
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedTaskIds: state.selection.selectedTaskIds.filter((id) => id !== action.payload),
        },
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selection: {
          selectedTaskIds: [],
          selectedDependencyIds: [],
          anchorTaskId: null,
        },
      };

    case 'ZOOM_IN': {
      const currentIndex = DEFAULT_ZOOM_LEVELS.findIndex((z) => z.id === state.zoomLevel.id);
      const nextIndex = Math.min(currentIndex + 1, DEFAULT_ZOOM_LEVELS.length - 1);
      return {
        ...state,
        zoomLevel: DEFAULT_ZOOM_LEVELS[nextIndex],
      };
    }

    case 'ZOOM_OUT': {
      const currentIndex = DEFAULT_ZOOM_LEVELS.findIndex((z) => z.id === state.zoomLevel.id);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return {
        ...state,
        zoomLevel: DEFAULT_ZOOM_LEVELS[prevIndex],
      };
    }

    case 'SET_ZOOM':
      return {
        ...state,
        zoomLevel: DEFAULT_ZOOM_LEVELS.find((z) => z.id === action.payload) || state.zoomLevel,
      };

    case 'START_DRAG': {
      const originalTask = state.tasks.find((t) => t.id === action.payload.taskId);
      return {
        ...state,
        dragState: {
          isDragging: true,
          taskId: action.payload.taskId,
          dragType: action.payload.dragType,
          startX: action.payload.startX,
          startY: action.payload.startY,
          currentX: action.payload.startX,
          currentY: action.payload.startY,
          originalTask: originalTask || null,
          ghostTask: originalTask || null,
        },
      };
    }

    case 'UPDATE_DRAG':
      return {
        ...state,
        dragState: {
          ...state.dragState,
          currentX: action.payload.currentX,
          currentY: action.payload.currentY,
          ghostTask: action.payload.ghostTask,
        },
      };

    case 'END_DRAG': {
      if (state.dragState.ghostTask && state.dragState.taskId) {
        return {
          ...state,
          tasks: state.tasks.map((t) =>
            t.id === state.dragState.taskId
              ? {
                  ...t,
                  startDate: state.dragState.ghostTask!.startDate,
                  endDate: state.dragState.ghostTask!.endDate,
                  duration: state.dragState.ghostTask!.duration,
                }
              : t
          ),
          dragState: {
            isDragging: false,
            taskId: null,
            dragType: null,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            originalTask: null,
            ghostTask: null,
          },
        };
      }
      return {
        ...state,
        dragState: {
          isDragging: false,
          taskId: null,
          dragType: null,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
          originalTask: null,
          ghostTask: null,
        },
      };
    }

    case 'CANCEL_DRAG':
      return {
        ...state,
        dragState: {
          isDragging: false,
          taskId: null,
          dragType: null,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
          originalTask: null,
          ghostTask: null,
        },
      };

    default:
      return state;
  }
}

// Context
interface GanttContextValue {
  state: GanttState;
  dispatch: React.Dispatch<GanttAction>;
}

const GanttContext = createContext<GanttContextValue | null>(null);

export function useGantt() {
  const context = useContext(GanttContext);
  if (!context) {
    throw new Error('useGantt must be used within GanttProvider');
  }
  return context;
}

interface GanttProviderProps {
  children: React.ReactNode;
  initialTasks?: GanttTask[];
  initialDependencies?: GanttDependency[];
  initialColumns?: GanttColumn[];
}

export function GanttProvider({
  children,
  initialTasks = [],
  initialDependencies = [],
  initialColumns,
}: GanttProviderProps) {
  const initialState: GanttState = useMemo(
    () => ({
      tasks: initialTasks,
      dependencies: initialDependencies,
      columns: initialColumns || DEFAULT_COLUMNS,
      calendar: DEFAULT_CALENDAR,
      zoomLevel: DEFAULT_ZOOM_LEVELS[3], // Week view by default
      viewport: {
        scrollLeft: 0,
        scrollTop: 0,
        visibleStartDate: new Date(),
        visibleEndDate: new Date(),
        containerWidth: 0,
        containerHeight: 0,
      },
      selection: {
        selectedTaskIds: [],
        selectedDependencyIds: [],
        anchorTaskId: null,
      },
      dragState: {
        isDragging: false,
        taskId: null,
        dragType: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        originalTask: null,
        ghostTask: null,
      },
      baselines: [],
      showCriticalPath: false,
      showBaseline: false,
      autoSchedule: false,
      undoStack: [],
      redoStack: [],
    }),
    [initialTasks, initialDependencies, initialColumns]
  );

  const [state, dispatch] = useReducer(ganttReducer, initialState);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <GanttContext.Provider value={value}>{children}</GanttContext.Provider>;
}
