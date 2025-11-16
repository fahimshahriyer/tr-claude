"use client";

import React from "react";
import { ConnectionPort as PortType, CONSTANTS } from "./types";

interface ConnectionPortProps {
  port: PortType;
  taskId: string;
  isConnecting: boolean;
  isSource: boolean;
  isTaskHovered: boolean;
  onStartConnect: (taskId: string, port: PortType, e: React.MouseEvent) => void;
  onFinishConnect: (taskId: string, port: PortType) => void;
}

export function ConnectionPort({
  port,
  taskId,
  isConnecting,
  isSource,
  isTaskHovered,
  onStartConnect,
  onFinishConnect,
}: ConnectionPortProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isConnecting) {
      onStartConnect(taskId, port, e);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConnecting && !isSource) {
      onFinishConnect(taskId, port);
    }
  };

  // Calculate position based on port location
  const getPortStyle = (): React.CSSProperties => {
    const size = CONSTANTS.CONNECTION_PORT_SIZE;
    const offset = -size / 2; // Center the port on the edge

    switch (port) {
      case "top":
        return {
          top: offset,
          left: "50%",
          transform: "translateX(-50%)",
        };
      case "right":
        return {
          right: offset,
          top: "50%",
          transform: "translateY(-50%)",
        };
      case "bottom":
        return {
          bottom: offset,
          left: "50%",
          transform: "translateX(-50%)",
        };
      case "left":
        return {
          left: offset,
          top: "50%",
          transform: "translateY(-50%)",
        };
    }
  };

  const portSize = CONSTANTS.CONNECTION_PORT_SIZE;
  const isVisible = isTaskHovered || isSource || isConnecting;

  return (
    <div
      className={`absolute z-50 cursor-crosshair select-none`}
      style={getPortStyle()}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Port outer ring */}
      <div
        className={`absolute transition-all duration-200 border-2 rounded-full ${
          isSource
            ? "opacity-100 bg-blue-500/30 border-blue-500 scale-110"
            : isConnecting
            ? "opacity-100 bg-zinc-500/30 border-zinc-500 hover:scale-125"
            : isVisible
            ? "opacity-100 bg-gray-500/20 border-gray-500 hover:scale-110"
            : "opacity-0 scale-0"
        }`}
        style={{
          width: `${portSize}px`,
          height: `${portSize}px`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Port inner dot */}
      <div
        className={`absolute transition-all duration-200 rounded-full ${
          isSource
            ? "bg-blue-500 scale-100"
            : isConnecting
            ? "bg-zinc-500 scale-100 hover:scale-125"
            : isVisible
            ? "bg-gray-400 scale-100 hover:scale-110"
            : "scale-0"
        }`}
        style={{
          width: `${portSize / 2}px`,
          height: `${portSize / 2}px`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
