import ResultsClientPage from './ResultsClientPage';

export default function ResultsPage() {
    // Since we can't access user data in server components without proper auth setup,
    // we'll let the client component handle all data fetching
    return (
        <ResultsClientPage
            historicalResults={null}
            errorHistorical={null}
        />
    );
}