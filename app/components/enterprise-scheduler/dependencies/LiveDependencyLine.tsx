'use client';

import React, { useMemo } from 'react';
import { useScheduler } from '../core/SchedulerContext';

export function LiveDependencyLine() {
  const { state } = useScheduler();
  const { dependencyCreation } = state;

  const path = useMemo(() => {
    if (!dependencyCreation.isCreating) return null;

    const { fromX, fromY, currentX, currentY } = dependencyCreation;
    const dx = currentX - fromX;
    const dy = currentY - fromY;

    // Constants for elbow routing
    const horizontalOffset = 30;
    const minVerticalGap = 10;

    // For same row connections
    if (Math.abs(dy) < minVerticalGap) {
      return `M ${fromX} ${fromY} L ${currentX} ${currentY}`;
    }

    // For forward connections (left to right)
    if (dx > 0) {
      const midX = fromX + (dx / 2);
      return `M ${fromX} ${fromY}
              L ${midX} ${fromY}
              L ${midX} ${currentY}
              L ${currentX} ${currentY}`;
    }

    // For backward connections (right to left)
    const outX = fromX + horizontalOffset;
    const inX = currentX - horizontalOffset;
    const midY = (fromY + currentY) / 2;

    return `M ${fromX} ${fromY}
            L ${outX} ${fromY}
            L ${outX} ${midY}
            L ${inX} ${midY}
            L ${inX} ${currentY}
            L ${currentX} ${currentY}`;
  }, [dependencyCreation]);

  if (!dependencyCreation.isCreating || !path) {
    return null;
  }

  return (
    <svg
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
      style={{ position: 'fixed' }}
    >
      <defs>
        <marker
          id="live-arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 L 3 5 z"
            fill="#60a5fa"
            className="transition-colors"
          />
        </marker>
      </defs>

      {/* Shadow for depth */}
      <path
        d={path}
        fill="none"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="3"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        opacity="0.5"
      />

      {/* Main line - dashed to indicate it's being created */}
      <path
        d={path}
        fill="none"
        stroke="#60a5fa"
        strokeWidth="2.5"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeDasharray="8 4"
        markerEnd="url(#live-arrowhead)"
        opacity="0.9"
      />
    </svg>
  );
}
