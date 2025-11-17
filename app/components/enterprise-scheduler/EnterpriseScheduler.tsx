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

  // Handle wheel events for horizontal scrolling and zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom with Ctrl/Cmd + wheel - prevent browser zoom
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaY < 0) {
        dispatch({ type: 'ZOOM_IN' });
      } else {
        dispatch({ type: 'ZOOM_OUT' });
      }
      return false;
    } else if (e.shiftKey) {
      // Horizontal scroll with Shift + wheel
      e.preventDefault();
      if (timelinePanelRef.current) {
        timelinePanelRef.current.scrollLeft += e.deltaY;
      }
    }
  }, [dispatch]);

  // Prevent browser zoom on timeline area
  useEffect(() => {
    const handleWheelCapture = (e: WheelEvent) => {
      if ((e.ctrlKey || e.metaKey) && timelinePanelRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', handleWheelCapture, { passive: false });
    return () => document.removeEventListener('wheel', handleWheelCapture);
  }, []);

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

    const dragState = state.dragState;
    const zoomLevel = state.zoomLevel;
    const timeAxis = state.timeAxis;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.originalEvent) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

      // Calculate milliseconds per pixel
      const msPerPixel = zoomLevel.tickSize / timeAxis.cellWidth;
      const timeDelta = deltaX * msPerPixel;

      let newStartDate: Date;
      let newEndDate: Date;
      let newResourceId = dragState.originalEvent.resourceId;

      if (dragState.dragType === 'move') {
        // Move: shift both start and end times
        newStartDate = new Date(dragState.originalEvent.startDate.getTime() + timeDelta);
        newEndDate = new Date(dragState.originalEvent.endDate.getTime() + timeDelta);

        // Calculate resource change based on deltaY
        const resourceIndexDelta = Math.round(deltaY / config.rowHeight);
        // TODO: Update resource based on resourceIndexDelta
      } else if (dragState.dragType === 'resize-start') {
        // Resize start: only change start time
        newStartDate = new Date(dragState.originalEvent.startDate.getTime() + timeDelta);
        newEndDate = dragState.originalEvent.endDate;

        // Ensure start doesn't go past end
        if (newStartDate >= newEndDate) {
          newStartDate = new Date(newEndDate.getTime() - config.minEventDuration * 60 * 1000);
        }
      } else if (dragState.dragType === 'resize-end') {
        // Resize end: only change end time
        newStartDate = dragState.originalEvent.startDate;
        newEndDate = new Date(dragState.originalEvent.endDate.getTime() + timeDelta);

        // Ensure end doesn't go before start
        if (newEndDate <= newStartDate) {
          newEndDate = new Date(newStartDate.getTime() + config.minEventDuration * 60 * 1000);
        }
      } else {
        return; // Unknown drag type
      }

      dispatch({
        type: 'SET_DRAG_STATE',
        payload: {
          currentX: e.clientX,
          currentY: e.clientY,
          ghostEvent: {
            ...dragState.originalEvent,
            startDate: newStartDate,
            endDate: newEndDate,
            resourceId: newResourceId,
          },
        },
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();

      if (dragState.ghostEvent && dragState.eventId) {
        // Commit the drag operation
        dispatch({
          type: 'UPDATE_EVENT',
          payload: {
            id: dragState.eventId,
            updates: {
              startDate: dragState.ghostEvent.startDate,
              endDate: dragState.ghostEvent.endDate,
              resourceId: dragState.ghostEvent.resourceId,
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
  }, [state.dragState.isDragging, dispatch, config.rowHeight, config.minEventDuration]);

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
