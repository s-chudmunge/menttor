'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Removed unused imports
import { RoadmapData, UserProgress } from '../../../lib/api'; // Keep UserProgress
import RoadmapVisualization from './RoadmapVisualization'; // Import RoadmapVisualization

interface ContentViewProps {
  currentView: 'day' | 'section';
  currentIndex: number;
  roadmapData: RoadmapData | null;
  progressData: UserProgress[] | null;
}

const ContentView: React.FC<ContentViewProps> = ({
  currentView,
  currentIndex,
  roadmapData,
  progressData
}) => {
  // Removed isSubtopicCompleted as it's now in RoadmapVisualization

  return (
    <>
      {/* Navigation and header for current view - keep this */}
      {/* This part might need adjustment if navigation is handled differently */}
      {/* For now, assuming navigation buttons remain here */}
      {/* <button
          onClick={() => handleNavigation('prev')}
          disabled={currentIndex === 0}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/50 text-gray-600 hover:text-indigo-600 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button> */}

      {/* <div className="flex-1 mx-4">
          {currentView === 'day' ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Day {roadmapByDay[currentIndex]?.day}
              </h2>
              <p className="text-gray-600">{(roadmapByDay[currentIndex] as DayViewSubtopic)?.date}</p>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {roadmapBySection[currentIndex]?.title}
              </h2>
              <p className="text-gray-600">{roadmapBySection[currentIndex]?.timeline}</p>
            </div>
          )}
        </div> */}

      {/* <button
          onClick={() => handleNavigation('next')}
          disabled={currentIndex >= (currentView === 'day' ? roadmapByDay.length - 1 : roadmapBySection.length - 1)}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/50 text-gray-600 hover:text-indigo-600 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button> */}
      {/* Render the RoadmapVisualization component */}
      {roadmapData && (
        <RoadmapVisualization
          roadmapData={roadmapData}
          progressData={progressData}
        />
      )}

      {/* Removed original content rendering logic */}

      {/* Removed pagination/progress bar as it might be handled by visualization */}
      {/* <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200/50">
          <span className="text-sm text-gray-600">
            {currentIndex + 1} of {currentView === 'day' ? roadmapByDay.length : roadmapBySection.length}
          </span>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / (currentView === 'day' ? roadmapByDay.length : roadmapBySection.length)) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      </div> */}
    </>
  );
};

export default ContentView;