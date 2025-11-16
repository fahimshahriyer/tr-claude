import { useEffect } from "react";
import { useTaskRadar } from "./TaskRadarContext";
import { CONSTANTS } from "./types";

export function useKeyboardShortcuts(
  onOpenCreateModal: () => void,
  onOpenEditModal: () => void
) {
  const {
    tasks,
    getFilteredTasks,
    selectedTaskId,
    selectTask,
    deleteTask,
    setZoom,
    zoom,
    toggleDependencyMode,
    resetView,
    exportTasks,
    cancelConnectingDependency,
    isConnectingDependency,
  } = useTaskRadar();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Escape key - close modals, cancel operations
      if (e.key === "Escape") {
        if (isConnectingDependency) {
          cancelConnectingDependency();
          e.preventDefault();
          return;
        }
        if (selectedTaskId) {
          selectTask(null);
          e.preventDefault();
          return;
        }
      }

      // Ctrl/Cmd + N - New task
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        onOpenCreateModal();
        return;
      }

      // E - Edit selected task
      if (e.key === "e" && selectedTaskId && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onOpenEditModal();
        return;
      }

      // Delete/Backspace - Delete selected task
      if ((e.key === "Delete" || e.key === "Backspace") && selectedTaskId) {
        e.preventDefault();
        const task = tasks.find((t) => t.id === selectedTaskId);
        if (task && confirm(`Delete task "${task.title}"?`)) {
          deleteTask(selectedTaskId);
        }
        return;
      }

      // D - Toggle dependency mode
      if (e.key === "d" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleDependencyMode();
        return;
      }

      // R - Reset view
      if (e.key === "r" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        resetView();
        return;
      }

      // + or = - Zoom in
      if ((e.key === "+" || e.key === "=") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setZoom(zoom + CONSTANTS.ZOOM_STEP);
        return;
      }

      // - or _ - Zoom out
      if ((e.key === "-" || e.key === "_") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setZoom(zoom - CONSTANTS.ZOOM_STEP);
        return;
      }

      // Ctrl/Cmd + E - Export tasks
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        const data = exportTasks();
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `task-radar-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // Arrow keys - Navigate between tasks
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();

        const filteredTasks = getFilteredTasks();
        if (filteredTasks.length === 0) return;

        let currentIndex = selectedTaskId
          ? filteredTasks.findIndex((t) => t.id === selectedTaskId)
          : -1;

        if (currentIndex === -1) {
          // No selection - select first task
          selectTask(filteredTasks[0].id);
          return;
        }

        let newIndex: number;

        switch (e.key) {
          case "ArrowDown":
          case "ArrowRight":
            newIndex = (currentIndex + 1) % filteredTasks.length;
            break;
          case "ArrowUp":
          case "ArrowLeft":
            newIndex = (currentIndex - 1 + filteredTasks.length) % filteredTasks.length;
            break;
          default:
            return;
        }

        selectTask(filteredTasks[newIndex].id);
        return;
      }

      // ? - Show keyboard shortcuts help
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        alert(`Keyboard Shortcuts:

Navigation:
  Arrow Keys - Navigate between tasks
  Escape - Deselect/Cancel

Task Management:
  Ctrl/Cmd + N - Create new task
  E - Edit selected task
  Delete/Backspace - Delete selected task

View Controls:
  + / = - Zoom in
  - / _ - Zoom out
  R - Reset view

Features:
  D - Toggle dependency mode
  Ctrl/Cmd + E - Export tasks
  ? - Show this help
        `);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    tasks,
    getFilteredTasks,
    selectedTaskId,
    selectTask,
    deleteTask,
    setZoom,
    zoom,
    toggleDependencyMode,
    resetView,
    exportTasks,
    cancelConnectingDependency,
    isConnectingDependency,
    onOpenCreateModal,
    onOpenEditModal,
  ]);
}
