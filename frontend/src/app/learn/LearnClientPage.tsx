'use client';

// Enhanced Learning Experience with Behavioral Features
import BehavioralLearnClientPage from './BehavioralLearnClientPage';

interface LearnClientPageProps {
  initialContent: any;
  error: string | null;
}

// Wrapper component that maintains the same interface but uses enhanced behavioral features
const LearnClientPage: React.FC<LearnClientPageProps> = ({ initialContent, error }) => {
  return <BehavioralLearnClientPage initialContent={initialContent} error={error} />;
};

export default LearnClientPage;