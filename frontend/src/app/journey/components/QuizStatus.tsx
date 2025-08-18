
'use client';

import React from 'react';
import { useQuizResult } from '../../../hooks/useQuizResult';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface QuizStatusProps {
  subTopicId: string;
}

const QuizStatus: React.FC<QuizStatusProps> = ({ subTopicId }) => {
  const { data: result, isLoading, isError } = useQuizResult(subTopicId);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center space-x-2 text-red-500">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm">Error</span>
      </div>
    );
  }

  if (!result || !result.completed) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <Circle className="w-5 h-5" />
        <span className="text-sm">Not started</span>
      </div>
    );
  }

  const scorePercentage = (result.score / result.total_questions) * 100;

  return (
    <div className="flex items-center space-x-2 text-green-600">
      <CheckCircle className="w-5 h-5" />
      <span className="text-sm font-medium">Completed</span>
      <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
        Score: {scorePercentage.toFixed(0)}%
      </span>
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${scorePercentage >= 70 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
        {scorePercentage >= 70 ? 'Passed' : 'Needs Review'}
      </span>
    </div>
  );
};

export default QuizStatus;
