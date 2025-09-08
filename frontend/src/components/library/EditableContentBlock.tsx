import React, { useState } from 'react';
import { RefreshCw, MoreHorizontal } from 'lucide-react';
import ModelSelectModal from './ModelSelectModal';
import ContextMenu from './ContextMenu';

interface Props {
  children: React.ReactNode;
  index: number;
  isRegenerating: boolean;
  editMode: boolean;
  onRegenerate: (index: number, model: string) => void;
}

const EditableContentBlock: React.FC<Props> = ({
  children,
  index,
  isRegenerating,
  editMode,
  onRegenerate,
}) => {
  const [showModelModal, setShowModelModal] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleRegenerate = (model: string) => {
    onRegenerate(index, model);
    setShowModelModal(false);
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  return (
    <div 
      className={`relative group transition-all duration-200 ${
        editMode ? 'border border-dashed border-gray-300 rounded-lg p-4' : ''
      } ${isRegenerating ? 'opacity-50' : ''}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onContextMenu={handleContextMenu}
    >
      {/* Hidden regeneration controls */}
      {(editMode || showControls) && !isRegenerating && (
        <div className={`absolute ${editMode ? '-top-2 -right-2' : 'top-2 right-2'} z-10`}>
          <div className="flex items-center space-x-1">
            {/* Hover-only regenerate button */}
            {!editMode && showControls && (
              <button
                onClick={() => setShowModelModal(true)}
                className="p-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-600 hover:text-gray-900"
                title="Regenerate this section"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
            
            {/* Edit mode controls */}
            {editMode && (
              <>
                <button
                  onClick={() => setShowModelModal(true)}
                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  title="Regenerate this section"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                  Block {index + 1}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isRegenerating && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-20 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Regenerating...</span>
          </div>
        </div>
      )}

      {/* Content */}
      {children}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onRegenerate={() => setShowModelModal(true)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Model Selection Modal */}
      {showModelModal && (
        <ModelSelectModal
          onSelectModel={handleRegenerate}
          onClose={() => setShowModelModal(false)}
          title="Select AI Model for Regeneration"
        />
      )}
    </div>
  );
};

export default EditableContentBlock;