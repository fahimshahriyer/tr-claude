"use client";

import React, { useState, useRef } from "react";
import { useTaskRadar } from "./TaskRadarContext";
import { CONSTANTS } from "./types";
import { TaskCreateModal } from "./TaskCreateModal";
import { Task } from "./types";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

export function EnhancedControls() {
  const {
    zoom,
    setZoom,
    showDependencies,
    toggleDependencyMode,
    isConnectingDependency,
    cancelConnectingDependency,
    filterQuery,
    setFilterQuery,
    filterPriority,
    setFilterPriority,
    filterStatus,
    setFilterStatus,
    timeOffset,
    setTimeOffset,
    resetView,
    addTask,
    updateTask,
    exportTasks,
    importTasks,
    clearAllTasks,
    selectedTaskId,
    tasks,
  } = useTaskRadar();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showTimeTravel, setShowTimeTravel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditSelectedTask = () => {
    if (selectedTaskId) {
      const task = tasks.find((t) => t.id === selectedTaskId);
      if (task) {
        setEditingTask(task);
        setIsCreateModalOpen(true);
      }
    }
  };

  // Setup keyboard shortcuts
  useKeyboardShortcuts(
    () => setIsCreateModalOpen(true),
    handleEditSelectedTask
  );

  const handleZoomIn = () => {
    setZoom(zoom + CONSTANTS.ZOOM_STEP);
  };

  const handleZoomOut = () => {
    setZoom(zoom - CONSTANTS.ZOOM_STEP);
  };

  const handleSaveTask = (task: Omit<Task, "id" | "createdAt">) => {
    if (editingTask) {
      updateTask(editingTask.id, task);
      setEditingTask(null);
    } else {
      addTask(task as Task);
    }
  };

  const handleExport = () => {
    const data = exportTasks();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task-radar-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      importTasks(data);
    };
    reader.readAsText(file);
  };

  return (
    <>
      {/* Main Control Panel - Top Right */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        {/* Quick Actions */}
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-2 flex gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded font-medium transition-colors flex items-center gap-2"
            title="Create new task (N)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Task
          </button>

          {selectedTaskId && (
            <button
              onClick={handleEditSelectedTask}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded font-medium transition-colors"
              title="Edit selected task (E)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-2 flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            disabled={zoom >= CONSTANTS.MAX_ZOOM}
            className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-400 font-bold transition-colors"
            title="Zoom in (+)"
          >
            +
          </button>
          <div className="h-px bg-gray-700" />
          <button
            onClick={handleZoomOut}
            disabled={zoom <= CONSTANTS.MIN_ZOOM}
            className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-400 font-bold transition-colors"
            title="Zoom out (-)"
          >
            −
          </button>
          <div className="h-px bg-gray-700" />
          <div className="text-center text-xs text-gray-400 py-1">{Math.round(zoom * 100)}%</div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-2 flex flex-col gap-2">
          {/* Dependency Mode */}
          <button
            onClick={
              isConnectingDependency ? cancelConnectingDependency : toggleDependencyMode
            }
            className={`p-3 rounded-lg transition-all ${
              showDependencies
                ? "bg-blue-900/50 border border-blue-500 text-blue-400"
                : "bg-gray-800 hover:bg-gray-700 text-gray-400"
            }`}
            title={showDependencies ? "Hide dependencies (D)" : "Show dependencies (D)"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </button>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-lg transition-all ${
              showFilters
                ? "bg-zinc-900/50 border border-zinc-500 text-zinc-300"
                : "bg-gray-800 hover:bg-gray-700 text-gray-400"
            }`}
            title="Toggle filters (F)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </button>

          {/* Time Travel Toggle */}
          <button
            onClick={() => setShowTimeTravel(!showTimeTravel)}
            className={`p-3 rounded-lg transition-all ${
              showTimeTravel || timeOffset !== 0
                ? "bg-purple-900/50 border border-purple-500 text-purple-400"
                : "bg-gray-800 hover:bg-gray-700 text-gray-400"
            }`}
            title="Time travel (T)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          <div className="h-px bg-gray-700" />

          {/* Reset View */}
          <button
            onClick={resetView}
            className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-all"
            title="Reset view (R)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Data Management */}
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-2 flex flex-col gap-2">
          <button
            onClick={handleExport}
            className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-all"
            title="Export tasks"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-all"
            title="Import tasks"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </button>

          <button
            onClick={clearAllTasks}
            className="p-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-all"
            title="Clear all tasks"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Panel - Top Left */}
      {showFilters && (
        <div className="absolute top-4 left-4 z-50 w-80">
          <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="all">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setFilterQuery("");
                setFilterPriority("all");
                setFilterStatus("all");
              }}
              className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Time Travel Panel - Bottom Left */}
      {showTimeTravel && (
        <div className="absolute bottom-20 left-4 z-50 w-80">
          <div className="bg-gray-900/95 backdrop-blur-sm border border-purple-500/50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-purple-400">Time Travel</h3>
              <button
                onClick={() => setShowTimeTravel(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time Offset: {timeOffset === 0 ? "Now" : `${Math.round(timeOffset / (24 * 60 * 60 * 1000))} days`}
              </label>
              <input
                type="range"
                min={-30 * 24 * 60 * 60 * 1000}
                max={30 * 24 * 60 * 60 * 1000}
                step={24 * 60 * 60 * 1000}
                value={timeOffset}
                onChange={(e) => setTimeOffset(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-30 days</span>
                <span>Today</span>
                <span>+30 days</span>
              </div>
            </div>

            <button
              onClick={() => setTimeOffset(0)}
              className="w-full px-4 py-2 bg-purple-900/50 hover:bg-purple-900/70 text-purple-400 rounded-lg font-medium transition-colors"
            >
              Reset to Now
            </button>
          </div>
        </div>
      )}

      {/* Connection Mode Indicator */}
      {isConnectingDependency && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-blue-900/95 backdrop-blur-sm border border-blue-500 rounded-lg px-6 py-3 flex items-center gap-3">
            <div className="animate-pulse">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            </div>
            <span className="text-white font-medium">
              Click on a task to create dependency
            </span>
            <button
              onClick={cancelConnectingDependency}
              className="ml-2 text-blue-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Task Create/Edit Modal */}
      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        editingTask={editingTask}
      />
    </>
  );
}
