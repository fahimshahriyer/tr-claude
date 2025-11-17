'use client';

import React, { useEffect, useRef } from 'react';
import { ContextMenuAction } from '../core/types';

interface ContextMenuProps {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export function ContextMenu({ x, y, actions, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const handleActionClick = (action: ContextMenuAction) => {
    if (!action.disabled && action.onClick) {
      action.onClick();
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {actions.map((action, index) => (
        <React.Fragment key={action.id}>
          {action.divider ? (
            <div className="h-px bg-slate-700 my-1" />
          ) : (
            <button
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              className={`
                w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors
                ${
                  action.disabled
                    ? 'text-slate-500 cursor-not-allowed'
                    : 'text-slate-200 hover:bg-slate-700 cursor-pointer'
                }
              `}
            >
              {action.icon && (
                <span className="w-4 h-4 flex-shrink-0">{action.icon}</span>
              )}
              <span className="flex-1">{action.label}</span>
              {action.children && (
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
