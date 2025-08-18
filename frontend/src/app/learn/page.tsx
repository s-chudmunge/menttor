import LearnClientPage from './LearnClientPage';
import ProtectedRoute from '../components/ProtectedRoute';

const LearnPage = () => {
    return (
        <ProtectedRoute>
            <LearnClientPage initialContent={null} error={null} />
        </ProtectedRoute>
    );
}

export default LearnPage;