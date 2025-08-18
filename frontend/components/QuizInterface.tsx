'use client';

// Enhanced Quiz Interface with full behavioral integration
import BehavioralQuizInterface from './BehavioralQuizInterface';

interface QuizInterfaceProps {
    quizParams: {
        subtopic_id: string;
        subtopic: string;
        subject: string;
        goal: string;
        time_value: string;
        time_unit: string;
        model: string;
        module_title: string;
        topic_title: string;
        session_token?: string;
        time_limit?: number;
        roadmap_id?: number;
    };
}

// Wrapper component that maintains the same interface but uses enhanced behavioral features
const QuizInterface: React.FC<QuizInterfaceProps> = ({ quizParams }) => {
    return <BehavioralQuizInterface quizParams={quizParams} />;
};

export default QuizInterface;