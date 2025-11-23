# Enterprise Gantt Chart - Implementation Plan

## Overview
Build a fully interactive Gantt chart component modeled after Bryntum Gantt, MS Project, and Smartsheet with complete feature parity including hierarchical task trees, dependency management, drag/drop interactions, and advanced scheduling.

---

## Phase 1: Foundation & Architecture (Days 1-3)

### 1.1 Type Definitions & Data Models
**File:** `app/components/gantt/core/types.ts`

**Tasks:**
- [ ] Define `GanttTask` interface
  - id, name, startDate, endDate, duration
  - progress (0-100), color, type (task/milestone/summary)
  - parentId, children array, level, expanded
  - assignedResources, constraints, baseline data
  - Custom metadata fields

- [ ] Define `GanttDependency` interface
  - id, fromTaskId, toTaskId
  - type: 'FS' | 'SS' | 'FF' | 'SF'
  - lag (in hours/days)

- [ ] Define `GanttColumn` interface
  - id, title, field, width, resizable, sortable, editable
  - renderCell function, dataType

- [ ] Define `Calendar` interface
  - workingDays array, workingHours
  - holidays array, exceptions

- [ ] Define `Constraint` types
  - ASAP, ALAP, SNET, SNLT, FNET, FNLT, MSO, MFO

- [ ] Define `ZoomLevel` interface
  - scale name, cellWidth, headerTiers
  - timeUnit (year/quarter/month/week/day/hour)

- [ ] Define `Baseline` interface
  - baselineNumber, tasks snapshot

- [ ] Define view state types
  - DragState, ResizeState, SelectionState
  - ScrollState, ViewportState

### 1.2 Core Context & State Management
**File:** `app/components/gantt/core/GanttContext.tsx`

**Tasks:**
- [ ] Create GanttProvider with useReducer
- [ ] Implement state structure:
  - tasks array (flat list with hierarchy via parentId)
  - dependencies array
  - columns configuration
  - calendar settings
  - zoom level state
  - viewport state (scrollLeft, scrollTop, visible range)
  - selection state (selectedTaskIds, selectedDependencyIds)
  - drag/resize state
  - baselines array
  - showCriticalPath boolean
  - showBaseline boolean

- [ ] Define reducer actions:
  - Task CRUD: ADD_TASK, UPDATE_TASK, DELETE_TASK, MOVE_TASK
  - Hierarchy: INDENT_TASK, OUTDENT_TASK, EXPAND_TASK, COLLAPSE_TASK
  - Dependencies: ADD_DEPENDENCY, UPDATE_DEPENDENCY, DELETE_DEPENDENCY
  - Selection: SELECT_TASK, DESELECT_TASK, CLEAR_SELECTION, MULTI_SELECT
  - Viewport: SET_SCROLL, SET_ZOOM, SET_VISIBLE_RANGE
  - Drag/Resize: START_DRAG, UPDATE_DRAG, END_DRAG, START_RESIZE, UPDATE_RESIZE, END_RESIZE
  - Calendar: UPDATE_CALENDAR, ADD_HOLIDAY, ADD_EXCEPTION
  - Baseline: SAVE_BASELINE, TOGGLE_BASELINE, TOGGLE_CRITICAL_PATH
  - Column: RESIZE_COLUMN, REORDER_COLUMN, TOGGLE_COLUMN

- [ ] Implement helper functions:
  - getTaskById, getTaskChildren, getTaskAncestors
  - getDependenciesForTask
  - calculateTaskPath (for critical path)
  - Undo/redo stack management

### 1.3 Scheduling Engine
**File:** `app/components/gantt/core/schedulingEngine.ts`

**Tasks:**
- [ ] Implement calendar utilities:
  - isWorkingDay(date, calendar)
  - getNextWorkingDay(date, calendar)
  - calculateWorkingDuration(start, end, calendar)
  - addWorkingDuration(start, duration, calendar)

