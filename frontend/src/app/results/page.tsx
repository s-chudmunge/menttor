// @ts-nocheck
import ResultsClientPage from './ResultsClientPage';
import { api } from '../../lib/api';

const fetchHistoricalResults = async () => {
    try {
        const response = await api.get(`/quizzes/results/${userId}`);
        return { data: response.data, error: null };
    } catch (error: unknown) {
        return { data: null, error: error instanceof Error ? (error as any).response?.data?.detail || error.message : 'An unknown error occurred' };
    }
};

export default async function ResultsPage() {
    const [historicalResults] = await Promise.all([
        fetchHistoricalResults(),
    ]);

    return (
        <ResultsClientPage
            historicalResults={historicalResults.data}
            errorHistorical={historicalResults.error}
        />
    );
}