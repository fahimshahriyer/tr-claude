import { ZoomLevel, HeaderTier } from './types';

// Define zoom levels from year view down to minute view
export const ZOOM_LEVELS: ZoomLevel[] = [
  // Year View
  {
    level: 0,
    name: 'Year',
    viewMode: 'year',
    cellWidth: 100,
    tickSize: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    headerTiers: [
      { unit: 'year', format: 'YYYY', increment: 1 },
      { unit: 'quarter', format: 'Q[Q]', increment: 1 },
      { unit: 'month', format: 'MMM', increment: 1 },
    ],
  },
  // Quarter View
  {
    level: 1,
    name: 'Quarter',
    viewMode: 'quarter',
    cellWidth: 120,
    tickSize: 7 * 24 * 60 * 60 * 1000, // 1 week in ms
    headerTiers: [
      { unit: 'year', format: 'YYYY', increment: 1 },
      { unit: 'quarter', format: 'Q[Q]', increment: 1 },
      { unit: 'month', format: 'MMM', increment: 1 },
    ],
  },
  // Month View
  {
    level: 2,
    name: 'Month',
    viewMode: 'month',
    cellWidth: 40,
    tickSize: 24 * 60 * 60 * 1000, // 1 day in ms
    headerTiers: [
      { unit: 'month', format: 'MMMM YYYY', increment: 1 },
      { unit: 'week', format: 'W[w]', increment: 1 },
      { unit: 'day', format: 'D', increment: 1 },
    ],
  },
  // Week View
  {
    level: 3,
    name: 'Week',
    viewMode: 'week',
    cellWidth: 60,
    tickSize: 60 * 60 * 1000, // 1 hour in ms
    headerTiers: [
      { unit: 'week', format: '[Week] W', increment: 1 },
      { unit: 'day', format: 'ddd D', increment: 1 },
      { unit: 'hour', format: 'HH:mm', increment: 2 },
    ],
  },
  // Day View
  {
    level: 4,
    name: 'Day',
    viewMode: 'day',
    cellWidth: 100,
    tickSize: 15 * 60 * 1000, // 15 minutes in ms
    headerTiers: [
      { unit: 'day', format: 'dddd, MMMM D, YYYY', increment: 1 },
      { unit: 'hour', format: 'HH:mm', increment: 1 },
      { unit: 'minute', format: ':mm', increment: 15 },
    ],
  },
];

export const DEFAULT_ZOOM_LEVEL = 2; // Month view

export function getZoomLevel(level: number): ZoomLevel {
  const clampedLevel = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, level));
  return ZOOM_LEVELS[clampedLevel];
}

export function getNextZoomLevel(currentLevel: number): ZoomLevel {
  return getZoomLevel(currentLevel + 1);
}

export function getPreviousZoomLevel(currentLevel: number): ZoomLevel {
  return getZoomLevel(currentLevel - 1);
}