- [ ] Implement task scheduling:
  - scheduleTask(task, dependencies, calendar, constraints)
  - scheduleForward (ASAP scheduling)
  - scheduleBackward (ALAP scheduling)
  - applyConstraints (SNET, SNLT, etc.)

- [ ] Implement dependency resolution:
  - calculateEarliestStart(task, dependencies)
  - calculateLatestFinish(task, dependencies)
  - resolveCircularDependencies

- [ ] Implement critical path calculation:
  - calculateSlack(task)
  - findCriticalPath(tasks, dependencies)
  - markCriticalTasks

- [ ] Implement summary task aggregation:
  - rollupSummaryDates(parent, children)
  - rollupProgress(parent, children)
  - recalculateAncestors(task)

---

## Phase 2: Task Tree Panel (Days 4-6)

### 2.1 Task Tree Core Component
**File:** `app/components/gantt/tree/TaskTree.tsx`

**Tasks:**
- [ ] Create main TaskTree component
- [ ] Implement sticky column headers
- [ ] Implement virtual scrolling for rows
- [ ] Sync scroll with timeline panel
- [ ] Handle row height calculations
- [ ] Implement row selection (single/multi)
- [ ] Implement keyboard navigation (arrow keys, Tab)

### 2.2 Task Row Component
**File:** `app/components/gantt/tree/TaskRow.tsx`

**Tasks:**
- [ ] Render task row with hierarchical indentation
- [ ] Add expand/collapse chevron icon
- [ ] Display task type icon (task/milestone/summary)
- [ ] Implement row hover state
- [ ] Implement row selection state
- [ ] Handle click events (single/double click)
- [ ] Implement row drag handle
- [ ] Apply zebra striping or alternating colors

### 2.3 Tree Cell Renderers
**File:** `app/components/gantt/tree/cells/`

**Tasks:**
- [ ] Create `NameCell.tsx`
  - Indentation rendering
  - Expand/collapse control
  - Inline editing on double-click

- [ ] Create `DateCell.tsx`
  - Format date display
  - Inline date picker editing

- [ ] Create `DurationCell.tsx`
  - Display duration with units (d/h/m)
  - Inline duration editor (parse "3d", "12h")

- [ ] Create `ProgressCell.tsx`
  - Progress bar visualization
  - Inline slider/input editor

- [ ] Create `ResourceCell.tsx`
  - Display assigned resources
  - Resource picker dropdown

- [ ] Create `GenericCell.tsx`
  - Handle text/number fields
  - Generic inline editor

### 2.4 Column Management
**File:** `app/components/gantt/tree/ColumnHeader.tsx`

**Tasks:**
- [ ] Render column headers with titles
- [ ] Implement column resize handles
- [ ] Implement column resize drag interaction
- [ ] Implement column reorder drag interaction
- [ ] Add sort indicators and sort click handlers
- [ ] Add column visibility toggle
- [ ] Persist column widths to state

### 2.5 Tree Interactions
**File:** `app/components/gantt/tree/interactions/`

**Tasks:**
- [ ] Implement row drag to reorder
  - Visual feedback during drag
  - Drop zones between rows
  - Update task order in state

- [ ] Implement indent/outdent via drag
  - Detect horizontal drag threshold
  - Visual indent level indicators
  - Update parentId and hierarchy

- [ ] Implement keyboard shortcuts
  - Tab/Shift+Tab for indent/outdent
  - Delete for remove task
  - Ctrl+C/V for copy/paste
  - Arrow keys for navigation

---

## Phase 3: Timeline Panel Core (Days 7-10)

### 3.1 Timeline Container
**File:** `app/components/gantt/timeline/Timeline.tsx`

**Tasks:**
- [ ] Create main Timeline component
- [ ] Implement horizontal infinite scroll
- [ ] Implement virtual rendering of visible time range
- [ ] Sync vertical scroll with task tree
- [ ] Calculate visible date range from scroll position
- [ ] Render grid background cells

### 3.2 Time Axis Headers
**File:** `app/components/gantt/timeline/TimeAxis.tsx`

