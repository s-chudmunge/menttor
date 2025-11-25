'use client';

import React from 'react';
import { Box, BookOpen } from 'lucide-react';

interface MainPageSidePanelProps {
  onShow3DGenerator: () => void;
  onShowLearnAboutSomething: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const MainPageSidePanel: React.FC<MainPageSidePanelProps> = ({
  onShow3DGenerator,
  onShowLearnAboutSomething,
  isOpen = true,
  onToggle
}) => {

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Side Panel */}
      <div className={`
        fixed top-14 left-0 h-[calc(100vh-3.5rem)] bg-white dark:bg-black 
        border-r border-gray-200 dark:border-gray-700 w-80 flex flex-col z-30
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-1 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* AI Tools */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 px-1">Tools</h3>
            <div className="space-y-1">
              <button
                onClick={onShow3DGenerator}
                className="w-full flex items-center px-2 py-1.5 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded"
              >
                <Box className="w-3.5 h-3.5 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium">3D Visualization</span>
              </button>
              
              <button
                onClick={onShowLearnAboutSomething}
                className="w-full flex items-center px-2 py-1.5 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded"
              >
                <BookOpen className="w-3.5 h-3.5 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium">Learn Something</span>
              </button>
              
            </div>
          </div>

        </div>

      </div>
    </>
  );
};

export default MainPageSidePanel;