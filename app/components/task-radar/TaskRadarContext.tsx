"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { RadarState, Task, TaskPosition, DragState, ViewportDimensions, CONSTANTS } from "./types";
import { calculateTaskPosition, calculateDueDateFromPosition, clamp, generateSampleTasks } from "./utils";

interface TaskRadarContextValue extends RadarState {
  // Viewport
  viewport: ViewportDimensions;
  setViewport: (viewport: ViewportDimensions) => void;

  // Drag state
  dragState: DragState;
  startDrag: (taskId: string, x: number, y: number) => void;
  updateDrag: (x: number, y: number) => void;
  endDrag: () => void;

  // Actions
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  selectTask: (taskId: string | null) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  toggleCenterLock: () => void;
  resetView: () => void;

  // Time
  updateCurrentTime: () => void;
  setTimeOffset: (offset: number) => void;

  // Dependencies
  toggleDependencyMode: () => void;
  startConnectingDependency: (taskId: string) => void;
  finishConnectingDependency: (toTaskId: string) => void;
  cancelConnectingDependency: () => void;
  removeDependency: (taskId: string, dependencyId: string) => void;

  // Filters
  setFilterQuery: (query: string) => void;
  setFilterPriority: (priority: Priority | "all") => void;
  setFilterStatus: (status: TaskStatus | "all") => void;
  getFilteredTasks: () => Task[];

  // Theme
  setTheme: (theme: "dark" | "light") => void;

  // Data persistence
  exportTasks: () => string;
  importTasks: (data: string) => void;
  clearAllTasks: () => void;
}

const TaskRadarContext = createContext<TaskRadarContextValue | null>(null);

export function useTaskRadar() {
  const context = useContext(TaskRadarContext);
  if (!context) {
    throw new Error("useTaskRadar must be used within TaskRadarProvider");
  }
  return context;
}