**Tasks:**
- [ ] Create multi-tier time header component
- [ ] Implement tier calculation based on zoom level:
  - Year tier
  - Quarter tier
  - Month tier
  - Week tier
  - Day tier
  - Hour tier

- [ ] Render tier headers with proper spanning
- [ ] Apply sticky positioning
- [ ] Handle zoom level changes
- [ ] Display "Today" marker
- [ ] Weekend/holiday highlighting in headers

### 3.3 Timeline Grid
**File:** `app/components/gantt/timeline/TimelineGrid.tsx`

**Tasks:**
- [ ] Render vertical grid lines aligned to time units
- [ ] Render horizontal grid lines per row
- [ ] Apply weekend shading
- [ ] Apply holiday shading
- [ ] Apply non-working time shading
- [ ] Optimize rendering with canvas or SVG

### 3.4 Task Bar Rendering
**File:** `app/components/gantt/timeline/TaskBar.tsx`

**Tasks:**
- [ ] Calculate bar position from task dates + zoom
- [ ] Render normal task as rectangle
- [ ] Render milestone as diamond shape
- [ ] Render summary task as thick bracket
- [ ] Display task name label on bar
- [ ] Render progress fill overlay
- [ ] Apply task color
- [ ] Add resize handles (left/right)
- [ ] Add hover effects
- [ ] Add selection outline
- [ ] Render task icons (if any)

### 3.5 Baseline Bars
**File:** `app/components/gantt/timeline/BaselineBar.tsx`

**Tasks:**
- [ ] Render thin baseline bar below main task
- [ ] Calculate position from baseline dates
- [ ] Different color/style from main bar
- [ ] Show slippage indicators
- [ ] Toggle visibility based on state

### 3.6 Dependency Lines
**File:** `app/components/gantt/timeline/DependencyLines.tsx`

**Tasks:**
- [ ] Calculate line coordinates from task positions
- [ ] Implement auto-routing algorithm:
  - FS: from end of A to start of B
  - SS: from start of A to start of B
  - FF: from end of A to end of B
  - SF: from start of A to end of B

- [ ] Render lines with elbow routing
- [ ] Add arrowheads at target
- [ ] Handle lines across rows (vertical segments)
- [ ] Handle lines across time (horizontal segments)
- [ ] Optimize with SVG overlay
- [ ] Click detection for selection
- [ ] Hover effects
- [ ] Show lag/lead offset visually

---

## Phase 4: Drag & Resize Interactions (Days 11-13)

### 4.1 Task Bar Drag (Move)
**File:** `app/components/gantt/timeline/interactions/dragTask.ts`

**Tasks:**
- [ ] Detect mousedown on task bar
- [ ] Track mouse movement to calculate delta
- [ ] Calculate new start/end dates from delta
- [ ] Snap to time unit grid
- [ ] Respect calendar (working days only)
- [ ] Show ghost/preview bar during drag
- [ ] Update dependent tasks if auto-schedule enabled
- [ ] Vertical drag to change row/resource
- [ ] Auto-scroll when dragging near edges
- [ ] Commit changes on mouseup
- [ ] Cancel on Escape key

### 4.2 Task Bar Resize
**File:** `app/components/gantt/timeline/interactions/resizeTask.ts`

**Tasks:**
- [ ] Detect mousedown on left resize handle
- [ ] Detect mousedown on right resize handle
- [ ] Track drag to calculate new start (left) or end (right)
- [ ] Snap to grid
- [ ] Respect working time
- [ ] Prevent resizing past opposite handle
- [ ] Update dependent tasks
- [ ] Show preview during resize
- [ ] Commit on mouseup
- [ ] Disable resize for milestones
- [ ] Disable resize for summary tasks

### 4.3 Dependency Creation
**File:** `app/components/gantt/timeline/interactions/createDependency.ts`

**Tasks:**
- [ ] Add connection ports to task bars (start/end)
- [ ] Detect drag from port
- [ ] Render live dependency line following cursor
- [ ] Highlight valid target ports on hover
- [ ] Determine dependency type from ports:
  - end → start = FS
  - start → start = SS
  - end → end = FF
  - start → end = SF

