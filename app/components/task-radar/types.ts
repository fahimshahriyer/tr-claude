export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in-progress" | "done";
export type ConnectionPort = "top" | "right" | "bottom" | "left";

export interface TaskConnection {
  fromTaskId: string;
  fromPort: ConnectionPort;
  toTaskId: string;
  toPort: ConnectionPort;
}

export interface Task {
  id: string;
  title: string;
  dueDate: Date;
  priority: Priority;
  description?: string;
  status?: TaskStatus;
  createdAt?: Date;
  tags?: string[];
  assignee?: string;
  estimatedHours?: number;
  dependencies?: string[]; // IDs of tasks this task depends on (legacy support)
  connections?: TaskConnection[]; // New port-based connections
  completedAt?: Date;
  subtasks?: { id: string; title: string; completed: boolean }[];
  category?: string;
}

export interface TaskPosition {
  x: number;
  y: number;
  isUserPositioned: boolean;
  relativeDistance: number; // unscaled distance from center
  relativeAngle: number; // angle in radians
}

export interface RadarState {
  zoom: number;
  panOffset: { x: number; y: number };
  centerLockEnabled: boolean;
  selectedTaskId: string | null;
  currentTime: Date;
  timeOffset: number; // milliseconds offset for simulation
  tasks: Task[];
  taskPositions: Map<string, TaskPosition>;
  showDependencies: boolean;
  isConnectingDependency: boolean;
  connectingFromTaskId: string | null;
  connectingFromPort: ConnectionPort | null;
  connectingMouseX: number;
  connectingMouseY: number;
  filterQuery: string;
  filterPriority: Priority | "all";
  filterStatus: TaskStatus | "all";
  theme: "dark" | "light";
}

export interface DragState {
  isDragging: boolean;
  taskId: string | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  newDueDate: Date | null;
}

export interface ViewportDimensions {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export const CONSTANTS = {
  BASE_RING_SPACING: 60, // px per day
  MIN_ZOOM: 0.3,
  MAX_ZOOM: 2.0,
  ZOOM_STEP: 0.1,
  RADIAL_LINES: 12,
  RING_LABEL_INTERVALS: [1, 3, 5, 7, 14, 21, 30, 60, 90], // days - added 3, 5, 21 for better granularity
  TASK_BLIP_WIDTH: 160,
  TASK_BLIP_HEIGHT: 70,
  CENTER_RADIUS: 40,
  TIME_UPDATE_INTERVAL: 1000, // ms
  CONNECTION_PORT_SIZE: 10, // px diameter of connection ports
} as const;

export const PRIORITY_COLORS = {
  low: "#a1a1aa", // zinc-400 - light grey
  medium: "#71717a", // zinc-500 - medium grey
  high: "#52525b", // zinc-600 - dark grey
} as const;

export const TIME_COLORS = {
  overdue: "#3f3f46", // zinc-700 - very dark grey
  urgent: "#52525b", // zinc-600 - dark grey (<1 day)
  soon: "#71717a", // zinc-500 - medium grey (<7 days)
  later: "#a1a1aa", // zinc-400 - light grey (>7 days)
} as const;

// ============================================
// TaskRadar Component Props & Options
// ============================================

export interface TaskRadarOptions {
  /** Theme mode */
  theme?: "dark" | "light";
  /** Show dependencies by default */
  showDependencies?: boolean;
  /** Enable filters panel */
  enableFilters?: boolean;
  /** Enable time travel feature */
  enableTimeTravel?: boolean;
  /** Enable export/import */
  enableDataManagement?: boolean;
  /** Show sidebar */
  showSidebar?: boolean;
  /** Initial zoom level (0.3 - 2.0) */
  initialZoom?: number;
  /** Lock center by default */
  centerLocked?: boolean;
}

export interface TaskRadarCallbacks {
  /** Called when a task is created */
  onTaskCreate?: (task: Omit<Task, "id" | "createdAt">) => void;
  /** Called when a task is updated */
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  /** Called when a task is deleted */
  onTaskDelete?: (taskId: string) => void;
  /** Called when tasks are imported */
  onTasksImport?: (tasks: Task[]) => void;
  /** Called when all tasks are cleared */
  onTasksClear?: () => void;
  /** Called when a connection is created */
  onConnectionCreate?: (connection: TaskConnection) => void;
  /** Called when a connection is removed */
  onConnectionRemove?: (connection: TaskConnection) => void;
}

export interface TaskRadarProps {
  /** Array of tasks to display */
  tasks: Task[];
  /** Configuration options */
  options?: TaskRadarOptions;
  /** Event callbacks */
  callbacks?: TaskRadarCallbacks;
  /** Custom class name for container */
  className?: string;
}
