'use client';

import React, { useMemo, useCallback } from 'react';
import { useScheduler } from '../core/SchedulerContext';
import { EventBar } from '../events/EventBar';
import { TimelineGrid } from './TimelineGrid';
import { DependencyLines } from '../dependencies/DependencyLines';
import { SchedulerEvent } from '../core/types';

interface TimelinePanelProps {
  scrollTop: number;
  scrollLeft: number;
  width: number;
  height: number;
  rowHeight: number;
}

export function TimelinePanel({
  scrollTop,
  scrollLeft,
  width,
  height,
  rowHeight,
}: TimelinePanelProps) {
  const { state, dispatch } = useScheduler();
  const { events, resources, timeAxis, zoomLevel } = state;

  // Flatten resources for row calculation
  const flatResources = useMemo(() => {
    return flattenResources(resources);
  }, [resources]);

  // Calculate event positions
  const eventPositions = useMemo(() => {
    return events.map((event) => {
      const resourceIndex = flatResources.findIndex((r) => r.id === event.resourceId);
      if (resourceIndex === -1) return null;

      const startTime = event.startDate.getTime();
      const endTime = event.endDate.getTime();
      const timeAxisStart = timeAxis.startDate.getTime();

      const left = ((startTime - timeAxisStart) / zoomLevel.tickSize) * timeAxis.cellWidth;
      const width = ((endTime - startTime) / zoomLevel.tickSize) * timeAxis.cellWidth;
      const top = resourceIndex * rowHeight;

      return {
        event,
        left,
        width,
        top,
        height: rowHeight,
      };
    }).filter(Boolean) as Array<{
      event: SchedulerEvent;
      left: number;
      width: number;
      top: number;
      height: number;
    }>;
  }, [events, flatResources, timeAxis, zoomLevel, rowHeight]);

  const handleDragStart = useCallback(
    (event: SchedulerEvent) => {
      return (e: React.MouseEvent, dragType: 'move' | 'resize-start' | 'resize-end') => {
        dispatch({
          type: 'SET_DRAG_STATE',
          payload: {
            isDragging: true,
            dragType,
            eventId: event.id,
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
            originalEvent: event,
            ghostEvent: { ...event },
          },
        });
      };
    },
    [dispatch]
  );

  const handleEventDoubleClick = useCallback(
    (event: SchedulerEvent) => {
      // Open edit modal or inline editor
      console.log('Edit event:', event);
    },
    []
  );

  // Resource rows background
  const rowCount = flatResources.length;
  const totalHeight = rowCount * rowHeight;

  // Calculate total timeline width
  const totalWidth = useMemo(() => {
    const timeDuration = timeAxis.endDate.getTime() - timeAxis.startDate.getTime();
    const numTicks = timeDuration / zoomLevel.tickSize;
    return numTicks * timeAxis.cellWidth;
  }, [timeAxis.startDate, timeAxis.endDate, timeAxis.cellWidth, zoomLevel.tickSize]);

  return (
    <div className="relative bg-slate-900" style={{ width: totalWidth, height: totalHeight, minHeight: height }}>
      {/* Resource row backgrounds */}
      <div className="absolute top-0 left-0" style={{ width: totalWidth, height: totalHeight }}>
        {flatResources.map((resource, index) => (
          <div
            key={resource.id}
            className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors"
            style={{
              height: rowHeight,
              width: totalWidth,
            }}
          />
        ))}
      </div>

      {/* Timeline grid */}
      <TimelineGrid height={totalHeight} scrollLeft={0} />

      {/* Dependency lines */}
      <DependencyLines
        scrollLeft={0}
        scrollTop={0}
        rowHeight={rowHeight}
      />

      {/* Events */}
      <div className="absolute top-0 left-0" style={{ width: totalWidth, height: totalHeight }}>
        {eventPositions.map(({ event, left, width, top, height }) => (
          <EventBar
            key={event.id}
            event={event}
            left={left}
            width={width}
            top={top}
            height={height}
            onDragStart={handleDragStart(event)}
            onDoubleClick={() => handleEventDoubleClick(event)}
          />
        ))}
      </div>

      {/* Ghost event during drag */}
      {state.dragState.isDragging && state.dragState.ghostEvent && (
        <GhostEvent
          event={state.dragState.ghostEvent}
          dragState={state.dragState}
          scrollLeft={scrollLeft}
          scrollTop={scrollTop}
          rowHeight={rowHeight}
          flatResources={flatResources}
          timeAxis={timeAxis}
          zoomLevel={zoomLevel}
        />
      )}
    </div>
  );
}

// Helper to flatten hierarchical resources
function flattenResources(resources: any[]): any[] {
  const result: any[] = [];

  function flatten(items: any[]) {
    for (const item of items) {
      result.push(item);
      if (item.expanded && item.children && item.children.length > 0) {
        flatten(item.children);
      }
    }
  }

  flatten(resources);
  return result;
}

// Ghost event component
function GhostEvent({
  event,
  dragState,
  scrollLeft,
  scrollTop,
  rowHeight,
  flatResources,
  timeAxis,
  zoomLevel,
}: any) {
  const resourceIndex = flatResources.findIndex((r: any) => r.id === event.resourceId);
  if (resourceIndex === -1) return null;

  const startTime = event.startDate.getTime();
  const endTime = event.endDate.getTime();
  const timeAxisStart = timeAxis.startDate.getTime();

  const left = ((startTime - timeAxisStart) / zoomLevel.tickSize) * timeAxis.cellWidth;
  const width = ((endTime - startTime) / zoomLevel.tickSize) * timeAxis.cellWidth;
  const top = resourceIndex * rowHeight;

  return (
    <div
      className="absolute rounded-md border-2 border-dashed border-blue-400 bg-blue-500/30 pointer-events-none z-50"
      style={{
        left: left - scrollLeft,
        top: top - scrollTop + 5,
        width: Math.max(width, 30),
        height: rowHeight - 10,
      }}
    />
  );
}
