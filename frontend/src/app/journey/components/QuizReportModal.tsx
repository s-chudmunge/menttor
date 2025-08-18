
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Quiz Report for <span className="text-indigo-600">{title}</span></h3>
          <p className="text-gray-600">Score: <span className="font-semibold">{result.score} / {result.total_questions}</span></p>
        </div>
        
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              {scorePercentage.toFixed(2)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all"
                style={{ width: `${scorePercentage}%` }}
              ></div>
            </div>
            <p className="text-gray-600">
              {scorePercentage >= 80 ? 'Excellent work!' : scorePercentage >= 60 ? 'Good job!' : 'Keep practicing!'}
            </p>
          </div>
        </div>
        
        <button
          onClick={close}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default QuizReportModal;
