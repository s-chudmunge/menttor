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

          {/* Score Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl border p-8 mb-8 text-center ${getScoreBg(results.score)}`}
          >
            <div className="flex items-center justify-center mb-4">
              {results.score >= 80 ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : results.score >= 60 ? (
                <AlertCircle className="w-12 h-12 text-yellow-600" />
              ) : (
                <XCircle className="w-12 h-12 text-red-600" />
              )}
            </div>
            
            <h2 className="text-6xl font-bold mb-2 text-gray-900 dark:text-white">
              {results.score}%
            </h2>
            
            <p className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-4">
              {results.correctAnswers} out of {results.totalQuestions} questions correct
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Time</p>
                <p className="font-bold text-gray-900 dark:text-white">{formatTime(results.totalTime)}</p>
              </div>
              
              <div className="text-center">
                <Target className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
                <p className="font-bold text-gray-900 dark:text-white">{results.score}%</p>
              </div>
              
              <div className="text-center">
                <Brain className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Time/Question</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {formatTime(Math.round(results.totalTime / results.totalQuestions))}
                </p>
              </div>
              
              <div className="text-center">
                <Lightbulb className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Hints Used</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {performanceMetrics?.hintsUsed || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Strengths */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
            >
              <div className="flex items-center mb-6">
                <TrendingUp className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Strengths ({analysis.strengths.length})
                </h3>
              </div>
              
              <div className="space-y-4">
                {analysis.strengths.length > 0 ? (
                  analysis.strengths.map((strength, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-green-800 dark:text-green-200">
                          {strength.category}
                        </h4>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {Math.round(strength.score)}%
                        </span>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {strength.description}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Keep practicing to identify your strengths!</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Weaknesses */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
            >
              <div className="flex items-center mb-6">
                <TrendingDown className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Areas for Improvement ({analysis.weaknesses.length})
                </h3>
              </div>
              
              <div className="space-y-4">
                {analysis.weaknesses.length > 0 ? (
                  analysis.weaknesses.map((weakness, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-red-800 dark:text-red-200">
                          {weakness.category}
                        </h4>
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          {Math.round(weakness.score)}%
                        </span>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                        {weakness.description}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        💡 {weakness.improvement}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Great job! No major areas for improvement identified.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

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

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Link
              href="/journey"
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Home className="w-5 h-5" />
              <span>Back to Journey</span>
            </Link>
            
            <button
              onClick={() => {
                // Create a new practice session with similar config
                const newConfig = {
                  ...results.config,
                  questionCount: Math.min(results.config.questionCount + 5, 150)
                };
                const params = new URLSearchParams();
                params.append('config', JSON.stringify(newConfig));
                window.open(`/practice-session?${params.toString()}`, '_blank');
              }}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold rounded-lg transition-all duration-200"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Practice Again</span>
            </button>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default PracticeResultsPage;