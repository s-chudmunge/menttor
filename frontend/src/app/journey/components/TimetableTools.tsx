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

  const timetableGenerator = new TimetableGenerator();

  const handleDownloadPDF = async () => {
    if (!roadmapData) return;
    
    setIsGenerating(true);
    setLastAction('pdf');
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      await timetableGenerator.generatePDF(roadmapData);
      
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
      timetableGenerator.downloadCalendar(roadmapData);
      
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
    timetableGenerator.addToGoogleCalendar(roadmapData);
    
    setTimeout(() => {
      setLastAction(null);
    }, 2000);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-center">
        <div className="inline-flex items-center px-2 py-1 rounded bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium mb-1">
          <Clock className="w-3 h-3 mr-1" />
          Study Timetable
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Get Your Learning Schedule
        </h3>
      </div>

      <div className="space-y-1">
        {/* PDF Download */}
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="w-full flex items-center justify-between p-2 bg-red-100 dark:bg-red-800 border border-red-200 dark:border-red-700 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-red-600 dark:bg-red-500 rounded flex items-center justify-center">
              {lastAction === 'pdf' && !isGenerating ? (
                <CheckCircle className="w-3 h-3 text-white" />
              ) : (
                <FileText className="w-3 h-3 text-white" />
              )}
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {lastAction === 'pdf' && !isGenerating ? 'Downloaded!' : 'PDF'}
              </h4>
            </div>
          </div>
          <div className="flex items-center">
            {isGenerating && lastAction === 'pdf' ? (
              <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3 h-3 text-gray-500" />
            )}
          </div>
        </button>

        {/* Calendar File Download */}
        <button
          onClick={handleDownloadCalendar}
          disabled={isGenerating}
          className="w-full flex items-center justify-between p-2 bg-green-100 dark:bg-green-800 border border-green-200 dark:border-green-700 rounded hover:bg-green-200 dark:hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-600 dark:bg-green-500 rounded flex items-center justify-center">
              {lastAction === 'calendar' && !isGenerating ? (
                <CheckCircle className="w-3 h-3 text-white" />
              ) : (
                <Calendar className="w-3 h-3 text-white" />
              )}
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {lastAction === 'calendar' && !isGenerating ? 'Downloaded!' : 'Calendar File'}
              </h4>
            </div>
          </div>
          <div className="flex items-center">
            {isGenerating && lastAction === 'calendar' ? (
              <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3 h-3 text-gray-500" />
            )}
          </div>
        </button>

        {/* Google Calendar */}
        <button
          onClick={handleAddToGoogleCalendar}
          disabled={isGenerating}
          className="w-full flex items-center justify-between p-2 bg-blue-100 dark:bg-blue-800 border border-blue-200 dark:border-blue-700 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 dark:bg-blue-500 rounded flex items-center justify-center">
              {lastAction === 'google' ? (
                <CheckCircle className="w-3 h-3 text-white" />
              ) : (
                <CalendarPlus className="w-3 h-3 text-white" />
              )}
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {lastAction === 'google' ? 'Opened!' : 'Google Calendar'}
              </h4>
            </div>
          </div>
          <div className="flex items-center">
            <CalendarPlus className="w-3 h-3 text-gray-500" />
          </div>
        </button>
      </div>

      <div className="bg-yellow-100 dark:bg-yellow-800 border border-yellow-200 dark:border-yellow-700 rounded p-2">
        <div className="flex items-start space-x-2">
          <div className="w-3 h-3 bg-yellow-600 dark:bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-xs font-bold text-white">!</span>
          </div>
          <div className="flex-1">
            <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
              Assumes 2 hours daily. Adjust based on your pace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableTools;