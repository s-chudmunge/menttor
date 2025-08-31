'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ThreeDGeneratorCard } from '../../../../components/ThreeDGenerator';
import { LearnAboutSomethingCard } from '../../../../components/LearnAboutSomething';
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
        fixed top-0 left-0 h-full bg-white dark:bg-gray-800
        border-r border-gray-200 dark:border-gray-700 shadow-lg z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-80 lg:w-96 flex flex-col
      `}>
        {/* Header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-purple-600 dark:bg-purple-500 rounded flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Quick Tools
              </h2>
            </div>
            <button
              onClick={onToggle}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close panel"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-2">
            {/* Timetable Tools */}
            {roadmapData && (
              <TimetableTools roadmapData={roadmapData} />
            )}
            
            {/* AI Tools - All together */}
            <ThreeDGeneratorCard 
              onClick={onShow3DGenerator}
              className="w-full"
            />
            <LearnAboutSomethingCard 
              onClick={onShowLearnAboutSomething}
              className="w-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            More tools coming soon
          </p>
        </div>
      </div>

      {/* Toggle Button - Fixed position when panel is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-1/2 left-0 transform -translate-y-1/2 z-40 
                     bg-purple-600 dark:bg-purple-500 text-white
                     p-2 rounded-r-lg shadow-lg
                     transition-all duration-200 hover:bg-purple-700 dark:hover:bg-purple-400
                     border-r border-t border-b border-purple-500 dark:border-purple-400"
          aria-label="Open quick tools panel"
        >
          <div className="flex flex-col items-center">
            <ChevronRight className="w-4 h-4" />
            <div className="text-xs font-medium" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              TOOLS
            </div>
          </div>
        </button>
      )}
    </>
  );
};

export default QuickToolsSidePanel;