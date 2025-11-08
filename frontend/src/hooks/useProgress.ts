// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

import { useAuth } from '../app/context/AuthContext';

export const useProgress = (roadmapId: number | null) => {
  const { user, loading } = useAuth();
  
  return useQuery({
    queryKey: ['progress', roadmapId, user?.id],
    queryFn: async () => {
      if (!roadmapId || !user) {
        return [];
      }

      // Add a small delay to ensure auth token is available
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        console.log(`🔄 useProgress: Fetching progress for roadmapId: ${roadmapId}, user: ${user?.id}`);
        const response = await api.get(`/progress/${roadmapId}`);
        console.log(`✅ useProgress: Received ${response.data?.length || 0} progress records`);
        if (response.data?.length > 0) {
          const learnCompletedCount = response.data.filter((p: any) => p.learn_completed).length;
          console.log(`📚 useProgress: ${learnCompletedCount} subtopics marked as learn_completed`);
        }
        return response.data;
      } catch (error: any) {
        // Handle common error cases gracefully
        if (error.response?.status === 404) {
          console.log('No progress data found for roadmap:', roadmapId);
          return []; // Return empty array for no progress data
        }
        if (error.response?.status === 401) {
          console.log('Authentication required for progress data - retrying in 1 second');
          // For auth errors, throw to allow retry
          throw error;
        }
        console.error('Progress data fetch error:', error);
        return [];
      }
    },
    enabled: !!roadmapId && !!user && !loading,
    retry: (failureCount, error: any) => {
      // Retry up to 2 times for auth errors
      if (error?.response?.status === 401 && failureCount < 2) {
        return true;
      }
      return false;
    },
    retryDelay: 1000, // Wait 1 second between retries
    refetchOnWindowFocus: true, // Refetch when user returns to tab (e.g., after quiz)
    refetchOnMount: true, // Always refetch when component mounts
    staleTime: 0, // Always consider data stale to ensure fresh fetches after completion
    gcTime: 30000, // Cache for 30 seconds (updated from cacheTime)
  });
};
