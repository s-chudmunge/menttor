import LearnClientPage from './LearnClientPage';
import ProtectedRoute from '../components/ProtectedRoute';

const LearnPage = () => {
    return (
        <ProtectedRoute>
            <div className="light">
                <LearnClientPage initialContent={null} error={null} />
            </div>
        </ProtectedRoute>
    );
}

export default LearnPage;