- [ ] Create dependency on drop
- [ ] Validate no circular dependencies
- [ ] Prevent duplicate dependencies

### 4.4 Task Creation
**File:** `app/components/gantt/timeline/interactions/createTask.ts`

**Tasks:**
- [ ] Detect double-click on empty timeline
- [ ] Open inline editor or modal
- [ ] Implement drag-to-create:
  - Click and drag horizontally
  - Visual preview of task bar
  - Calculate start/end from drag range
  - Create task on release

- [ ] Insert task at appropriate row
- [ ] Assign default values
- [ ] Focus name field for editing

---

## Phase 5: Zoom & Calendar (Days 14-15)

### 5.1 Zoom Controls
**File:** `app/components/gantt/zoom/ZoomControls.tsx`

**Tasks:**
- [ ] Create zoom in/out buttons
- [ ] Define zoom level presets:
  - Year view (months visible)
  - Quarter view (weeks visible)
  - Month view (days visible)
  - Week view (days/hours visible)
  - Day view (hours visible)

- [ ] Implement zoom in/out dispatch
- [ ] Implement Ctrl+wheel zoom
- [ ] Implement pinch-to-zoom (touch)
- [ ] Maintain scroll anchor point during zoom
- [ ] Smooth transitions between levels

### 5.2 Zoom Logic
**File:** `app/components/gantt/zoom/zoomEngine.ts`

**Tasks:**
- [ ] Calculate cell width per zoom level
- [ ] Calculate which time tiers to show
- [ ] Calculate header spans per tier
- [ ] Recalculate visible date range
- [ ] Adjust scroll position to keep anchor centered
- [ ] Update grid intervals

### 5.3 Working Calendar
**File:** `app/components/gantt/calendar/Calendar.tsx`

**Tasks:**
- [ ] Define default calendar (Mon-Fri, 9-5)
- [ ] Calendar editor UI (modal or panel)
- [ ] Set working days checkboxes
- [ ] Set working hours time pickers
- [ ] Add holidays date picker
- [ ] Add exceptions (special working/non-working dates)
- [ ] Support multiple calendars (global, resource-specific)
- [ ] Apply calendar to scheduling calculations

### 5.4 Calendar Visualization
**File:** `app/components/gantt/calendar/CalendarShading.tsx`

**Tasks:**
- [ ] Shade weekends on timeline
- [ ] Shade holidays on timeline
- [ ] Shade non-working hours (for day/hour view)
- [ ] Display constraint markers on bars
- [ ] Show "earliest start" / "latest finish" indicators

---

## Phase 6: Advanced Features (Days 16-18)

### 6.1 Critical Path
**File:** `app/components/gantt/criticalPath/`

**Tasks:**
- [ ] Implement critical path algorithm in scheduling engine
- [ ] Highlight critical tasks with different color
- [ ] Update on any task date change
- [ ] Toggle on/off from toolbar
- [ ] Show slack values in tooltip

### 6.2 Baselines
**File:** `app/components/gantt/baseline/`

**Tasks:**
- [ ] Save baseline snapshot (copy all task dates)
- [ ] Store multiple baselines (Baseline 1, 2, 3)
- [ ] Render baseline bars below main bars
- [ ] Show variance (slippage lines)
- [ ] Toggle baseline visibility
- [ ] Baseline comparison view

### 6.3 Constraints
**File:** `app/components/gantt/constraints/`

**Tasks:**
- [ ] UI to set task constraints (dropdown)
- [ ] Implement constraint types in scheduling:
  - ASAP (as soon as possible)
  - ALAP (as late as possible)
  - SNET (start no earlier than)
  - SNLT (start no later than)
  - FNET (finish no earlier than)
  - FNLT (finish no later than)
  - MSO (must start on)
  - MFO (must finish on)

- [ ] Display constraint markers on timeline
- [ ] Validate constraints during drag/resize
- [ ] Show constraint violations

