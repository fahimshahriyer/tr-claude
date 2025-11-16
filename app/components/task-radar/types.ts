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
  RING_LABEL_INTERVALS: [1, 7, 14, 30, 60, 90], // days
  TASK_BLIP_WIDTH: 200,
  TASK_BLIP_HEIGHT: 80,
  CENTER_RADIUS: 40,
  TIME_UPDATE_INTERVAL: 1000, // ms
  CONNECTION_PORT_SIZE: 12, // px diameter of connection ports
} as const;

export const PRIORITY_COLORS = {
  low: "#22c55e", // green
  medium: "#eab308", // yellow
  high: "#ef4444", // red
} as const;

export const TIME_COLORS = {
  overdue: "#ef4444", // red
  urgent: "#f97316", // orange (<1 day)
  soon: "#eab308", // yellow (<7 days)
  later: "#22c55e", // green (>7 days)
} as const;
