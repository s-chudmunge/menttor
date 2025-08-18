
import { useQuery } from '@tanstack/react-query';
import { fetchQuizResult } from '../lib/api';

export const useQuizResult = (subTopicId: string) => {
  return useQuery({ 
    queryKey: ['quizResult', subTopicId], 
    queryFn: () => fetchQuizResult(subTopicId), 
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
