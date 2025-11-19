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

    // Based on zoom level, generate appropriate tiers
    if (zoomLevel.scale === 'week' || zoomLevel.scale === 'day') {
      // Bottom tier: Days first (so we know exact day count)
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });

      if (zoomLevel.scale === 'day') {
        const days = allDays.map((day) => ({
          label: format(day, 'd'),
          width: zoomLevel.cellWidth,
          date: day,
          isWeekend: day.getDay() === 0 || day.getDay() === 6,
        }));

        // Top tier: Months - calculate based on actual days rendered
        const months: { label: string; width: number; start: Date }[] = [];
        let currentMonth = -1;
        let currentYear = -1;
        let dayCount = 0;

        allDays.forEach((day, index) => {
          const month = day.getMonth();
          const year = day.getFullYear();

          if (month !== currentMonth || year !== currentYear) {
            // New month started
            if (currentMonth !== -1) {
              // Save previous month
              months.push({
                label: format(allDays[index - dayCount], 'MMMM yyyy'),
                width: dayCount * zoomLevel.cellWidth,
                start: allDays[index - dayCount],
              });
            }
            currentMonth = month;
            currentYear = year;
            dayCount = 1;
          } else {
            dayCount++;
          }
        });

        // Don't forget the last month
        if (dayCount > 0) {
          months.push({
            label: format(allDays[allDays.length - dayCount], 'MMMM yyyy'),
            width: dayCount * zoomLevel.cellWidth,
            start: allDays[allDays.length - dayCount],
          });
        }

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

        // Months for week view
        const months: { label: string; width: number; start: Date }[] = [];
        let currentMonth = -1;
        let currentYear = -1;
        let weekCount = 0;

        allDays.forEach((day, index) => {
          const month = day.getMonth();
          const year = day.getFullYear();

          if (month !== currentMonth || year !== currentYear) {
            if (currentMonth !== -1 && weekCount > 0) {
              months.push({
                label: format(allDays[index - 1], 'MMMM yyyy'),
                width: weekCount * zoomLevel.cellWidth,
                start: allDays[index - weekCount],
              });
              weekCount = 0;
            }
            currentMonth = month;
            currentYear = year;
          }
          weekCount++;
        });

        if (weekCount > 0) {
          months.push({
            label: format(allDays[allDays.length - 1], 'MMMM yyyy'),
            width: weekCount * zoomLevel.cellWidth,
            start: allDays[allDays.length - weekCount],
          });
        }

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
        <div className="h-5 flex border-b border-slate-600">
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
      <div className={topTier ? "h-5 flex" : "h-10 flex"}>
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
