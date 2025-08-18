import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import { fetchRecommendedReviews, RecommendedReview } from '../lib/api';

export const useRecommendedReviews = () => {
    const { user, loading } = useAuth();

    return useQuery<RecommendedReview[], Error>({
        queryKey: ['recommendedReviews', user?.uid],
        queryFn: async () => {
            if (!user) {
                throw new Error('User not authenticated');
            }
            const token = await user.getIdToken();
            return fetchRecommendedReviews(token as string);
        },
        enabled: !loading && !!user,
        staleTime: 5 * 60 * 1000,
    });
};
