'use client';

import React, { useMemo } from 'react';
import { useScheduler } from '../core/SchedulerContext';
import { formatDate, addDays, addHours, addMinutes, isWeekend, startOfDay } from '../utils/dateUtils';
import { HeaderTier } from '../core/types';

interface TimeAxisProps {
  width: number;
  scrollLeft: number;
}

export function TimeAxis({ width, scrollLeft }: TimeAxisProps) {
  const { state } = useScheduler();
  const { timeAxis, zoomLevel } = state;

  const ticks = useMemo(() => {
    return generateTimeTicks(
      timeAxis.startDate,
      timeAxis.endDate,
      zoomLevel.tickSize,
      timeAxis.cellWidth
    );
  }, [timeAxis.startDate, timeAxis.endDate, zoomLevel.tickSize, timeAxis.cellWidth]);

  const headerRows = useMemo(() => {
    return zoomLevel.headerTiers.map((tier) =>
      generateHeaderCells(
        timeAxis.startDate,
        timeAxis.endDate,
        tier,
        timeAxis.cellWidth,
        zoomLevel.tickSize
      )
    );
  }, [timeAxis.startDate, timeAxis.endDate, zoomLevel.headerTiers, timeAxis.cellWidth, zoomLevel.tickSize]);

  return (
    <div className="sticky top-0 z-30 bg-slate-800 border-b border-slate-700">
      {/* Multi-tier headers */}
      {headerRows.map((cells, tierIndex) => (
        <div
          key={tierIndex}
          className="flex border-b border-slate-700 last:border-b-0"
          style={{
            height: tierIndex === 0 ? 40 : tierIndex === 1 ? 35 : 30,
            transform: `translateX(-${scrollLeft}px)`,
          }}
        >
          {cells.map((cell, cellIndex) => (
            <div
              key={cellIndex}
              className={`
                flex items-center justify-center border-r border-slate-700
                ${tierIndex === 0 ? 'text-sm font-semibold text-slate-200' : ''}
                ${tierIndex === 1 ? 'text-xs font-medium text-slate-300' : ''}
                ${tierIndex === 2 ? 'text-xs text-slate-400' : ''}
              `}
              style={{
                width: cell.width,
                minWidth: cell.width,
              }}
            >
              {cell.label}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

interface TimeTick {
  date: Date;
  position: number;
  isWeekend: boolean;
  isNonWorking: boolean;
}

function generateTimeTicks(
  startDate: Date,
  endDate: Date,
  tickSize: number,
  cellWidth: number
): TimeTick[] {
  const ticks: TimeTick[] = [];
  let currentDate = new Date(startDate);
  let position = 0;

  while (currentDate <= endDate) {
    ticks.push({
      date: new Date(currentDate),
      position,
      isWeekend: isWeekend(currentDate),
      isNonWorking: false, // Can be enhanced with working hours logic
    });

    currentDate = new Date(currentDate.getTime() + tickSize);
    position += cellWidth;
  }

  return ticks;
}

interface HeaderCell {
  label: string;
  width: number;
  startDate: Date;
  endDate: Date;
}

function generateHeaderCells(
  startDate: Date,
  endDate: Date,
  tier: HeaderTier,
  cellWidth: number,
  tickSize: number
): HeaderCell[] {
  const cells: HeaderCell[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const cellStartDate = new Date(currentDate);
    const cellEndDate = getNextDateForUnit(currentDate, tier.unit, tier.increment);

    // Calculate how many ticks fit in this header cell
    const durationMs = cellEndDate.getTime() - cellStartDate.getTime();
    const numTicks = Math.ceil(durationMs / tickSize);
    const width = numTicks * cellWidth;

    cells.push({
      label: formatDate(currentDate, tier.format),
      width,
      startDate: cellStartDate,
      endDate: cellEndDate,
    });

    currentDate = cellEndDate;
  }

  return cells;
}

function getNextDateForUnit(date: Date, unit: HeaderTier['unit'], increment: number): Date {
  const result = new Date(date);

  switch (unit) {
    case 'year':
      result.setFullYear(result.getFullYear() + increment);
      break;
    case 'quarter':
      result.setMonth(result.getMonth() + (increment * 3));
      break;
    case 'month':
      result.setMonth(result.getMonth() + increment);
      break;
    case 'week':
      return addDays(result, increment * 7);
    case 'day':
      return addDays(result, increment);
    case 'hour':
      return addHours(result, increment);
    case 'minute':
      return addMinutes(result, increment);
  }

  return result;
}
