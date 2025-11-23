// Core type definitions for the Gantt chart component

// Task types
export type TaskType = 'task' | 'milestone' | 'summary';
export type ConstraintType = 'ASAP' | 'ALAP' | 'SNET' | 'SNLT' | 'FNET' | 'FNLT' | 'MSO' | 'MFO';
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface GanttTask {
  id: string;
  name: string;
  type: TaskType;

  // Dates and duration
  startDate: Date;
  endDate: Date;
  duration: number; // in days

  // Progress
  progress: number; // 0-100

  // Hierarchy
  parentId: string | null;
  children?: string[]; // child IDs
  level: number; // 0 = root, 1 = first level, etc.
  expanded: boolean;

  // Visual
  color?: string;

  // Resources
  assignedResources?: string[];

  // Constraints
  constraint?: ConstraintType;
  constraintDate?: Date;

  // Baseline
  baselineStart?: Date;
  baselineEnd?: Date;

  // Metadata
  notes?: string;
  customFields?: Record<string, any>;
}

export interface GanttDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: DependencyType;
  lag?: number; // in days, can be negative (lead)
}

export interface GanttColumn {
  id: string;
  title: string;
  field: keyof GanttTask | string;
  width: number;
  minWidth?: number;
  resizable?: boolean;
  sortable?: boolean;
  editable?: boolean;
  visible?: boolean;
  renderCell?: (task: GanttTask) => React.ReactNode;
}

export interface WorkingCalendar {
  id: string;
  name: string;
  workingDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  workingHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
  holidays: Date[];
  exceptions: {
    date: Date;
    isWorking: boolean;
  }[];
}

export interface ZoomLevel {
  id: string;
  name: string;
  scale: 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour';
  cellWidth: number; // pixels per unit
  headerTiers: ('year' | 'quarter' | 'month' | 'week' | 'day' | 'hour')[];
}

export interface GanttBaseline {
  id: string;
  name: string;
  tasks: Map<string, { start: Date; end: Date }>; // taskId -> dates
  savedDate: Date;
}

// State types
export interface DragState {
  isDragging: boolean;
  taskId: string | null;
  dragType: 'move' | 'resize-start' | 'resize-end' | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  originalTask: GanttTask | null;
  ghostTask: GanttTask | null;
}

export interface SelectionState {
  selectedTaskIds: string[];
  selectedDependencyIds: string[];
  anchorTaskId: string | null; // for shift-click range select
}

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  taskId: string | null;
}

export interface InlineEditState {
  isEditing: boolean;
  taskId: string | null;
  field: keyof GanttTask | null;
  value: string;
}

export interface ViewportState {
  scrollLeft: number;
  scrollTop: number;
  visibleStartDate: Date;
  visibleEndDate: Date;
  containerWidth: number;
  containerHeight: number;
}

export interface GanttState {
  tasks: GanttTask[];
  dependencies: GanttDependency[];
  columns: GanttColumn[];
  calendar: WorkingCalendar;
  zoomLevel: ZoomLevel;
  viewport: ViewportState;
  selection: SelectionState;
  dragState: DragState;
  contextMenu: ContextMenuState;
  inlineEdit: InlineEditState;
  baselines: GanttBaseline[];
  showCriticalPath: boolean;
  criticalPathSchedules: Map<string, any> | null; // TaskSchedule map
  showBaseline: boolean;
  autoSchedule: boolean;
  useCalendar: boolean; // Whether to use calendar for date calculations
  undoStack: GanttState[];
  redoStack: GanttState[];
}

// Default zoom levels
export const DEFAULT_ZOOM_LEVELS: ZoomLevel[] = [
  {
    id: 'year',
    name: 'Year',
    scale: 'year',
    cellWidth: 100,
    headerTiers: ['year', 'quarter'],
  },
  {
    id: 'quarter',
    name: 'Quarter',
    scale: 'quarter',
    cellWidth: 120,
    headerTiers: ['year', 'month'],
  },
  {
    id: 'month',
    name: 'Month',
    scale: 'month',
    cellWidth: 30,
    headerTiers: ['month', 'week'],
  },
  {
    id: 'week',
    name: 'Week',
    scale: 'week',
    cellWidth: 100,
    headerTiers: ['month', 'day'],
  },
  {
    id: 'day',
    name: 'Day',
    scale: 'day',
    cellWidth: 50,
    headerTiers: ['week', 'day'],
  },
  {
    id: 'hour',
    name: 'Hour',
    scale: 'hour',
    cellWidth: 60,
    headerTiers: ['day', 'hour'],
  },
];

// Default columns
export const DEFAULT_COLUMNS: GanttColumn[] = [
  {
    id: 'name',
    title: 'Task Name',
    field: 'name',
    width: 250,
    minWidth: 150,
    resizable: true,
    sortable: true,
    editable: true,
    visible: true,
  },
  {
    id: 'start',
    title: 'Start',
    field: 'startDate',
    width: 100,
    resizable: true,
    sortable: true,
    editable: true,
    visible: true,
  },
  {
    id: 'end',
    title: 'End',
    field: 'endDate',
    width: 100,
    resizable: true,
    sortable: true,
    editable: true,
    visible: true,
  },
  {
    id: 'duration',
    title: 'Duration',
    field: 'duration',
    width: 80,
    resizable: true,
    sortable: true,
    editable: true,
    visible: true,
  },
  {
    id: 'progress',
    title: '% Complete',
    field: 'progress',
    width: 100,
    resizable: true,
    sortable: true,
    editable: true,
    visible: true,
  },
  {
    id: 'slack',
    title: 'Slack',
    field: 'id', // We'll use custom renderer to get slack from schedules
    width: 80,
    resizable: true,
    sortable: false,
    editable: false,
    visible: true,
  },
];

// Default calendar
export const DEFAULT_CALENDAR: WorkingCalendar = {
  id: 'default',
  name: 'Standard',
  workingDays: [1, 2, 3, 4, 5], // Mon-Fri
  workingHours: {
    start: '09:00',
    end: '17:00',
  },
  holidays: [],
  exceptions: [],
};
