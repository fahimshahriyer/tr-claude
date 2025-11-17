'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import {
  SchedulerState,
  SchedulerConfig,
  SchedulerEvent,
  Resource,
  Dependency,
  DragState,
  ViewportBounds,
  ZoomLevel,
  SelectionState,
} from './types';
import { ZOOM_LEVELS, DEFAULT_ZOOM_LEVEL } from './zoomLevels';
import { startOfMonth, endOfMonth, addMonths } from '../utils/dateUtils';

// Action types
type SchedulerAction =
  | { type: 'SET_RESOURCES'; payload: Resource[] }
  | { type: 'ADD_RESOURCE'; payload: Resource }
  | { type: 'UPDATE_RESOURCE'; payload: { id: string; updates: Partial<Resource> } }
  | { type: 'DELETE_RESOURCE'; payload: string }
  | { type: 'SET_EVENTS'; payload: SchedulerEvent[] }
  | { type: 'ADD_EVENT'; payload: SchedulerEvent }
  | { type: 'UPDATE_EVENT'; payload: { id: string; updates: Partial<SchedulerEvent> } }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SET_DEPENDENCIES'; payload: Dependency[] }
  | { type: 'ADD_DEPENDENCY'; payload: Dependency }
  | { type: 'DELETE_DEPENDENCY'; payload: string }
  | { type: 'SET_ZOOM_LEVEL'; payload: number }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'SET_VIEWPORT'; payload: Partial<ViewportBounds> }
  | { type: 'SET_DRAG_STATE'; payload: Partial<DragState> }
  | { type: 'CLEAR_DRAG_STATE' }
  | { type: 'SELECT_EVENT'; payload: string }
  | { type: 'DESELECT_EVENT'; payload: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'TOGGLE_SNAP_TO_GRID' }
  | { type: 'TOGGLE_DEPENDENCIES' }
  | { type: 'TOGGLE_WEEKENDS' }
  | { type: 'TOGGLE_NON_WORKING_TIME' }
  | { type: 'NAVIGATE_TO_TODAY' }
  | { type: 'NAVIGATE_TO_DATE'; payload: Date };

// Initial state
function createInitialState(config: SchedulerConfig): SchedulerState {
  const today = new Date();
  const startDate = startOfMonth(addMonths(today, -1));
  const endDate = endOfMonth(addMonths(today, 2));

  return {
    resources: [],
    events: [],
    dependencies: [],
    timeAxis: {
      viewMode: 'month',
      startDate,
      endDate,
      cellWidth: 40,
      showWeekends: true,
      showNonWorkingTime: false,
      workingHours: { start: 9, end: 17 },
    },
    zoomLevel: ZOOM_LEVELS[DEFAULT_ZOOM_LEVEL],
    viewport: {
      startIndex: 0,
      endIndex: 0,
      startTime: startDate,
      endTime: endDate,
      scrollLeft: 0,
      scrollTop: 0,
    },
    selection: {
      selectedEventIds: new Set(),
      selectedResourceIds: new Set(),
      selectedDependencyIds: new Set(),
    },
    dragState: {
      isDragging: false,
      dragType: null,
      eventId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    },
    snapToGrid: true,
    showDependencies: true,
  };
}