export function TaskRadarProvider({ children }: { children: React.ReactNode }) {
  // Viewport state
  const [viewport, setViewport] = useState<ViewportDimensions>({
    width: 0,
    height: 0,
    centerX: 0,
    centerY: 0,
  });

  // Radar state
  const [zoom, setZoomState] = useState(1.0);
  const [panOffset, setPanOffsetState] = useState({ x: 0, y: 0 });
  const [centerLockEnabled, setCenterLockEnabled] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeOffset, setTimeOffsetState] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskPositions, setTaskPositions] = useState<Map<string, TaskPosition>>(new Map());
  const [showDependencies, setShowDependencies] = useState(false);
  const [isConnectingDependency, setIsConnectingDependency] = useState(false);
  const [connectingFromTaskId, setConnectingFromTaskId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    taskId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    newDueDate: null,
  });

  // Ref for time interval
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with tasks from localStorage or sample tasks
  useEffect(() => {
    const savedTasks = localStorage.getItem("taskRadarTasks");
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        // Convert date strings back to Date objects
        const tasksWithDates = parsed.map((task: Task) => ({
          ...task,
          dueDate: new Date(task.dueDate),
          createdAt: task.createdAt ? new Date(task.createdAt) : undefined,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        }));
        setTasks(tasksWithDates);
      } catch (e) {
        console.error("Failed to parse saved tasks", e);
        const sampleTasks = generateSampleTasks();
        setTasks(sampleTasks);
      }
    } else {
      const sampleTasks = generateSampleTasks();
      setTasks(sampleTasks);
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem("taskRadarTasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  // Update task positions when tasks, zoom, viewport, or time changes
  useEffect(() => {
    const newPositions = new Map<string, TaskPosition>();

    tasks.forEach((task) => {
      const existingPosition = taskPositions.get(task.id);
      const position = calculateTaskPosition(
        task,
        new Date(currentTime.getTime() + timeOffset),
        viewport.centerX,
        viewport.centerY,
        zoom,
        existingPosition,
        tasks // Pass all tasks for better distribution
      );
      newPositions.set(task.id, position);
    });

    setTaskPositions(newPositions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, zoom, viewport, currentTime, timeOffset]);

  // Time progression
  const updateCurrentTime = useCallback(() => {
    setCurrentTime(new Date());
  }, []);

  useEffect(() => {
    timeIntervalRef.current = setInterval(updateCurrentTime, CONSTANTS.TIME_UPDATE_INTERVAL);

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [updateCurrentTime]);

  // Actions
  const addTask = useCallback((task: Task) => {
    const newTask = {
      ...task,
      id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: task.createdAt || new Date(),
    };
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task)));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setTaskPositions((prev) => {
      const newPositions = new Map(prev);
      newPositions.delete(taskId);
      return newPositions;
    });
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
  }, [selectedTaskId]);

  const selectTask = useCallback((taskId: string | null) => {
    setSelectedTaskId(taskId);
  }, []);

  const setZoom = useCallback(
    (newZoom: number) => {
      const clampedZoom = clamp(newZoom, CONSTANTS.MIN_ZOOM, CONSTANTS.MAX_ZOOM);
      setZoomState(clampedZoom);
    },
    []
  );

  const setPanOffset = useCallback(
    (offset: { x: number; y: number }) => {
      if (!centerLockEnabled) {
        setPanOffsetState(offset);
      }
    },
    [centerLockEnabled]
  );

  const toggleCenterLock = useCallback(() => {
    setCenterLockEnabled((prev) => {
      if (!prev) {
        // Turning center lock ON - reset pan
        setPanOffsetState({ x: 0, y: 0 });
      }
      return !prev;
    });
  }, []);

  const resetView = useCallback(() => {
    setZoomState(1.0);
    setPanOffsetState({ x: 0, y: 0 });
    setCenterLockEnabled(true);
    setSelectedTaskId(null);
  }, []);

  // Drag handlers
  const startDrag = useCallback((taskId: string, x: number, y: number) => {
    setDragState({
      isDragging: true,
      taskId,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      newDueDate: null,
    });
  }, []);

  const updateDrag = useCallback(
    (x: number, y: number) => {
      if (!dragState.isDragging || !dragState.taskId) return;

      const newDueDate = calculateDueDateFromPosition(
        x,
        y,
        viewport.centerX,
        viewport.centerY,
        new Date(currentTime.getTime() + timeOffset),
        zoom
      );

      setDragState((prev) => ({
        ...prev,
        currentX: x,
        currentY: y,
        newDueDate,
      }));
    },
    [dragState.isDragging, dragState.taskId, viewport, currentTime, timeOffset, zoom]
  );

  const endDrag = useCallback(() => {
    if (!dragState.isDragging || !dragState.taskId || !dragState.newDueDate) {
      setDragState({
        isDragging: false,
        taskId: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        newDueDate: null,
      });
      return;
    }

    // Update task with new due date
    const taskId = dragState.taskId;
    const newDueDate = dragState.newDueDate;

    // Calculate the angle where the user dropped the task
    const dx = dragState.currentX - viewport.centerX;
    const dy = dragState.currentY - viewport.centerY;
    const dropAngle = Math.atan2(dy, dx);
    const dropDistance = Math.sqrt(dx * dx + dy * dy);
    const unscaledDistance = dropDistance / zoom;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              dueDate: newDueDate,
            }
          : task
      )
    );

    // Mark position as user-positioned with the new angle
    setTaskPositions((prev) => {
      const newPositions = new Map(prev);
      const currentPosition = newPositions.get(taskId);
      if (currentPosition) {
        newPositions.set(taskId, {
          ...currentPosition,
          isUserPositioned: true,
          relativeAngle: dropAngle,
          relativeDistance: unscaledDistance,
        });
      }
      return newPositions;
    });

    setDragState({
      isDragging: false,
      taskId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      newDueDate: null,
    });
  }, [dragState, viewport, zoom]);

  // Dependency methods
  const toggleDependencyMode = useCallback(() => {
    setShowDependencies((prev) => !prev);
    if (isConnectingDependency) {
      cancelConnectingDependency();
    }
  }, [isConnectingDependency]);

  const startConnectingDependency = useCallback((taskId: string) => {
    setIsConnectingDependency(true);
    setConnectingFromTaskId(taskId);
  }, []);

  const finishConnectingDependency = useCallback(
    (toTaskId: string) => {
      if (!connectingFromTaskId || connectingFromTaskId === toTaskId) {
        cancelConnectingDependency();
        return;
      }

      // Check for circular dependencies
      const wouldCreateCircular = (fromId: string, toId: string): boolean => {
        const task = tasks.find((t) => t.id === toId);
        if (!task || !task.dependencies) return false;
        if (task.dependencies.includes(fromId)) return true;
        return task.dependencies.some((depId) => wouldCreateCircular(fromId, depId));
      };

      if (wouldCreateCircular(toTaskId, connectingFromTaskId)) {
        alert("Cannot create circular dependency!");
        cancelConnectingDependency();
        return;
      }

      // Add dependency
      setTasks((prev) =>
        prev.map((task) =>
          task.id === toTaskId
            ? {
                ...task,
                dependencies: [...(task.dependencies || []), connectingFromTaskId],
              }
            : task
        )
      );

      cancelConnectingDependency();
    },
    [connectingFromTaskId, tasks]
  );

  const cancelConnectingDependency = useCallback(() => {
    setIsConnectingDependency(false);
    setConnectingFromTaskId(null);
  }, []);

  const removeDependency = useCallback((taskId: string, dependencyId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              dependencies: task.dependencies?.filter((id) => id !== dependencyId),
            }
          : task
      )
    );
  }, []);

  // Filter methods
  const getFilteredTasks = useCallback((): Task[] => {
    return tasks.filter((task) => {
      // Text search
      if (filterQuery) {
        const query = filterQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query);
        const matchesTags = task.tags?.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDescription && !matchesTags) return false;
      }

      // Priority filter
      if (filterPriority !== "all" && task.priority !== filterPriority) return false;

      // Status filter
      if (filterStatus !== "all" && task.status !== filterStatus) return false;

      return true;
    });
  }, [tasks, filterQuery, filterPriority, filterStatus]);

  // Data persistence methods
  const exportTasks = useCallback((): string => {
    return JSON.stringify(tasks, null, 2);
  }, [tasks]);

  const importTasks = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data);
      const tasksWithDates = parsed.map((task: Task) => ({
        ...task,
        dueDate: new Date(task.dueDate),
        createdAt: task.createdAt ? new Date(task.createdAt) : undefined,
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      }));
      setTasks(tasksWithDates);
    } catch (e) {
      alert("Failed to import tasks. Invalid JSON format.");
    }
  }, []);

  const clearAllTasks = useCallback(() => {
    if (confirm("Are you sure you want to delete all tasks? This cannot be undone.")) {
      setTasks([]);
      localStorage.removeItem("taskRadarTasks");
    }
  }, []);

  const value: TaskRadarContextValue = {
    // State
    zoom,
    panOffset,
    centerLockEnabled,
    selectedTaskId,
    currentTime,
    timeOffset,
    tasks,
    taskPositions,
    viewport,
    dragState,
    showDependencies,
    isConnectingDependency,
    connectingFromTaskId,
    filterQuery,
    filterPriority,
    filterStatus,
    theme,

    // Setters
    setViewport,

    // Actions
    addTask,
    updateTask,
    deleteTask,
    selectTask,
    setZoom,
    setPanOffset,
    toggleCenterLock,
    resetView,
    updateCurrentTime,
    setTimeOffset: setTimeOffsetState,

    // Drag
    startDrag,
    updateDrag,
    endDrag,

    // Dependencies
    toggleDependencyMode,
    startConnectingDependency,
    finishConnectingDependency,
    cancelConnectingDependency,
    removeDependency,

    // Filters
    setFilterQuery,
    setFilterPriority,
    setFilterStatus,
    getFilteredTasks,

    // Theme
    setTheme,

    // Data persistence
    exportTasks,
    importTasks,
    clearAllTasks,
  };

  return <TaskRadarContext.Provider value={value}>{children}</TaskRadarContext.Provider>;
}
