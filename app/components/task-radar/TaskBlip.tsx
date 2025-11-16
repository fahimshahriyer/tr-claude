"use client";

import React, { useRef, useCallback } from "react";
import { useTaskRadar } from "./TaskRadarContext";
import { Task, CONSTANTS, PRIORITY_COLORS, ConnectionPort as PortType } from "./types";
import { daysBetween, formatTimeRemaining, getTimeColor } from "./utils";
import { ConnectionPort } from "./ConnectionPort";

interface TaskBlipProps {
  task: Task;
}

export function TaskBlip({ task }: TaskBlipProps) {
  const {
    taskPositions,
    selectedTaskId,
    selectTask,
    dragState,
    startDrag,
    currentTime,
    isConnectingDependency,
    connectingFromTaskId,
    connectingFromPort,
    finishConnectingDependency,
    startConnectingFromPort,
    showDependencies,
    viewport,
    panOffset,
  } = useTaskRadar();

  const blipRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const isDraggingThis = dragState.isDragging && dragState.taskId === task.id;
  const isSelected = selectedTaskId === task.id;
  const isConnectingFrom = isConnectingDependency && connectingFromTaskId === task.id;
  const canConnectTo = isConnectingDependency && connectingFromTaskId !== task.id;

  // Port connection handlers
  const handleStartConnect = useCallback(
    (taskId: string, port: PortType, e: React.MouseEvent) => {
      e.stopPropagation();

      // Convert mouse coordinates to radar coordinate system
      // Get the event target's bounding rect to calculate relative position
      if (blipRef.current) {
        const containerElement = blipRef.current.parentElement?.parentElement; // Get to the radar canvas container
        if (containerElement) {
          const rect = containerElement.getBoundingClientRect();
          const radarX = e.clientX - rect.left - panOffset.x;
          const radarY = e.clientY - rect.top - panOffset.y;
          startConnectingFromPort(taskId, port, radarX, radarY);
          return;
        }
      }

      // Fallback if we can't calculate coordinates
      startConnectingFromPort(taskId, port);
    },
    [startConnectingFromPort, panOffset]
  );

  const handleFinishConnect = useCallback(
    (taskId: string, port: PortType) => {
      finishConnectingDependency(taskId, port);
    },
    [finishConnectingDependency]
  );

  // Handle mouse down to start drag (only if not in dependency mode)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isConnectingDependency) {
        startDrag(task.id, e.clientX, e.clientY);
      }
    },
    [startDrag, task.id, isConnectingDependency]
  );

  // Handle click to select or connect dependency
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isConnectingDependency) {
        // Connecting dependency
        if (canConnectTo) {
          finishConnectingDependency(task.id);
        }
      } else if (!isDraggingThis) {
        // Normal selection
        selectTask(isSelected ? null : task.id);
      }
    },
    [isDraggingThis, isSelected, selectTask, task.id, isConnectingDependency, canConnectTo, finishConnectingDependency]
  );

  // Early return after all hooks
  const position = taskPositions.get(task.id);
  if (!position) return null;

  const daysRemaining = daysBetween(currentTime, task.dueDate);
  const timeColor = getTimeColor(daysRemaining);
  const timeRemaining = formatTimeRemaining(daysRemaining);
  const isOverdue = daysRemaining < 0;
  const isUrgent = daysRemaining >= 0 && daysRemaining < 1; // Less than 1 day

  // Calculate position (use drag position if dragging this task)
  let displayX = position.x;
  let displayY = position.y;

  if (isDraggingThis) {
    displayX = dragState.currentX;
    displayY = dragState.currentY;
  }

  // Adjust for blip size (center the blip on the position)
  const adjustedX = displayX - CONSTANTS.TASK_BLIP_WIDTH / 2;
  const adjustedY = displayY - CONSTANTS.TASK_BLIP_HEIGHT / 2;

  return (
    <>
      <div
        ref={blipRef}
        className={`absolute animate-fade-in select-none ${
          isDraggingThis ? "" : "transition-all duration-300"
        } ${
          isConnectingDependency
            ? canConnectTo
              ? "cursor-crosshair z-40"
              : "cursor-not-allowed z-30"
            : "cursor-grab active:cursor-grabbing"
        } ${isDraggingThis ? "z-50 scale-110" : isSelected || isConnectingFrom ? "z-40" : "z-30"}`}
        style={{
          left: `${adjustedX}px`,
          top: `${adjustedY}px`,
          width: `${CONSTANTS.TASK_BLIP_WIDTH}px`,
          minHeight: `${CONSTANTS.TASK_BLIP_HEIGHT}px`,
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`rounded-lg backdrop-blur-sm border transition-all ${
            isConnectingFrom
              ? "bg-blue-900/90 border-blue-500 shadow-lg shadow-blue-500/30 animate-pulse"
              : canConnectTo
              ? "bg-gray-900/90 border-yellow-500 shadow-lg shadow-yellow-500/20 hover:scale-110"
              : isSelected
              ? "bg-gray-900/90 border-emerald-500 shadow-lg shadow-emerald-500/20"
              : isDraggingThis
              ? "bg-gray-900/95 border-emerald-400 shadow-xl shadow-emerald-400/30"
              : "bg-gray-800/80 border-gray-700 hover:border-gray-600 hover:bg-gray-800/90 hover:scale-105"
          }`}
          style={{
            boxShadow: isConnectingFrom
              ? `0 0 30px rgba(59, 130, 246, 0.4)`
              : canConnectTo
              ? `0 0 25px rgba(234, 179, 8, 0.3)`
              : isDraggingThis
              ? `0 0 30px rgba(16, 185, 129, 0.4)`
              : isSelected
              ? `0 0 20px rgba(16, 185, 129, 0.2)`
              : undefined,
          }}
        >
          {/* Drag handle */}
          <div className="flex items-center justify-center py-1 border-b border-gray-700/50">
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-gray-600"></div>
              <div className="w-1 h-1 rounded-full bg-gray-600"></div>
              <div className="w-1 h-1 rounded-full bg-gray-600"></div>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 space-y-2">
            {/* Title and Priority */}
            <div className="flex items-start gap-2">
              <div
                className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                title={`${task.priority} priority`}
              />
              <h3 className="text-sm font-medium text-white line-clamp-2 flex-1">{task.title}</h3>
            </div>

            {/* Time remaining */}
            <div className="flex items-center justify-between text-xs">
              <span
                className="font-semibold"
                style={{ color: timeColor }}
              >
                {isOverdue && "⚠ "}
                {timeRemaining}
              </span>
              {task.status && (
                <span className="px-2 py-0.5 rounded bg-gray-700/50 text-gray-300 text-[10px]">
                  {task.status}
                </span>
              )}
            </div>
          </div>

          {/* Connection Ports - Only show when dependencies are enabled */}
          {showDependencies && (
            <>
              <ConnectionPort
                port="top"
                taskId={task.id}
                isConnecting={isConnectingDependency}
                isSource={isConnectingFrom && connectingFromPort === "top"}
                isTaskHovered={isHovered}
                onStartConnect={handleStartConnect}
                onFinishConnect={handleFinishConnect}
              />
              <ConnectionPort
                port="right"
                taskId={task.id}
                isConnecting={isConnectingDependency}
                isSource={isConnectingFrom && connectingFromPort === "right"}
                isTaskHovered={isHovered}
                onStartConnect={handleStartConnect}
                onFinishConnect={handleFinishConnect}
              />
              <ConnectionPort
                port="bottom"
                taskId={task.id}
                isConnecting={isConnectingDependency}
                isSource={isConnectingFrom && connectingFromPort === "bottom"}
                isTaskHovered={isHovered}
                onStartConnect={handleStartConnect}
                onFinishConnect={handleFinishConnect}
              />
              <ConnectionPort
                port="left"
                taskId={task.id}
                isConnecting={isConnectingDependency}
                isSource={isConnectingFrom && connectingFromPort === "left"}
                isTaskHovered={isHovered}
                onStartConnect={handleStartConnect}
                onFinishConnect={handleFinishConnect}
              />
            </>
          )}
        </div>
      </div>

      {/* Tooltip showing "TO -> From" */}
      {isHovered && !isDraggingThis && !isConnectingDependency && (
        <div
          className="absolute z-[100] pointer-events-none left-1/2 -translate-x-1/2"
          style={{
            top: `${CONSTANTS.TASK_BLIP_HEIGHT + 8}px`,
          }}
        >
          <div className="bg-gray-900/95 border border-gray-700 rounded-md px-2 py-1 shadow-lg backdrop-blur-sm">
            <div className="text-xs text-gray-300 font-medium whitespace-nowrap">
              {task.dueDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
              <span className="text-gray-500 mx-1.5">→</span>
              {currentTime.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
