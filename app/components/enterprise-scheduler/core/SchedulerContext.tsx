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
  | { type: 'START_DEPENDENCY_CREATION'; payload: { eventId: string; port: 'top' | 'bottom' | 'left' | 'right'; x: number; y: number } }
  | { type: 'UPDATE_DEPENDENCY_CREATION'; payload: { x: number; y: number; toEventId?: string | null; toPort?: 'top' | 'bottom' | 'left' | 'right' | null } }
  | { type: 'COMPLETE_DEPENDENCY_CREATION' }
  | { type: 'CANCEL_DEPENDENCY_CREATION' }
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
    dependencyCreation: {
      isCreating: false,
      fromEventId: null,
      fromPort: null,
      fromX: 0,
      fromY: 0,
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

    case 'START_DEPENDENCY_CREATION':
      return {
        ...state,
        dependencyCreation: {
          isCreating: true,
          fromEventId: action.payload.eventId,
          fromPort: action.payload.port,
          fromX: action.payload.x,
          fromY: action.payload.y,
          currentX: action.payload.x,
          currentY: action.payload.y,
        },
      };

    case 'UPDATE_DEPENDENCY_CREATION':
      return {
        ...state,
        dependencyCreation: {
          ...state.dependencyCreation,
          currentX: action.payload.x,
          currentY: action.payload.y,
          toEventId: action.payload.toEventId,
          toPort: action.payload.toPort,
        },
      };

    case 'COMPLETE_DEPENDENCY_CREATION': {
      const { fromEventId, toEventId } = state.dependencyCreation;

      // Only create dependency if we have both from and to events
      if (fromEventId && toEventId && fromEventId !== toEventId) {
        // Check if dependency already exists
        const existingDep = state.dependencies.find(
          d => d.fromEventId === fromEventId && d.toEventId === toEventId
        );

        if (!existingDep) {
          // Create new dependency with default finish-to-start type
          const newDependency: Dependency = {
            id: `dep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fromEventId,
            toEventId,
            type: 'finish-to-start',
          };

          return {
            ...state,
            dependencies: [...state.dependencies, newDependency],
            dependencyCreation: {
              isCreating: false,
              fromEventId: null,
              fromPort: null,
              fromX: 0,
              fromY: 0,
              currentX: 0,
              currentY: 0,
            },
          };
        }
      }

      // Reset dependency creation state
      return {
        ...state,
        dependencyCreation: {
          isCreating: false,
          fromEventId: null,
          fromPort: null,
          fromX: 0,
          fromY: 0,
          currentX: 0,
          currentY: 0,
        },
      };
    }

    case 'CANCEL_DEPENDENCY_CREATION':
      return {
        ...state,
        dependencyCreation: {
          isCreating: false,
          fromEventId: null,
          fromPort: null,
          fromX: 0,
          fromY: 0,
          currentX: 0,
          currentY: 0,
        },
      };

    default:
      return state;
  }
}

// Context
interface SchedulerContextValue {
  state: SchedulerState;
  config: SchedulerConfig;
  dispatch: React.Dispatch<SchedulerAction>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
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
  scrollToDate: (date: Date) => void;
  scrollToPosition: (scrollLeft: number, scrollTop?: number) => void;
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    // Store current viewport center before zoom
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const containerWidth = container.clientWidth;
      const centerScrollLeft = container.scrollLeft + containerWidth / 2;

      // Calculate what time is at the center using current zoom level
      const { timeAxis, zoomLevel } = state;
      const centerTime = timeAxis.startDate.getTime() +
        (centerScrollLeft / timeAxis.cellWidth) * zoomLevel.tickSize;

      // Calculate the next zoom level
      const currentLevelIndex = ZOOM_LEVELS.findIndex((z) => z.level === zoomLevel.level);
      const nextLevelIndex = Math.min(ZOOM_LEVELS.length - 1, currentLevelIndex + 1);
      const nextZoomLevel = ZOOM_LEVELS[nextLevelIndex];

      // Perform zoom
      dispatch({ type: 'ZOOM_IN' });

      // After zoom, adjust scroll to keep the same time at center
      requestAnimationFrame(() => {
        // Calculate new pixel position with the new zoom level
        const newCenterPixel =
          ((centerTime - timeAxis.startDate.getTime()) / nextZoomLevel.tickSize) *
          nextZoomLevel.cellWidth;
        const newScrollLeft = Math.max(0, newCenterPixel - containerWidth / 2);
        container.scrollLeft = newScrollLeft;
      });
    } else {
      dispatch({ type: 'ZOOM_IN' });
    }
  }, [state, scrollContainerRef]);

  const zoomOut = useCallback(() => {
    // Store current viewport center before zoom
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const containerWidth = container.clientWidth;
      const centerScrollLeft = container.scrollLeft + containerWidth / 2;

      // Calculate what time is at the center using current zoom level
      const { timeAxis, zoomLevel } = state;
      const centerTime = timeAxis.startDate.getTime() +
        (centerScrollLeft / timeAxis.cellWidth) * zoomLevel.tickSize;

      // Calculate the previous zoom level
      const currentLevelIndex = ZOOM_LEVELS.findIndex((z) => z.level === zoomLevel.level);
      const prevLevelIndex = Math.max(0, currentLevelIndex - 1);
      const prevZoomLevel = ZOOM_LEVELS[prevLevelIndex];

      // Perform zoom
      dispatch({ type: 'ZOOM_OUT' });

      // After zoom, adjust scroll to keep the same time at center
      requestAnimationFrame(() => {
        // Calculate new pixel position with the new zoom level
        const newCenterPixel =
          ((centerTime - timeAxis.startDate.getTime()) / prevZoomLevel.tickSize) *
          prevZoomLevel.cellWidth;
        const newScrollLeft = Math.max(0, newCenterPixel - containerWidth / 2);
        container.scrollLeft = newScrollLeft;
      });
    } else {
      dispatch({ type: 'ZOOM_OUT' });
    }
  }, [state, scrollContainerRef]);

  const scrollToDate = useCallback((date: Date) => {
    if (!scrollContainerRef.current) return;

    const { timeAxis, zoomLevel } = state;
    const dateTime = date.getTime();
    const startTime = timeAxis.startDate.getTime();

    // Calculate pixel position of the date
    const pixelPosition = ((dateTime - startTime) / zoomLevel.tickSize) * timeAxis.cellWidth;

    // Scroll to center the date in the viewport
    const containerWidth = scrollContainerRef.current.clientWidth;
    const scrollLeft = Math.max(0, pixelPosition - containerWidth / 2);

    scrollContainerRef.current.scrollTo({
      left: scrollLeft,
      behavior: 'smooth',
    });
  }, [state]);

  const scrollToPosition = useCallback((scrollLeft: number, scrollTop?: number) => {
    if (!scrollContainerRef.current) return;

    scrollContainerRef.current.scrollTo({
      left: scrollLeft,
      top: scrollTop ?? scrollContainerRef.current.scrollTop,
      behavior: 'smooth',
    });
  }, []);

  const navigateToToday = useCallback(() => {
    // Just scroll to today's position without changing the time range
    // This preserves the current zoom level and time range
    const today = new Date();
    scrollToDate(today);
  }, [scrollToDate]);

  const navigateToDate = useCallback((date: Date) => {
    dispatch({ type: 'NAVIGATE_TO_DATE', payload: date });
    // Scroll to the date's position after a short delay
    setTimeout(() => {
      scrollToDate(date);
    }, 0);
  }, [scrollToDate]);

  const value: SchedulerContextValue = {
    state,
    config,
    dispatch,
    scrollContainerRef,
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
    scrollToDate,
    scrollToPosition,
  };

  return <SchedulerContext.Provider value={value}>{children}</SchedulerContext.Provider>;
}
