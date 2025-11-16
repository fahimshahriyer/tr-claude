"use client";

import React, { useCallback, useEffect } from "react";
import { TaskRadarProvider, useTaskRadar } from "./TaskRadarContext";
import { TaskRadarCanvas } from "./TaskRadarCanvas";
import { EnhancedControls } from "./EnhancedControls";
import { TaskSidebar } from "./TaskSidebar";
import { CONSTANTS } from "./types";

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
    <div
      id="task-radar-container"
      className={`relative w-full h-screen ${theme === "dark" ? "bg-gray-950" : "bg-white"}`}
    >
      <TaskRadarCanvas />
      <EnhancedControls />
      <TaskSidebar />
    </div>
  );
}

export function TaskRadar() {
  return (
    <TaskRadarProvider>
      <TaskRadarContent />
    </TaskRadarProvider>
  );
}