### 6.4 Multi-Select & Bulk Operations
**File:** `app/components/gantt/selection/`

**Tasks:**
- [ ] Implement Ctrl+click for multi-select
- [ ] Implement Shift+click for range select
- [ ] Implement drag-box selection on timeline
- [ ] Highlight all selected tasks
- [ ] Bulk delete
- [ ] Bulk move
- [ ] Bulk update (e.g., assign resource to all)

---

## Phase 7: Context Menus & Toolbars (Days 19-20)

### 7.1 Task Bar Context Menu
**File:** `app/components/gantt/menus/TaskBarContextMenu.tsx`

**Tasks:**
- [ ] Right-click on task bar to open menu
- [ ] Menu items:
  - Edit task
  - Add child task
  - Add sibling task
  - Delete task
  - Convert to milestone
  - Change color
  - Manage dependencies
  - Set constraint
  - Add to baseline

- [ ] Position menu near cursor
- [ ] Close on click outside or Escape

### 7.2 Task Tree Context Menu
**File:** `app/components/gantt/menus/TaskTreeContextMenu.tsx`

**Tasks:**
- [ ] Right-click on tree row to open menu
- [ ] Menu items:
  - Indent
  - Outdent
  - Add new task
  - Duplicate task
  - Delete task
  - Expand all
  - Collapse all

- [ ] Apply actions to selected task(s)

### 7.3 Timeline Context Menu
**File:** `app/components/gantt/menus/TimelineContextMenu.tsx`

**Tasks:**
- [ ] Right-click on empty timeline area
- [ ] Menu items:
  - Create new task here
  - Jump to date
  - Toggle working hours visibility
  - Zoom to fit

- [ ] Pass date/row context from click position

### 7.4 Toolbar
**File:** `app/components/gantt/toolbar/GanttToolbar.tsx`

**Tasks:**
- [ ] Create toolbar component at top
- [ ] Buttons/controls:
  - Add task
  - Add summary task
  - Indent
  - Outdent
  - Delete
  - Undo
  - Redo
  - Today (scroll to today)
  - Zoom in
  - Zoom out
  - Zoom to fit
  - Critical path toggle
  - Baseline toggle
  - Working time toggle
  - Calendar selector dropdown
  - Export (CSV/JSON)
  - Print

- [ ] Use icons + tooltips
- [ ] Disable buttons when not applicable
- [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+Y, etc.)

---

## Phase 8: Inline Editing (Days 21-22)

### 8.1 Tree Cell Editors
**File:** `app/components/gantt/editors/`

**Tasks:**
- [ ] Double-click to activate inline editor
- [ ] Text editor for name
- [ ] Date picker for dates
- [ ] Duration parser ("3d", "12h", "2w")
- [ ] Progress slider (0-100%)
- [ ] Resource picker (dropdown/autocomplete)
- [ ] Save on blur or Enter
- [ ] Cancel on Escape
- [ ] Tab to next cell

### 8.2 Task Bar Inline Edit
**File:** `app/components/gantt/timeline/TaskBarEditor.tsx`

**Tasks:**
- [ ] Double-click bar to edit name inline
- [ ] Small text input overlaying bar
- [ ] Save on blur/Enter
- [ ] Cancel on Escape

### 8.3 Dependency Editor
**File:** `app/components/gantt/editors/DependencyEditor.tsx`

**Tasks:**
- [ ] Click dependency line to select
- [ ] Show editor panel or modal
- [ ] Edit dependency type (FS/SS/FF/SF)
- [ ] Edit lag/lead time
- [ ] Delete button
- [ ] Save changes

---

## Phase 9: Performance & Virtualization (Days 23-24)

### 9.1 Virtual Scrolling
**File:** `app/components/gantt/virtual/VirtualScroller.tsx`

**Tasks:**
- [ ] Calculate visible row range from scroll position
- [ ] Render only visible rows + buffer
- [ ] Recycle row components
- [ ] Handle dynamic row heights if needed
- [ ] Optimize for 5,000+ tasks

