import { GanttTask, GanttDependency } from './types';

export interface TaskSchedule {
  taskId: string;
  earlyStart: Date;
  earlyFinish: Date;
  lateStart: Date;
  lateFinish: Date;
  totalSlack: number; // in days
  isCritical: boolean;
}

/**
 * Calculate the critical path for a set of tasks and dependencies
 */
export function calculateCriticalPath(
  tasks: GanttTask[],
  dependencies: GanttDependency[]
): Map<string, TaskSchedule> {
  const schedules = new Map<string, TaskSchedule>();

  // Initialize all task schedules
  tasks.forEach((task) => {
    schedules.set(task.id, {
      taskId: task.id,
      earlyStart: task.startDate,
      earlyFinish: task.endDate,
      lateStart: task.startDate,
      lateFinish: task.endDate,
      totalSlack: 0,
      isCritical: false,
    });
  });

  // Forward pass: Calculate Early Start (ES) and Early Finish (EF)
  const forwardPass = () => {
    // Build dependency map: taskId -> predecessors
    const predecessors = new Map<string, GanttDependency[]>();
    dependencies.forEach((dep) => {
      const preds = predecessors.get(dep.toTaskId) || [];
      preds.push(dep);
      predecessors.set(dep.toTaskId, preds);
    });

    // Process tasks in order (can be optimized with topological sort)
    let changed = true;
    let iterations = 0;
    const maxIterations = tasks.length * 2; // Prevent infinite loops

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      tasks.forEach((task) => {
        const schedule = schedules.get(task.id)!;
        const preds = predecessors.get(task.id) || [];

        if (preds.length === 0) {
          // No predecessors, use task's original start date
          schedule.earlyStart = task.startDate;
          schedule.earlyFinish = task.endDate;
          return;
        }

        // Find the latest early finish of all predecessors
        let maxPredFinish = new Date(0);

        preds.forEach((dep) => {
          const predTask = tasks.find((t) => t.id === dep.fromTaskId);
          const predSchedule = schedules.get(dep.fromTaskId);

          if (!predTask || !predSchedule) return;

          let constraintDate: Date;

          switch (dep.type) {
            case 'FS': // Finish-to-Start
              constraintDate = predSchedule.earlyFinish;
              break;
            case 'SS': // Start-to-Start
              constraintDate = predSchedule.earlyStart;
              break;
            case 'FF': // Finish-to-Finish
              constraintDate = new Date(
                predSchedule.earlyFinish.getTime() -
                  (task.endDate.getTime() - task.startDate.getTime())
              );
              break;
            case 'SF': // Start-to-Finish
              constraintDate = new Date(
                predSchedule.earlyStart.getTime() -
                  (task.endDate.getTime() - task.startDate.getTime())
              );
              break;
            default:
              constraintDate = predSchedule.earlyFinish;
          }

          // Apply lag
          if (dep.lag) {
            const lagMs = dep.lag * 24 * 60 * 60 * 1000;
            constraintDate = new Date(constraintDate.getTime() + lagMs);
          }

          if (constraintDate > maxPredFinish) {
            maxPredFinish = constraintDate;
          }
        });

        // Update early start if changed
        if (maxPredFinish > schedule.earlyStart) {
          const taskDuration = task.endDate.getTime() - task.startDate.getTime();
          schedule.earlyStart = maxPredFinish;
          schedule.earlyFinish = new Date(maxPredFinish.getTime() + taskDuration);
          changed = true;
        }
      });
    }
  };

  // Backward pass: Calculate Late Start (LS) and Late Finish (LF)
  const backwardPass = () => {
    // Find project end date (latest early finish)
    let projectEnd = new Date(0);
    tasks.forEach((task) => {
      const schedule = schedules.get(task.id)!;
      if (schedule.earlyFinish > projectEnd) {
        projectEnd = schedule.earlyFinish;
      }
    });

    // Initialize all late dates to project end
    tasks.forEach((task) => {
      const schedule = schedules.get(task.id)!;
      const taskDuration = task.endDate.getTime() - task.startDate.getTime();

      // Tasks without successors finish at project end
      schedule.lateFinish = projectEnd;
      schedule.lateStart = new Date(projectEnd.getTime() - taskDuration);
    });

    // Build successor map: taskId -> successors
    const successors = new Map<string, GanttDependency[]>();
    dependencies.forEach((dep) => {
      const succs = successors.get(dep.fromTaskId) || [];
      succs.push(dep);
      successors.set(dep.fromTaskId, succs);
    });

    // Process tasks in reverse order
    let changed = true;
    let iterations = 0;
    const maxIterations = tasks.length * 2;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      // Process in reverse
      for (let i = tasks.length - 1; i >= 0; i--) {
        const task = tasks[i];
        const schedule = schedules.get(task.id)!;
        const succs = successors.get(task.id) || [];

        if (succs.length === 0) {
          // No successors, already set to project end
          continue;
        }

        // Find the earliest late start of all successors
        let minSuccStart = new Date(projectEnd);

        succs.forEach((dep) => {
          const succTask = tasks.find((t) => t.id === dep.toTaskId);
          const succSchedule = schedules.get(dep.toTaskId);

          if (!succTask || !succSchedule) return;

          let constraintDate: Date;

          switch (dep.type) {
            case 'FS': // Finish-to-Start
              constraintDate = succSchedule.lateStart;
              break;
            case 'SS': // Start-to-Start
              constraintDate = new Date(
                succSchedule.lateStart.getTime() -
                  (task.endDate.getTime() - task.startDate.getTime())
              );
              break;
            case 'FF': // Finish-to-Finish
              constraintDate = succSchedule.lateFinish;
              break;
            case 'SF': // Start-to-Finish
              constraintDate = new Date(
                succSchedule.lateFinish.getTime() -
                  (task.endDate.getTime() - task.startDate.getTime())
              );
              break;
            default:
              constraintDate = succSchedule.lateStart;
          }

          // Apply lag
          if (dep.lag) {
            const lagMs = dep.lag * 24 * 60 * 60 * 1000;
            constraintDate = new Date(constraintDate.getTime() - lagMs);
          }

          if (constraintDate < minSuccStart) {
            minSuccStart = constraintDate;
          }
        });

        // Update late finish if changed
        if (minSuccStart < schedule.lateFinish) {
          const taskDuration = task.endDate.getTime() - task.startDate.getTime();
          schedule.lateFinish = minSuccStart;
          schedule.lateStart = new Date(minSuccStart.getTime() - taskDuration);
          changed = true;
        }
      }
    }
  };

  // Calculate total slack and identify critical tasks
  const calculateSlack = () => {
    tasks.forEach((task) => {
      const schedule = schedules.get(task.id)!;

      // Total slack = Late Start - Early Start (or Late Finish - Early Finish)
      const slackMs = schedule.lateStart.getTime() - schedule.earlyStart.getTime();
      schedule.totalSlack = slackMs / (24 * 60 * 60 * 1000); // Convert to days

      // Tasks with zero or near-zero slack are critical
      schedule.isCritical = Math.abs(schedule.totalSlack) < 0.5; // Tolerance for rounding
    });
  };

  // Run the algorithm
  forwardPass();
  backwardPass();
  calculateSlack();

  return schedules;
}

/**
 * Get all tasks on the critical path
 */
export function getCriticalTasks(
  tasks: GanttTask[],
  schedules: Map<string, TaskSchedule>
): GanttTask[] {
  return tasks.filter((task) => {
    const schedule = schedules.get(task.id);
    return schedule?.isCritical || false;
  });
}

/**
 * Get the total slack for a task
 */
export function getTaskSlack(
  taskId: string,
  schedules: Map<string, TaskSchedule>
): number {
  return schedules.get(taskId)?.totalSlack || 0;
}
