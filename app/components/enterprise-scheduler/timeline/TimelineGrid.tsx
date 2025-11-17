'use client';

import React, { useMemo } from 'react';
import { useScheduler } from '../core/SchedulerContext';
import { isWeekend, isWorkingHour } from '../utils/dateUtils';

interface TimelineGridProps {
  height: number;
  scrollLeft: number;
}

export function TimelineGrid({ height, scrollLeft }: TimelineGridProps) {
  const { state } = useScheduler();
  const { timeAxis, zoomLevel } = state;

  const columns = useMemo(() => {
    const cols: Array<{ position: number; isWeekend: boolean; isNonWorking: boolean }> = [];
    let currentDate = new Date(timeAxis.startDate);
    let position = 0;

    while (currentDate <= timeAxis.endDate) {
      const weekend = isWeekend(currentDate);
      const nonWorking = !isWorkingHour(
        currentDate,
        timeAxis.workingHours?.start,
        timeAxis.workingHours?.end
      );

      cols.push({
        position,
        isWeekend: weekend,
        isNonWorking: nonWorking,
      });

      currentDate = new Date(currentDate.getTime() + zoomLevel.tickSize);
      position += timeAxis.cellWidth;
    }

    return cols;
  }, [timeAxis.startDate, timeAxis.endDate, timeAxis.cellWidth, zoomLevel.tickSize]);

  // Calculate total width for the grid
  const totalWidth = useMemo(() => {
    const timeDuration = timeAxis.endDate.getTime() - timeAxis.startDate.getTime();
    const numTicks = timeDuration / zoomLevel.tickSize;
    return numTicks * timeAxis.cellWidth;
  }, [timeAxis.startDate, timeAxis.endDate, timeAxis.cellWidth, zoomLevel.tickSize]);

  // Calculate the width occupied by columns
  const columnsWidth = columns.length * timeAxis.cellWidth;
  const remainingWidth = Math.max(0, totalWidth - columnsWidth);

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: totalWidth, height: '100%' }}
    >
      <div className="relative h-full flex" style={{ width: totalWidth, minWidth: totalWidth }}>
        {columns.map((col, index) => (
          <div
            key={index}
            className={`
              border-r border-slate-700/50 flex-shrink-0
              ${col.isWeekend && timeAxis.showWeekends ? 'bg-slate-900/40' : ''}
              ${col.isNonWorking && timeAxis.showNonWorkingTime ? 'bg-slate-800/20' : ''}
            `}
            style={{
              width: timeAxis.cellWidth,
              height: '100%',
            }}
          />
        ))}
        {/* Fill remaining space if columns don't reach totalWidth */}
        {remainingWidth > 0 && (
          <div
            className="flex-shrink-0 border-r border-slate-700/50"
            style={{
              width: remainingWidth,
              height: '100%',
            }}
          />
        )}
      </div>

      {/* Today indicator */}
      <TodayIndicator />
    </div>
  );
}

function TodayIndicator() {
  const { state } = useScheduler();
  const { timeAxis, zoomLevel } = state;

  const todayPosition = useMemo(() => {
    const now = new Date();
    const startTime = timeAxis.startDate.getTime();
    const nowTime = now.getTime();
    const elapsed = nowTime - startTime;
    const position = (elapsed / zoomLevel.tickSize) * timeAxis.cellWidth;
    return position;
  }, [timeAxis.startDate, timeAxis.cellWidth, zoomLevel.tickSize]);

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20 pointer-events-none"
      style={{
        left: todayPosition,
      }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full">
        <div className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-t whitespace-nowrap">
          Today
        </div>
      </div>
    </div>
  );
}
