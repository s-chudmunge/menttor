import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface OnboardingStatus {
  needs_onboarding: boolean;
  profile_completed: boolean;
  user_id: number;
}

interface OnboardingData {
  display_name: string;
  email?: string;
}

export const useOnboardingStatus = () => {
  return useQuery<OnboardingStatus>({
    queryKey: ['onboarding-status'],
    queryFn: async () => {
      const response = await api.get('/auth/onboarding-status');
      return response.data;
    },
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 0, // Always check for fresh onboarding status
  });
};

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: OnboardingData) => {
      const response = await api.post('/auth/complete-onboarding', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate onboarding status and user data
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};