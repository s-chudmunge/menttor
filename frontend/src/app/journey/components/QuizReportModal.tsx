
'use client';

import React from 'react';
import { useModalStore } from '../../../store/modalStore';
import { Award } from 'lucide-react';

const QuizReportModal = () => {
  const { isOpen, result, title, close } = useModalStore();

  if (!isOpen || !result) {
    return null;
  }

  const scorePercentage = (result.score / result.total_questions) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Quiz Report: <span className="text-blue-600">{title}</span></h3>
          <p className="text-gray-600">Score: <span className="font-semibold">{result.score} / {result.total_questions}</span></p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {scorePercentage.toFixed(0)}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 mb-3">
              <div 
                className="bg-blue-600 h-2 transition-all"
                style={{ width: `${scorePercentage}%` }}
              ></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {scorePercentage >= 80 ? 'Excellent work!' : scorePercentage >= 60 ? 'Good job!' : 'Keep practicing!'}
            </p>
          </div>
        </div>
        
        <button
          onClick={close}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default QuizReportModal;
