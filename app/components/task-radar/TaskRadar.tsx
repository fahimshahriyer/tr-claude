"use client";

import React, { useCallback, useEffect } from "react";
import { TaskRadarProvider, useTaskRadar } from "./TaskRadarContext";
import { TaskRadarCanvas } from "./TaskRadarCanvas";
import { EnhancedControls } from "./EnhancedControls";
import { TaskDetails } from "./TaskDetails";
import { CONSTANTS } from "./types";

function TaskRadarContent() {
  const { setZoom, zoom, theme } = useTaskRadar();

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -CONSTANTS.ZOOM_STEP : CONSTANTS.ZOOM_STEP;
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
      <TaskDetails />
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
