// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import { API_BASE_URL } from '../config/config';
import { LearningContentResponse } from '../lib/api';

export const useLearningContent = (userId: string | undefined) => {
    const { user } = useAuth();

    return useQuery<LearningContentResponse[], Error>({
        queryKey: ['savedLearningContent', userId],
        queryFn: () => Promise.resolve([]), // Return an empty array immediately
        enabled: false, // Disable fetching saved content
        staleTime: Infinity, // Never refetch
    });
};


