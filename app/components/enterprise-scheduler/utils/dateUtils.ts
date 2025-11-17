// Date utility functions for the scheduler

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day;
  result.setDate(diff);
  return startOfDay(result);
}

export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  return startOfDay(result);
}

export function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  return endOfDay(result);
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isWorkingHour(date: Date, workStart = 9, workEnd = 17): boolean {
  const hour = date.getHours();
  return hour >= workStart && hour < workEnd;
}

export function diffInMinutes(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
}

export function diffInHours(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
}

export function diffInDays(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function snapToMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  const m = result.getMinutes();
  const snapped = Math.round(m / minutes) * minutes;
  result.setMinutes(snapped);
  result.setSeconds(0);
  result.setMilliseconds(0);
  return result;
}

export function snapToHours(date: Date, hours: number): Date {
  const result = new Date(date);
  const h = result.getHours();
  const snapped = Math.round(h / hours) * hours;
  result.setHours(snapped);
  result.setMinutes(0);
  result.setSeconds(0);
  result.setMilliseconds(0);
  return result;
}

export function snapToDays(date: Date): Date {
  return startOfDay(date);
}

export function formatDate(date: Date, format: string): string {
  const map: Record<string, string> = {
    YYYY: date.getFullYear().toString(),
    YY: date.getFullYear().toString().slice(-2),
    MMMM: getMonthName(date.getMonth()),
    MMM: getMonthName(date.getMonth()).slice(0, 3),
    MM: (date.getMonth() + 1).toString().padStart(2, '0'),
    M: (date.getMonth() + 1).toString(),
    DD: date.getDate().toString().padStart(2, '0'),
    D: date.getDate().toString(),
    dddd: getDayName(date.getDay()),
    ddd: getDayName(date.getDay()).slice(0, 3),
    HH: date.getHours().toString().padStart(2, '0'),
    H: date.getHours().toString(),
    mm: date.getMinutes().toString().padStart(2, '0'),
    m: date.getMinutes().toString(),
    ss: date.getSeconds().toString().padStart(2, '0'),
    s: date.getSeconds().toString(),
  };

  let result = format;

  // Handle [Q] for quarter
  if (result.includes('[Q]')) {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    result = result.replace('[Q]', quarter.toString());
  }

  // Sort keys by length descending to replace longer patterns first
  // This prevents "MMMM" -> "November" -> "Nove11ber" when replacing "M"
  const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length);

  sortedKeys.forEach((key) => {
    // Use global replace to handle multiple occurrences
    const regex = new RegExp(key, 'g');
    result = result.replace(regex, map[key]);
  });

  // Handle [Week] or [w] for week number AFTER other replacements
  // This prevents the placeholder from being affected by format token replacements
  if (result.includes('W') || result.includes('[w]')) {
    const weekNum = getWeekNumber(date);

    // Replace week patterns directly with week number
    result = result.replace(/\[Week\]\s*W/g, `Week ${weekNum}`);
    result = result.replace(/W\[w\]/g, `W${weekNum}`);
    result = result.replace(/W/g, weekNum.toString());
  }

  return result;
}

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month];
}

function getDayName(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

export function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

export function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

export function getTodayStart(): Date {
  return startOfDay(new Date());
}

export function getTodayEnd(): Date {
  return endOfDay(new Date());
}
