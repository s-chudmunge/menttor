'use client';

import React, { useState } from 'react';
import { Download, Calendar, FileText, Clock, CalendarPlus, CheckCircle } from 'lucide-react';
import { TimetableGenerator } from '../utils/timetableGenerator';

interface TimetableToolsProps {
  roadmapData: any;
  className?: string;
}

const TimetableTools: React.FC<TimetableToolsProps> = ({ roadmapData, className = "" }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastAction, setLastAction] = useState<'pdf' | 'calendar' | 'google' | null>(null);
  const [studyTime, setStudyTime] = useState('09:00');

  const timetableGenerator = new TimetableGenerator();

  const handleDownloadPDF = async () => {
    if (!roadmapData) return;
    
    setIsGenerating(true);
    setLastAction('pdf');
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      await timetableGenerator.generatePDF(roadmapData, studyTime);
      
      // Show success for 2 seconds
      setTimeout(() => {
        setLastAction(null);
      }, 2000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setLastAction(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCalendar = async () => {
    if (!roadmapData) return;
    
    setIsGenerating(true);
    setLastAction('calendar');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      timetableGenerator.downloadCalendar(roadmapData, studyTime);
      
      setTimeout(() => {
        setLastAction(null);
      }, 2000);
    } catch (error) {
      console.error('Error generating calendar:', error);
      setLastAction(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToGoogleCalendar = () => {
    if (!roadmapData) return;
    
    setLastAction('google');
    timetableGenerator.addToGoogleCalendar(roadmapData, studyTime);
    
    setTimeout(() => {
      setLastAction(null);
    }, 2000);
  };

  return (
    <div className={`${className}`}>
      {/* Study Time Selection */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          Preferred Study Time
        </label>
        <input
          type="time"
          value={studyTime}
          onChange={(e) => setStudyTime(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      {/* Menu Items */}
      <div className="space-y-0">
        {/* PDF Download */}
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="w-full flex items-center px-0 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium flex-1">
            {lastAction === 'pdf' && !isGenerating ? 'Downloaded PDF!' : 'Download PDF'}
          </span>
          {isGenerating && lastAction === 'pdf' && (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          )}
        </button>

        {/* Calendar File Download */}
        <button
          onClick={handleDownloadCalendar}
          disabled={isGenerating}
          className="w-full flex items-center px-0 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Calendar className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium flex-1">
            {lastAction === 'calendar' && !isGenerating ? 'Downloaded Calendar!' : 'Calendar File'}
          </span>
          {isGenerating && lastAction === 'calendar' && (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          )}
        </button>

        {/* Google Calendar */}
        <button
          onClick={handleAddToGoogleCalendar}
          disabled={isGenerating}
          className="w-full flex items-center px-0 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CalendarPlus className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium flex-1">
            {lastAction === 'google' ? 'Opened Google Calendar!' : 'Google Calendar'}
          </span>
        </button>
      </div>

      <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
        Assumes 2 hours daily study time. Adjust based on your pace.
      </div>
    </div>
  );
};

export default TimetableTools;