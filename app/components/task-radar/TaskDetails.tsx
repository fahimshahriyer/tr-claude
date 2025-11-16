"use client";

import React from "react";
import { useTaskRadar } from "./TaskRadarContext";
import { PRIORITY_COLORS } from "./types";
import { daysBetween, formatDueDate, formatDetailedTimeRemaining, getTimeColor } from "./utils";

export function TaskDetails() {
  const { selectedTaskId, tasks, selectTask, deleteTask, currentTime } = useTaskRadar();

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  if (!selectedTask) return null;

  const daysRemaining = daysBetween(currentTime, selectedTask.dueDate);
  const timeColor = getTimeColor(daysRemaining);
  const detailedTime = formatDetailedTimeRemaining(daysRemaining);
  const formattedDueDate = formatDueDate(selectedTask.dueDate);

  const handleClose = () => {
    selectTask(null);
  };

  const handleDelete = () => {
    if (confirm(`Delete task "${selectedTask.title}"?`)) {
      deleteTask(selectedTask.id);
    }
  };

  return (
    <div className="absolute top-4 right-20 z-50 w-80">
      <div className="bg-gray-900/95 backdrop-blur-sm border border-emerald-500/50 rounded-lg shadow-2xl shadow-emerald-500/10">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-800">
          <div className="flex items-start gap-3 flex-1">
            <div
              className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0"
              style={{ backgroundColor: PRIORITY_COLORS[selectedTask.priority] }}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-white break-words">{selectedTask.title}</h2>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300 capitalize">
                {selectedTask.priority} Priority
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="ml-2 text-gray-400 hover:text-white transition-colors"
            title="Close"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Due date and time remaining */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Due Date</span>
              <span className="text-sm text-white font-medium">{formattedDueDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Time Remaining</span>
              <span
                className="text-sm font-bold"
                style={{ color: timeColor }}
              >
                {detailedTime}
              </span>
            </div>
          </div>

          {/* Description */}
          {selectedTask.description && (
            <div className="space-y-2">
              <span className="text-sm text-gray-400">Description</span>
              <p className="text-sm text-gray-300 leading-relaxed">{selectedTask.description}</p>
            </div>
          )}

          {/* Status */}
          {selectedTask.status && (
            <div className="space-y-2">
              <span className="text-sm text-gray-400">Status</span>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-emerald-400 capitalize">
                {selectedTask.status}
              </span>
            </div>
          )}

          {/* Tags */}
          {selectedTask.tags && selectedTask.tags.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm text-gray-400">Tags</span>
              <div className="flex flex-wrap gap-2">
                {selectedTask.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded text-xs bg-gray-800 text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional metadata */}
          <div className="pt-3 border-t border-gray-800 space-y-2 text-xs text-gray-500">
            {selectedTask.createdAt && (
              <div className="flex justify-between">
                <span>Created</span>
                <span>{selectedTask.createdAt.toLocaleDateString()}</span>
              </div>
            )}
            {selectedTask.estimatedHours && (
              <div className="flex justify-between">
                <span>Estimated Hours</span>
                <span>{selectedTask.estimatedHours}h</span>
              </div>
            )}
            {selectedTask.assignee && (
              <div className="flex justify-between">
                <span>Assignee</span>
                <span>{selectedTask.assignee}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Task ID</span>
              <span className="font-mono">{selectedTask.id}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-800 flex gap-2">
            <button
              onClick={handleDelete}
              className="flex-1 px-3 py-2 rounded bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm font-medium transition-colors"
            >
              Delete Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
