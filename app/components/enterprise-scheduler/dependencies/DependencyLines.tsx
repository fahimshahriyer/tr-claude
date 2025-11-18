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

      // Calculate event bounding boxes
      const fromStartX = ((fromEvent.startDate.getTime() - timeAxisStart) / zoomLevel.tickSize) * timeAxis.cellWidth;
      const fromEndX = ((fromEvent.endDate.getTime() - timeAxisStart) / zoomLevel.tickSize) * timeAxis.cellWidth;
      const fromTopY = fromResourceIndex * rowHeight;
      const fromBottomY = fromResourceIndex * rowHeight + rowHeight;
      const fromCenterY = fromResourceIndex * rowHeight + rowHeight / 2;

      const toStartX = ((toEvent.startDate.getTime() - timeAxisStart) / zoomLevel.tickSize) * timeAxis.cellWidth;
      const toEndX = ((toEvent.endDate.getTime() - timeAxisStart) / zoomLevel.tickSize) * timeAxis.cellWidth;
      const toTopY = toResourceIndex * rowHeight;
      const toBottomY = toResourceIndex * rowHeight + rowHeight;
      const toCenterY = toResourceIndex * rowHeight + rowHeight / 2;

      // Calculate port positions
      let fromX: number, fromY: number;

      if (dep.fromPort) {
        // Use the specified port
        switch (dep.fromPort) {
          case 'top':
            fromX = (fromStartX + fromEndX) / 2;
            fromY = fromTopY;
            break;
          case 'bottom':
            fromX = (fromStartX + fromEndX) / 2;
            fromY = fromBottomY;
            break;
          case 'left':
            fromX = fromStartX;
            fromY = fromCenterY;
            break;
          case 'right':
            fromX = fromEndX;
            fromY = fromCenterY;
            break;
        }
      } else {
        // Default: use dependency type to determine position
        const fromTime = dep.type === 'start-to-start' || dep.type === 'start-to-finish'
          ? fromEvent.startDate.getTime()
          : fromEvent.endDate.getTime();
        fromX = ((fromTime - timeAxisStart) / zoomLevel.tickSize) * timeAxis.cellWidth;
        fromY = fromCenterY;
      }

      let toX: number, toY: number;

      if (dep.toPort) {
        // Use the specified port
        switch (dep.toPort) {
          case 'top':
            toX = (toStartX + toEndX) / 2;
            toY = toTopY;
            break;
          case 'bottom':
            toX = (toStartX + toEndX) / 2;
            toY = toBottomY;
            break;
          case 'left':
            toX = toStartX;
            toY = toCenterY;
            break;
          case 'right':
            toX = toEndX;
            toY = toCenterY;
            break;
        }
      } else {
        // Default: use dependency type to determine position
        const toTime = dep.type === 'finish-to-finish' || dep.type === 'start-to-finish'
          ? toEvent.endDate.getTime()
          : toEvent.startDate.getTime();
        toX = ((toTime - timeAxisStart) / zoomLevel.tickSize) * timeAxis.cellWidth;
        toY = toCenterY;
      }

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
        {/* Simple triangle arrowhead */}
        <marker
          id="arrowhead"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill="currentColor"
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
    const horizontalOffset = 30;
    const verticalOffset = 30;
    const minGap = 10;

    const fromPort = dependency.fromPort;
    const toPort = dependency.toPort;

    // Determine primary flow direction based on ports
    const fromVertical = fromPort === 'top' || fromPort === 'bottom';
    const toVertical = toPort === 'top' || toPort === 'bottom';

    // Case 1: Both ports are vertical (top/bottom)
    if (fromVertical && toVertical) {
      // Check if this is a natural vertical flow (bottom→top or top→bottom)
      const isNaturalVerticalFlow =
        (fromPort === 'bottom' && toPort === 'top' && dy > 0) || // downward
        (fromPort === 'top' && toPort === 'bottom' && dy < 0);   // upward

      // If natural vertical flow and perfectly aligned horizontally, draw simple straight line
      if (isNaturalVerticalFlow && Math.abs(dx) < 10) {
        return `M ${fromX} ${fromY} L ${toX} ${toY}`;
      }

      // For vertical connections, always use elbow routing to ensure arrowhead points vertically
      const fromDir = fromPort === 'top' ? -1 : 1;
      const toDir = toPort === 'top' ? -1 : 1;

      // If tasks are close vertically, use small offsets for compact elbow
      if (Math.abs(dy) < verticalOffset * 2) {
        const smallOffset = 15; // Small offset for compact elbows
        const outY = fromY + (fromDir * smallOffset);
        const inY = toY + (toDir * smallOffset);
        const midX = fromX + (dx / 2);

        // Proper elbow: vertical out -> horizontal -> vertical in
        return `M ${fromX} ${fromY}
                L ${fromX} ${outY}
                L ${midX} ${outY}
                L ${midX} ${inY}
                L ${toX} ${inY}
                L ${toX} ${toY}`;
      }

      // For tasks far apart, use full elbow routing
      const outY = fromY + (fromDir * verticalOffset);
      const inY = toY + (toDir * verticalOffset);
      const midX = fromX + (dx / 2);

      return `M ${fromX} ${fromY}
              L ${fromX} ${outY}
              L ${midX} ${outY}
              L ${midX} ${inY}
              L ${toX} ${inY}
              L ${toX} ${toY}`;
    }

    // Case 2: From vertical, to horizontal
    if (fromVertical && !toVertical) {
      const fromDir = fromPort === 'top' ? -1 : 1;
      const outY = fromY + (fromDir * verticalOffset);
      const midX = fromX + (dx / 2);

      return `M ${fromX} ${fromY}
              L ${fromX} ${outY}
              L ${midX} ${outY}
              L ${midX} ${toY}
              L ${toX} ${toY}`;
    }

    // Case 3: From horizontal, to vertical
    if (!fromVertical && toVertical) {
      const toDir = toPort === 'top' ? -1 : 1;
      const inY = toY + (toDir * verticalOffset);
      const midX = fromX + (dx / 2);

      return `M ${fromX} ${fromY}
              L ${midX} ${fromY}
              L ${midX} ${inY}
              L ${toX} ${inY}
              L ${toX} ${toY}`;
    }

    // Case 4: Both horizontal (left/right) - original logic
    if (Math.abs(dy) < minGap) {
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    }

    if (dx > 0) {
      const midX = fromX + (dx / 2);
      return `M ${fromX} ${fromY}
              L ${midX} ${fromY}
              L ${midX} ${toY}
              L ${toX} ${toY}`;
    } else {
      const outX = fromX + horizontalOffset;
      const inX = toX - horizontalOffset;
      const midY = (fromY + toY) / 2;

      return `M ${fromX} ${fromY}
              L ${outX} ${fromY}
              L ${outX} ${midY}
              L ${inX} ${midY}
              L ${inX} ${toY}
              L ${toX} ${toY}`;
    }
  }, [fromX, fromY, toX, toY, dependency.fromPort, dependency.toPort]);

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
