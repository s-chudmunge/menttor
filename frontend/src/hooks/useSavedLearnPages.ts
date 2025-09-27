import { useQuery } from '@tanstack/react-query';
import { getUserSavedLearnPages } from '../lib/api';

export const useSavedLearnPages = (roadmapId?: number) => {
  return useQuery({
    queryKey: ['savedLearnPages', roadmapId],
    queryFn: () => getUserSavedLearnPages(roadmapId),
    enabled: !!roadmapId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};