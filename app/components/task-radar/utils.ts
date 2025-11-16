import { Task, TaskPosition, CONSTANTS, TIME_COLORS } from "./types";

/**
 * Hash a string to a consistent number (for angle calculation)
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diff = date2.getTime() - date1.getTime();
  return diff / (1000 * 60 * 60 * 24);
}

/**
 * Convert polar coordinates to cartesian
 */
export function polarToCartesian(
  centerX: number,
  centerY: number,
  distance: number,
  angle: number
): { x: number; y: number } {
  return {
    x: Number((centerX + distance * Math.cos(angle)).toFixed(2)),
    y: Number((centerY + distance * Math.sin(angle)).toFixed(2)),
  };
}

/**
 * Convert cartesian coordinates to polar
 */
export function cartesianToPolar(
  centerX: number,
  centerY: number,
  x: number,
  y: number
): { distance: number; angle: number } {
  const dx = x - centerX;
  const dy = y - centerY;
  return {
    distance: Math.sqrt(dx * dx + dy * dy),
    angle: Math.atan2(dy, dx),
  };
}

/**
 * Calculate task position based on due date with better angle distribution
 */
export function calculateTaskPosition(
  task: Task,
  currentTime: Date,
  centerX: number,
  centerY: number,
  zoom: number,
  existingPosition?: TaskPosition,
  allTasks?: Task[]
): TaskPosition {
  const daysRemaining = daysBetween(currentTime, task.dueDate);

  // If overdue or today, position at center
  if (daysRemaining <= 0) {
    return {
      x: centerX,
      y: centerY,
      isUserPositioned: existingPosition?.isUserPositioned || false,
      relativeDistance: 0,
      relativeAngle: existingPosition?.relativeAngle || 0,
    };
  }

  // Calculate distance from center
  const unscaledDistance = daysRemaining * CONSTANTS.BASE_RING_SPACING;
  const scaledDistance = unscaledDistance * zoom;

  // Determine angle
  let angle: number;
  if (existingPosition?.isUserPositioned) {
    // Maintain user's chosen angle
    angle = existingPosition.relativeAngle;
  } else if (existingPosition?.relativeAngle !== undefined) {
    // Keep existing angle for tasks that have been positioned
    angle = existingPosition.relativeAngle;
  } else if (allTasks) {
    // Sort all tasks by ID for consistent ordering
    const sortedTasks = [...allTasks].sort((a, b) => a.id.localeCompare(b.id));
    const taskIndex = sortedTasks.findIndex(t => t.id === task.id);
    const totalTasks = sortedTasks.length;

    // Use golden angle for optimal distribution (prevents clustering)
    // Golden angle ≈ 137.5° creates a spiral pattern that looks natural
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.399 radians

    // Base angle uses golden angle spiral
    let baseAngle = (taskIndex * goldenAngle) % (2 * Math.PI);

    // Add variation based on priority to further spread tasks
    const priorityOffset = task.priority === "high" ? 0 : task.priority === "medium" ? 0.5 : 1.0;

    // Add small deterministic offset based on task properties
    const hash = hashString(task.id + (task.title || ""));
    const hashOffset = ((hash % 100) / 100) * 0.3; // Small variation (0-0.3 radians)

    angle = baseAngle + priorityOffset + hashOffset;
  } else {
    // Fallback: Use improved hash with better distribution
    const hash = hashString(task.id + (task.title || "") + (task.priority || ""));
    angle = (hash / 1000000) * 2 * Math.PI;
  }

  const { x, y } = polarToCartesian(centerX, centerY, scaledDistance, angle);

  return {
    x,
    y,
    isUserPositioned: existingPosition?.isUserPositioned || false,
    relativeDistance: unscaledDistance,
    relativeAngle: angle,
  };
}

/**
 * Calculate due date from position
 */
