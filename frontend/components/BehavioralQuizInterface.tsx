'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import { useBehavioralContext } from '@/app/context/BehavioralContext';
import { useAIState } from '@/store/aiState';
import { useRouter } from 'next/navigation';
import { useQuizIntegrity } from '../src/hooks/useQuizIntegrity';
import { useEloSystem, useFocusMode } from '../src/hooks/useBehavioral';
import { api } from '@/lib/api';
import { AxiosError } from 'axios';
import { formatQuizQuestion } from '../src/app/journey/utils/textFormatting';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Link from 'next/link';
import Logo from './Logo';
import ProfileDropdown from '../src/components/ProfileDropdown';
import { 
  Clock, Brain, CheckCircle, XCircle, 
  AlertTriangle, Home, BookOpen, Target, BarChart3
} from 'lucide-react';

interface Question {
    id: number;
    question_text: string;
    options: { id: string; text: string }[];
    concept_tags?: string[];
    difficulty_level?: number;
}

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
        learn_content_context?: any;
    };
}

const BehavioralQuizInterface: React.FC<QuizInterfaceProps> = ({ quizParams }) => {
    const { user, loading } = useAuth();
    const { } = useBehavioralContext();
    const router = useRouter();
    
    // State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number | string }>({});
    const [answerFeedback, setAnswerFeedback] = useState<{ [key: number]: { correct: boolean; explanation?: string } }>({});
    const [selectedTimeOption, setSelectedTimeOption] = useState<number>(quizParams.time_limit ? quizParams.time_limit / 60 : 5);
    const [timeLeft, setTimeLeft] = useState(quizParams.time_limit || selectedTimeOption * 60);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sessionToken, setSessionToken] = useState<string | null>(null);
    const [quizStarted, setQuizStarted] = useState(false);
    
    // Behavioral state
    const [confidenceLevel, setConfidenceLevel] = useState<number>(3);
    const [responseStartTime, setResponseStartTime] = useState<Date | null>(null);
    const [difficulty, setDifficulty] = useState<'adaptive' | 'fixed'>('adaptive');

    const queryClient = useQueryClient();
    const { startGeneration, endGeneration } = useAIState();
    const { eloRatings, updateElo } = useEloSystem();
    const { isEnabled: focusMode, toggleFocus } = useFocusMode();

    const QUIZ_STATE_KEY = `quizState-${quizParams.subtopic_id}`;

    // Quiz integrity

    // Create a ref to store the exitFullscreen function
    const exitFullscreenRef = useRef<(() => Promise<void>) | null>(null);

    const handleViolation = useCallback((type: 'fullscreen' | 'visibility') => {
        // Simplified - no violation tracking
    }, []);

    const { requestFullscreen, exitFullscreen, fullscreenError } = useQuizIntegrity({ onViolation: handleViolation });
    
    // Update the ref with the current exitFullscreen function
    useEffect(() => {
        exitFullscreenRef.current = exitFullscreen;
    }, [exitFullscreen]);

    // Start quiz with session transition
    const startQuiz = useCallback(async () => {
        setQuizStarted(true);
        setResponseStartTime(new Date());
    }, []);

    // Handle answer selection with immediate feedback
    const handleAnswerSelect = useCallback(async (questionId: number, answerId: string | number, isCorrect?: boolean) => {
        setSelectedAnswers(prev => ({ ...prev, [questionId]: answerId }));
        
        const question = questions.find(q => q.id === questionId);
        
        if (isCorrect !== undefined && question) {
            // Update Elo for each concept tag
            if (question.concept_tags) {
                question.concept_tags.forEach(concept => {
                    updateElo({ concept, outcome: isCorrect ? 1 : 0, difficulty: question.difficulty_level || 1200 });
                });
            }
            
            // Store feedback
            setAnswerFeedback(prev => ({
                ...prev,
                [questionId]: { correct: isCorrect }
            }));
            
        }
        
        // Reset response timer for next question
        setTimeout(() => setResponseStartTime(new Date()), 100);
    }, [
        responseStartTime, 
        questions, 
        updateElo
    ]);

    // Enhanced quiz submission with full behavioral integration
    const mutation = useMutation({
        mutationFn: async (isAutoSubmit: boolean) => {
            // Quiz completion tracking
            
            return api.post('/quizzes/submit', {
                session_token: sessionToken,
                answers: questions.map(q => ({
                    question_id: q.id,
                    selected_option_id: selectedAnswers[q.id] || null,
                    response_time: responseStartTime ? 
                        (new Date().getTime() - responseStartTime.getTime()) / 1000 : null,
                    confidence_level: confidenceLevel
                })),
                violations: { fullscreen: 0, visibility: 0 },
                final_action: isAutoSubmit ? 'auto-submit' : 'manual-submit',
            });
        },
        onSuccess: async (response) => {
            const result = response.data;
            const score = Math.round((result.score || 0) / (result.total_questions || 1) * 100);
            
            // Simple completion tracking
            console.log('Quiz completed with score:', score);
            
            
            
            // Invalidate queries and navigate
            await queryClient.invalidateQueries({ queryKey: ['sessionSummary'] });
            await queryClient.invalidateQueries({ queryKey: ['quizResults'] });
            await queryClient.invalidateQueries({ queryKey: ['progress'] });
            await queryClient.invalidateQueries({ queryKey: ['behavioral-stats'] });
            
            sessionStorage.removeItem(QUIZ_STATE_KEY);
            router.push(`/quiz/results?attempt_id=${result.attempt_id}`);
        },
        onError: (err: any) => {
            setError(err.message || 'An unknown error occurred during submission.');
            setIsSubmitting(false);
        },
    });

    const handleSubmit = useCallback((isAutoSubmit = false) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        mutation.mutate(isAutoSubmit);
    }, [isSubmitting, mutation]);

    // Adaptive quiz generation based on user's Elo ratings
    const fetchQuizQuestions = async () => {
        setIsLoading(true);
        setError(null);
        startGeneration(quizParams.model);
        
        try {
            // Get user's current Elo for this subject area to adapt difficulty
            const userElo = eloRatings[quizParams.subject] || 1200;
            const adaptiveDifficulty = Math.max(800, Math.min(1600, userElo));
            
            // Convert learn content to text context if available
            let learnContentText = null;
            if (quizParams.learn_content_context?.content) {
                try {
                    learnContentText = quizParams.learn_content_context.content
                        .map((block: any) => {
                            if (block.type === 'paragraph') return block.data.text;
                            if (block.type === 'heading') return block.data.text;
                            return '';
                        })
                        .filter((text: string) => text.trim())
                        .join('\n\n');
                } catch (e) {
                    console.log('Could not parse learn content context:', e);
                }
            }

            const requestPayload = {
                sub_topic_title: quizParams.subtopic || "Learning Topic",
                sub_topic_id: quizParams.subtopic_id,
                subject: quizParams.subject || "General Subject", 
                goal: quizParams.goal || "Learn new concepts",
                time_value: selectedTimeOption,
                time_unit: "minutes",
                model: quizParams.model || "vertexai:gemini-2.5-flash-lite",
                module_title: quizParams.module_title || "Learning Module",
                topic_title: quizParams.topic_title || "Topic",
                num_questions: 5,
                learn_content_context: learnContentText,
                // Behavioral enhancements
                difficulty_target: difficulty === 'adaptive' ? adaptiveDifficulty : 1200,
                user_elo: userElo,
                focus_mode: false,
                previous_performance: Object.keys(eloRatings).length > 0 ? 'experienced' : 'new_learner'
            };
            
            console.log('Behavioral quiz generation:', { userElo, adaptiveDifficulty, requestPayload });
            
            const response = await api.post('/quizzes/generate_quiz', requestPayload);
            const data = response.data;

            const formattedQuestions = data.questions.map((q: any) => ({
                id: q.id,
                question_text: q.question_text,
                options: q.options.map((opt: any) => ({ id: opt.id, text: opt.text })),
                concept_tags: q.concept_tags || [quizParams.subject],
                difficulty_level: q.difficulty_level || adaptiveDifficulty,
            }));
            
            setQuestions(formattedQuestions);
            setSessionToken(data.session_token);
            
            // Difficulty adaptation handled silently

        } catch (err: any) {
            console.error('Quiz generation error:', err);
            setError(err.response?.data?.detail || err.message || 'Failed to generate quiz');
        } finally {
            setIsLoading(false);
            endGeneration();
        }
    };

    // Timer with behavioral feedback
    useEffect(() => {
        if (!quizStarted || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                const newTime = prev - 1;
                
                // Time tracking without nudges
                
                if (newTime <= 0) {
                    // Exit fullscreen before auto-submit due to timeout
                    if (exitFullscreenRef.current) {
                        exitFullscreenRef.current().then(() => handleSubmit(true));
                    } else {
                        handleSubmit(true);
                    }
                }
                return newTime;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [quizStarted, timeLeft, handleSubmit]);

    // Initialize quiz
    useEffect(() => {
        const savedState = sessionStorage.getItem(QUIZ_STATE_KEY);
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            setQuestions(parsedState.questions);
            setCurrentQuestionIndex(parsedState.currentQuestionIndex);
            setSelectedAnswers(parsedState.selectedAnswers);
            setTimeLeft(parsedState.timeLeft);
            setQuizStarted(parsedState.quizStarted);
            setSessionToken(parsedState.sessionToken);
            setIsLoading(false);
        } else if (!loading && user) {
            fetchQuizQuestions();
        }
    }, [quizParams.subtopic_id, user, loading]);

    // Save state periodically
    useEffect(() => {
        if (questions.length > 0) {
            sessionStorage.setItem(QUIZ_STATE_KEY, JSON.stringify({
                questions,
                currentQuestionIndex,
                selectedAnswers,
                timeLeft,
                quizStarted,
                sessionToken
            }));
        }
    }, [questions, currentQuestionIndex, selectedAnswers, timeLeft, quizStarted, sessionToken]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimeColor = (seconds: number) => {
        if (seconds <= 60) return 'text-red-600 dark:text-red-400';
        if (seconds <= 300) return 'text-orange-600 dark:text-orange-400';
        return 'text-green-600 dark:text-green-400';
    };

    const getProgressPercentage = () => {
        return ((currentQuestionIndex + 1) / questions.length) * 100;
    };

    // Function to clean up malformed LaTeX in quiz text
    const cleanLatexText = (text: string): string => {
        if (!text) return '';
        
        return text
            // Fix malformed angle brackets (angle -> \rangle)
            .replace(/\|([^|>]+)\s+angle/g, '|$1\\rangle')
            // Fix malformed beta character (␈eta -> \beta)
            .replace(/␈eta/g, '\\beta')
            // Fix malformed alpha
            .replace(/\|α\|/g, '|\\alpha|')
            // Ensure proper LaTeX delimiters for inline math
            .replace(/\$([^$]+)\$/g, '$$$1$$')
            // Fix spacing issues
            .replace(/\s+/g, ' ')
            .trim();
    };

    // Component to render math-enabled text
    const MathText: React.FC<{ children: string; className?: string }> = ({ children, className = '' }) => {
        const cleanedText = cleanLatexText(children);
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
                        p: ({ children }) => <span>{children}</span>, // Inline paragraphs for quiz context
                    }}
                >
                    {cleanedText}
                </ReactMarkdown>
            </div>
        );
    };

    // Loading state with behavioral elements
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full mx-auto mb-4"
                        />
                        <Brain className="w-8 h-8 text-green-600 absolute inset-0 m-auto" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        Generating Your Personalized Quiz
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Adapting difficulty based on your learning progress...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-6 max-w-md text-center">
                    <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Quiz Generation Failed</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {/* Navigation Header */}
            <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
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
            
            {/* Quiz Context Header */}
            <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Brain className="w-5 h-5 text-blue-600" />
                            <div>
                                <h1 className="font-medium text-gray-900 dark:text-white text-lg">
                                    {quizParams.subtopic}
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Quiz
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            {/* Timer */}
                            <div className="flex items-center space-x-2">
                                <Clock className={`w-4 h-4 ${getTimeColor(timeLeft)}`} />
                                <span className={`font-mono font-medium ${getTimeColor(timeLeft)}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </span>
                            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                {Math.round(getProgressPercentage())}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 h-1">
                            <div
                                className="bg-blue-600 h-full transition-all duration-300"
                                style={{ width: `${getProgressPercentage()}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quiz Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {!quizStarted ? (
                    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-6 text-center max-w-2xl">
                        <div className="mb-6">
                            <Brain className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                                Ready for Quiz?
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Test your understanding of the concepts you just learned.
                            </p>
                        </div>
                        
                        <div className="mb-6">
                            <div className="bg-gray-50 dark:bg-gray-900 p-3 text-center">
                                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                    <span>Time: {selectedTimeOption} minutes</span>
                                    <span>•</span>
                                    <span>{questions.length} questions</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={startQuiz}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-medium"
                        >
                            Start Quiz
                        </button>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-6">
                            <div className="mb-6">
                                <div className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                    <MathText>{currentQuestion.question_text}</MathText>
                                </div>
                                
                            </div>

                            <div className="space-y-3">
                                {currentQuestion.options.map((option, optionIndex) => {
                                    const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                                    const feedback = answerFeedback[currentQuestion.id];
                                    const showFeedback = feedback && selectedAnswers[currentQuestion.id] === option.id;
                                    
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                                            className={`w-full p-3 text-left border transition-colors ${
                                                isSelected
                                                    ? showFeedback
                                                        ? feedback.correct
                                                            ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                                                            : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                                                        : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                                                    : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 text-gray-800 dark:text-gray-200">
                                                    <MathText>{option.text}</MathText>
                                                </div>
                                                {isSelected && showFeedback && (
                                                    <div className="ml-3 flex-shrink-0">
                                                        {feedback.correct 
                                                            ? <CheckCircle className="w-5 h-5 text-green-600" />
                                                            : <XCircle className="w-5 h-5 text-red-600" />
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between items-center mt-6">
                                <button
                                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentQuestionIndex === 0}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    Previous
                                </button>

                                {currentQuestionIndex === questions.length - 1 ? (
                                    <button
                                        onClick={() => handleSubmit(false)}
                                        disabled={isSubmitting}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium disabled:opacity-50 text-sm"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Complete Quiz'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium text-sm"
                                    >
                                        Next
                                    </button>
                                )}
                            </div>
                        </div>
                )}
            </div>

            {/* Warning Modal */}
        </div>
    );
};

export default BehavioralQuizInterface;