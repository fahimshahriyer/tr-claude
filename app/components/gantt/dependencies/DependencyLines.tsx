'use client';

import React, { useMemo } from 'react';
import { useGantt } from '../core/GanttContext';
import { GanttTask, GanttDependency } from '../core/types';

interface DependencyLinesProps {
  visibleTasks: GanttTask[];
  timelineStart: Date;
  zoomLevel: any;
  rowHeight: number;
}

export function DependencyLines({
  visibleTasks,
  timelineStart,
  zoomLevel,
  rowHeight,
}: DependencyLinesProps) {
  const { state } = useGantt();
  const { dependencies } = state;

  // Calculate dependency line coordinates
  const dependencyPaths = useMemo(() => {
    return dependencies
      .map((dep) => {
        const fromTask = visibleTasks.find((t) => t.id === dep.fromTaskId);
        const toTask = visibleTasks.find((t) => t.id === dep.toTaskId);

        if (!fromTask || !toTask) return null;

        const fromIndex = visibleTasks.indexOf(fromTask);
        const toIndex = visibleTasks.indexOf(toTask);

        // Calculate task positions
        const dayInMs = 24 * 60 * 60 * 1000;

        // From position based on dependency type
        let fromX: number, fromY: number;
        const fromY_center = fromIndex * rowHeight + rowHeight / 2;

        if (dep.type === 'FS' || dep.type === 'FF') {
          // Finish connection - use end date
          const fromOffset = (fromTask.endDate.getTime() - timelineStart.getTime()) / dayInMs;
          fromX = fromOffset * zoomLevel.cellWidth;
        } else {
          // Start connection - use start date
          const fromOffset = (fromTask.startDate.getTime() - timelineStart.getTime()) / dayInMs;
          fromX = fromOffset * zoomLevel.cellWidth;
        }
        fromY = fromY_center;

        // To position based on dependency type
        let toX: number, toY: number;
        const toY_center = toIndex * rowHeight + rowHeight / 2;

        if (dep.type === 'SS' || dep.type === 'FS') {
          // Start connection - use start date
          const toOffset = (toTask.startDate.getTime() - timelineStart.getTime()) / dayInMs;
          toX = toOffset * zoomLevel.cellWidth;
        } else {
          // Finish connection - use end date
          const toOffset = (toTask.endDate.getTime() - timelineStart.getTime()) / dayInMs;
          toX = toOffset * zoomLevel.cellWidth;
        }
        toY = toY_center;

        return {
          dependency: dep,
          fromX,
          fromY,
          toX,
          toY,
          fromTask,
          toTask,
        };
      })
      .filter(Boolean) as Array<{
      dependency: GanttDependency;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      fromTask: GanttTask;
      toTask: GanttTask;
    }>;
  }, [dependencies, visibleTasks, timelineStart, zoomLevel, rowHeight]);

  if (dependencyPaths.length === 0) {
    return null;
  }

  const totalWidth = 10000; // Large enough for scrolling
  const totalHeight = visibleTasks.length * rowHeight;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: totalWidth, height: totalHeight }}
    >
      <defs>
        {/* Simple triangle arrowhead */}
        <marker
          id="gantt-arrowhead"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
        </marker>
      </defs>

      {dependencyPaths.map((path) => (
        <DependencyPath key={path.dependency.id} {...path} />
      ))}
    </svg>
  );
}

interface DependencyPathProps {
  dependency: GanttDependency;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromTask: GanttTask;
  toTask: GanttTask;
}

function DependencyPath({
  dependency,
  fromX,
  fromY,
  toX,
  toY,
}: DependencyPathProps) {
  const pathData = useMemo(() => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const horizontalOffset = 30;
    const minGap = 10;

    // Same row - straight line
    if (Math.abs(dy) < minGap) {
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    }

    // Forward connection (left to right)
    if (dx > 0) {
      const midX = fromX + dx / 2;
      return `M ${fromX} ${fromY}
              L ${midX} ${fromY}
              L ${midX} ${toY}
              L ${toX} ${toY}`;
    }

    // Backward connection (right to left)
    const outX = fromX + horizontalOffset;
    const inX = toX - horizontalOffset;
    const midY = (fromY + toY) / 2;

    return `M ${fromX} ${fromY}
            L ${outX} ${fromY}
            L ${outX} ${midY}
            L ${inX} ${midY}
            L ${inX} ${toY}
            L ${toX} ${toY}`;
  }, [fromX, fromY, toX, toY]);

  return (
    <g className="dependency-line">
      <title>
        {`${dependency.type.replace('-', ' to ').toUpperCase()}${dependency.lag ? ` (${dependency.lag}d lag)` : ''}`}
      </title>

      {/* Shadow for depth */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="3"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        opacity="0.5"
      />

      {/* Main line */}
      <path
        d={pathData}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        markerEnd="url(#gantt-arrowhead)"
        opacity="0.85"
      />

      {/* Invisible wider path for hover */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth="16"
        className="pointer-events-auto cursor-pointer"
      />
    </g>
  );
}
