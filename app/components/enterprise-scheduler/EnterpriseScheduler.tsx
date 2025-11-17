'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SchedulerProvider, useScheduler } from './core/SchedulerContext';
import { Toolbar } from './toolbar/Toolbar';
import { ResourcePanel } from './panels/ResourcePanel';
import { TimeAxis } from './timeline/TimeAxis';
import { TimelinePanel } from './timeline/TimelinePanel';
import { Resource, SchedulerEvent, Dependency, SchedulerConfig } from './core/types';

interface EnterpriseSchedulerProps {
  resources?: Resource[];
  events?: SchedulerEvent[];
  dependencies?: Dependency[];
  config?: Partial<SchedulerConfig>;
  className?: string;
}

export function EnterpriseScheduler({
  resources = [],
  events = [],
  dependencies = [],
  config,
  className = '',
}: EnterpriseSchedulerProps) {
  return (
    <SchedulerProvider
      initialResources={resources}
      initialEvents={events}
      initialDependencies={dependencies}
      config={config}
    >
      <SchedulerInner className={className} />
    </SchedulerProvider>
  );
}

function SchedulerInner({ className }: { className: string }) {
  const { state, config, dispatch } = useScheduler();
  const timelinePanelRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);

    dispatch({
      type: 'SET_VIEWPORT',
      payload: {
        scrollLeft: target.scrollLeft,
        scrollTop: target.scrollTop,
      },
    });
  }, [dispatch]);

  // Handle wheel events for horizontal scrolling
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom with Ctrl/Cmd + wheel
      e.preventDefault();
      if (e.deltaY < 0) {
        dispatch({ type: 'ZOOM_IN' });
      } else {
        dispatch({ type: 'ZOOM_OUT' });
      }
    } else if (e.shiftKey) {
      // Horizontal scroll with Shift + wheel
      e.preventDefault();
      if (timelinePanelRef.current) {
        timelinePanelRef.current.scrollLeft += e.deltaY;
      }
    }
  }, [dispatch]);

  // Measure container size
  useEffect(() => {
    const updateSize = () => {
      if (timelinePanelRef.current) {
        setContainerSize({
          width: timelinePanelRef.current.clientWidth,
          height: timelinePanelRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete selected events
        state.selection.selectedEventIds.forEach(id => {
          dispatch({ type: 'DELETE_EVENT', payload: id });
        });
      } else if (e.key === 'Escape') {
        // Clear selection
        dispatch({ type: 'CLEAR_SELECTION' });
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        // Undo (placeholder)
        e.preventDefault();
        console.log('Undo');
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        // Redo (placeholder)
        e.preventDefault();
        console.log('Redo');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.selection.selectedEventIds, dispatch]);

  // Handle global mouse events for drag operations
  useEffect(() => {
    if (!state.dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      dispatch({
        type: 'SET_DRAG_STATE',
        payload: {
          currentX: e.clientX,
          currentY: e.clientY,
        },
      });

      // Update ghost event position based on drag type
      if (state.dragState.dragType === 'move' && state.dragState.originalEvent) {
        const deltaX = e.clientX - state.dragState.startX;
        const deltaY = e.clientY - state.dragState.startY;

        const pixelsPerMs = config.snapIncrement * 60 * 1000 / state.timeAxis.cellWidth;
        const timeDelta = deltaX * pixelsPerMs;

        const newStartDate = new Date(state.dragState.originalEvent.startDate.getTime() + timeDelta);
        const newEndDate = new Date(state.dragState.originalEvent.endDate.getTime() + timeDelta);

        dispatch({
          type: 'SET_DRAG_STATE',
          payload: {
            ghostEvent: {
              ...state.dragState.originalEvent,
              startDate: newStartDate,
              endDate: newEndDate,
            },
          },
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (state.dragState.ghostEvent && state.dragState.eventId) {
        // Commit the drag operation
        dispatch({
          type: 'UPDATE_EVENT',
          payload: {
            id: state.dragState.eventId,
            updates: {
              startDate: state.dragState.ghostEvent.startDate,
              endDate: state.dragState.ghostEvent.endDate,
              resourceId: state.dragState.ghostEvent.resourceId,
            },
          },
        });
      }

      dispatch({ type: 'CLEAR_DRAG_STATE' });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [state.dragState, state.timeAxis, config, dispatch]);

  const sidebarWidth = config.sidebarWidth;
  const timelineWidth = containerSize.width;
  const timelineHeight = containerSize.height - 105; // Subtract header height

  return (
    <div className={`h-screen flex flex-col bg-slate-900 ${className}`}>
      {/* Toolbar */}
      <Toolbar />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Resource panel */}
        <ResourcePanel
          width={sidebarWidth}
          scrollTop={scrollTop}
          rowHeight={config.rowHeight}
        />

        {/* Timeline area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline panel with events */}
          <div
            ref={timelinePanelRef}
            className="flex-1 overflow-auto"
            onScroll={handleScroll}
            onWheel={handleWheel}
          >
            {/* Time axis header - sticky within scroll container */}
            <TimeAxis width={timelineWidth} scrollLeft={0} />

            <TimelinePanel
              scrollTop={scrollTop}
              scrollLeft={scrollLeft}
              width={timelineWidth}
              height={timelineHeight}
              rowHeight={config.rowHeight}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
