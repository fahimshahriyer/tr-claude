import { WorkingCalendar } from './types';

/**
 * Check if a date is a working day according to the calendar
 */
export function isWorkingDay(date: Date, calendar: WorkingCalendar): boolean {
  const dayOfWeek = date.getDay();

  // Check if it's a working day of the week
  if (!calendar.workingDays.includes(dayOfWeek)) {
    return false;
  }

  // Check if it's a holiday
  const dateStr = date.toDateString();
  if (calendar.holidays.some((holiday) => holiday.toDateString() === dateStr)) {
    return false;
  }

  // Check exceptions
  const exception = calendar.exceptions.find(
    (ex) => ex.date.toDateString() === dateStr
  );
  if (exception) {
    return exception.isWorking;
  }

  return true;
}

/**
 * Get the next working day from a given date
 */
export function getNextWorkingDay(date: Date, calendar: WorkingCalendar): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  while (!isWorkingDay(nextDay, calendar)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
}

/**
 * Get the previous working day from a given date
 */
export function getPreviousWorkingDay(date: Date, calendar: WorkingCalendar): Date {
  const prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);

  while (!isWorkingDay(prevDay, calendar)) {
    prevDay.setDate(prevDay.getDate() - 1);
  }

  return prevDay;
}

/**
 * Snap a date to the nearest working day
 */
export function snapToWorkingDay(
  date: Date,
  calendar: WorkingCalendar,
  direction: 'forward' | 'backward' | 'nearest' = 'nearest'
): Date {
  if (isWorkingDay(date, calendar)) {
    return date;
  }

  if (direction === 'forward') {
    return getNextWorkingDay(date, calendar);
  }

  if (direction === 'backward') {
    return getPreviousWorkingDay(date, calendar);
  }

  // Find nearest working day
  const next = getNextWorkingDay(date, calendar);
  const prev = getPreviousWorkingDay(date, calendar);

  const nextDiff = next.getTime() - date.getTime();
  const prevDiff = date.getTime() - prev.getTime();

  return nextDiff < prevDiff ? next : prev;
}

/**
 * Calculate the number of working days between two dates
 */
export function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  calendar: WorkingCalendar
): number {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    if (isWorkingDay(current, calendar)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Add a number of working days to a date
 */
export function addWorkingDays(
  date: Date,
  days: number,
  calendar: WorkingCalendar
): Date {
  let current = new Date(date);
  let remaining = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;

  while (remaining > 0) {
    current.setDate(current.getDate() + direction);
    if (isWorkingDay(current, calendar)) {
      remaining--;
    }
  }

  return current;
}

/**
 * Calculate end date from start date and duration in working days
 */
export function calculateEndDate(
  startDate: Date,
  durationInWorkingDays: number,
  calendar: WorkingCalendar
): Date {
  // If duration is 0 (milestone), return start date
  if (durationInWorkingDays === 0) {
    return startDate;
  }

  // Add working days (duration - 1 because start day counts as first day)
  return addWorkingDays(startDate, durationInWorkingDays - 1, calendar);
}

/**
 * Calculate duration in working days from start and end dates
 */
export function calculateDuration(
  startDate: Date,
  endDate: Date,
  calendar: WorkingCalendar
): number {
  return calculateWorkingDays(startDate, endDate, calendar);
}
