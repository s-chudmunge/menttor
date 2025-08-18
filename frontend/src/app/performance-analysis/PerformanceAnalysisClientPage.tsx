'use client';

// Enhanced Performance Analysis with Behavioral Insights
import BehavioralPerformanceAnalysisClientPage from './BehavioralPerformanceAnalysisClientPage';

interface PerformanceAnalysisClientPageProps {
  performanceDetails: any;
  error: string | null;
}

// Wrapper component that maintains the same interface but uses enhanced behavioral features
const PerformanceAnalysisClientPage: React.FC<PerformanceAnalysisClientPageProps> = ({ 
  performanceDetails, 
  error 
}) => {
  return <BehavioralPerformanceAnalysisClientPage performanceDetails={performanceDetails} error={error} />;
};

export default PerformanceAnalysisClientPage;