### 9.2 Timeline Virtual Rendering
**File:** `app/components/gantt/virtual/VirtualTimeline.tsx`

**Tasks:**
- [ ] Calculate visible date range from horizontal scroll
- [ ] Render only visible task bars
- [ ] Render only visible dependency lines
- [ ] Use spatial indexing for fast lookups
- [ ] Optimize for 20,000+ dependencies

### 9.3 Rendering Optimization
**Tasks:**
- [ ] Use React.memo for row components
- [ ] Use useMemo for expensive calculations
- [ ] Debounce scroll events
- [ ] Throttle drag/resize updates
- [ ] Use requestAnimationFrame for animations
- [ ] Consider canvas rendering for grid
- [ ] Profile and optimize re-renders

---

## Phase 10: Utility Features (Days 25-26)

### 10.1 Tooltips
**File:** `app/components/gantt/tooltips/TaskTooltip.tsx`

**Tasks:**
- [ ] Show tooltip on task bar hover
- [ ] Display:
  - Task name
  - Start/end dates
  - Duration
  - Progress
  - Assigned resources
  - Constraint info
  - Slack (if critical path enabled)

- [ ] Position tooltip near cursor
- [ ] Delay before showing
- [ ] Style consistently

### 10.2 Copy/Paste
**File:** `app/components/gantt/clipboard/`

**Tasks:**
- [ ] Ctrl+C to copy selected task(s)
- [ ] Store in clipboard state (not browser clipboard)
- [ ] Ctrl+V to paste
- [ ] Duplicate task with new IDs
- [ ] Preserve hierarchy if copying parent+children
- [ ] Paste at selected row or end of list

### 10.3 Undo/Redo
**File:** `app/components/gantt/history/`

**Tasks:**
- [ ] Implement undo stack in context
- [ ] Push state snapshot on each action
- [ ] Ctrl+Z to undo
- [ ] Ctrl+Y to redo
- [ ] Limit stack size (e.g., 50 steps)
- [ ] Clear redo stack on new action

### 10.4 Export/Import
**File:** `app/components/gantt/export/`

**Tasks:**
- [ ] Export to JSON (full project data)
- [ ] Export to CSV (flattened task list)
- [ ] Import from JSON
- [ ] Validate imported data
- [ ] Export button in toolbar

### 10.5 Print View
**File:** `app/components/gantt/print/PrintView.tsx`

**Tasks:**
- [ ] Print-optimized layout
- [ ] Paginate timeline across multiple pages
- [ ] Include task tree in print
- [ ] CSS for @media print
- [ ] Print preview modal
- [ ] Print button in toolbar

---

## Phase 11: Testing & Polish (Days 27-30)

### 11.1 Unit Tests
**Files:** `app/components/gantt/**/*.test.ts`

**Tasks:**
- [ ] Test scheduling engine functions
- [ ] Test critical path algorithm
- [ ] Test calendar utilities
- [ ] Test dependency validation
- [ ] Test hierarchy operations (indent/outdent)
- [ ] Test task CRUD operations
- [ ] Test zoom calculations

### 11.2 Integration Tests
**Tasks:**
- [ ] Test drag task updates dependencies
- [ ] Test resize task triggers recalculation
- [ ] Test indent/outdent updates summary tasks
- [ ] Test delete task removes dependencies
- [ ] Test undo/redo full workflow
- [ ] Test multi-select + bulk delete

### 11.3 E2E Tests
**Tasks:**
- [ ] Test full user workflow: add tasks, link, schedule
- [ ] Test zoom in/out maintains view
- [ ] Test scroll sync between panels
- [ ] Test context menus open and execute
- [ ] Test keyboard shortcuts
- [ ] Test touch interactions (if supported)

### 11.4 Performance Testing
**Tasks:**
- [ ] Load test with 5,000 tasks
- [ ] Load test with 20,000 dependencies
- [ ] Profile rendering performance
- [ ] Profile scroll performance
- [ ] Optimize bottlenecks
- [ ] Memory leak checks

