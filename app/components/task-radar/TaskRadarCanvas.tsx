"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useTaskRadar } from "./TaskRadarContext";
import { RadarCanvas } from "./RadarCanvas";
import { TaskBlip } from "./TaskBlip";
import { DependencyConnections } from "./DependencyConnections";
import { CONSTANTS } from "./types";
import { dateFromDistance } from "./utils";

export function TaskRadarCanvas() {
  const {
    getFilteredTasks,
    setViewport,
    dragState,
    updateDrag,
    endDrag,
    centerLockEnabled,
    panOffset,
    setPanOffset,
    selectTask,
    isConnectingDependency,
    updateConnectingMouse,
    zoom,
    currentTime,
    viewport,
    sidebarCollapsed,
  } = useTaskRadar();

  const tasks = getFilteredTasks();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [cursorDate, setCursorDate] = useState<Date | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Update viewport dimensions on mount, resize, and sidebar state change
  useEffect(() => {
    const updateViewport = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewport({
          width: rect.width,
          height: rect.height,
          centerX: rect.width / 2,
          centerY: rect.height / 2,
        });
      }
    };

    // Use requestAnimationFrame to ensure layout has settled after sidebar state change
    const rafId = requestAnimationFrame(updateViewport);
    window.addEventListener("resize", updateViewport);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateViewport);
    };
  }, [setViewport, sidebarCollapsed]);

  // Handle global mouse move for dragging and connecting
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging) {
        updateDrag(e.clientX, e.clientY);
      } else if (isConnectingDependency && containerRef.current) {
        // Convert mouse coordinates to radar coordinate system
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - panOffset.x;
        const y = e.clientY - rect.top - panOffset.y;
        updateConnectingMouse(x, y);
      } else if (isPanning && !centerLockEnabled) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setPanOffset({
          x: panOffset.x + dx,
          y: panOffset.y + dy,
        });
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [dragState.isDragging, isConnectingDependency, isPanning, centerLockEnabled, panStart, panOffset, updateDrag, updateConnectingMouse, setPanOffset]
  );

  // Handle global mouse up for dragging
  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      endDrag();
    }
    if (isPanning) {
      setIsPanning(false);
    }
  }, [dragState.isDragging, isPanning, endDrag]);

  // Attach global listeners
  useEffect(() => {
    if (dragState.isDragging || isPanning || isConnectingDependency) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState.isDragging, isPanning, isConnectingDependency, handleMouseMove, handleMouseUp]);

  // Handle background mouse down for panning
  const handleBackgroundMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!centerLockEnabled && e.target === containerRef.current) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [centerLockEnabled]
  );

  // Handle background click to deselect
  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === containerRef.current) {
        selectTask(null);
      }
    },
    [selectTask]
  );

  // Handle cursor movement to show temporal tooltip
  const handleContainerMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || dragState.isDragging || isPanning || isConnectingDependency) {
        setCursorDate(null);
        return;
      }

      // Hide tooltip when hovering over tasks (check if target has task-related classes or is inside a task)
      const target = e.target as HTMLElement;
      if (target.closest('[data-task-blip]')) {
        setCursorDate(null);
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - panOffset.x;
      const mouseY = e.clientY - rect.top - panOffset.y;

      // Calculate distance from center
      const dx = mouseX - viewport.centerX;
      const dy = mouseY - viewport.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Convert distance to fractional days
      const unscaledDistance = distance / zoom;
      const fractionalDays = unscaledDistance / CONSTANTS.BASE_RING_SPACING;

      // Calculate the calendar date this distance represents
      const date = dateFromDistance(currentTime, fractionalDays);

      setCursorDate(date);
      setCursorPos({ x: e.clientX, y: e.clientY });
    },
    [dragState.isDragging, isPanning, isConnectingDependency, panOffset, viewport, zoom, currentTime]
  );

  const handleContainerMouseLeave = useCallback(() => {
    setCursorDate(null);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black ${
        !centerLockEnabled && !dragState.isDragging ? "cursor-move" : ""
      } ${dragState.isDragging ? "cursor-grabbing" : ""}`}
      onMouseDown={handleBackgroundMouseDown}
      onClick={handleBackgroundClick}
      onMouseMove={handleContainerMouseMove}
      onMouseLeave={handleContainerMouseLeave}
    >
      {/* Radar background */}
      <RadarCanvas />

      {/* Dependency connections */}
      <DependencyConnections />

      {/* Task blips */}
      <div className="absolute inset-0">
        {tasks.map((task) => (
          <TaskBlip key={task.id} task={task} />
        ))}
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-2">
            <p className="text-gray-500 text-lg">No tasks yet</p>
            <p className="text-gray-600 text-sm">Tasks will appear on the radar based on their due dates</p>
          </div>
        </div>
      )}

      {/* Cursor temporal tooltip */}
      {cursorDate && (
        <div
          className="fixed z-[200] pointer-events-none"
          style={{
            left: `${cursorPos.x + 15}px`,
            top: `${cursorPos.y - 35}px`,
          }}
        >
          <div className="bg-gray-900/95 border border-gray-600 rounded-md px-2 py-1 shadow-lg backdrop-blur-sm">
            <div className="text-xs text-gray-300 font-medium whitespace-nowrap flex items-center gap-1.5">
              <span className="text-gray-400">📍</span>
              {cursorDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: cursorDate.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
              })}{" "}
              {cursorDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
