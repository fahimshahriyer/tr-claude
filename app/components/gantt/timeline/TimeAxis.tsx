'use client';

import React, { useMemo } from 'react';
import { ZoomLevel } from '../core/types';
import { eachDayOfInterval, format, endOfWeek, eachWeekOfInterval } from 'date-fns';

interface TimeAxisProps {
  startDate: Date;
  endDate: Date;
  zoomLevel: ZoomLevel;
}

export function TimeAxis({ startDate, endDate, zoomLevel }: TimeAxisProps) {
  const { topTier, bottomTier } = useMemo(() => {
    // Normalize all dates to midnight to avoid time-of-day issues
    const normalizedStart = new Date(startDate);
    normalizedStart.setHours(0, 0, 0, 0);
    const normalizedEnd = new Date(endDate);
    normalizedEnd.setHours(0, 0, 0, 0);

    // Generate all days in the range - this is our base grid
    const allDays = eachDayOfInterval({ start: normalizedStart, end: normalizedEnd });

    // Helper to build month headers from day array
    const buildMonthHeaders = () => {
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

      return months;
    };

    // Based on zoom level, generate appropriate tiers
    if (zoomLevel.scale === 'day') {
      const days = allDays.map((day) => ({
        label: format(day, 'd'),
        width: zoomLevel.cellWidth,
        date: day,
        isWeekend: day.getDay() === 0 || day.getDay() === 6,
      }));

      return { topTier: buildMonthHeaders(), bottomTier: days };
    } else if (zoomLevel.scale === 'week') {
      // For week view: generate week cells where each week spans the actual days it contains
      const weeks: { label: string; width: number; date: Date }[] = [];

      // Track which day index we're at
      let dayIndex = 0;

      while (dayIndex < allDays.length) {
        const currentDay = allDays[dayIndex];
        const weekStart = currentDay;
        const weekEnd = endOfWeek(currentDay);

        // Count consecutive days that belong to this week
        let daysInThisWeek = 0;
        while (dayIndex < allDays.length) {
          const day = allDays[dayIndex];
          if (day <= weekEnd) {
            daysInThisWeek++;
            dayIndex++;
          } else {
            break;
          }
        }

        weeks.push({
          label: format(weekStart, 'w'),
          width: daysInThisWeek * zoomLevel.cellWidth,
          date: weekStart,
        });
      }

      return { topTier: buildMonthHeaders(), bottomTier: weeks };
    }

    // Default: show days
    const days = allDays.map((day) => ({
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
