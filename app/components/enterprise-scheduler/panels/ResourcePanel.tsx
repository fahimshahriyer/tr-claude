'use client';

import React, { useState } from 'react';
import { useScheduler } from '../core/SchedulerContext';
import { Resource } from '../core/types';

interface ResourcePanelProps {
  width: number;
  scrollTop: number;
  rowHeight: number;
}

export function ResourcePanel({ width, scrollTop, rowHeight }: ResourcePanelProps) {
  const { state, updateResource } = useScheduler();
  const { resources } = state;

  // Flatten resources for rendering (handle hierarchy)
  const flatResources = flattenResources(resources);

  return (
    <div
      className="sticky left-0 z-20 bg-slate-800 border-r border-slate-700 flex-shrink-0"
      style={{ width }}
    >
      {/* Header */}
      <div className="h-[105px] border-b border-slate-700 flex items-center px-4 font-semibold text-slate-200">
        Resources
      </div>

      {/* Resource list */}
      <div className="relative" style={{ transform: `translateY(-${scrollTop}px)` }}>
        {flatResources.map((resource, index) => (
          <ResourceRow
            key={resource.id}
            resource={resource}
            height={rowHeight}
            onToggle={() => {
              if (resource.children && resource.children.length > 0) {
                updateResource(resource.id, { expanded: !resource.expanded });
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface ResourceRowProps {
  resource: Resource;
  height: number;
  onToggle: () => void;
}

function ResourceRow({ resource, height, onToggle }: ResourceRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const depth = getResourceDepth(resource);
  const hasChildren = resource.children && resource.children.length > 0;

  return (
    <div
      className={`
        flex items-center px-4 border-b border-slate-700/50 transition-colors
        ${isHovered ? 'bg-slate-700/30' : ''}
      `}
      style={{
        height,
        paddingLeft: `${depth * 20 + 16}px`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Expand/collapse toggle */}
      {hasChildren ? (
        <button
          onClick={onToggle}
          className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-200 mr-2"
        >
          <svg
            className={`w-3 h-3 transition-transform ${resource.expanded ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      ) : (
        <div className="w-4 mr-2" />
      )}

      {/* Avatar/Icon */}
      {resource.avatar ? (
        <img
          src={resource.avatar}
          alt={resource.name}
          className="w-8 h-8 rounded-full mr-3"
        />
      ) : resource.icon ? (
        <div className="w-8 h-8 rounded-full mr-3 flex items-center justify-center bg-slate-600 text-slate-200">
          {resource.icon}
        </div>
      ) : (
        <div
          className="w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white text-sm font-semibold"
          style={{ backgroundColor: resource.color || '#6b7280' }}
        >
          {resource.name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Resource name */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-200 truncate">{resource.name}</div>
        {resource.type && (
          <div className="text-xs text-slate-400 truncate">{resource.type}</div>
        )}
      </div>

      {/* Actions (visible on hover) */}
      {isHovered && (
        <div className="flex gap-1">
          <button className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// Helper function to flatten hierarchical resources
function flattenResources(resources: Resource[]): Resource[] {
  const result: Resource[] = [];

  function flatten(items: Resource[], depth = 0) {
    for (const item of items) {
      result.push({ ...item, metadata: { ...item.metadata, depth } });
      if (item.expanded && item.children && item.children.length > 0) {
        flatten(item.children, depth + 1);
      }
    }
  }

  flatten(resources);
  return result;
}

function getResourceDepth(resource: Resource): number {
  return resource.metadata?.depth || 0;
}
