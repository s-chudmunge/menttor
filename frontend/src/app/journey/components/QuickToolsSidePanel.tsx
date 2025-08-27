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
        fixed top-0 left-0 h-full bg-gradient-to-b from-white/95 via-blue-50/95 to-indigo-50/95 
        dark:from-gray-800/95 dark:via-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm
        border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-80 lg:w-96 flex flex-col
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Quick Tools
              </h2>
            </div>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close panel"
            >
              <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
            Access additional tools to enhance your learning experience
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
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
        <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
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
                     bg-gradient-to-r from-purple-500 to-indigo-500 text-white
                     p-3 rounded-r-xl shadow-xl hover:shadow-2xl
                     transition-all duration-300 hover:scale-105
                     border-r border-t border-b border-purple-400"
          aria-label="Open quick tools panel"
        >
          <div className="flex flex-col items-center space-y-1">
            <ChevronRight className="w-5 h-5" />
            <div className="text-xs font-medium tracking-wider" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              TOOLS
            </div>
          </div>
        </button>
      )}
    </>
  );
};

export default QuickToolsSidePanel;