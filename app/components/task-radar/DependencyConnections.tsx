"use client";

import React from "react";
import { useTaskRadar } from "./TaskRadarContext";

export function DependencyConnections() {
  const {
    tasks,
    taskPositions,
    showDependencies,
    viewport,
    panOffset,
    isConnectingDependency,
    connectingFromTaskId,
    selectedTaskId,
  } = useTaskRadar();

  if (!showDependencies && !isConnectingDependency) return null;
  if (viewport.width === 0 || viewport.height === 0) return null;

  // Generate all dependency connections
  const connections: Array<{
    fromId: string;
    toId: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    isActive: boolean;
  }> = [];

  tasks.forEach((task) => {
    if (task.dependencies && task.dependencies.length > 0) {
      const toPos = taskPositions.get(task.id);
      if (!toPos) return;

      task.dependencies.forEach((depId) => {
        const fromPos = taskPositions.get(depId);
        if (!fromPos) return;

        const isActive = selectedTaskId === task.id || selectedTaskId === depId;

        connections.push({
          fromId: depId,
          toId: task.id,
          fromX: fromPos.x,
          fromY: fromPos.y,
          toX: toPos.x,
          toY: toPos.y,
          isActive,
        });
      });
    }
  });

  // Helper to create curved path
  const createCurvePath = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): string => {
    // Calculate control points for smooth bezier curve
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Control point offset (creates the curve)
    const controlDistance = distance * 0.3;

    // Calculate perpendicular direction for control points
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Angle of the line
    const angle = Math.atan2(dy, dx);
    const perpAngle = angle + Math.PI / 2;

    // Control points
    const cp1x = x1 + Math.cos(angle) * controlDistance;
    const cp1y = y1 + Math.sin(angle) * controlDistance;
    const cp2x = x2 - Math.cos(angle) * controlDistance;
    const cp2y = y2 - Math.sin(angle) * controlDistance;

    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  };

  // Create arrowhead marker path
  const createArrowhead = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): { x: number; y: number; angle: number } => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    return {
      x: x2,
      y: y2,
      angle: (angle * 180) / Math.PI,
    };
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-20"
      width={viewport.width}
      height={viewport.height}
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      style={{
        transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
      }}
    >
      <defs>
        {/* Arrow marker for active connections */}
        <marker
          id="arrowhead-active"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
        </marker>

        {/* Arrow marker for normal connections */}
        <marker
          id="arrowhead-normal"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#6b7280" />
        </marker>

        {/* Glow filter for active connections */}
        <filter id="connection-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Draw all dependency connections */}
      <g>
        {connections.map(({ fromId, toId, fromX, fromY, toX, toY, isActive }) => {
          const path = createCurvePath(fromX, fromY, toX, toY);
          const arrow = createArrowhead(fromX, fromY, toX, toY);

          return (
            <g key={`${fromId}-${toId}`}>
              {/* Background glow for active connections */}
              {isActive && (
                <path
                  d={path}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  opacity="0.3"
                  filter="url(#connection-glow)"
                />
              )}

              {/* Main connection line */}
              <path
                d={path}
                fill="none"
                stroke={isActive ? "#10b981" : "#6b7280"}
                strokeWidth={isActive ? "2.5" : "1.5"}
                strokeDasharray={isActive ? "0" : "5 5"}
                opacity={isActive ? "0.9" : "0.4"}
                markerEnd={isActive ? "url(#arrowhead-active)" : "url(#arrowhead-normal)"}
                className="transition-all duration-300"
              />

              {/* Connection label (optional - shows on hover) */}
              {isActive && (
                <g>
                  <circle
                    cx={(fromX + toX) / 2}
                    cy={(fromY + toY) / 2}
                    r="12"
                    fill="#1f2937"
                    stroke="#10b981"
                    strokeWidth="1.5"
                  />
                  <text
                    x={(fromX + toX) / 2}
                    y={(fromY + toY) / 2}
                    fill="#10b981"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    →
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Show connecting line when in dependency connection mode */}
      {isConnectingDependency && connectingFromTaskId && (
        <g className="pointer-events-none">
          <path
            d={`M ${taskPositions.get(connectingFromTaskId)?.x || 0} ${
              taskPositions.get(connectingFromTaskId)?.y || 0
            } L ${viewport.centerX} ${viewport.centerY}`}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="5 5"
            opacity="0.6"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="10"
              dur="0.5s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      )}
    </svg>
  );
}
