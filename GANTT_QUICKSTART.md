# Gantt Chart - Quick Start Guide

## Getting Started

This guide will help you begin implementing the Gantt chart component by walking through the first day of development.

---

## Day 1: Foundation Setup

### Step 1: Create Type Definitions

Start with the core data model. This is the foundation everything else builds on.

**File:** `app/components/gantt/core/types.ts`

```typescript
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
  baselines: GanttBaseline[];
  showCriticalPath: boolean;
  showBaseline: boolean;
  autoSchedule: boolean;
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
```

### Step 2: Create Mock Data for Development

**File:** `app/components/gantt/core/mockData.ts`

```typescript
import { GanttTask, GanttDependency } from './types';

export const MOCK_TASKS: GanttTask[] = [
  {
    id: '1',
    name: 'Project Kickoff',
    type: 'summary',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    duration: 20,
    progress: 50,
    parentId: null,
    children: ['2', '3'],
    level: 0,
    expanded: true,
    color: '#3b82f6',
  },
  {
    id: '2',
    name: 'Requirements Gathering',
    type: 'task',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-10'),
    duration: 7,
    progress: 100,
    parentId: '1',
    level: 1,
    expanded: false,
    color: '#10b981',
  },
  {
    id: '3',
    name: 'Design Phase',
    type: 'task',
    startDate: new Date('2024-01-11'),
    endDate: new Date('2024-01-25'),
    duration: 10,
    progress: 60,
    parentId: '1',
    level: 1,
    expanded: false,
    color: '#8b5cf6',
  },
  {
    id: '4',
    name: 'Development Sprint 1',
    type: 'summary',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-29'),
    duration: 20,
    progress: 30,
    parentId: null,
    children: ['5', '6'],
    level: 0,
    expanded: true,
    color: '#f59e0b',
  },
  {
    id: '5',
    name: 'Backend API',
    type: 'task',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-15'),
    duration: 10,
    progress: 40,
    parentId: '4',
    level: 1,
    expanded: false,
    color: '#06b6d4',
  },
  {
    id: '6',
    name: 'Frontend UI',
    type: 'task',
    startDate: new Date('2024-02-16'),
    endDate: new Date('2024-02-29'),
    duration: 10,
    progress: 20,
    parentId: '4',
    level: 1,
    expanded: false,
    color: '#ec4899',
  },
  {
    id: '7',
    name: 'Testing & QA',
    type: 'task',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-03-15'),
    duration: 10,
    progress: 0,
    parentId: null,
    level: 0,
    expanded: false,
    color: '#ef4444',
  },
  {
    id: '8',
    name: 'Launch Milestone',
    type: 'milestone',
    startDate: new Date('2024-03-20'),
    endDate: new Date('2024-03-20'),
    duration: 0,
    progress: 0,
    parentId: null,
    level: 0,
    expanded: false,
    color: '#14b8a6',
  },
];

export const MOCK_DEPENDENCIES: GanttDependency[] = [
  { id: 'd1', fromTaskId: '2', toTaskId: '3', type: 'FS', lag: 0 },
  { id: 'd2', fromTaskId: '3', toTaskId: '5', type: 'FS', lag: 0 },
  { id: 'd3', fromTaskId: '5', toTaskId: '6', type: 'FS', lag: 0 },
  { id: 'd4', fromTaskId: '6', toTaskId: '7', type: 'FS', lag: 0 },
  { id: 'd5', fromTaskId: '7', toTaskId: '8', type: 'FS', lag: 0 },
];
```

### Step 3: Create the Main Gantt Component

**File:** `app/components/gantt/Gantt.tsx`

```typescript
'use client';

import React from 'react';
import { GanttProvider } from './core/GanttContext';
import { GanttTask, GanttDependency, GanttColumn } from './core/types';

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
  return (
    <div className={`h-screen flex flex-col bg-slate-900 ${className}`}>
      {/* Toolbar - to be implemented */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-4">
        <span className="text-white text-sm font-semibold">Gantt Chart</span>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Task Tree Panel - to be implemented */}
        <div className="w-96 bg-slate-800 border-r border-slate-700 flex items-center justify-center">
          <span className="text-slate-400">Task Tree Panel</span>
        </div>

        {/* Timeline Panel - to be implemented */}
        <div className="flex-1 bg-slate-900 flex items-center justify-center">
          <span className="text-slate-400">Timeline Panel</span>
        </div>
      </div>
    </div>
  );
}
```

### Step 4: Create a Demo Page

**File:** `app/gantt-demo/page.tsx`

```typescript
'use client';

import { Gantt } from '@/app/components/gantt/Gantt';
import { MOCK_TASKS, MOCK_DEPENDENCIES } from '@/app/components/gantt/core/mockData';

export default function GanttDemoPage() {
  return (
    <div className="w-full h-screen">
      <Gantt
        tasks={MOCK_TASKS}
        dependencies={MOCK_DEPENDENCIES}
      />
    </div>
  );
}
```

---

## Next Steps After Day 1

1. **Test the basic structure**: Run the demo page and verify the layout appears
2. **Implement GanttContext**: Create the state management (see Phase 1 in main plan)
3. **Build TaskTree component**: Start rendering the left panel (see Phase 2)
4. **Build Timeline component**: Start rendering the right panel (see Phase 3)

---

## Tips for Implementation

### Use Incremental Development
- Build one feature at a time
- Test each feature before moving on
- Don't try to implement everything at once

### Start Simple
- Begin with static rendering (no interactions)
- Add interactions one by one
- Optimize only after features work

### Use the Enterprise Scheduler as Reference
- Borrow patterns from the existing scheduler component
- Reuse utilities where applicable (date formatting, etc.)
- Similar architecture but different features

### Common Pitfalls to Avoid
1. **Don't build nested task structure** - use flat array with parentId
2. **Don't render all tasks at once** - use virtual scrolling from the start
3. **Don't recalculate everything on every change** - be selective
4. **Don't forget keyboard accessibility** - plan for it early

---

## Development Tools

### Recommended VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- TypeScript Hero
- Tailwind CSS IntelliSense

### Debugging
- React DevTools for component inspection
- Performance profiler for optimization
- Console logging for scheduling engine

### Testing Strategy
- Write tests as you build each feature
- Test edge cases (empty state, single task, 1000 tasks)
- Manual testing for UX feel

---

## Estimated Timeline

- **Weeks 1-2**: Foundation + Basic UI
- **Weeks 3-4**: Core interactions (drag/resize/dependencies)
- **Week 5**: Advanced features (calendar, critical path)
- **Week 6**: Polish + performance + testing

Total: ~6 weeks for full implementation

---

## Questions to Answer Before Starting

1. **Target performance**: How many tasks should it handle smoothly?
   - Suggested: 5,000 tasks minimum

2. **Browser support**: Which browsers?
   - Suggested: Modern browsers (Chrome, Firefox, Safari, Edge)

3. **Mobile/touch**: Is touch support required?
   - Suggested: Desktop-first, touch is nice-to-have

4. **Backend integration**: Will tasks sync to a server?
   - Suggested: Build with local state first, add sync later

5. **Customization needs**: Custom columns, custom task types?
   - Suggested: Design for extensibility from the start

---

## Success Metrics

After completing the implementation, you should have:

✅ A working Gantt chart that matches the feature spec
✅ Smooth performance with 5,000+ tasks
✅ All core interactions working (drag, resize, dependencies)
✅ Professional UI/UX comparable to commercial tools
✅ Comprehensive test coverage
✅ Clean, maintainable code architecture

---

Ready to start? Begin with Day 1 tasks above, then proceed through the phases in the main implementation plan.
