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
      timetableGenerator.generatePDF(roadmapData);
      
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
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 text-sm font-medium mb-3">
          <Clock className="w-4 h-4 mr-2" />
          Study Timetable
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Get Your Learning Schedule
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Download a printable timetable or add your roadmap to your calendar
        </p>
      </div>

      <div className="space-y-3">
        {/* PDF Download */}
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200/50 dark:border-red-700/50 rounded-xl hover:from-red-100 hover:to-pink-100 dark:hover:from-red-900/30 dark:hover:to-pink-900/30 transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
              {lastAction === 'pdf' && !isGenerating ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <FileText className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {lastAction === 'pdf' && !isGenerating ? 'Downloaded!' : 'Download PDF Timetable'}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Printable schedule with branding
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isGenerating && lastAction === 'pdf' ? (
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </button>

        {/* Calendar File Download */}
        <button
          onClick={handleDownloadCalendar}
          disabled={isGenerating}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/50 rounded-xl hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              {lastAction === 'calendar' && !isGenerating ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <Calendar className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {lastAction === 'calendar' && !isGenerating ? 'Downloaded!' : 'Download Calendar File'}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                .ics file for any calendar app
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isGenerating && lastAction === 'calendar' ? (
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </button>

        {/* Google Calendar */}
        <button
          onClick={handleAddToGoogleCalendar}
          disabled={isGenerating}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              {lastAction === 'google' ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <CalendarPlus className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {lastAction === 'google' ? 'Opened!' : 'Add to Google Calendar'}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Quick add to Google Calendar
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarPlus className="w-5 h-5 text-gray-500" />
          </div>
        </button>
      </div>

      <div className="bg-yellow-50/50 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-700/50 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-xs font-bold text-white">!</span>
          </div>
          <div className="flex-1">
            <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
              Study Schedule Tips:
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              The timetable assumes 2 hours of daily study time. Adjust your schedule based on your availability and learning pace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableTools;