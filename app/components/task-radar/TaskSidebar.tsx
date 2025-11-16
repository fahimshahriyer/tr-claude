"use client";

import React, { useState } from "react";
import { useTaskRadar } from "./TaskRadarContext";
import { Task, PRIORITY_COLORS } from "./types";
import { formatTimeRemaining, getTimeColor, daysBetween } from "./utils";

type DateRange = "Today" | "Tomorrow" | "This Week" | "This Month";

const DATE_RANGES: DateRange[] = ["Today", "Tomorrow", "This Week", "This Month"];

export function TaskSidebar() {
  const {
    tasks,
    selectedTaskId,
    selectTask,
    currentTime,
    updateTask,
    deleteTask,
  } = useTaskRadar();

  const [dateRange, setDateRange] = useState<DateRange>("Today");
  const [showDropdown, setShowDropdown] = useState(false);

  // Navigate date range with arrows
  const navigateDateRange = (direction: "prev" | "next") => {
    const currentIndex = DATE_RANGES.indexOf(dateRange);
    if (direction === "prev") {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : DATE_RANGES.length - 1;
      setDateRange(DATE_RANGES[newIndex]);
    } else {
      const newIndex = currentIndex < DATE_RANGES.length - 1 ? currentIndex + 1 : 0;
      setDateRange(DATE_RANGES[newIndex]);
    }
  };

  // Filter tasks based on date range
  const getTasksForDateRange = (): Task[] => {
    const now = new Date(currentTime);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const tomorrowStart = new Date(todayEnd);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const monthEnd = new Date(todayStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    return tasks.filter((task) => {
      const taskDate = task.dueDate;

      switch (dateRange) {
        case "Today":
          return taskDate >= todayStart && taskDate < todayEnd;
        case "Tomorrow":
          return taskDate >= tomorrowStart && taskDate < tomorrowEnd;
        case "This Week":
          return taskDate >= todayStart && taskDate < weekEnd;
        case "This Month":
          return taskDate >= todayStart && taskDate < monthEnd;
        default:
          return false;
      }
    });
  };

  const filteredTasks = getTasksForDateRange();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // Task Details Mode
  if (selectedTask) {
    const daysRemaining = daysBetween(currentTime, selectedTask.dueDate);
    const timeColor = getTimeColor(daysRemaining);
    const detailedTime = formatTimeRemaining(daysRemaining);

    return (
      <div className="fixed right-0 top-0 h-screen w-96 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 z-40 flex flex-col">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-800">
          <button
            onClick={() => selectTask(null)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Back to list"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-white">Task Details</h2>
        </div>

        {/* Task Details Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Priority & Title */}
          <div className="flex items-start gap-3">
            <div
              className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: PRIORITY_COLORS[selectedTask.priority] }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-white break-words">{selectedTask.title}</h3>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300 capitalize">
                {selectedTask.priority} Priority
              </span>
            </div>
          </div>

          {/* Due Date & Time Remaining */}
          <div className="space-y-2 bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Due Date</span>
              <span className="text-sm text-white font-medium">
                {selectedTask.dueDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Time Remaining</span>
              <span className="text-sm font-bold" style={{ color: timeColor }}>
                {detailedTime}
              </span>
            </div>
          </div>

          {/* Description */}
          {selectedTask.description && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-400">Description</span>
              <p className="text-sm text-gray-300 leading-relaxed bg-gray-800/30 rounded-lg p-3">
                {selectedTask.description}
              </p>
            </div>
          )}

          {/* Status */}
          {selectedTask.status && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-400">Status</span>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-zinc-400 capitalize">
                {selectedTask.status}
              </span>
            </div>
          )}

          {/* Tags */}
          {selectedTask.tags && selectedTask.tags.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-400">Tags</span>
              <div className="flex flex-wrap gap-2">
                {selectedTask.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this task?")) {
                deleteTask(selectedTask.id);
                selectTask(null);
              }
            }}
            className="w-full px-4 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded-lg font-medium transition-colors"
          >
            Delete Task
          </button>
        </div>
      </div>
    );
  }

  // Task List Mode
  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 z-40 flex flex-col">
      {/* Date Range Navigation */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between gap-2">
          {/* Previous Button */}
          <button
            onClick={() => navigateDateRange("prev")}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Previous range"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Date Range Dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors flex items-center justify-between"
            >
              <span>{dateRange}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                {DATE_RANGES.map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateRange(range);
                      setShowDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left transition-colors ${
                      range === dateRange
                        ? "bg-gray-700 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Next Button */}
          <button
            onClick={() => navigateDateRange("next")}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Next range"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Task Count */}
        <div className="mt-3 text-sm text-gray-400">
          {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-sm">No tasks for {dateRange.toLowerCase()}</div>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const daysRemaining = daysBetween(currentTime, task.dueDate);
            const timeColor = getTimeColor(daysRemaining);

            return (
              <button
                key={task.id}
                onClick={() => selectTask(task.id)}
                className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        {task.dueDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-xs font-medium" style={{ color: timeColor }}>
                        {formatTimeRemaining(daysRemaining)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