// Reducer
function schedulerReducer(state: SchedulerState, action: SchedulerAction): SchedulerState {
  switch (action.type) {
    case 'SET_RESOURCES':
      return { ...state, resources: action.payload };

    case 'ADD_RESOURCE':
      return { ...state, resources: [...state.resources, action.payload] };

    case 'UPDATE_RESOURCE':
      return {
        ...state,
        resources: state.resources.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
        ),
      };

    case 'DELETE_RESOURCE':
      return {
        ...state,
        resources: state.resources.filter((r) => r.id !== action.payload),
        events: state.events.filter((e) => e.resourceId !== action.payload),
      };

    case 'SET_EVENTS':
      return { ...state, events: action.payload };

    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };

    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.payload.id ? { ...e, ...action.payload.updates } : e
        ),
      };

    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter((e) => e.id !== action.payload),
        dependencies: state.dependencies.filter(
          (d) => d.fromEventId !== action.payload && d.toEventId !== action.payload
        ),
      };

    case 'SET_DEPENDENCIES':
      return { ...state, dependencies: action.payload };

    case 'ADD_DEPENDENCY':
      return { ...state, dependencies: [...state.dependencies, action.payload] };

    case 'DELETE_DEPENDENCY':
      return {
        ...state,
        dependencies: state.dependencies.filter((d) => d.id !== action.payload),
      };

    case 'SET_ZOOM_LEVEL': {
      const level = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, action.payload));
      const zoomLevel = ZOOM_LEVELS[level];
      return {
        ...state,
        zoomLevel,
        timeAxis: {
          ...state.timeAxis,
          viewMode: zoomLevel.viewMode,
          cellWidth: zoomLevel.cellWidth,
        },
      };
    }

    case 'ZOOM_IN': {
      const currentLevel = ZOOM_LEVELS.findIndex((z) => z.level === state.zoomLevel.level);
      const nextLevel = Math.min(ZOOM_LEVELS.length - 1, currentLevel + 1);
      const zoomLevel = ZOOM_LEVELS[nextLevel];
      return {
        ...state,
        zoomLevel,
        timeAxis: {
          ...state.timeAxis,
          viewMode: zoomLevel.viewMode,
          cellWidth: zoomLevel.cellWidth,
        },
      };
    }

    case 'ZOOM_OUT': {
      const currentLevel = ZOOM_LEVELS.findIndex((z) => z.level === state.zoomLevel.level);
      const prevLevel = Math.max(0, currentLevel - 1);
      const zoomLevel = ZOOM_LEVELS[prevLevel];
      return {
        ...state,
        zoomLevel,
        timeAxis: {
          ...state.timeAxis,
          viewMode: zoomLevel.viewMode,
          cellWidth: zoomLevel.cellWidth,
        },
      };
    }

    case 'SET_VIEWPORT':
      return {
        ...state,
        viewport: { ...state.viewport, ...action.payload },
      };

    case 'SET_DRAG_STATE':
      return {
        ...state,
        dragState: { ...state.dragState, ...action.payload },
      };

    case 'CLEAR_DRAG_STATE':
      return {
        ...state,
        dragState: {
          isDragging: false,
          dragType: null,
          eventId: null,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
        },
      };

    case 'SELECT_EVENT': {
      const newSet = new Set(state.selection.selectedEventIds);
      newSet.add(action.payload);
      return {
        ...state,
        selection: { ...state.selection, selectedEventIds: newSet },
      };
    }

    case 'DESELECT_EVENT': {
      const newSet = new Set(state.selection.selectedEventIds);
      newSet.delete(action.payload);
      return {
        ...state,
        selection: { ...state.selection, selectedEventIds: newSet },
      };
    }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selection: {
          selectedEventIds: new Set(),
          selectedResourceIds: new Set(),
          selectedDependencyIds: new Set(),
        },
      };

    case 'TOGGLE_SNAP_TO_GRID':
      return { ...state, snapToGrid: !state.snapToGrid };

    case 'TOGGLE_DEPENDENCIES':
      return { ...state, showDependencies: !state.showDependencies };

    case 'TOGGLE_WEEKENDS':
      return {
        ...state,
        timeAxis: {
          ...state.timeAxis,
          showWeekends: !state.timeAxis.showWeekends,
        },
      };

    case 'TOGGLE_NON_WORKING_TIME':
      return {
        ...state,
        timeAxis: {
          ...state.timeAxis,
          showNonWorkingTime: !state.timeAxis.showNonWorkingTime,
        },
      };

    case 'NAVIGATE_TO_TODAY': {
      const today = new Date();
      const startDate = startOfMonth(addMonths(today, -1));
      const endDate = endOfMonth(addMonths(today, 2));
      return {
        ...state,
        timeAxis: {
          ...state.timeAxis,
          startDate,
          endDate,
        },
        viewport: {
          ...state.viewport,
          startTime: startDate,
          endTime: endDate,
        },
      };
    }

    case 'NAVIGATE_TO_DATE': {
      const date = action.payload;
      const startDate = startOfMonth(addMonths(date, -1));
      const endDate = endOfMonth(addMonths(date, 2));
      return {
        ...state,
        timeAxis: {
          ...state.timeAxis,
          startDate,
          endDate,
        },
        viewport: {
          ...state.viewport,
          startTime: startDate,
          endTime: endDate,
        },
      };
    }

    default:
      return state;
  }
}

