// @ts-nocheck
'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { 
    CheckCircle, 
    XCircle, 
    Home,
    ChevronDown,
    ChevronUp,
    BookOpen,
    Target,
    BarChart3,
    Brain
} from 'lucide-react';
import { api } from '@/lib/api';
import Logo from '../../../../components/Logo';
import ProfileDropdown from '../../../components/ProfileDropdown';
import Link from 'next/link';

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
    
    const [showDetails, setShowDetails] = useState(false);

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

    const getOptionText = (questionId: number, optionId: number) => {
        const question = quiz?.questions.find(q => q.id === questionId);
        if (!question) return 'N/A';
        const option = question.options.find(o => o.id === optionId);
        return option ? option.text : 'N/A';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading results...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to Load Results</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error.message}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Results Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">We couldn't find results for this quiz.</p>
                    <button 
                        onClick={() => router.push('/journey')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Back to Journey
                    </button>
                </div>
            </div>
        );
    }

    const correctAnswers = results.question_results.filter(qr => qr.is_correct).length;
    const totalQuestions = results.question_results.length;
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {/* Navigation Header */}
            <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Logo />
                        </div>
                        
                        {/* Navigation */}
                        <nav className="hidden lg:flex items-center space-x-1">
                            <Link 
                                href="/" 
                                className="flex items-center space-x-2 px-3 py-2 font-medium transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                <Home className="w-4 h-4" />
                                <span className="text-sm">Home</span>
                            </Link>
                            <Link 
                                href="/explore" 
                                className="flex items-center space-x-2 px-3 py-2 font-medium transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                <BookOpen className="w-4 h-4" />
                                <span className="text-sm">Explore</span>
                            </Link>
                            <Link 
                                href="/journey" 
                                className="flex items-center space-x-2 px-3 py-2 font-medium transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                <Target className="w-4 h-4" />
                                <span className="text-sm">Journey</span>
                            </Link>
                            <Link 
                                href="/performance-analysis" 
                                className="flex items-center space-x-2 px-3 py-2 font-medium transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span className="text-sm">Performance</span>
                            </Link>
                        </nav>

                        {/* Profile */}
                        <ProfileDropdown />
                    </div>
                </div>
            </div>
            
            <div className="max-w-2xl mx-auto px-4 py-12">
                {/* Main Score Display */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white text-xl font-bold mb-3">
                        {scorePercentage}%
                    </div>
                    <h1 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                        {scorePercentage >= 70 ? 'Well Done!' : 'Keep Learning!'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {correctAnswers} out of {totalQuestions} questions correct
                    </p>
                </div>

                {/* Primary Actions */}
                <div className="mb-8 space-y-3">
                    <button
                        onClick={() => {
                            sessionStorage.setItem('returning-from-quiz', 'true');
                            router.push('/journey');
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Target className="w-4 h-4" />
                        Continue Journey
                    </button>
                    
                    {/* Review Learn Content Button */}
                    {(searchParams.get('subtopic_id') && searchParams.get('subtopic')) && (
                        <Link
                            href={`/learn?subtopic=${encodeURIComponent(searchParams.get('subtopic') || '')}&subtopic_id=${searchParams.get('subtopic_id')}&roadmap_id=${searchParams.get('roadmap_id') || '1'}`}
                            className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 py-2 px-4 font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <BookOpen className="w-4 h-4" />
                            Review Learn Content
                        </Link>
                    )}
                </div>

                {/* Question Details Toggle */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                        <span className="font-medium text-gray-900 dark:text-white">
                            Review Questions
                        </span>
                        {showDetails ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                    </button>

                    {showDetails && (
                        <div className="mt-4 space-y-4">
                            {results.question_results.map((qr, index) => {
                                const question = quiz?.questions.find(q => q.id === qr.question_id);
                                
                                return (
                                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                                qr.is_correct ? 'bg-green-500' : 'bg-red-500'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className={`inline-flex items-center gap-1 text-sm font-medium mb-2 ${
                                                    qr.is_correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                    {qr.is_correct ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4" />
                                                            Correct
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-4 h-4" />
                                                            Incorrect
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-gray-900 dark:text-gray-100 mb-3">
                                                    <MathText>{question?.question_text || 'Question not available'}</MathText>
                                                </div>
                                                
                                                <div className="text-sm">
                                                    <div className="mb-2">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">Your answer: </span>
                                                        <span className="text-gray-900 dark:text-gray-100">
                                                            <MathText>{getOptionText(qr.question_id, qr.selected_answer_id)}</MathText>
                                                        </span>
                                                    </div>
                                                    
                                                    {!qr.is_correct && (
                                                        <div className="mb-2">
                                                            <span className="font-medium text-green-700 dark:text-green-300">Correct answer: </span>
                                                            <span className="text-gray-900 dark:text-gray-100">
                                                                <MathText>{getOptionText(qr.question_id, qr.correct_answer_id)}</MathText>
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {qr.explanation && (
                                                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                                            <div className="text-blue-900 dark:text-blue-100 text-sm">
                                                                <MathText>{qr.explanation}</MathText>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const QuizResultsPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading results...</p>
                </div>
            </div>
        }>
            <QuizResultsContent />
        </Suspense>
    );
};

export default QuizResultsPage;