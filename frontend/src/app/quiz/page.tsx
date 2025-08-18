'use client';

import QuizInterface from '../../../components/QuizInterface';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';

const QuizPage = () => {
  const searchParams = useSearchParams();
  const rawParams = Object.fromEntries(searchParams.entries());
  
  // Get roadmap data from session storage for missing parameters
  const getStoredRoadmapData = () => {
    try {
      const storedRoadmap = sessionStorage.getItem('currentRoadmap');
      return storedRoadmap ? JSON.parse(storedRoadmap) : null;
    } catch {
      return null;
    }
  };

  const storedRoadmap = getStoredRoadmapData();

  // Construct comprehensive quiz parameters with fallbacks
  const quizParams = {
    subtopic_id: rawParams.subtopic_id || '',
    subtopic: rawParams.subtopic || rawParams.subtopic_title || 'Learning Topic',
    subject: rawParams.subject || storedRoadmap?.subject || 'General Subject',
    goal: rawParams.goal || storedRoadmap?.goal || 'Learn new concepts and improve skills',
    time_value: rawParams.time_value || '10',
    time_unit: rawParams.time_unit || 'minutes', 
    model: rawParams.model || storedRoadmap?.model || 'vertexai:gemini-2.5-flash-lite',
    module_title: rawParams.module_title || 'Learning Module',
    topic_title: rawParams.topic_title || 'Topic',
    session_token: rawParams.session_token,
    time_limit: rawParams.time_limit ? parseInt(rawParams.time_limit) : undefined,
    roadmap_id: rawParams.roadmap_id ? parseInt(rawParams.roadmap_id) : storedRoadmap?.id,
  };

  console.log('Quiz page - Raw params:', rawParams);
  console.log('Quiz page - Stored roadmap:', storedRoadmap);
  console.log('Quiz page - Final params:', quizParams);

  return <QuizInterface quizParams={quizParams} />;
};

const ProtectedQuizPage = () => (
    <ProtectedRoute>
        <QuizPage />
    </ProtectedRoute>
);

export default ProtectedQuizPage;