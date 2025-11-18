'use client';

import React, { useMemo } from 'react';
import { ZoomLevel } from '../core/types';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';

interface TimeAxisProps {
  startDate: Date;
  endDate: Date;
  zoomLevel: ZoomLevel;
}

export function TimeAxis({ startDate, endDate, zoomLevel }: TimeAxisProps) {
  const { topTier, bottomTier } = useMemo(() => {
    const dayInMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / dayInMs);

    // Based on zoom level, generate appropriate tiers
    if (zoomLevel.scale === 'week' || zoomLevel.scale === 'day') {
      // Top tier: Months
      const months: { label: string; width: number; start: Date }[] = [];
      let currentDate = new Date(startDate);

      while (currentDate < endDate) {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const visibleStart = monthStart < startDate ? startDate : monthStart;
        const visibleEnd = monthEnd > endDate ? endDate : monthEnd;

        const days = Math.ceil((visibleEnd.getTime() - visibleStart.getTime()) / dayInMs);
        const width = days * zoomLevel.cellWidth;

        months.push({
          label: format(currentDate, 'MMMM yyyy'),
          width,
          start: monthStart,
        });

        // Move to next month
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }

      // Bottom tier: Days or Weeks
      if (zoomLevel.scale === 'day') {
        const days = eachDayOfInterval({ start: startDate, end: endDate }).map((day) => ({
          label: format(day, 'd'),
          width: zoomLevel.cellWidth,
          date: day,
          isWeekend: day.getDay() === 0 || day.getDay() === 6,
        }));

        return { topTier: months, bottomTier: days };
      } else {
        // Weeks
        const weeks = eachWeekOfInterval({ start: startDate, end: endDate }).map((week) => {
          const weekEnd = endOfWeek(week);
          const days = Math.ceil((weekEnd.getTime() - week.getTime()) / dayInMs);
          return {
            label: format(week, 'w'),
            width: days * zoomLevel.cellWidth,
            date: week,
          };
        });

        return { topTier: months, bottomTier: weeks };
      }
    }

    // Default: show days
    const days = eachDayOfInterval({ start: startDate, end: endDate }).map((day) => ({
      label: format(day, 'MMM d'),
      width: zoomLevel.cellWidth,
      date: day,
    }));

    return { topTier: null, bottomTier: days };
  }, [startDate, endDate, zoomLevel]);

  return (
    <div className="bg-slate-800 border-b border-slate-700">
      {/* Top Tier (if exists) */}
      {topTier && (
        <div className="h-8 flex border-b border-slate-600">
          {topTier.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-center text-slate-200 text-xs font-semibold border-r border-slate-600"
              style={{ width: item.width }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}

      {/* Bottom Tier */}
      <div className="h-8 flex">
        {bottomTier.map((item, i) => (
          <div
            key={i}
            className={`
              flex items-center justify-center text-slate-300 text-xs border-r border-slate-600/50
              ${'isWeekend' in item && item.isWeekend ? 'bg-slate-700/50' : ''}
            `}
            style={{ width: item.width }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
