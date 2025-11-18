'use client';

import React, { useState, useRef, useCallback } from 'react';
import { SchedulerEvent } from '../core/types';
import { useScheduler } from '../core/SchedulerContext';

interface EventBarProps {
  event: SchedulerEvent;
  left: number;
  width: number;
  top: number;
  height: number;
  onDragStart?: (e: React.MouseEvent, type: 'move' | 'resize-start' | 'resize-end') => void;
  onDoubleClick?: () => void;
}

export function EventBar({
  event,
  left,
  width,
  top,
  height,
  onDragStart,
  onDoubleClick,
}: EventBarProps) {
  const { state, config, selectEvent, deselectEvent } = useScheduler();
  const [isHovered, setIsHovered] = useState(false);
  const isSelected = state.selection.selectedEventIds.has(event.id);
  const barRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Select event
      if (!isSelected) {
        if (!e.shiftKey) {
          // Clear previous selection if not holding shift
          state.selection.selectedEventIds.forEach(id => {
            if (id !== event.id) deselectEvent(id);
          });
        }
        selectEvent(event.id);
      }

      // Start drag if enabled
      if (event.draggable !== false && onDragStart) {
        onDragStart(e, 'move');
      }
    },
    [event, isSelected, selectEvent, deselectEvent, onDragStart, state.selection.selectedEventIds]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      selectEvent(event.id);
      if (onDragStart) {
        onDragStart(e, 'resize-start');
      }
    },
    [event.id, selectEvent, onDragStart]
  );

  const handleResizeEnd = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      selectEvent(event.id);
      if (onDragStart) {
        onDragStart(e, 'resize-end');
      }
    },
    [event.id, selectEvent, onDragStart]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDoubleClick?.();
    },
    [onDoubleClick]
  );

  const getPriorityColor = () => {
    switch (event.priority) {
      case 'urgent':
        return 'border-red-500 bg-red-600';
      case 'high':
        return 'border-orange-500 bg-orange-600';
      case 'medium':
        return 'border-yellow-500 bg-yellow-600';
      case 'low':
        return 'border-green-500 bg-green-600';
      default:
        return 'border-blue-500 bg-blue-600';
    }
  };

  const getStatusStyle = () => {
    switch (event.status) {
      case 'completed':
        return 'opacity-60';
      case 'cancelled':
        return 'opacity-40 line-through';
      case 'in-progress':
        return 'border-2';
      default:
        return '';
    }
  };

  const backgroundColor = event.color || '#3b82f6';

  return (
    <div
      ref={barRef}
      className={`
        absolute rounded-md border transition-all cursor-pointer select-none
        ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900 z-10' : 'z-0'}
        ${isHovered ? 'shadow-lg' : 'shadow'}
        ${getStatusStyle()}
      `}
      style={{
        left,
        top: top + 5,
        width: Math.max(width, 30),
        height: height - 10,
        backgroundColor,
        borderColor: event.color || '#2563eb',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {/* Event content */}
      <div className="h-full flex flex-col px-2 py-1 overflow-hidden">
        <div className="text-xs font-semibold text-white truncate">{event.title}</div>
        {width > 100 && event.description && (
          <div className="text-xs text-white/80 truncate mt-0.5">{event.description}</div>
        )}

        {/* Progress bar */}
        {event.progress !== undefined && event.progress > 0 && (
          <div className="mt-auto pt-1">
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/60 rounded-full transition-all"
                style={{ width: `${event.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Resize handles (visible on hover or selection) */}
      {(isHovered || isSelected) && event.resizable !== false && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/20 hover:bg-white/40 transition-colors"
            onMouseDown={handleResizeStart}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/20 hover:bg-white/40 transition-colors"
            onMouseDown={handleResizeEnd}
          />
        </>
      )}

      {/* Dependency anchors */}
      {config.enableDependencies && (isHovered || isSelected) && (
        <>
          {/* Start anchor */}
          <div
            className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border-2 border-white cursor-crosshair hover:scale-125 transition-transform"
            data-anchor="start"
            data-event-id={event.id}
          />
          {/* End anchor */}
          <div
            className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border-2 border-white cursor-crosshair hover:scale-125 transition-transform"
            data-anchor="end"
            data-event-id={event.id}
          />
        </>
      )}

      {/* Priority indicator */}
      <div
        className={`absolute top-0 right-0 w-0 h-0 border-t-8 border-r-8 border-transparent rounded-tr-md ${
          event.priority === 'urgent' ? 'border-t-red-400' : ''
        } ${event.priority === 'high' ? 'border-t-orange-400' : ''}`}
        style={{
          borderTopColor: event.priority === 'urgent' || event.priority === 'high' ? undefined : 'transparent',
          borderRightColor: event.priority === 'urgent' || event.priority === 'high' ? undefined : 'transparent',
        }}
      />
    </div>
  );
}
