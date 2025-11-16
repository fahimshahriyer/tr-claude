"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useTaskRadar } from "./TaskRadarContext";
import { RadarCanvas } from "./RadarCanvas";
import { TaskBlip } from "./TaskBlip";

export function TaskRadarCanvas() {
  const {
    tasks,
    setViewport,
    dragState,
    updateDrag,
    endDrag,
    centerLockEnabled,
    panOffset,
    setPanOffset,
    selectTask,
  } = useTaskRadar();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Update viewport dimensions on mount and resize
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

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, [setViewport]);

  // Handle global mouse move for dragging
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging) {
        updateDrag(e.clientX, e.clientY);
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
    [dragState.isDragging, isPanning, centerLockEnabled, panStart, panOffset, updateDrag, setPanOffset]
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
    if (dragState.isDragging || isPanning) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState.isDragging, isPanning, handleMouseMove, handleMouseUp]);

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

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black ${
        !centerLockEnabled && !dragState.isDragging ? "cursor-move" : ""
      } ${dragState.isDragging ? "cursor-grabbing" : ""}`}
      onMouseDown={handleBackgroundMouseDown}
      onClick={handleBackgroundClick}
    >
      {/* Radar background */}
      <RadarCanvas />

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
    </div>
  );
}