export function calculateDueDateFromPosition(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  currentTime: Date,
  zoom: number
): Date {
  const { distance } = cartesianToPolar(centerX, centerY, x, y);
  const unscaledDistance = distance / zoom;
  const days = unscaledDistance / CONSTANTS.BASE_RING_SPACING;

  const newDate = new Date(currentTime);
  newDate.setTime(newDate.getTime() + days * 24 * 60 * 60 * 1000);

  return newDate;
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(daysRemaining: number): string {
  if (daysRemaining < 0) return "Overdue";

  const totalHours = daysRemaining * 24;
  const totalMinutes = totalHours * 60;

  if (totalMinutes < 60) {
    return `${Math.floor(totalMinutes)}m`;
  } else if (totalHours < 24) {
    return `${Math.floor(totalHours)}h`;
  } else {
    return `${Math.floor(daysRemaining)}d`;
  }
}

/**
 * Get time color based on days remaining
 */
export function getTimeColor(daysRemaining: number): string {
  if (daysRemaining < 0) return TIME_COLORS.overdue;
  if (daysRemaining < 1) return TIME_COLORS.urgent;
  if (daysRemaining < 7) return TIME_COLORS.soon;
  return TIME_COLORS.later;
}

/**
 * Format due date for tooltip
 */
export function formatDueDate(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format detailed time remaining
 */
export function formatDetailedTimeRemaining(daysRemaining: number): string {
  if (daysRemaining < 0) {
    const overdueDays = Math.abs(Math.floor(daysRemaining));
    return `${overdueDays} day${overdueDays !== 1 ? "s" : ""} overdue`;
  }

  const days = Math.floor(daysRemaining);
  const hours = Math.floor((daysRemaining - days) * 24);
  const minutes = Math.floor(((daysRemaining - days) * 24 - hours) * 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes > 0 && days === 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);

  return parts.join(" ") || "Now";
}

/**
 * Generate ring labels based on viewport and zoom
 */
export function generateRingLabels(maxRadius: number, zoom: number): Array<{ distance: number; label: string }> {
  const labels: Array<{ distance: number; label: string }> = [];

  for (const days of CONSTANTS.RING_LABEL_INTERVALS) {
    const distance = days * CONSTANTS.BASE_RING_SPACING * zoom;
    if (distance <= maxRadius) {
      let label: string;
      if (days === 1) label = "Tomorrow";
      else if (days === 7) label = "1 Week";
      else if (days === 14) label = "2 Weeks";
      else if (days === 30) label = "1 Month";
      else if (days === 60) label = "2 Months";
      else if (days === 90) label = "3 Months";
      else label = `${days}d`;

      labels.push({ distance, label });
    }
  }

  return labels;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate sample tasks for demo
 */
export function generateSampleTasks(): Task[] {
  const now = new Date();

  return [
    {
      id: "task-1",
      title: "Review Q4 Financial Report",
      dueDate: new Date(now.getTime() + 2.2 * 24 * 60 * 60 * 1000), // 2.2 days
      priority: "high",
      description: "Complete review of Q4 financial statements and prepare summary for board meeting",
      status: "in-progress",
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      tags: ["finance", "urgent"],
      estimatedHours: 4,
      dependencies: [], // No dependencies - this is a starting task
    },
    {
      id: "task-2",
      title: "Update Marketing Website",
      dueDate: new Date(now.getTime() + 4.5 * 24 * 60 * 60 * 1000), // 4.5 days
      priority: "medium",
      description: "Update homepage with new product features and testimonials",
      status: "todo",
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      tags: ["marketing", "website"],
      estimatedHours: 6,
      dependencies: ["task-7"], // Depends on customer feedback analysis
    },
    {
      id: "task-3",
      title: "Team Building Event Planning",
      dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      priority: "low",
      description: "Organize team building activities for the next quarter",
      status: "todo",
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      tags: ["hr", "team"],
      estimatedHours: 3,
      dependencies: ["task-8"], // Depends on onboarding new team members
    },
    {
      id: "task-4",
      title: "Fix Critical Security Bug",
      dueDate: new Date(now.getTime() + 0.5 * 24 * 60 * 60 * 1000), // 12 hours
      priority: "high",
      description: "Address security vulnerability in authentication system",
      status: "in-progress",
      createdAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000),
      tags: ["security", "urgent", "dev"],
      estimatedHours: 8,
      dependencies: [], // No dependencies - critical urgent fix
    },
    {
      id: "task-5",
      title: "Quarterly Newsletter",
      dueDate: new Date(now.getTime() + 6.8 * 24 * 60 * 60 * 1000), // ~7 days
      priority: "medium",
      description: "Draft and send quarterly company newsletter to all stakeholders",
      status: "todo",
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      tags: ["communications", "marketing"],
      estimatedHours: 2,
      dependencies: ["task-1"], // Depends on financial report review
    },
    {
      id: "task-6",
      title: "Database Migration",
      dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
      priority: "high",
      description: "Migrate production database to new infrastructure",
      status: "todo",
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      tags: ["infrastructure", "dev"],
      estimatedHours: 16,
      dependencies: ["task-4"], // Depends on security bug fix
    },
    {
      id: "task-7",
      title: "Customer Feedback Analysis",
      dueDate: new Date(now.getTime() + 2.7 * 24 * 60 * 60 * 1000), // 2.7 days
      priority: "medium",
      description: "Analyze recent customer feedback and prepare insights report",
      status: "todo",
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      tags: ["product", "research"],
      estimatedHours: 5,
      dependencies: [], // No dependencies - independent research
    },
    {
      id: "task-8",
      title: "Onboard New Team Members",
      dueDate: new Date(now.getTime() + 1.1 * 24 * 60 * 60 * 1000), // 1.1 days
      priority: "high",
      description: "Complete onboarding process for three new engineers",
      status: "in-progress",
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      tags: ["hr", "onboarding"],
      estimatedHours: 4,
      dependencies: [], // No dependencies - urgent HR task
    },
    {
      id: "task-9",
      title: "Annual Performance Reviews",
      dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 1 month
      priority: "medium",
      description: "Conduct performance reviews for all team members",
      status: "todo",
      createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      tags: ["hr", "management"],
      estimatedHours: 20,
      dependencies: ["task-3"], // Depends on team building event
    },
    {
      id: "task-10",
      title: "API Documentation Update",
      dueDate: new Date(now.getTime() + 9.5 * 24 * 60 * 60 * 1000), // 9.5 days
      priority: "low",
      description: "Update API documentation for v2.0 release",
      status: "todo",
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      tags: ["documentation", "dev"],
      estimatedHours: 8,
      dependencies: ["task-6"], // Depends on database migration completion
    },
  ];
}
