// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import { RoadmapData, fetchUserRoadmap } from '../lib/api';
import { supabase } from '../lib/supabase/client';

export const useRoadmap = (userId: string | undefined) => {
    const { user } = useAuth();

    return useQuery<RoadmapData[], Error>({
        queryKey: ['userRoadmap', userId],
        queryFn: async () => {
            if (!user) {
                throw new Error('User not authenticated');
            }
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                if (!token) {
                    throw new Error('No authentication token available');
                }
                return fetchUserRoadmap(token as string);
            } catch (error: any) {
                if (error.response?.status === 401) {
                    console.log('Authentication failed for roadmap data');
                    throw new Error('Authentication required');
                }
                if (error.response?.status === 404) {
                    console.log('No roadmap data found for user');
                    return [];
                }
                console.error('Roadmap fetch error:', error);
                throw error;
            }
        },
        enabled: !!user && !!userId,
        staleTime: 5 * 60 * 1000,
        retry: false,
        refetchOnWindowFocus: false,
    });
};
