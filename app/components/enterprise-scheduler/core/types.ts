// Core type definitions for the enterprise scheduler

export type ViewMode = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type DependencyType = 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';

export type EventStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'blocked';

export type EventPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Resource {
  id: string;
  name: string;
  type?: string;
  avatar?: string;
  icon?: string;
  color?: string;
  children?: Resource[];
  parentId?: string | null;
  expanded?: boolean;
  metadata?: Record<string, any>;
}

export interface SchedulerEvent {
  id: string;
  resourceId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: EventStatus;
  priority: EventPriority;
  color?: string;
  progress?: number; // 0-100
  metadata?: Record<string, any>;
  resizable?: boolean;
  draggable?: boolean;
  editable?: boolean;
}

export interface Dependency {
  id: string;
  fromEventId: string;
  toEventId: string;
  type: DependencyType;
  lag?: number; // in hours
  color?: string;
  fromPort?: 'top' | 'bottom' | 'left' | 'right';
  toPort?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TimeAxisConfig {
  viewMode: ViewMode;
  startDate: Date;
  endDate: Date;
  cellWidth: number; // pixels per unit
  showWeekends: boolean;
  showNonWorkingTime: boolean;
  workingHours?: { start: number; end: number }; // 0-23
}

export interface ZoomLevel {
  level: number;
  name: string;
  viewMode: ViewMode;
  cellWidth: number;
  tickSize: number; // time unit in ms
  headerTiers: HeaderTier[];
}

export interface HeaderTier {
  unit: 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour' | 'minute';
  format: string;
  increment: number;
}

export interface ViewportBounds {
  startIndex: number;
  endIndex: number;
  startTime: Date;
  endTime: Date;
  scrollLeft: number;
  scrollTop: number;
}

export interface DragState {
  isDragging: boolean;
  dragType: 'move' | 'resize-start' | 'resize-end' | 'create' | 'dependency' | null;
  eventId: string | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  originalEvent?: SchedulerEvent;
  ghostEvent?: SchedulerEvent;
  targetResourceId?: string;
}

export interface DependencyCreationState {
  isCreating: boolean;
  fromEventId: string | null;
  fromPort: 'top' | 'bottom' | 'left' | 'right' | null;
  fromX: number;
  fromY: number;
  currentX: number;
  currentY: number;
  toEventId?: string | null;
  toPort?: 'top' | 'bottom' | 'left' | 'right' | null;
}

export interface SelectionState {
  selectedEventIds: Set<string>;
  selectedResourceIds: Set<string>;
  selectedDependencyIds: Set<string>;
}

export interface HistoryState {
  past: SchedulerState[];
  future: SchedulerState[];
}

export interface SchedulerState {
  resources: Resource[];
  events: SchedulerEvent[];
  dependencies: Dependency[];
  timeAxis: TimeAxisConfig;
  zoomLevel: ZoomLevel;
  viewport: ViewportBounds;
  selection: SelectionState;
  dragState: DragState;
  dependencyCreation: DependencyCreationState;
  snapToGrid: boolean;
  showDependencies: boolean;
}

export interface SchedulerConfig {
  enableDragDrop: boolean;
  enableResize: boolean;
  enableCreate: boolean;
  enableDependencies: boolean;
  enableUndo: boolean;
  snapIncrement: number; // minutes
  minEventDuration: number; // minutes
  maxZoomLevel: number;
  minZoomLevel: number;
  virtualScrolling: boolean;
  rowHeight: number;
  sidebarWidth: number;
  sidebarResizable: boolean;
}

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
  children?: ContextMenuAction[];
  onClick?: () => void;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Position, Size {}
