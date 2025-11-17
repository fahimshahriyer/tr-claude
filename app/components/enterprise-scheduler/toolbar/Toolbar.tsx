'use client';

import React, { useState } from 'react';
import { useScheduler } from '../core/SchedulerContext';
import { ViewMode } from '../core/types';

export function Toolbar() {
  const {
    state,
    dispatch,
    zoomIn,
    zoomOut,
    navigateToToday,
    navigateToDate,
  } = useScheduler();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const handleViewModeChange = (mode: ViewMode) => {
    const levelMap: Record<ViewMode, number> = {
      year: 0,
      quarter: 1,
      month: 2,
      week: 3,
      day: 4,
    };
    dispatch({ type: 'SET_ZOOM_LEVEL', payload: levelMap[mode] });
  };

  const handleDateJump = () => {
    if (selectedDate) {
      navigateToDate(new Date(selectedDate));
      setShowDatePicker(false);
    }
  };

  const handleToggleWeekends = () => {
    dispatch({ type: 'TOGGLE_WEEKENDS' });
  };

  const handleToggleNonWorkingTime = () => {
    dispatch({ type: 'TOGGLE_NON_WORKING_TIME' });
  };

  const handleToggleSnapToGrid = () => {
    dispatch({ type: 'TOGGLE_SNAP_TO_GRID' });
  };

  const handleToggleDependencies = () => {
    dispatch({ type: 'TOGGLE_DEPENDENCIES' });
  };

  return (
    <div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {/* Today button */}
          <button
            onClick={navigateToToday}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
            title="Jump to today"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Today
          </button>

          {/* Date picker */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
              title="Jump to date"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Jump to Date
            </button>

            {showDatePicker && (
              <div className="absolute top-full left-0 mt-2 bg-slate-700 rounded-lg shadow-xl p-3 z-50 border border-slate-600">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleDateJump}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
                  >
                    Go
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-white text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
            <button
              onClick={zoomOut}
              className="p-2 hover:bg-slate-600 rounded text-slate-200 transition-colors"
              title="Zoom out (Ctrl + -)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <div className="px-3 py-1 text-xs text-slate-300 font-medium">
              {state.zoomLevel.name}
            </div>
            <button
              onClick={zoomIn}
              className="p-2 hover:bg-slate-600 rounded text-slate-200 transition-colors"
              title="Zoom in (Ctrl + +)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </button>
          </div>

          {/* View mode selector */}
          <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
            {(['year', 'quarter', 'month', 'week', 'day'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleViewModeChange(mode)}
                className={`
                  px-3 py-2 rounded text-sm font-medium transition-colors capitalize
                  ${
                    state.timeAxis.viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-600'
                  }
                `}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Toggle buttons */}
          <TooltipButton
            active={state.snapToGrid}
            onClick={handleToggleSnapToGrid}
            title="Snap to grid"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
            }
          />

          <TooltipButton
            active={state.showDependencies}
            onClick={handleToggleDependencies}
            title="Show dependencies"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
          />

          <TooltipButton
            active={state.timeAxis.showWeekends}
            onClick={handleToggleWeekends}
            title="Show weekends"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
          />

          <TooltipButton
            active={state.timeAxis.showNonWorkingTime}
            onClick={handleToggleNonWorkingTime}
            title="Show non-working time"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            }
          />

          {/* Divider */}
          <div className="w-px h-8 bg-slate-600" />

          {/* Add resource */}
          <button
            className="p-2 hover:bg-slate-700 rounded text-slate-200 transition-colors"
            title="Add resource"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </button>

          {/* Add event */}
          <button
            className="p-2 hover:bg-slate-700 rounded text-slate-200 transition-colors"
            title="Add event"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface TooltipButtonProps {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}

function TooltipButton({ active, onClick, title, icon }: TooltipButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        p-2 rounded transition-colors
        ${active ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}
      `}
      title={title}
    >
      {icon}
    </button>
  );
}
