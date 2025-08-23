'use client';

import React from 'react';
import { NextSubtopicResponse } from '../../../lib/api';
import { Play, Clock, BookOpen, ArrowRight } from 'lucide-react';

interface SimpleResumeCardProps {
  sessionSummary: any;
  nextRecommendedSubtopic: NextSubtopicResponse | undefined;
  onResume: () => void;
}

// Simple time formatting function
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

const SimpleResumeCard: React.FC<SimpleResumeCardProps> = ({
  sessionSummary,
  nextRecommendedSubtopic,
  onResume
}) => {
  const lastActiveTimestamp = sessionSummary?.last_active_timestamp
    ? new Date(sessionSummary.last_active_timestamp)
    : null;

  const timeSinceLastSession = lastActiveTimestamp
    ? formatTimeAgo(lastActiveTimestamp)
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mr-3">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Welcome back! 👋
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ready to continue your learning journey?
          </p>
        </div>
      </div>

      {/* Last Progress */}
      {sessionSummary && timeSinceLastSession && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-1">
            <Clock className="w-4 h-4 mr-2" />
            <span>Last active {timeSinceLastSession}</span>
          </div>
          <p className="text-gray-900 dark:text-gray-100 font-medium">
            {sessionSummary.last_active_subtopic_id || 'Continue your learning'}
          </p>
        </div>
      )}

      {/* Next Up */}
      {nextRecommendedSubtopic && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
          <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 mb-1">
            <ArrowRight className="w-4 h-4 mr-2" />
            <span>Next up</span>
          </div>
          <p className="text-blue-900 dark:text-blue-100 font-medium text-sm">
            {nextRecommendedSubtopic.subtopic_title}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {nextRecommendedSubtopic.topic_title}
          </p>
        </div>
      )}

      {/* Resume Button */}
      <button
        onClick={onResume}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
      >
        <Play className="w-5 h-5" />
        <span>Continue Learning</span>
      </button>
    </div>
  );
};

export default SimpleResumeCard;