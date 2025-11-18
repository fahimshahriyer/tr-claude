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
      className="absolute top-0 left-0 pointer-events-none overflow-visible z-20"
      style={{
        width: totalWidth,
        height: totalHeight,
      }}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Modern arrow marker */}
        <marker
          id="arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 L 3 5 z"
            fill="currentColor"
            className="transition-colors"
          />
        </marker>

        {/* Gradient for modern look */}
        <linearGradient id="dependencyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
        </linearGradient>
      </defs>
      {dependencyPaths.map((path) => (
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
    const dx = toX - fromX;
    const dy = toY - fromY;

    // Constants for elbow routing
    const horizontalOffset = 30; // Distance to go out horizontally
    const minVerticalGap = 10;   // Minimum gap for vertical routing

    // For same row connections
    if (Math.abs(dy) < minVerticalGap) {
      // Simple straight horizontal line
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    }

    // For forward connections (left to right)
    if (dx > 0) {
      // Calculate midpoint for vertical segment
      const midX = fromX + (dx / 2);

      // Elbow connector: horizontal -> vertical -> horizontal
      return `M ${fromX} ${fromY}
              L ${midX} ${fromY}
              L ${midX} ${toY}
              L ${toX} ${toY}`;
    }
    // For backward connections (right to left)
    else {
      // Need to route around: go out, down/up, then back
      const outX = fromX + horizontalOffset;
      const inX = toX - horizontalOffset;
      const midY = (fromY + toY) / 2;

      // Complex elbow: out -> down -> across -> down -> in
      return `M ${fromX} ${fromY}
              L ${outX} ${fromY}
              L ${outX} ${midY}
              L ${inX} ${midY}
              L ${inX} ${toY}
              L ${toX} ${toY}`;
    }
  }, [fromX, fromY, toX, toY]);

  return (
    <g className="dependency-line" style={{ color }}>
      {/* Shadow for depth */}
      <path
        d={path}
        fill="none"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="3"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        opacity="0.5"
        className="pointer-events-none"
      />

      {/* Main line - angular with sharp corners */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        markerEnd="url(#arrowhead)"
        className="pointer-events-none transition-colors"
        opacity="0.85"
      />

      {/* Invisible wider path for easier hover/click detection */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-auto cursor-pointer"
      >
        <title>
          {dependency.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' to ')}
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
