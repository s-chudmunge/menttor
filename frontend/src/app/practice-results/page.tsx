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
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  totalTime: number;
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
    timeSpent: number;
    hintUsed: boolean;
  }>;
  questions: Array<{
    id: string;
    type: string;
    question: string;
    correctAnswer: string;
    explanation: string;
    subtopicId: string;
    difficulty: string;
  }>;
  config: {
    subtopicIds: string[];
    questionCount: number;
    questionTypes: string[];
    timeLimit: number;
    hintsEnabled: boolean;
    roadmapId: number;
    subject: string;
    goal: string;
  };
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

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (!results) return null;

    const averageTimePerQuestion = results.totalTime / results.totalQuestions;
    const hintsUsed = results.answers.filter(a => a.hintUsed).length;
    const accuracy = (results.correctAnswers / results.totalQuestions) * 100;
    
    // Performance by question type
    const typePerformance: Record<string, { correct: number; total: number }> = {};
    results.answers.forEach((answer, index) => {
      const question = results.questions[index];
      const type = question.type;
      
      if (!typePerformance[type]) {
        typePerformance[type] = { correct: 0, total: 0 };
      }
      
      typePerformance[type].total++;
      if (answer.isCorrect) {
        typePerformance[type].correct++;
      }
    });

    // Performance by difficulty
    const difficultyPerformance: Record<string, { correct: number; total: number }> = {};
    results.answers.forEach((answer, index) => {
      const question = results.questions[index];
      const difficulty = question.difficulty;
      
      if (!difficultyPerformance[difficulty]) {
        difficultyPerformance[difficulty] = { correct: 0, total: 0 };
      }
      
      difficultyPerformance[difficulty].total++;
      if (answer.isCorrect) {
        difficultyPerformance[difficulty].correct++;
      }
    });

    return {
      accuracy,
      averageTimePerQuestion,
      hintsUsed,
      typePerformance,
      difficultyPerformance
    };
  }, [results]);

  // Identify strengths and weaknesses
  const analysis = useMemo(() => {
    if (!results || !performanceMetrics) return { strengths: [], weaknesses: [] };

    const strengths: Strength[] = [];
    const weaknesses: Weakness[] = [];

    // Analyze by question type
    Object.entries(performanceMetrics.typePerformance).forEach(([type, performance]) => {
      const score = (performance.correct / performance.total) * 100;
      const typeLabels: Record<string, string> = {
        mcq: 'Multiple Choice Questions',
        numerical: 'Numerical Problem Solving',
        caseStudy: 'Case Study Analysis',
        codeCompletion: 'Code Completion',
        debugging: 'Debugging Skills'
      };
      
      if (score >= 80) {
        strengths.push({
          category: typeLabels[type] || type,
          score,
          description: `Strong performance in ${typeLabels[type]?.toLowerCase() || type} with ${performance.correct}/${performance.total} correct`
        });
      } else if (score < 60) {
        weaknesses.push({
          category: typeLabels[type] || type,
          score,
          description: `Room for improvement in ${typeLabels[type]?.toLowerCase() || type}`,
          improvement: `Focus on practicing ${typeLabels[type]?.toLowerCase() || type} more frequently`
        });
      }
    });

    // Analyze by difficulty
    Object.entries(performanceMetrics.difficultyPerformance).forEach(([difficulty, performance]) => {
      const score = (performance.correct / performance.total) * 100;
      
      if (difficulty === 'hard' && score >= 70) {
        strengths.push({
          category: 'Advanced Problem Solving',
          score,
          description: `Excellent performance on challenging questions with ${performance.correct}/${performance.total} correct`
        });
      } else if (difficulty === 'easy' && score < 80) {
        weaknesses.push({
          category: 'Fundamental Concepts',
          score,
          description: 'Struggling with basic concepts',
          improvement: 'Review fundamental materials and practice basic problems'
        });
      }
    });

    // Time management analysis
    if (performanceMetrics.averageTimePerQuestion < (results.config.timeLimit * 60) / (results.totalQuestions * 2)) {
      strengths.push({
        category: 'Time Management',
        score: 90,
        description: 'Efficient time usage - completing questions quickly while maintaining accuracy'
      });
    } else if (performanceMetrics.averageTimePerQuestion > (results.config.timeLimit * 60) / results.totalQuestions) {
      weaknesses.push({
        category: 'Time Management',
        score: 40,
        description: 'Taking too much time per question',
        improvement: 'Practice timed exercises to improve speed while maintaining accuracy'
      });
    }

    // Hint usage analysis
    if (performanceMetrics.hintsUsed === 0 && performanceMetrics.accuracy > 80) {
      strengths.push({
        category: 'Independent Problem Solving',
        score: 95,
        description: 'Solved problems independently without needing hints'
      });
    } else if (performanceMetrics.hintsUsed > results.totalQuestions * 0.5) {
      weaknesses.push({
        category: 'Confidence & Knowledge',
        score: 50,
        description: 'Heavy reliance on hints',
        improvement: 'Build confidence by reviewing concepts before practicing'
      });
    }

    return { strengths, weaknesses };
  }, [results, performanceMetrics]);

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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  results.score >= 80 ? 'bg-green-100 dark:bg-green-900' : 
                  results.score >= 60 ? 'bg-yellow-100 dark:bg-yellow-900' : 
                  'bg-red-100 dark:bg-red-900'
                }`}>
                  {results.score >= 80 ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : results.score >= 60 ? (
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {results.score}%
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {results.correctAnswers}/{results.totalQuestions} correct • {formatTime(results.totalTime)}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Performance</div>
                <div className={`text-2xl font-bold ${getScoreColor(results.score)}`}>
                  {results.score >= 80 ? 'Excellent' : results.score >= 60 ? 'Good' : 'Needs Work'}
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6"
          >
            <div className="flex items-center mb-4">
              <Brain className="w-6 h-6 text-purple-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Performance Analysis</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          {performanceMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 mb-8"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <BarChart3 className="w-6 h-6 text-indigo-600 mr-3" />
                Performance by Question Type
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(performanceMetrics.typePerformance).map(([type, performance]) => {
                  const score = (performance.correct / performance.total) * 100;
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
                      className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {typeLabels[type] || type}
                      </h4>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {performance.correct}/{performance.total} correct
                        </span>
                        <span className={`font-bold ${getScoreColor(score)}`}>
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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8"
          >
            <div className="flex items-center mb-6">
              <BarChart3 className="w-6 h-6 text-indigo-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Question Review</h3>
            </div>
            
            <div className="space-y-4">
              {results.answers.map((answer, index) => {
                const question = results.questions[index];
                return (
                  <div 
                    key={answer.questionId}
                    className={`p-4 rounded-lg border ${
                      answer.isCorrect 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        {answer.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mr-2" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">
                          Question {index + 1}
                        </span>
                      </div>
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(answer.timeSpent)}
                        {answer.hintUsed && <span className="ml-2">💡</span>}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Your answer:</strong> {answer.answer}
                    </p>
                    
                    {!answer.isCorrect && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Expected:</strong> {question.correctAnswer}
                      </p>
                    )}
                    
                    <div className={`text-sm p-2 rounded ${
                      answer.isCorrect 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                    }`}>
                      <strong>AI Feedback:</strong> {question.explanation}
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
            className="flex gap-4 justify-center"
          >
            <Link
              href="/journey"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Continue Learning</span>
            </Link>
            
            <button
              onClick={() => {
                const params = new URLSearchParams();
                params.append('config', JSON.stringify(results.config));
                router.push(`/practice-session?${params.toString()}`);
              }}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors flex items-center space-x-2"
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