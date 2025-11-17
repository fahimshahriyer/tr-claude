'use client';

import React, { useMemo } from 'react';
import { useScheduler } from '../core/SchedulerContext';
import { SchedulerEvent, Dependency, Resource } from '../core/types';

interface DependencyLinesProps {
  scrollLeft: number;
  scrollTop: number;
  rowHeight: number;
}

export function DependencyLines({ scrollLeft, scrollTop, rowHeight }: DependencyLinesProps) {
  const { state } = useScheduler();
  const { dependencies, events, resources, timeAxis, zoomLevel, showDependencies } = state;

  const flatResources = useMemo(() => flattenResources(resources), [resources]);

  const dependencyPaths = useMemo(() => {
    if (!showDependencies) return [];

    return dependencies.map((dep) => {
      const fromEvent = events.find((e) => e.id === dep.fromEventId);
      const toEvent = events.find((e) => e.id === dep.toEventId);

      if (!fromEvent || !toEvent) return null;

      const fromResourceIndex = flatResources.findIndex((r) => r.id === fromEvent.resourceId);
      const toResourceIndex = flatResources.findIndex((r) => r.id === toEvent.resourceId);

      if (fromResourceIndex === -1 || toResourceIndex === -1) return null;

      // Calculate positions
      const timeAxisStart = timeAxis.startDate.getTime();

      // From point (end of from event for finish-to-start)
      const fromTime = dep.type === 'start-to-start' || dep.type === 'start-to-finish'
        ? fromEvent.startDate.getTime()
        : fromEvent.endDate.getTime();

      const fromX = ((fromTime - timeAxisStart) / zoomLevel.tickSize) * timeAxis.cellWidth;
      const fromY = fromResourceIndex * rowHeight + rowHeight / 2;

      // To point (start of to event for finish-to-start)
      const toTime = dep.type === 'finish-to-finish' || dep.type === 'start-to-finish'
        ? toEvent.endDate.getTime()
        : toEvent.startDate.getTime();

      const toX = ((toTime - timeAxisStart) / zoomLevel.tickSize) * timeAxis.cellWidth;
      const toY = toResourceIndex * rowHeight + rowHeight / 2;

      return {
        dependency: dep,
        fromX,
        fromY,
        toX,
        toY,
        color: dep.color || '#3b82f6',
      };
    }).filter(Boolean) as Array<{
      dependency: Dependency;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      color: string;
    }>;
  }, [dependencies, events, flatResources, timeAxis, zoomLevel, showDependencies, rowHeight]);

  // Calculate total dimensions
  const totalWidth = useMemo(() => {
    const timeDuration = timeAxis.endDate.getTime() - timeAxis.startDate.getTime();
    const numTicks = timeDuration / zoomLevel.tickSize;
    return numTicks * timeAxis.cellWidth;
  }, [timeAxis.startDate, timeAxis.endDate, timeAxis.cellWidth, zoomLevel.tickSize]);

  const totalHeight = useMemo(() => {
    return flatResources.length * rowHeight;
  }, [flatResources.length, rowHeight]);

  if (!showDependencies || dependencyPaths.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none overflow-visible z-5"
      style={{
        width: totalWidth,
        height: totalHeight,
      }}
    >
      {dependencyPaths.map((path, index) => (
        <DependencyPath
          key={path.dependency.id}
          {...path}
        />
      ))}
    </svg>
  );
}

interface DependencyPathProps {
  dependency: Dependency;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
}

function DependencyPath({ dependency, fromX, fromY, toX, toY, color }: DependencyPathProps) {
  const path = useMemo(() => {
    // Create a smooth curved path between the two points
    const dx = toX - fromX;
    const dy = toY - fromY;

    // Control point offset for the curve
    const controlOffset = Math.abs(dx) / 3;

    // If events are on the same row or close rows, use a simple arc
    if (Math.abs(dy) < 20) {
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    }

    // Otherwise create a smooth S-curve
    const midX = fromX + dx / 2;

    return `
      M ${fromX} ${fromY}
      C ${fromX + controlOffset} ${fromY},
        ${midX - controlOffset} ${fromY},
        ${midX} ${fromY + dy / 2}
      C ${midX + controlOffset} ${fromY + dy / 2},
        ${toX - controlOffset} ${toY},
        ${toX} ${toY}
    `;
  }, [fromX, fromY, toX, toY]);

  // Arrow marker
  const markerId = `arrow-${dependency.id}`;

  return (
    <g className="pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity">
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={color} />
        </marker>
      </defs>

      {/* Shadow/outline for better visibility */}
      <path
        d={path}
        fill="none"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
      />

      {/* Invisible wider path for easier hover detection */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="12"
        strokeLinecap="round"
        style={{ pointerEvents: 'stroke' }}
      >
        <title>
          {dependency.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          {dependency.lag ? ` (${dependency.lag}h lag)` : ''}
        </title>
      </path>
    </g>
  );
}

function flattenResources(resources: Resource[]): Resource[] {
  const result: Resource[] = [];

  function flatten(items: Resource[]) {
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
