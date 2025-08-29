'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Trophy,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Brain,
  Lightbulb,
  RefreshCw,
  Home,
  Download
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';

interface PracticeResults {
  session_id?: number;
  final_score: number;
  correct_answers: number;
  total_questions: number;
  total_time: number;
  hints_used: number;
  strengths: Array<{
    category: string;
    score: number;
    description: string;
  }>;
  weaknesses: Array<{
    category: string;
    score: number;
    description: string;
    improvement_suggestion: string;
  }>;
  question_results: Array<{
    question_id: number;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
    time_spent: number;
    hint_used: boolean;
  }>;
  performance_by_type: Record<string, { correct: number; total: number; percentage: number }>;
  performance_by_difficulty: Record<string, { correct: number; total: number; percentage: number }>;
  completed_at: string;
  // Legacy fields for backward compatibility
  score?: number;
  answers?: any[];
  questions?: any[];
  config?: any;
}

interface Strength {
  category: string;
  score: number;
  description: string;
}

interface Weakness {
  category: string;
  score: number;
  description: string;
  improvement: string;
}

const PracticeResultsPage = () => {
  const router = useRouter();
  const [results, setResults] = useState<PracticeResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedResults = sessionStorage.getItem('practiceResults');
    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults);
        setResults(parsedResults);
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing results:', error);
        router.push('/journey');
      }
    } else {
      router.push('/journey');
    }
  }, [router]);

  // Calculate performance metrics (use backend data when available)
  const performanceMetrics = useMemo(() => {
    if (!results) return null;

    // Use backend performance data if available, otherwise fallback to local calculation
    if (results.performance_by_type && results.performance_by_difficulty) {
      return {
        accuracy: results.final_score,
        averageTimePerQuestion: results.total_time / results.total_questions,
        hintsUsed: results.hints_used,
        typePerformance: results.performance_by_type,
        difficultyPerformance: results.performance_by_difficulty
      };
    }

    // Legacy fallback for old data format
    const totalQuestions = results.total_questions || results.questions?.length || 0;
    const correctAnswers = results.correct_answers || results.answers?.filter((a: any) => a.isCorrect).length || 0;
    const totalTime = results.total_time || 0;
    const hintsUsed = results.hints_used || results.answers?.filter((a: any) => a.hintUsed).length || 0;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const averageTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;

    return {
      accuracy,
      averageTimePerQuestion,
      hintsUsed,
      typePerformance: {},
      difficultyPerformance: {}
    };
  }, [results]);

  // Use backend analysis when available, fallback to local calculation
  const analysis = useMemo(() => {
    if (!results) return { strengths: [], weaknesses: [] };

    // Use backend AI analysis if available
    if (results.strengths && results.weaknesses) {
      return {
        strengths: results.strengths,
        weaknesses: results.weaknesses.map(w => ({
          ...w,
          improvement: w.improvement_suggestion
        }))
      };
    }

    // Legacy fallback for old data format
    return { strengths: [], weaknesses: [] };
  }, [results]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700';
    return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700';
  };

  // Normalize results data to handle both backend and legacy formats
  const normalizedResults = useMemo(() => {
    if (!results) return null;
    
    return {
      finalScore: results.final_score ?? results.score ?? 0,
      correctAnswers: results.correct_answers ?? results.correctAnswers ?? 0,
      totalQuestions: results.total_questions ?? results.totalQuestions ?? 0,
      totalTime: results.total_time ?? results.totalTime ?? 0,
      hintsUsed: results.hints_used ?? results.answers?.filter((a: any) => a.hintUsed).length ?? 0,
      questionResults: results.question_results ?? results.answers ?? [],
      strengths: results.strengths ?? [],
      weaknesses: results.weaknesses ?? [],
      performanceByType: results.performance_by_type ?? {},
      performanceByDifficulty: results.performance_by_difficulty ?? {}
    };
  }, [results]);

  if (isLoading || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <BarChart3 className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Analyzing Results
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Generating your performance report...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Trophy className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Practice Results & Analysis
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Detailed breakdown of your performance
            </p>
          </motion.div>

          {/* Simplified Score Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${
                  (normalizedResults?.finalScore || 0) >= 80 ? 'bg-green-100 dark:bg-green-900' : 
                  (normalizedResults?.finalScore || 0) >= 60 ? 'bg-yellow-100 dark:bg-yellow-900' : 
                  'bg-red-100 dark:bg-red-900'
                }`}>
                  {(normalizedResults?.finalScore || 0) >= 80 ? (
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                  ) : (normalizedResults?.finalScore || 0) >= 60 ? (
                    <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                  ) : (
                    <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                  )}
                </div>
                
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {Math.round(normalizedResults?.finalScore || 0)}%
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {normalizedResults?.correctAnswers}/{normalizedResults?.totalQuestions} correct • {formatTime(normalizedResults?.totalTime || 0)}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Performance</div>
                <div className={`text-xl sm:text-2xl font-bold ${getScoreColor(normalizedResults?.finalScore || 0)}`}>
                  {(normalizedResults?.finalScore || 0) >= 80 ? 'Excellent' : (normalizedResults?.finalScore || 0) >= 60 ? 'Good' : 'Needs Work'}
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6"
          >
            <div className="flex items-center mb-4">
              <Brain className="w-6 h-6 text-purple-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Performance Analysis</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Strengths */}
              <div>
                <div className="flex items-center mb-3">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">What You Did Well</h4>
                </div>
                <div className="space-y-2">
                  {analysis.strengths.length > 0 ? (
                    analysis.strengths.slice(0, 3).map((strength, index) => (
                      <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                          {strength.category}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          {strength.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <p className="text-sm">Continue practicing to build strengths</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Areas to Improve */}
              <div>
                <div className="flex items-center mb-3">
                  <Target className="w-4 h-4 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Focus Areas</h4>
                </div>
                <div className="space-y-2">
                  {analysis.weaknesses.length > 0 ? (
                    analysis.weaknesses.slice(0, 3).map((weakness, index) => (
                      <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                          {weakness.category}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          {weakness.improvement}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <Trophy className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <p className="text-sm">Great performance overall!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Performance by Type */}
          {normalizedResults && Object.keys(normalizedResults.performanceByType).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 mb-6 sm:mb-8"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <BarChart3 className="w-6 h-6 text-indigo-600 mr-3" />
                Performance by Question Type
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {Object.entries(normalizedResults?.performanceByType || {}).map(([type, performance]) => {
                  const score = performance.percentage || ((performance.correct / performance.total) * 100);
                  const typeLabels: Record<string, string> = {
                    mcq: 'Multiple Choice',
                    numerical: 'Numerical',
                    caseStudy: 'Case Study',
                    codeCompletion: 'Code Completion',
                    debugging: 'Debugging'
                  };
                  
                  return (
                    <div
                      key={type}
                      className="p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
                        {typeLabels[type] || type}
                      </h4>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {performance.correct}/{performance.total} correct
                        </span>
                        <span className={`font-bold text-sm sm:text-base ${getScoreColor(score)}`}>
                          {Math.round(score)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Question-by-Question Review with AI Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8"
          >
            <div className="flex items-center mb-6">
              <BarChart3 className="w-6 h-6 text-indigo-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Question Review</h3>
            </div>
            
            <div className="space-y-4">
              {(results.question_results || results.answers || []).map((questionResult: any, index: number) => {
                // Handle both new backend format and legacy format
                const isBackendFormat = 'question_id' in questionResult;
                const answer = isBackendFormat ? questionResult : questionResult;
                const question = isBackendFormat ? null : results.questions?.[index];
                
                return (
                  <div 
                    key={isBackendFormat ? questionResult.question_id : questionResult.questionId || index}
                    className={`p-3 sm:p-4 rounded-lg border ${
                      (isBackendFormat ? questionResult.is_correct : questionResult.isCorrect)
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 space-y-1 sm:space-y-0">
                      <div className="flex items-center">
                        {(isBackendFormat ? questionResult.is_correct : questionResult.isCorrect) ? (
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                          Question {index + 1}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3 mr-1 sm:hidden" />
                        <span>{formatTime(isBackendFormat ? questionResult.time_spent : questionResult.timeSpent)}</span>
                        {(isBackendFormat ? questionResult.hint_used : questionResult.hintUsed) && <span className="ml-2">💡</span>}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Your answer:</strong> 
                        <span className="ml-1 break-words">
                          {isBackendFormat ? questionResult.user_answer : questionResult.answer}
                        </span>
                      </p>
                      
                      {!(isBackendFormat ? questionResult.is_correct : questionResult.isCorrect) && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Expected:</strong> 
                          <span className="ml-1 break-words">
                            {isBackendFormat ? questionResult.correct_answer : question?.correctAnswer}
                          </span>
                        </p>
                      )}
                      
                      <div className={`text-sm p-3 rounded-lg ${
                        (isBackendFormat ? questionResult.is_correct : questionResult.isCorrect)
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                      }`}>
                        <strong>AI Feedback:</strong> 
                        <span className="ml-1">
                          {isBackendFormat ? questionResult.explanation : question?.explanation || 'Detailed feedback will be available in future sessions.'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Simple Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
          >
            <Link
              href="/journey"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 min-h-[48px] w-full sm:w-auto"
            >
              <Home className="w-4 h-4" />
              <span>Continue Learning</span>
            </Link>
            
            <button
              onClick={() => {
                // Use legacy config if available, otherwise create basic config
                const config = results.config || {
                  subtopicIds: ['general'],
                  questionCount: results.total_questions || 20,
                  questionTypes: ['mcq'],
                  timeLimit: 30,
                  hintsEnabled: true,
                  roadmapId: 1,
                  subject: 'General',
                  goal: 'Practice'
                };
                const params = new URLSearchParams();
                params.append('config', JSON.stringify(config));
                router.push(`/practice-session?${params.toString()}`);
              }}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 min-h-[48px] w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default PracticeResultsPage;