### 11.5 Accessibility
**Tasks:**
- [ ] Keyboard navigation for all features
- [ ] ARIA labels for interactive elements
- [ ] Focus management
- [ ] Screen reader support for task tree
- [ ] High contrast mode support

### 11.6 Polish & UX
**Tasks:**
- [ ] Smooth animations for expand/collapse
- [ ] Smooth animations for zoom transitions
- [ ] Consistent hover states
- [ ] Consistent selection states
- [ ] Loading states for heavy operations
- [ ] Error messages for validation failures
- [ ] Empty state when no tasks
- [ ] Responsive layout (minimum width warnings)

---

## File Structure

```
app/components/gantt/
├── core/
│   ├── types.ts                    # All TypeScript interfaces
│   ├── GanttContext.tsx            # Main context + reducer
│   ├── schedulingEngine.ts         # Scheduling logic
│   └── utils.ts                    # Helper functions
│
├── tree/
│   ├── TaskTree.tsx                # Main tree component
│   ├── TaskRow.tsx                 # Single row
│   ├── ColumnHeader.tsx            # Header row
│   ├── cells/
│   │   ├── NameCell.tsx
│   │   ├── DateCell.tsx
│   │   ├── DurationCell.tsx
│   │   ├── ProgressCell.tsx
│   │   ├── ResourceCell.tsx
│   │   └── GenericCell.tsx
│   └── interactions/
│       ├── dragRow.ts
│       ├── indentOutdent.ts
│       └── keyboardNav.ts
│
├── timeline/
│   ├── Timeline.tsx                # Main timeline component
│   ├── TimeAxis.tsx                # Multi-tier headers
│   ├── TimelineGrid.tsx            # Grid background
│   ├── TaskBar.tsx                 # Task bar rendering
│   ├── BaselineBar.tsx             # Baseline rendering
│   ├── DependencyLines.tsx         # Dependency arrows
│   ├── TaskBarEditor.tsx           # Inline bar editor
│   └── interactions/
│       ├── dragTask.ts
│       ├── resizeTask.ts
│       ├── createDependency.ts
│       └── createTask.ts
│
├── zoom/
│   ├── ZoomControls.tsx
│   └── zoomEngine.ts
│
├── calendar/
│   ├── Calendar.tsx                # Calendar editor
│   ├── CalendarShading.tsx         # Visual shading
│   └── calendarUtils.ts
│
├── criticalPath/
│   ├── criticalPathEngine.ts
│   └── CriticalPathHighlight.tsx
│
├── baseline/
│   ├── BaselineManager.tsx
│   └── BaselineComparison.tsx
│
├── constraints/
│   ├── ConstraintEditor.tsx
│   └── ConstraintMarkers.tsx
│
├── selection/
│   ├── MultiSelect.tsx
│   └── SelectionBox.tsx
│
├── menus/
│   ├── TaskBarContextMenu.tsx
│   ├── TaskTreeContextMenu.tsx
│   └── TimelineContextMenu.tsx
│
├── toolbar/
│   └── GanttToolbar.tsx
│
├── editors/
│   ├── TextEditor.tsx
│   ├── DateEditor.tsx
│   ├── DurationEditor.tsx
│   ├── ProgressEditor.tsx
│   ├── ResourceEditor.tsx
│   └── DependencyEditor.tsx
│
├── virtual/
│   ├── VirtualScroller.tsx
│   └── VirtualTimeline.tsx
│
├── tooltips/
│   └── TaskTooltip.tsx
│
├── clipboard/
│   └── copyPaste.ts
│
├── history/
│   └── undoRedo.ts
│
├── export/
│   ├── exportJSON.ts
│   ├── exportCSV.ts
│   └── importJSON.ts
│
├── print/
│   └── PrintView.tsx
│
└── Gantt.tsx                       # Main exported component
```

---

## Implementation Order Priority

### Phase 1 (Critical Foundation)
1. Type definitions
2. Context & state management
3. Basic scheduling engine

