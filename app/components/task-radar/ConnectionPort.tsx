"use client";

import React from "react";
import { ConnectionPort as PortType, CONSTANTS } from "./types";

interface ConnectionPortProps {
  port: PortType;
  taskId: string;
  isConnecting: boolean;
  isSource: boolean;
  onStartConnect: (taskId: string, port: PortType, e: React.MouseEvent) => void;
  onFinishConnect: (taskId: string, port: PortType) => void;
}

export function ConnectionPort({
  port,
  taskId,
  isConnecting,
  isSource,
  onStartConnect,
  onFinishConnect,
}: ConnectionPortProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isConnecting) {
      onStartConnect(taskId, port, e);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
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

  return (
    <div
      className={`absolute z-50 cursor-pointer group/port`}
      style={getPortStyle()}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Port outer ring (visible on hover) */}
      <div
        className={`absolute transition-all duration-200 ${
          isSource
            ? "opacity-100 bg-blue-500/30 border-blue-500"
            : isConnecting
            ? "opacity-100 bg-emerald-500/30 border-emerald-500 group-hover/port:scale-125"
            : "opacity-0 group-hover/port:opacity-100 bg-gray-500/20 border-gray-500 group-hover/port:scale-110"
        } border-2 rounded-full`}
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
            ? "bg-emerald-500 scale-100 group-hover/port:scale-125"
            : "bg-gray-400 scale-0 group-hover/port:scale-100"
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
