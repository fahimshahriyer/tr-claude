"use client";

import React from "react";
import { useTaskRadar } from "./TaskRadarContext";
import { CONSTANTS } from "./types";
import { generateRingLabels } from "./utils";

export function RadarCanvas() {
  const { viewport, zoom, panOffset, currentTime } = useTaskRadar();

  // Don't render until viewport is initialized
  if (viewport.width === 0 || viewport.height === 0) {
    return null;
  }

  // Calculate maximum radius based on viewport
  const maxRadius = Math.max(viewport.width, viewport.height) * 1.5;

  // Generate ring labels
  const ringLabels = generateRingLabels(maxRadius, zoom);

  // Generate rings (more than labels for visual continuity)
  const maxDays = Math.ceil(maxRadius / (CONSTANTS.BASE_RING_SPACING * zoom));
  const rings = Array.from({ length: maxDays }, (_, i) => i + 1);

  // Current time display
  const timeString = currentTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={viewport.width}
      height={viewport.height}
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      style={{
        transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
      }}
    >
      {/* Background grid pattern */}
      <defs>
        <pattern
          id="grid-pattern"
          width={20 * zoom}
          height={20 * zoom}
          patternUnits="userSpaceOnUse"
          x={viewport.centerX}
          y={viewport.centerY}
        >
          <path
            d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth="0.5"
          />
        </pattern>

        {/* Center point gradient */}
        <radialGradient id="center-gradient" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#059669" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#047857" stopOpacity="0" />
        </radialGradient>

        {/* Glow filter for center */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid background */}
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />

      {/* Radial lines */}
      <g>
        {Array.from({ length: CONSTANTS.RADIAL_LINES }).map((_, i) => {
          const angle = (i * 360) / CONSTANTS.RADIAL_LINES;
          const radians = (angle * Math.PI) / 180;
          const x2 = viewport.centerX + maxRadius * Math.cos(radians);
          const y2 = viewport.centerY + maxRadius * Math.sin(radians);

          return (
            <line
              key={`radial-${i}`}
              x1={viewport.centerX}
              y1={viewport.centerY}
              x2={x2}
              y2={y2}
              stroke="rgba(16, 185, 129, 0.15)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}
      </g>

      {/* Concentric rings */}
      <g>
        {rings.map((day) => {
          const radius = day * CONSTANTS.BASE_RING_SPACING * zoom;
          if (radius > maxRadius) return null;

          // Emphasize labeled rings
          const isLabeled = CONSTANTS.RING_LABEL_INTERVALS.includes(day);
          const strokeWidth = isLabeled ? 1.5 : 0.5;
          const strokeOpacity = isLabeled ? 0.4 : 0.2;

          return (
            <circle
              key={`ring-${day}`}
              cx={viewport.centerX}
              cy={viewport.centerY}
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeOpacity={strokeOpacity}
            />
          );
        })}
      </g>

      {/* Ring labels */}
      <g>
        {ringLabels.map(({ distance, label }) => (
          <text
            key={`label-${label}`}
            x={viewport.centerX}
            y={viewport.centerY - distance}
            fill="#10b981"
            fillOpacity="0.7"
            fontSize="12"
            fontWeight="500"
            textAnchor="middle"
            dy="-8"
            className="select-none"
          >
            {label}
          </text>
        ))}
      </g>

      {/* Center point */}
      <g>
        {/* Outer glow */}
        <circle
          cx={viewport.centerX}
          cy={viewport.centerY}
          r={CONSTANTS.CENTER_RADIUS * 1.5}
          fill="url(#center-gradient)"
          opacity="0.3"
        />

        {/* Middle ring */}
        <circle
          cx={viewport.centerX}
          cy={viewport.centerY}
          r={CONSTANTS.CENTER_RADIUS}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          opacity="0.6"
          filter="url(#glow)"
        />

        {/* Inner core */}
        <circle
          cx={viewport.centerX}
          cy={viewport.centerY}
          r={CONSTANTS.CENTER_RADIUS * 0.6}
          fill="#10b981"
          opacity="0.8"
          filter="url(#glow)"
        />

        {/* Pulsing animation ring */}
        <circle
          cx={viewport.centerX}
          cy={viewport.centerY}
          r={CONSTANTS.CENTER_RADIUS * 0.8}
          fill="none"
          stroke="#10b981"
          strokeWidth="1"
          opacity="0.5"
        >
          <animate
            attributeName="r"
            from={CONSTANTS.CENTER_RADIUS * 0.6}
            to={CONSTANTS.CENTER_RADIUS * 1.2}
            dur="2s"
            repeatCount="indefinite"
          />
          <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* Current time label (above center) */}
        <text
          x={viewport.centerX}
          y={viewport.centerY - CONSTANTS.CENTER_RADIUS - 15}
          fill="#10b981"
          fillOpacity="0.9"
          fontSize="14"
          fontWeight="600"
          textAnchor="middle"
          className="select-none"
        >
          {timeString}
        </text>

        {/* TODAY label (below center) */}
        <text
          x={viewport.centerX}
          y={viewport.centerY + CONSTANTS.CENTER_RADIUS + 25}
          fill="#10b981"
          fillOpacity="0.9"
          fontSize="16"
          fontWeight="700"
          textAnchor="middle"
          letterSpacing="2"
          className="select-none"
        >
          TODAY
        </text>
      </g>
    </svg>
  );
}
