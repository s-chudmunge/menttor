// @ts-nocheck
'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import { useBehavioralContext } from '@/app/context/BehavioralContext';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { 
    CheckCircle, 
    XCircle, 
    Trophy, 
    Star, 
    Brain, 
    Clock, 
    Target,
    ArrowRight,
    Home,
    RotateCcw,
    Share2,
    TrendingUp,
    Award,
    Zap,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { api } from '@/lib/api';

// Component to render math-enabled text
const MathText: React.FC<{ children: string; className?: string }> = ({ children, className = '' }) => {
    return (
        <div className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    div: ({ className, children, ...props }) => {
                        if (className === 'math math-display') {
                            return <div className="math-display my-2 text-center overflow-x-auto" {...props}>{children}</div>;
                        }
                        return <div className={className} {...props}>{children}</div>;
                    },
                    span: ({ className, children, ...props }) => {
                        if (className === 'math math-inline') {
                            return <span className="math-inline" {...props}>{children}</span>;
                        }
                        return <span className={className} {...props}>{children}</span>;
                    },
                    p: ({ children }) => <span>{children}</span>,
                }}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
};

const QuizResultsContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const attemptId = searchParams.get('attempt_id');
    const { user } = useAuth();
    const { showNotification } = useBehavioralContext();
    
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);

    const { data: results, isLoading, error } = useQuery({
        queryKey: ['quizResult', attemptId],
        queryFn: async () => {
            if (!attemptId || !user) return null;
            const response = await api.get(`/quizzes/results/attempt/${attemptId}`);
            return response.data;
        },
        enabled: !!attemptId && !!user,
    });

    const { data: quiz } = useQuery({
        queryKey: ['quiz', results?.quiz_id],
        queryFn: async () => {
            if (!results?.quiz_id || !user) return null;
            const response = await api.get(`/quizzes/${results.quiz_id}`);
            return response.data;
        },
        enabled: !!results?.quiz_id && !!user,
    });

    // Trigger celebration for high scores
    useEffect(() => {
        if (results && results.score >= 80) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3000);
        }
    }, [results]);

    const getOptionText = (questionId: number, optionId: number) => {
        const question = quiz?.questions.find(q => q.id === questionId);
        if (!question) return 'N/A';
        const option = question.options.find(o => o.id === optionId);
        return option ? option.text : 'N/A';
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'from-green-500 to-emerald-600';
        if (score >= 80) return 'from-blue-500 to-indigo-600';
        if (score >= 70) return 'from-yellow-500 to-orange-500';
        if (score >= 60) return 'from-orange-500 to-red-500';
        return 'from-red-500 to-pink-600';
    };

    const getScoreMessage = (score: number) => {
        if (score >= 90) return { message: 'Outstanding! 🏆', subtext: 'You\'ve mastered this topic!' };
        if (score >= 80) return { message: 'Excellent Work! ⭐', subtext: 'Great understanding of the concepts!' };
        if (score >= 70) return { message: 'Good Job! 👍', subtext: 'You\'re getting there!' };
        if (score >= 60) return { message: 'Keep Going! 💪', subtext: 'Room for improvement!' };
        return { message: 'Keep Practicing! 📚', subtext: 'Don\'t give up, you\'ll get it!' };
    };

    const handleShare = async () => {
        const shareText = `Just scored ${results.score.toFixed(1)}% on my quiz! 🎯`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Quiz Results',
                    text: shareText,
                });
            } catch (err) {
                // Fallback to clipboard
                navigator.clipboard.writeText(shareText);
                showNotification({
                    type: 'session',
                    title: 'Copied to Clipboard!',
                    message: 'Share text copied to clipboard',
                    duration: 2000,
                    priority: 'low'
                });
            }
        } else {
            navigator.clipboard.writeText(shareText);
            showNotification({
                type: 'session',
                title: 'Copied to Clipboard!',
                message: 'Share text copied to clipboard',
                duration: 2000,
                priority: 'low'
            });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"
                    />
                    <Brain className="w-8 h-8 text-indigo-600 absolute inset-0 m-auto" />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-8">
                        Loading Your Results
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Calculating performance metrics...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Failed to Load Results</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error.message}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md text-center">
                    <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No Results Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">We couldn't find results for this quiz attempt.</p>
                    <button 
                        onClick={() => router.push('/journey')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Back to Journey
                    </button>
                </div>
            </div>
        );
    }

    const scoreMessage = getScoreMessage(results.score);
    const correctAnswers = results.question_results.filter(qr => qr.is_correct).length;
    const totalQuestions = results.question_results.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Celebration Animation */}
            <AnimatePresence>
                {showCelebration && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-6xl"
                        >
                            🎉
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="flex items-center justify-center mb-4">
                        <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                            Quiz Complete!
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Here's how you performed
                    </p>
                </motion.div>

                {/* Score Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-8 border border-gray-200/50 dark:border-gray-700/50"
                >
                    <div className="text-center mb-6">
                        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r ${getScoreColor(results.score)} mb-4 shadow-lg`}>
                            <span className="text-3xl font-bold text-white">
                                {results.score.toFixed(0)}%
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {scoreMessage.message}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            {scoreMessage.subtext}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 text-center border border-green-200/50 dark:border-green-700/50">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                {correctAnswers}
                            </div>
                            <div className="text-sm text-green-600 dark:text-green-400">
                                Correct Answers
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 text-center border border-blue-200/50 dark:border-blue-700/50">
                            <Target className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {totalQuestions}
                            </div>
                            <div className="text-sm text-blue-600 dark:text-blue-400">
                                Total Questions
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 text-center border border-purple-200/50 dark:border-purple-700/50">
                            <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                {((correctAnswers / totalQuestions) * 100).toFixed(0)}%
                            </div>
                            <div className="text-sm text-purple-600 dark:text-purple-400">
                                Accuracy Rate
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => {
                                sessionStorage.setItem('returning-from-quiz', 'true');
                                router.push('/journey');
                            }}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        >
                            <Home className="w-5 h-5" />
                            Continue Journey
                        </button>
                        
                        <button
                            onClick={handleShare}
                            className="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl"
                        >
                            <Share2 className="w-5 h-5" />
                            Share Results
                        </button>
                    </div>
                </motion.div>

                {/* Question Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-700/50"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Brain className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                            Question Breakdown
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            Detailed Review
                        </div>
                    </div>

                    <div className="space-y-4">
                        {results.question_results.map((qr, index) => {
                            const question = quiz?.questions.find(q => q.id === qr.question_id);
                            const isExpanded = expandedQuestion === index;
                            
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                    className={`border rounded-2xl transition-all duration-200 ${
                                        qr.is_correct 
                                            ? 'border-green-200 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
                                            : 'border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
                                    }`}
                                >
                                    <button
                                        onClick={() => setExpandedQuestion(isExpanded ? null : index)}
                                        className="w-full p-6 text-left transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-2xl"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                                        qr.is_correct ? 'bg-green-500' : 'bg-red-500'
                                                    }`}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {qr.is_correct ? (
                                                            <>
                                                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                                <span className="font-semibold text-green-700 dark:text-green-300">Correct</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                                <span className="font-semibold text-red-700 dark:text-red-300">Incorrect</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-gray-900 dark:text-gray-100 font-medium">
                                                    <MathText>{question?.question_text || 'Question not found'}</MathText>
                                                </div>
                                            </div>
                                            <div className="ml-4 flex-shrink-0">
                                                {isExpanded ? (
                                                    <ChevronUp className="w-6 h-6 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-6 h-6 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="px-6 pb-6 border-t border-gray-200/50 dark:border-gray-600/50"
                                            >
                                                <div className="pt-4 space-y-4">
                                                    <div className="bg-white/80 dark:bg-gray-700/50 rounded-xl p-4">
                                                        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                            <span className={`w-3 h-3 rounded-full ${qr.is_correct ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                            Your Answer:
                                                        </h5>
                                                        <div className="text-gray-900 dark:text-gray-100">
                                                            <MathText>{getOptionText(qr.question_id, qr.selected_answer_id)}</MathText>
                                                        </div>
                                                    </div>

                                                    {!qr.is_correct && (
                                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
                                                            <h5 className="font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                                                                <CheckCircle className="w-4 h-4" />
                                                                Correct Answer:
                                                            </h5>
                                                            <div className="text-green-900 dark:text-green-100">
                                                                <MathText>{getOptionText(qr.question_id, qr.correct_answer_id)}</MathText>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {qr.explanation && (
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                                                            <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                                                                <Brain className="w-4 h-4" />
                                                                Explanation:
                                                            </h5>
                                                            <div className="text-blue-900 dark:text-blue-100">
                                                                <MathText>{qr.explanation}</MathText>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

const QuizResultsPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-600 dark:text-gray-400">Loading quiz results...</p>
                </div>
            </div>
        }>
            <QuizResultsContent />
        </Suspense>
    );
};

export default QuizResultsPage;