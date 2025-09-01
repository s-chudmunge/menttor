'use client';

import React from 'react';
import { Sparkles, Box, BookOpen } from 'lucide-react';
import TimetableTools from './TimetableTools';

interface QuickToolsSidePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onShow3DGenerator: () => void;
  onShowLearnAboutSomething: () => void;
  roadmapData?: any;
}

const QuickToolsSidePanel: React.FC<QuickToolsSidePanelProps> = ({
  isOpen,
  onToggle,
  onShow3DGenerator,
  onShowLearnAboutSomething,
  roadmapData
}) => {
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Side Panel */}
      <div className={`
        fixed top-14 left-0 h-[calc(100vh-3.5rem)] bg-white dark:bg-gray-800
        border-r border-gray-200 dark:border-gray-700 shadow-lg z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64 lg:w-72 flex flex-col
      `}>
        {/* Header */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-1.5">
            <div className="w-5 h-5 bg-purple-600 dark:bg-purple-500 rounded flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Quick Tools
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-2 py-1">
            {/* Timetable Tools */}
            {roadmapData && (
              <TimetableTools roadmapData={roadmapData} />
            )}
            
            {/* AI Tools Menu */}
            <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onShow3DGenerator}
                className="w-full flex items-center px-2 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded"
              >
                <Box className="w-3.5 h-3.5 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium">3D Visualization</span>
              </button>
              
              <button
                onClick={onShowLearnAboutSomething}
                className="w-full flex items-center px-2 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded"
              >
                <BookOpen className="w-3.5 h-3.5 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium">Learn About Something</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            More tools coming soon
          </p>
        </div>
      </div>

    </>
  );
};

export default QuickToolsSidePanel;