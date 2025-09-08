import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

interface Props {
  x: number;
  y: number;
  onRegenerate: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<Props> = ({ x, y, onRegenerate, onClose }) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.context-menu')) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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

  // Adjust position to stay within viewport
  const adjustedStyle = {
    position: 'fixed' as const,
    left: Math.min(x, window.innerWidth - 200),
    top: Math.min(y, window.innerHeight - 100),
    zIndex: 1000,
  };

  return (
    <div
      className="context-menu bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-48"
      style={adjustedStyle}
    >
      <button
        onClick={() => {
          onRegenerate();
          onClose();
        }}
        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Regenerate this section</span>
      </button>
      <hr className="border-gray-100 my-1" />
      <button
        onClick={onClose}
        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <X className="w-4 h-4" />
        <span>Close</span>
      </button>
    </div>
  );
};

export default ContextMenu;