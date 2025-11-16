"use client";

import React from "react";
import { useTaskRadar } from "./TaskRadarContext";
import { CONSTANTS, ConnectionPort } from "./types";

export function DependencyConnections() {
  const {
    tasks,
    taskPositions,
    showDependencies,
    viewport,
    panOffset,
    isConnectingDependency,
    connectingFromTaskId,
    connectingFromPort,
    connectingMouseX,
    connectingMouseY,
    selectedTaskId,
  } = useTaskRadar();

  if (!showDependencies && !isConnectingDependency) return null;
  if (viewport.width === 0 || viewport.height === 0) return null;

  // Helper to get port position
  const getPortPosition = (
    taskId: string,
    port: ConnectionPort
  ): { x: number; y: number } | null => {
    const taskPos = taskPositions.get(taskId);
    if (!taskPos) return null;

    const halfWidth = CONSTANTS.TASK_BLIP_WIDTH / 2;
    const halfHeight = CONSTANTS.TASK_BLIP_HEIGHT / 2;

    switch (port) {
      case "top":
        return { x: taskPos.x, y: taskPos.y - halfHeight };
      case "right":
        return { x: taskPos.x + halfWidth, y: taskPos.y };
      case "bottom":
        return { x: taskPos.x, y: taskPos.y + halfHeight };
      case "left":
        return { x: taskPos.x - halfWidth, y: taskPos.y };
    }
  };

  // Generate all port-based connections
  const connections: Array<{
    fromId: string;
    toId: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    fromPort: ConnectionPort;
    toPort: ConnectionPort;
    isActive: boolean;
  }> = [];

  tasks.forEach((task) => {
    if (task.connections && task.connections.length > 0) {
      task.connections.forEach((conn) => {
        const fromPos = getPortPosition(conn.fromTaskId, conn.fromPort);
        const toPos = getPortPosition(conn.toTaskId, conn.toPort);

        if (!fromPos || !toPos) return;

        const isActive = selectedTaskId === task.id || selectedTaskId === conn.fromTaskId;

        connections.push({
          fromId: conn.fromTaskId,
          toId: conn.toTaskId,
          fromX: fromPos.x,
          fromY: fromPos.y,
          toX: toPos.x,
          toY: toPos.y,
          fromPort: conn.fromPort,
          toPort: conn.toPort,
          isActive,
        });
      });
    }
  });

  // Helper to create curved path from port to port
  const createCurvePath = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    fromPort: ConnectionPort,
    toPort: ConnectionPort
  ): string => {
    // Calculate control points based on port directions
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Control point distance from ports
    const controlDist = Math.min(distance * 0.4, 150);

    // Calculate control points based on port orientation
    let cp1x = x1;
    let cp1y = y1;
    let cp2x = x2;
    let cp2y = y2;

    // First control point (from port direction)
    switch (fromPort) {
      case "top":
        cp1y = y1 - controlDist;
        break;
      case "right":
        cp1x = x1 + controlDist;
        break;
      case "bottom":
        cp1y = y1 + controlDist;
        break;
      case "left":
        cp1x = x1 - controlDist;
        break;
    }

    // Second control point (to port direction)
    switch (toPort) {
      case "top":
        cp2y = y2 - controlDist;
        break;
      case "right":
        cp2x = x2 + controlDist;
        break;
      case "bottom":
        cp2y = y2 + controlDist;
        break;
      case "left":
        cp2x = x2 - controlDist;
        break;
    }

    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
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

      {/* Draw all port-based connections */}
      <g>
        {connections.map(
          ({ fromId, toId, fromX, fromY, toX, toY, fromPort, toPort, isActive }) => {
            const path = createCurvePath(fromX, fromY, toX, toY, fromPort, toPort);

            return (
              <g key={`${fromId}-${fromPort}-${toId}-${toPort}`}>
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
          }
        )}
      </g>

      {/* Show connecting line when in dependency connection mode */}
      {isConnectingDependency && connectingFromTaskId && connectingFromPort && (
        <g className="pointer-events-none">
          {(() => {
            const fromPos = getPortPosition(connectingFromTaskId, connectingFromPort);
            if (!fromPos) return null;

            return (
              <line
                x1={fromPos.x}
                y1={fromPos.y}
                x2={connectingMouseX}
                y2={connectingMouseY}
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
              </line>
            );
          })()}
        </g>
      )}
    </svg>
  );
}
