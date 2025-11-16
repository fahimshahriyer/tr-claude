"use client";

import React, { useRef, useCallback } from "react";
import { useTaskRadar } from "./TaskRadarContext";
import { Task, CONSTANTS, PRIORITY_COLORS } from "./types";
import { daysBetween, formatTimeRemaining, getTimeColor } from "./utils";

interface TaskBlipProps {
  task: Task;
}

export function TaskBlip({ task }: TaskBlipProps) {
  const { taskPositions, selectedTaskId, selectTask, dragState, startDrag, currentTime } =
    useTaskRadar();

  const blipRef = useRef<HTMLDivElement>(null);
  const isDraggingThis = dragState.isDragging && dragState.taskId === task.id;
  const isSelected = selectedTaskId === task.id;

  // Handle mouse down to start drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      startDrag(task.id, e.clientX, e.clientY);
    },
    [startDrag, task.id]
  );

  // Handle click to select (when not dragging)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isDraggingThis) {
        selectTask(isSelected ? null : task.id);
      }
    },
    [isDraggingThis, isSelected, selectTask, task.id]
  );

  // Early return after all hooks
  const position = taskPositions.get(task.id);
  if (!position) return null;

  const daysRemaining = daysBetween(currentTime, task.dueDate);
  const timeColor = getTimeColor(daysRemaining);
  const timeRemaining = formatTimeRemaining(daysRemaining);
  const isOverdue = daysRemaining < 0;

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
        className={`absolute transition-all duration-100 cursor-grab active:cursor-grabbing ${
          isDraggingThis ? "z-50 scale-110" : isSelected ? "z-40" : "z-30"
        }`}
        style={{
          left: `${adjustedX}px`,
          top: `${adjustedY}px`,
          width: `${CONSTANTS.TASK_BLIP_WIDTH}px`,
          minHeight: `${CONSTANTS.TASK_BLIP_HEIGHT}px`,
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        <div
          className={`rounded-lg backdrop-blur-sm border transition-all ${
            isSelected
              ? "bg-gray-900/90 border-emerald-500 shadow-lg shadow-emerald-500/20"
              : isDraggingThis
              ? "bg-gray-900/95 border-emerald-400 shadow-xl shadow-emerald-400/30"
              : "bg-gray-800/80 border-gray-700 hover:border-gray-600 hover:bg-gray-800/90 hover:scale-105"
          }`}
          style={{
            boxShadow: isDraggingThis
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
        </div>
      </div>

      {/* Drag tooltip */}
      {isDraggingThis && dragState.newDueDate && (
        <div
          className="absolute z-[100] pointer-events-none"
          style={{
            left: `${dragState.currentX + 20}px`,
            top: `${dragState.currentY - 40}px`,
          }}
        >
          <div className="bg-gray-900 border border-emerald-500 rounded-lg px-3 py-2 shadow-xl">
            <div className="text-xs text-emerald-400 font-medium">
              {dragState.newDueDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Release to confirm</div>
          </div>
        </div>
      )}
    </>
  );
}
