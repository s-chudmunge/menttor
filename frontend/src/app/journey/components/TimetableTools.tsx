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
        <div className="inline-flex items-center px-2 py-1 rounded bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-xs font-medium mb-1">
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
          className="w-full flex items-center justify-between p-2 bg-purple-100 dark:bg-purple-800 border border-purple-200 dark:border-purple-700 rounded hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-600 dark:bg-purple-500 rounded flex items-center justify-center">
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
              <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3 h-3 text-gray-500" />
            )}
          </div>
        </button>

        {/* Calendar File Download */}
        <button
          onClick={handleDownloadCalendar}
          disabled={isGenerating}
          className="w-full flex items-center justify-between p-2 bg-purple-100 dark:bg-purple-800 border border-purple-200 dark:border-purple-700 rounded hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-600 dark:bg-purple-500 rounded flex items-center justify-center">
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
              <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3 h-3 text-gray-500" />
            )}
          </div>
        </button>

        {/* Google Calendar */}
        <button
          onClick={handleAddToGoogleCalendar}
          disabled={isGenerating}
          className="w-full flex items-center justify-between p-2 bg-purple-100 dark:bg-purple-800 border border-purple-200 dark:border-purple-700 rounded hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-600 dark:bg-purple-500 rounded flex items-center justify-center">
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

      <div className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded p-2">
        <div className="flex items-start space-x-2">
          <div className="w-3 h-3 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-xs font-bold text-white">!</span>
          </div>
          <div className="flex-1">
            <p className="text-xs text-purple-800 dark:text-purple-200 font-medium">
              Assumes 2 hours daily. Adjust based on your pace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableTools;