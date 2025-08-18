// @ts-nocheck
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import { fetchQuizResults, QuizResult } from '../lib/api';

export const useQuizResults = () => {
    const { user, loading } = useAuth();

    return useInfiniteQuery<any, Error>({
        queryKey: ['quizResults', user?.uid],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await fetchQuizResults({ pageParam });
            return response; // response is now { items: [], total: 0, page: 1, size: 10 }
        },
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.items.length === 0) {
                return undefined;
            }
            const totalPages = Math.ceil(lastPage.total / lastPage.size);
            const nextPage = lastPage.page + 1;
            return nextPage <= totalPages ? nextPage : undefined;
        },
        enabled: !loading && !!user,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
    });
};