// Context
interface SchedulerContextValue {
  state: SchedulerState;
  config: SchedulerConfig;
  dispatch: React.Dispatch<SchedulerAction>;
  // Convenience methods
  addEvent: (event: SchedulerEvent) => void;
  updateEvent: (id: string, updates: Partial<SchedulerEvent>) => void;
  deleteEvent: (id: string) => void;
  addResource: (resource: Resource) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  addDependency: (dependency: Dependency) => void;
  deleteDependency: (id: string) => void;
  selectEvent: (id: string) => void;
  deselectEvent: (id: string) => void;
  clearSelection: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  navigateToToday: () => void;
  navigateToDate: (date: Date) => void;
}

const SchedulerContext = createContext<SchedulerContextValue | null>(null);

export function useScheduler() {
  const context = useContext(SchedulerContext);
  if (!context) {
    throw new Error('useScheduler must be used within SchedulerProvider');
  }
  return context;
}

interface SchedulerProviderProps {
  children: React.ReactNode;
  config?: Partial<SchedulerConfig>;
  initialResources?: Resource[];
  initialEvents?: SchedulerEvent[];
  initialDependencies?: Dependency[];
}

const defaultConfig: SchedulerConfig = {
  enableDragDrop: true,
  enableResize: true,
  enableCreate: true,
  enableDependencies: true,
  enableUndo: true,
  snapIncrement: 15,
  minEventDuration: 15,
  maxZoomLevel: 4,
  minZoomLevel: 0,
  virtualScrolling: true,
  rowHeight: 50,
  sidebarWidth: 250,
  sidebarResizable: true,
};

export function SchedulerProvider({
  children,
  config: configProp,
  initialResources = [],
  initialEvents = [],
  initialDependencies = [],
}: SchedulerProviderProps) {
  const config = { ...defaultConfig, ...configProp };
  const [state, dispatch] = useReducer(schedulerReducer, createInitialState(config));

  // Initialize with provided data
  useEffect(() => {
    if (initialResources.length > 0) {
      dispatch({ type: 'SET_RESOURCES', payload: initialResources });
    }
    if (initialEvents.length > 0) {
      dispatch({ type: 'SET_EVENTS', payload: initialEvents });
    }
    if (initialDependencies.length > 0) {
      dispatch({ type: 'SET_DEPENDENCIES', payload: initialDependencies });
    }
  }, []); // Only run once on mount

  // Convenience methods
  const addEvent = useCallback((event: SchedulerEvent) => {
    dispatch({ type: 'ADD_EVENT', payload: event });
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<SchedulerEvent>) => {
    dispatch({ type: 'UPDATE_EVENT', payload: { id, updates } });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EVENT', payload: id });
  }, []);

  const addResource = useCallback((resource: Resource) => {
    dispatch({ type: 'ADD_RESOURCE', payload: resource });
  }, []);

  const updateResource = useCallback((id: string, updates: Partial<Resource>) => {
    dispatch({ type: 'UPDATE_RESOURCE', payload: { id, updates } });
  }, []);

  const deleteResource = useCallback((id: string) => {
    dispatch({ type: 'DELETE_RESOURCE', payload: id });
  }, []);

  const addDependency = useCallback((dependency: Dependency) => {
    dispatch({ type: 'ADD_DEPENDENCY', payload: dependency });
  }, []);

  const deleteDependency = useCallback((id: string) => {
    dispatch({ type: 'DELETE_DEPENDENCY', payload: id });
  }, []);

  const selectEvent = useCallback((id: string) => {
    dispatch({ type: 'SELECT_EVENT', payload: id });
  }, []);

  const deselectEvent = useCallback((id: string) => {
    dispatch({ type: 'DESELECT_EVENT', payload: id });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const zoomIn = useCallback(() => {
    dispatch({ type: 'ZOOM_IN' });
  }, []);

  const zoomOut = useCallback(() => {
    dispatch({ type: 'ZOOM_OUT' });
  }, []);

  const navigateToToday = useCallback(() => {
    dispatch({ type: 'NAVIGATE_TO_TODAY' });
  }, []);

  const navigateToDate = useCallback((date: Date) => {
    dispatch({ type: 'NAVIGATE_TO_DATE', payload: date });
  }, []);

  const value: SchedulerContextValue = {
    state,
    config,
    dispatch,
    addEvent,
    updateEvent,
    deleteEvent,
    addResource,
    updateResource,
    deleteResource,
    addDependency,
    deleteDependency,
    selectEvent,
    deselectEvent,
    clearSelection,
    zoomIn,
    zoomOut,
    navigateToToday,
    navigateToDate,
  };

  return <SchedulerContext.Provider value={value}>{children}</SchedulerContext.Provider>;
}
