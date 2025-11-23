"use client";

import { useState, useEffect, useCallback } from "react";
import { TaskRadar } from "./components/task-radar";
import { Task, TaskConnection } from "./components/task-radar/types";
import { generateSampleTasks } from "./components/task-radar/utils";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Initialize with tasks from localStorage or sample tasks
  useEffect(() => {
    const savedTasks = localStorage.getItem("taskRadarTasks");
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        // Convert date strings back to Date objects
        const tasksWithDates = parsed.map((task: Task) => ({
          ...task,
          dueDate: new Date(task.dueDate),
          createdAt: task.createdAt ? new Date(task.createdAt) : undefined,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        }));
        setTasks(tasksWithDates);
      } catch (e) {
        console.error("Failed to parse saved tasks", e);
        const sampleTasks = generateSampleTasks();
        setTasks(sampleTasks);
      }
    } else {
      const sampleTasks = generateSampleTasks();
      setTasks(sampleTasks);
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem("taskRadarTasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  // Task operation handlers
  const handleTaskCreate = useCallback((task: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      dueDate: task.dueDate,
      priority: task.priority,
      title: task.title,
    };
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const handleTaskUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task)));
  }, []);

  const handleTaskDelete = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  const handleTasksImport = useCallback((importedTasks: Task[]) => {
    setTasks(importedTasks);
  }, []);

  const handleTasksClear = useCallback(() => {
    setTasks([]);
    localStorage.removeItem("taskRadarTasks");
  }, []);

  const handleConnectionCreate = useCallback((connection: TaskConnection) => {
    console.log("Connection created:", connection);
    // Connection is handled via task update callback
  }, []);

  const handleConnectionRemove = useCallback((connection: TaskConnection) => {
    console.log("Connection removed:", connection);
    // Connection is handled via task update callback
  }, []);

  return (
    <TaskRadar
      tasks={tasks}
      options={{
        theme: "dark",
        showDependencies: false,
        enableFilters: true,
        enableTimeTravel: true,
        enableDataManagement: true,
        showSidebar: true,
        initialZoom: 1.0,
        centerLocked: true,
      }}
      callbacks={{
        onTaskCreate: handleTaskCreate,
        onTaskUpdate: handleTaskUpdate,
        onTaskDelete: handleTaskDelete,
        onTasksImport: handleTasksImport,
        onTasksClear: handleTasksClear,
        onConnectionCreate: handleConnectionCreate,
        onConnectionRemove: handleConnectionRemove,
      }}
    />
  );
}
