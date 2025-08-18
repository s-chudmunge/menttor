
'use client';

import React from 'react';
import { useQuizResult } from '../../../hooks/useQuizResult';
import { BarChart3 } from 'lucide-react';
import { useModalStore } from '../../../store/modalStore';

interface ReportButtonProps {
  subTopicId: string;
  subtopicTitle: string;
}

const ReportButton: React.FC<ReportButtonProps> = ({ subTopicId, subtopicTitle }) => {
  const { data: result, isLoading, isError } = useQuizResult(subTopicId);
  const { open } = useModalStore();

  if (isLoading || isError || !result || !result.completed) {
    return null;
  }

  return (
    <button 
      onClick={() => open(result, subtopicTitle)}
      className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 transition-all shadow-lg"
    >
      <BarChart3 className="w-4 h-4" />
      <span className="text-sm font-medium">Report</span>
    </button>
  );
};

export default ReportButton;
