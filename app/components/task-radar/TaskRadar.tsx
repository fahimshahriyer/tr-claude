"use client";

import React, { useCallback, useEffect } from "react";
import { TaskRadarProvider, useTaskRadar } from "./TaskRadarContext";
import { TaskRadarCanvas } from "./TaskRadarCanvas";
import { EnhancedControls } from "./EnhancedControls";
import { TaskSidebar } from "./TaskSidebar";
import { CONSTANTS, TaskRadarProps } from "./types";

function TaskRadarContent() {
  const { setZoom, zoom, theme } = useTaskRadar();

  // Handle wheel zoom with slower sensitivity
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      // Reduce sensitivity by scaling down deltaY
      // Typical mouse wheel: ~100, trackpad: ~4-10 per event
      const scaledDelta = e.deltaY / 500; // Slower zoom speed
      const delta = -scaledDelta * CONSTANTS.ZOOM_STEP;
      setZoom(zoom + delta);
    },
    [zoom, setZoom]
  );

  useEffect(() => {
    const container = document.getElementById("task-radar-container");
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        container.removeEventListener("wheel", handleWheel);
      };
    }
  }, [handleWheel]);

  return (
    <div className={`flex w-full h-screen ${theme === "dark" ? "bg-gray-950" : "bg-white"}`}>
      {/* Radar Container */}
      <div
        id="task-radar-container"
        className="relative flex-1"
      >
        <TaskRadarCanvas />
        <EnhancedControls />
      </div>

      {/* Sidebar Container */}
      <TaskSidebar />
    </div>
  );
}

/**
 * TaskRadar - A visual task management component with temporal positioning
 *
 * @example
 * ```tsx
 * <TaskRadar
 *   tasks={tasks}
 *   options={{
 *     theme: 'dark',
 *     showDependencies: true,
 *     showSidebar: true
 *   }}
 *   callbacks={{
 *     onTaskCreate: (task) => handleCreate(task),
 *     onTaskUpdate: (id, updates) => handleUpdate(id, updates),
 *     onTaskDelete: (id) => handleDelete(id)
 *   }}
 * />
 * ```
 */
export function TaskRadar({ tasks, options, callbacks, className }: TaskRadarProps) {
  return (
    <TaskRadarProvider tasks={tasks} options={options} callbacks={callbacks}>
      <div className={className}>
        <TaskRadarContent />
      </div>
    </TaskRadarProvider>
  );
}
