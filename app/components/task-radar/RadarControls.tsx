"use client";

import React from "react";
import { useTaskRadar } from "./TaskRadarContext";
import { CONSTANTS, PRIORITY_COLORS } from "./types";

export function RadarControls() {
  const { zoom, setZoom, centerLockEnabled, toggleCenterLock, resetView, tasks } = useTaskRadar();

  const handleZoomIn = () => {
    setZoom(zoom + CONSTANTS.ZOOM_STEP);
  };

  const handleZoomOut = () => {
    setZoom(zoom - CONSTANTS.ZOOM_STEP);
  };

  // Calculate task stats
  const now = new Date();
  const overdueCount = tasks.filter((t) => t.dueDate < now).length;
  const todayCount = tasks.filter((t) => {
    const diffDays = (t.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays < 1;
  }).length;
  const priorityCounts = {
    high: tasks.filter((t) => t.priority === "high").length,
    medium: tasks.filter((t) => t.priority === "medium").length,
    low: tasks.filter((t) => t.priority === "low").length,
  };

  return (
    <>
      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        {/* Zoom controls */}
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-2 flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            disabled={zoom >= CONSTANTS.MAX_ZOOM}
            className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-400 font-bold transition-colors"
            title="Zoom in"
          >
            +
          </button>
          <div className="h-px bg-gray-700" />
          <button
            onClick={handleZoomOut}
            disabled={zoom <= CONSTANTS.MIN_ZOOM}
            className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-400 font-bold transition-colors"
            title="Zoom out"
          >
            −
          </button>
          <div className="h-px bg-gray-700" />
          <div className="text-center text-xs text-gray-400 py-1">{Math.round(zoom * 100)}%</div>
        </div>

        {/* Center lock toggle */}
        <button
          onClick={toggleCenterLock}
          className={`bg-gray-900/90 backdrop-blur-sm border rounded-lg p-3 transition-all ${
            centerLockEnabled
              ? "border-emerald-500 text-emerald-400"
              : "border-gray-700 text-gray-400 hover:border-gray-600"
          }`}
          title={centerLockEnabled ? "Center locked (click to unlock)" : "Center unlocked (click to lock)"}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {centerLockEnabled ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            )}
          </svg>
        </button>

        {/* Reset view */}
        <button
          onClick={resetView}
          className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-emerald-400 rounded-lg p-3 transition-all"
          title="Reset view"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Top-left legend */}
      <div className="absolute top-4 left-4 z-50">
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-emerald-400">Priority</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: PRIORITY_COLORS.high }}
              />
              <span>High ({priorityCounts.high})</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: PRIORITY_COLORS.medium }}
              />
              <span>Medium ({priorityCounts.medium})</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: PRIORITY_COLORS.low }}
              />
              <span>Low ({priorityCounts.low})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-6 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6 text-gray-400">
              <span>
                Total Tasks: <span className="text-emerald-400 font-semibold">{tasks.length}</span>
              </span>
              {todayCount > 0 && (
                <span>
                  Due Today: <span className="text-orange-400 font-semibold">{todayCount}</span>
                </span>
              )}
              {overdueCount > 0 && (
                <span>
                  Overdue: <span className="text-red-400 font-semibold">{overdueCount}</span>
                </span>
              )}
            </div>
            <div className="text-gray-500 text-xs">
              Drag tasks to reschedule • Click to select • Scroll to zoom
            </div>
          </div>
        </div>
      </div>

      {/* Instructions panel (top-center, collapsible) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2">
          <p className="text-xs text-gray-400 text-center">
            <span className="text-emerald-400 font-semibold">Task Radar</span> • Distance from center = time until due
          </p>
        </div>
      </div>
    </>
  );
}