### Phase 2 (Basic UI)
4. Task tree rendering (no editing yet)
5. Timeline core + time axis
6. Basic task bar rendering

### Phase 3 (Core Interactions)
7. Task bar drag/resize
8. Dependency rendering
9. Dependency creation

### Phase 4 (Essential Features)
10. Zoom controls
11. Tree interactions (indent/outdent, expand/collapse)
12. Inline editing

### Phase 5 (Advanced Features)
13. Calendar support
14. Critical path
15. Baselines
16. Constraints

### Phase 6 (Polish)
17. Context menus
18. Toolbar
19. Tooltips
20. Undo/redo

### Phase 7 (Performance)
21. Virtual scrolling
22. Optimization

### Phase 8 (Final)
23. Export/import
24. Print view
25. Testing
26. Documentation

---

## Key Technical Decisions

### State Management
- Use React Context + useReducer (not Redux)
- Single source of truth for tasks/dependencies
- Immutable state updates
- Optimistic updates with rollback on error

### Rendering Strategy
- Virtual scrolling for 5k+ tasks
- Canvas for grid if needed for performance
- SVG for dependency lines
- React components for task bars (easier interactions)
- RequestAnimationFrame for smooth animations

### Data Structure
- Flat task array with `parentId` (not nested tree)
  - Easier to update
  - Easier to search
  - Build hierarchy on-demand for rendering

- Dependency array (not embedded in tasks)
  - Easier to add/remove
  - Easier to query

### Scheduling Approach
- Forward scheduling by default (ASAP)
- Auto-scheduling updates downstream tasks
- Manual mode allows free positioning
- Respect calendars and constraints
- Recalculate critical path after each change

### Performance Targets
- 60 FPS scrolling with 5,000 tasks
- < 100ms for drag/resize updates
- < 500ms for full reschedule
- < 1s for critical path calculation

---

## Dependencies & Libraries

### Required
- React 18+
- TypeScript
- date-fns (date manipulation)
- Tailwind CSS (styling)

### Optional/Consider
- react-virtual (virtual scrolling)
- d3-scale (time scale calculations)
- konva or fabric.js (canvas rendering if needed)
- react-beautiful-dnd (drag/drop - or custom)

---

## Testing Strategy

### Unit Tests (Jest + React Testing Library)
- All utility functions
- Scheduling engine
- Calendar calculations
- Critical path algorithm
- Reducer actions

### Integration Tests
- Component interactions
- Drag and drop flows
- Multi-step operations

### E2E Tests (Playwright/Cypress)
- Full user workflows
- Complex scenarios (1000+ tasks)

### Performance Tests
- Render benchmarks
- Scroll performance
- Memory profiling

---

## Documentation Plan

### User Documentation
- Getting started guide
- Feature overview
- Keyboard shortcuts reference
- API documentation

### Developer Documentation
- Architecture overview
- State management guide
- Adding custom columns
- Extending the scheduling engine
- Performance optimization guide

---

## Success Criteria

- [ ] Render 5,000 tasks without performance degradation
- [ ] Handle 20,000 dependencies smoothly
- [ ] Smooth 60 FPS scrolling
- [ ] All drag/drop interactions work intuitively
- [ ] Critical path calculates correctly
- [ ] Multi-level undo/redo works
- [ ] Export/import preserves all data
- [ ] Accessible via keyboard
- [ ] Works on modern browsers (Chrome, Firefox, Safari, Edge)
- [ ] Responsive down to 1280px width

---

## Next Steps

1. **Review & Approve Plan**: Get stakeholder sign-off
2. **Set Up Project Structure**: Create folder structure
3. **Start Phase 1**: Begin with types and context
4. **Daily Standups**: Track progress, blockers
5. **Incremental Demos**: Show working features every 3-4 days
6. **Iterate**: Gather feedback and adjust

---

This plan provides a complete roadmap for implementing an enterprise-grade Gantt chart component with feature parity to Bryntum Gantt and MS Project.
