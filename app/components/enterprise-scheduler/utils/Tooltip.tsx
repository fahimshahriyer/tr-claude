'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SchedulerEvent } from '../core/types';
import { formatDate } from './dateUtils';

interface TooltipProps {
  event: SchedulerEvent;
  x: number;
  y: number;
}

export function EventTooltip({ event, x, y }: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x + 10;
      let adjustedY = y + 10;

      // Adjust if tooltip goes off-screen
      if (adjustedX + rect.width > viewportWidth) {
        adjustedX = x - rect.width - 10;
      }

      if (adjustedY + rect.height > viewportHeight) {
        adjustedY = y - rect.height - 10;
      }

      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);

  const getPriorityColor = () => {
    switch (event.priority) {
      case 'urgent':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-blue-400';
    }
  };

  const getStatusColor = () => {
    switch (event.status) {
      case 'completed':
        return 'text-green-400';
      case 'in-progress':
        return 'text-blue-400';
      case 'cancelled':
        return 'text-red-400';
      case 'blocked':
        return 'text-orange-400';
      default:
        return 'text-slate-400';
    }
  };

  const duration = Math.round(
    (event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60)
  );

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[110] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-4 max-w-sm pointer-events-none"
      style={{ left: position.x, top: position.y }}
    >
      {/* Event title */}
      <div className="font-semibold text-white mb-2 flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: event.color || '#3b82f6' }}
        />
        {event.title}
      </div>

      {/* Description */}
      {event.description && (
        <div className="text-sm text-slate-300 mb-3">{event.description}</div>
      )}

      {/* Details */}
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-slate-300">
            {formatDate(event.startDate, 'MMM D, YYYY HH:mm')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-slate-300">
            {formatDate(event.endDate, 'MMM D, YYYY HH:mm')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-slate-300">Duration: {duration}h</span>
        </div>

        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className={`capitalize ${getPriorityColor()}`}>
            {event.priority} priority
          </span>
        </div>

        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className={`capitalize ${getStatusColor()}`}>
            {event.status.replace('-', ' ')}
          </span>
        </div>

        {event.progress !== undefined && (
          <div className="flex items-center gap-2 pt-2">
            <span className="text-slate-400">Progress:</span>
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${event.progress}%` }}
              />
            </div>
            <span className="text-slate-300">{event.progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
