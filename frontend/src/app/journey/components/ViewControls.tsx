
'use client';

import React from 'react';
import { Calendar, List } from 'lucide-react';

interface ViewControlsProps {
  currentView: 'day' | 'section';
  setCurrentView: (view: 'day' | 'section') => void;
  setCurrentIndex: (index: number) => void;
}

const ViewControls: React.FC<ViewControlsProps> = ({ currentView, setCurrentView, setCurrentIndex }) => {
  return (
    <div className="mb-8">
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 border border-gray-200/50 inline-flex">
        <button
          onClick={() => {setCurrentView('day'); setCurrentIndex(0);}}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
            currentView === 'day' 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Day View</span>
        </button>
        <button
          onClick={() => {setCurrentView('section'); setCurrentIndex(0);}}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
            currentView === 'section' 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <List className="w-4 h-4" />
          <span>Section View</span>
        </button>
      </div>
    </div>
  );
};

export default ViewControls;
