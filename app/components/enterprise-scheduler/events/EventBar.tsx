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
  const { state, config, selectEvent, deselectEvent, dispatch } = useScheduler();
  const [isHovered, setIsHovered] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const isSelected = state.selection.selectedEventIds.has(event.id);
  const barRef = useRef<HTMLDivElement>(null);
  const mouseDownPos = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Don't prevent default yet - we need to detect if it's a click or drag
      e.stopPropagation();

      // Record mouse down position and time
      mouseDownPos.current = {
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      };

      // Select event
      if (!isSelected) {
        if (!e.shiftKey) {
          state.selection.selectedEventIds.forEach(id => {
            if (id !== event.id) deselectEvent(id);
          });
        }
        selectEvent(event.id);
      }
    },
    [event, isSelected, selectEvent, deselectEvent, state.selection.selectedEventIds]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!mouseDownPos.current) return;

      const dx = e.clientX - mouseDownPos.current.x;
      const dy = e.clientY - mouseDownPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If moved more than 5px, it's a drag
      if (distance > 5 && event.draggable !== false && onDragStart) {
        e.preventDefault();
        onDragStart(e, 'move');
        mouseDownPos.current = null; // Clear to prevent re-triggering
      }
    },
    [event.draggable, onDragStart]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!mouseDownPos.current) return;

      const dx = e.clientX - mouseDownPos.current.x;
      const dy = e.clientY - mouseDownPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const elapsed = Date.now() - mouseDownPos.current.time;

      // If moved less than 5px and time less than 300ms, it's a click
      if (distance < 5 && elapsed < 300) {
        setShowPopover(true);
      }

      mouseDownPos.current = null;
    },
    []
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

  const handlePortMouseDown = useCallback(
    (e: React.MouseEvent, port: 'top' | 'bottom' | 'left' | 'right') => {
      e.preventDefault();
      e.stopPropagation();

      // Get port center position in viewport coordinates
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      dispatch({
        type: 'START_DEPENDENCY_CREATION',
        payload: {
          eventId: event.id,
          port,
          x,
          y,
        },
      });
    },
    [event.id, dispatch]
  );

  const handleDoubleClickInternal = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDoubleClick?.();
    },
    [onDoubleClick]
  );

  const backgroundColor = event.color || '#3b82f6';
  const progress = event.progress || 0;

  return (
    <>
      <div
        ref={barRef}
        className={`
          absolute rounded-md border transition-all cursor-pointer select-none overflow-hidden
          ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900 z-10' : 'z-0'}
          ${isHovered ? 'shadow-lg' : 'shadow'}
          ${event.status === 'completed' ? 'opacity-60' : ''}
          ${event.status === 'cancelled' ? 'opacity-40' : ''}
        `}
        style={{
          left,
          top: top + 5,
          width: Math.max(width, 30),
          height: height - 10,
          borderColor: event.color || '#2563eb',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={handleDoubleClickInternal}
      >
        {/* Progress bar as background */}
        <div
          className="absolute inset-0 transition-all"
          style={{
            background: `linear-gradient(to right, ${backgroundColor} ${progress}%, ${backgroundColor}40 ${progress}%)`,
          }}
        />

        {/* Event content */}
        <div className="relative h-full flex flex-col px-2 py-1 overflow-hidden">
          <div className="text-xs font-semibold text-white truncate">{event.title}</div>
          {width > 100 && event.description && (
            <div className="text-xs text-white/80 truncate mt-0.5">{event.description}</div>
          )}
        </div>

        {/* Resize handles */}
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

        {/* 4 Connection Ports */}
        {config.enableDependencies && (isHovered || isSelected) && (
          <>
            {/* Top port */}
            <div
              className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border-2 border-white cursor-crosshair hover:scale-125 transition-transform z-20"
              onMouseDown={(e) => handlePortMouseDown(e, 'top')}
              data-port="top"
              data-event-id={event.id}
              title="Connect from top"
            />
            {/* Right port */}
            <div
              className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border-2 border-white cursor-crosshair hover:scale-125 transition-transform z-20"
              onMouseDown={(e) => handlePortMouseDown(e, 'right')}
              data-port="right"
              data-event-id={event.id}
              title="Connect from right"
            />
            {/* Bottom port */}
            <div
              className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border-2 border-white cursor-crosshair hover:scale-125 transition-transform z-20"
              onMouseDown={(e) => handlePortMouseDown(e, 'bottom')}
              data-port="bottom"
              data-event-id={event.id}
              title="Connect from bottom"
            />
            {/* Left port */}
            <div
              className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border-2 border-white cursor-crosshair hover:scale-125 transition-transform z-20"
              onMouseDown={(e) => handlePortMouseDown(e, 'left')}
              data-port="left"
              data-event-id={event.id}
              title="Connect from left"
            />
          </>
        )}

        {/* Priority indicator */}
        {(event.priority === 'urgent' || event.priority === 'high') && (
          <div
            className="absolute top-0 right-0 w-0 h-0 border-t-8 border-r-8 rounded-tr-md"
            style={{
              borderTopColor: event.priority === 'urgent' ? '#f87171' : '#fb923c',
              borderRightColor: event.priority === 'urgent' ? '#f87171' : '#fb923c',
            }}
          />
        )}
      </div>

      {/* Task Details Popover */}
      {showPopover && (
        <div
          className="fixed bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 z-50 max-w-sm"
          style={{
            left: Math.min(left + width / 2, window.innerWidth - 300),
            top: top + height + 10,
          }}
        >
          <button
            onClick={() => setShowPopover(false)}
            className="absolute top-2 right-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
          <h3 className="text-white font-semibold mb-2">{event.title}</h3>
          {event.description && (
            <p className="text-slate-300 text-sm mb-2">{event.description}</p>
          )}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="text-white capitalize">{event.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Priority:</span>
              <span className="text-white capitalize">{event.priority}</span>
            </div>
            {event.progress !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">Progress:</span>
                <span className="text-white">{event.progress}%</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Start:</span>
              <span className="text-white">{event.startDate.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">End:</span>
              <span className="text-white">{event.endDate.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
