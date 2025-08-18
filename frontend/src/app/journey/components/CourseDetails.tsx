
'use client';

import React from 'react';
import { Clock, Target } from 'lucide-react';
import { RoadmapData } from '../../../lib/api';

interface CourseDetailsProps {
  roadmapData: RoadmapData | null;
  overallProgress: number;
  roadmapBySection: any[]; // Adjust the type as per your data structure
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ roadmapData, overallProgress, roadmapBySection }) => {
  if (!roadmapData) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{roadmapData?.subject}</h1>
            <p className="text-gray-600 text-lg mb-4">{roadmapData?.goal}</p>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{roadmapData?.time_value} {roadmapData?.time_unit}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>{roadmapBySection.length} Modules</span>
              </div>
            </div>
          </div>
          
          {/* Progress Circle */}
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
              <circle 
                cx="50" cy="50" r="40" 
                stroke="url(#gradient)" 
                strokeWidth="8" 
                fill="none"
                strokeDasharray={`${overallProgress * 2.51} 251`}
                className="transition-all duration-500"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-900">{overallProgress}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
