'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import { useBehavioralContext } from '@/app/context/BehavioralContext';
import { useAIState } from '@/store/aiState';
import { useRouter } from 'next/navigation';
import { useQuizIntegrity } from '../src/hooks/useQuizIntegrity';
import { useEloSystem, useFocusMode } from '../src/hooks/useBehavioral';
import WarningModal from './WarningModal';
import XPPopAnimation from '../src/components/behavioral/XPPopAnimation';
import { api } from '@/lib/api';
import { AxiosError } from 'axios';
import { formatQuizQuestion } from '../src/app/journey/utils/textFormatting';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Target, Brain, Zap, Star, CheckCircle, XCircle, 
  Timer, Focus, AlertTriangle, Trophy, Award
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
    };
}

const BehavioralQuizInterface: React.FC<QuizInterfaceProps> = ({ quizParams }) => {
    const { user, loading } = useAuth();
    const { 
        awardXPForActivity, 
        updateUserStreak, 
        triggerReward,
        showNotification,
        transitionSession 
    } = useBehavioralContext();
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
    const [showXPPop, setShowXPPop] = useState(false);
    const [currentXPGain, setCurrentXPGain] = useState(0);
    
    // Behavioral state
    const [confidenceLevel, setConfidenceLevel] = useState<number>(3);
    const [responseStartTime, setResponseStartTime] = useState<Date | null>(null);
    const [streakCount, setStreakCount] = useState(0);
    const [difficulty, setDifficulty] = useState<'adaptive' | 'fixed'>('adaptive');

    const queryClient = useQueryClient();
    const { startGeneration, endGeneration } = useAIState();
    const { eloRatings, updateElo } = useEloSystem();
    const { isEnabled: focusMode, toggleFocus } = useFocusMode();

    const QUIZ_STATE_KEY = `quizState-${quizParams.subtopic_id}`;

    // Quiz integrity
    const [violations, setViolations] = useState({ fullscreen: 0, visibility: 0 });
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [warning, setWarning] = useState({ title: '', message: '' });

    // Create a ref to store the exitFullscreen function
    const exitFullscreenRef = useRef<(() => Promise<void>) | null>(null);

    const handleViolation = useCallback((type: 'fullscreen' | 'visibility') => {
        setViolations(prev => {
            const newCount = prev[type] + 1;
            if (newCount >= 2) {
                // Exit fullscreen before auto-submit
                if (exitFullscreenRef.current) {
                    exitFullscreenRef.current().then(() => handleSubmit(true));
                } else {
                    handleSubmit(true);
                }
            } else {
                setWarning({
                    title: `Focus Breach Warning`,
                    message: `This affects your learning flow. Stay focused to maximize your XP gains! (${2 - newCount} warning${2 - newCount > 1 ? 's' : ''} remaining)`,
                });
                setIsWarningModalOpen(true);
                
                // Show behavioral feedback for violations
                showNotification({
                    type: 'focus',
                    title: 'Focus Interrupted',
                    message: 'Stay concentrated for better learning outcomes',
                    duration: 3000,
                    priority: 'medium'
                });
            }
            return { ...prev, [type]: newCount };
        });
    }, [showNotification]);

    const { requestFullscreen, exitFullscreen, fullscreenError } = useQuizIntegrity({ onViolation: handleViolation });
    
    // Update the ref with the current exitFullscreen function
    useEffect(() => {
        exitFullscreenRef.current = exitFullscreen;
    }, [exitFullscreen]);

    // Start quiz with session transition
    const startQuiz = useCallback(async () => {
        try {
            setQuizStarted(true);
            setResponseStartTime(new Date());
            
            // Enable focus mode automatically
            if (!focusMode) {
                toggleFocus(true, selectedTimeOption);
            }
            
            await requestFullscreen();
        } catch (error) {
            console.error('Error starting quiz:', error);
            showNotification({
                type: 'session',
                title: 'Quiz Start Failed',
                message: 'Unable to start quiz. Please try again.',
                duration: 5000,
                priority: 'high'
            });
        }
    }, [focusMode, toggleFocus, selectedTimeOption, requestFullscreen, showNotification]);

    // Handle answer selection with immediate feedback
    const handleAnswerSelect = useCallback(async (questionId: number, answerId: string | number, isCorrect?: boolean) => {
        setSelectedAnswers(prev => ({ ...prev, [questionId]: answerId }));
        
        const responseTime = responseStartTime ? 
            (new Date().getTime() - responseStartTime.getTime()) / 1000 : 0;
        
        const question = questions.find(q => q.id === questionId);
        
        if (isCorrect !== undefined && question) {
            // Immediate XP and Elo feedback
            const xpGain = isCorrect ? (responseTime < 10 ? 15 : 10) : 5; // Quick answers get bonus
            setCurrentXPGain(xpGain);
            setShowXPPop(true);
            
            // Update Elo for each concept tag
            if (question.concept_tags) {
                question.concept_tags.forEach(concept => {
                    updateElo({ concept, outcome: isCorrect ? 1 : 0, difficulty: question.difficulty_level || 1200 });
                });
            }
            
            // Award XP with context
            await awardXPForActivity('quiz_question', {
                correct: isCorrect,
                response_time: responseTime,
                confidence_level: confidenceLevel,
                question_id: questionId,
                subtopic_id: quizParams.subtopic_id
            });
            
            // Update streak and trigger rewards
            if (isCorrect) {
                setStreakCount(prev => prev + 1);
                if (streakCount >= 2) {
                    triggerReward('quiz_streak', { streak: streakCount + 1 });
                }
            } else {
                setStreakCount(0);
            }
            
            // Store feedback
            setAnswerFeedback(prev => ({
                ...prev,
                [questionId]: { correct: isCorrect }
            }));
            
            // Show immediate feedback
            showNotification({
                type: isCorrect ? 'xp' : 'focus',
                title: isCorrect ? `+${xpGain} XP` : 'Keep Learning',
                message: isCorrect ? 
                    `Great answer! ${responseTime < 5 ? 'Lightning fast! ⚡' : ''}` :
                    'Every mistake is a learning opportunity',
                duration: 2000,
                priority: 'low',
                data: { xpGain, responseTime, isCorrect }
            });
        }
        
        // Reset response timer for next question
        setTimeout(() => setResponseStartTime(new Date()), 100);
    }, [
        responseStartTime, 
        questions, 
        confidenceLevel, 
        streakCount, 
        awardXPForActivity, 
        updateElo, 
        triggerReward, 
        showNotification, 
        quizParams.subtopic_id
    ]);

    // Enhanced quiz submission with full behavioral integration
    const mutation = useMutation({
        mutationFn: async (isAutoSubmit: boolean) => {
            // Transition to CHECKPOINT state
            await transitionSession('CHECKPOINT', { 
                activity: 'quiz_completion',
                score: Object.values(answerFeedback).filter(f => f.correct).length,
                total_questions: questions.length,
                violations: violations
            });
            
            return api.post('/quizzes/submit', {
                session_token: sessionToken,
                answers: questions.map(q => ({
                    question_id: q.id,
                    selected_option_id: selectedAnswers[q.id] || null,
                    response_time: responseStartTime ? 
                        (new Date().getTime() - responseStartTime.getTime()) / 1000 : null,
                    confidence_level: confidenceLevel
                })),
                violations: violations,
                final_action: isAutoSubmit ? 'auto-submit' : 'manual-submit',
            });
        },
        onSuccess: async (response) => {
            const result = response.data;
            const score = (result.score || 0) * 100;
            
            // Calculate final XP bonus
            const completionXP = Math.round(score * 0.5 + (violations.fullscreen + violations.visibility === 0 ? 20 : 0));
            
            // Award completion XP
            await awardXPForActivity('quiz_completion', {
                score: score,
                perfect_focus: violations.fullscreen + violations.visibility === 0,
                streak_count: streakCount,
                completion_time: selectedTimeOption * 60 - timeLeft
            });
            
            // Update user streak
            await updateUserStreak();
            
            // Transition to REWARD state
            await transitionSession('REWARD', { 
                quiz_completed: true,
                final_score: score,
                xp_earned: completionXP
            });
            
            // Major celebration for high scores
            if (score >= 80) {
                showNotification({
                    type: 'milestone',
                    title: 'Outstanding Performance! 🏆',
                    message: `${score}% score - You've mastered this topic!`,
                    duration: 6000,
                    priority: 'high',
                    data: { score, completionXP }
                });
                
                triggerReward('high_score', { score, subtopic: quizParams.subtopic });
            }
            
            // Disable focus mode and exit fullscreen
            if (focusMode) {
                toggleFocus(false);
            }
            
            // Exit fullscreen mode
            await exitFullscreen();
            
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
                // Behavioral enhancements
                difficulty_target: difficulty === 'adaptive' ? adaptiveDifficulty : 1200,
                user_elo: userElo,
                focus_mode: focusMode,
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
            
            // Show difficulty adaptation message
            if (difficulty === 'adaptive' && userElo !== 1200) {
                showNotification({
                    type: 'session',
                    title: 'Quiz Adapted',
                    message: `Difficulty adjusted based on your ${userElo > 1200 ? 'strong' : 'developing'} performance`,
                    duration: 4000,
                    priority: 'low'
                });
            }

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
                
                // Time-based nudges
                if (newTime === 60) {
                    showNotification({
                        type: 'focus',
                        title: '1 Minute Remaining',
                        message: 'Focus on your strongest answers now',
                        duration: 3000,
                        priority: 'medium'
                    });
                } else if (newTime === 300 && prev > 300) {
                    showNotification({
                        type: 'session',
                        title: '5 Minutes Left',
                        message: 'You\'re doing great! Keep the momentum going',
                        duration: 2000,
                        priority: 'low'
                    });
                }
                
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
    }, [quizStarted, timeLeft, handleSubmit, showNotification]);

    // Initialize quiz
    useEffect(() => {
        const savedState = sessionStorage.getItem(QUIZ_STATE_KEY);
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            setQuestions(parsedState.questions);
            setCurrentQuestionIndex(parsedState.currentQuestionIndex);
            setSelectedAnswers(parsedState.selectedAnswers);
            setTimeLeft(parsedState.timeLeft);
            setViolations(parsedState.violations);
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
                violations,
                quizStarted,
                sessionToken
            }));
        }
    }, [questions, currentQuestionIndex, selectedAnswers, timeLeft, violations, quizStarted, sessionToken]);

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

    // Loading state with behavioral elements
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"
                        />
                        <Brain className="w-8 h-8 text-indigo-600 absolute inset-0 m-auto" />
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
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Quiz Generation Failed</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
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

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* XP Pop Animation */}
            <XPPopAnimation 
                xpAmount={currentXPGain}
                activityType="quiz_question"
            />
            
            {/* Enhanced Header with Behavioral Elements */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                <div>
                                    <h1 className="font-bold text-gray-800 dark:text-gray-200">
                                        {quizParams.subtopic}
                                    </h1>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Adaptive Learning Quiz
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            {/* Streak Counter */}
                            {streakCount > 0 && (
                                <div className="flex items-center space-x-1 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
                                    <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                    <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                                        {streakCount} streak
                                    </span>
                                </div>
                            )}
                            
                            {/* Timer */}
                            <div className="flex items-center space-x-2">
                                <Clock className={`w-5 h-5 ${getTimeColor(timeLeft)}`} />
                                <span className={`font-mono text-lg font-bold ${getTimeColor(timeLeft)}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Progress Bar with Behavioral Enhancement */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </span>
                            <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                                {Math.round(getProgressPercentage())}% Complete
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <motion.div
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${getProgressPercentage()}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quiz Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {!quizStarted ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center"
                    >
                        <div className="mb-6">
                            <Target className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                                Ready for Your Adaptive Quiz?
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                                This quiz adapts to your learning level and rewards focused performance. 
                                Stay in focus mode for maximum XP!
                            </p>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4 mb-8 text-sm">
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4">
                                <Timer className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                                <p className="font-semibold text-indigo-700 dark:text-indigo-300">
                                    {selectedTimeOption} Minutes
                                </p>
                                <p className="text-indigo-600 dark:text-indigo-400">Time Limit</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
                                <Star className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                                <p className="font-semibold text-purple-700 dark:text-purple-300">
                                    XP Rewards
                                </p>
                                <p className="text-purple-600 dark:text-purple-400">Performance Based</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                                <Focus className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                                <p className="font-semibold text-green-700 dark:text-green-300">
                                    Focus Mode
                                </p>
                                <p className="text-green-600 dark:text-green-400">Auto-Enabled</p>
                            </div>
                        </div>

                        <button
                            onClick={startQuiz}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        >
                            Start Adaptive Quiz
                        </button>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestionIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
                        >
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                    {formatQuizQuestion(currentQuestion.question_text)}
                                </h2>
                                
                                {/* Confidence Level Selector */}
                                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        How confident are you about this answer?
                                    </p>
                                    <div className="flex space-x-2">
                                        {[1, 2, 3, 4, 5].map(level => (
                                            <button
                                                key={level}
                                                onClick={() => setConfidenceLevel(level)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                                    confidenceLevel === level
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                                                }`}
                                            >
                                                {level === 1 ? 'Guess' : level === 2 ? 'Unsure' : level === 3 ? 'Likely' : level === 4 ? 'Sure' : 'Certain'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {currentQuestion.options.map((option, optionIndex) => {
                                    const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                                    const feedback = answerFeedback[currentQuestion.id];
                                    const showFeedback = feedback && selectedAnswers[currentQuestion.id] === option.id;
                                    
                                    return (
                                        <motion.button
                                            key={option.id}
                                            onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`w-full p-4 text-left rounded-xl border transition-all duration-200 ${
                                                isSelected
                                                    ? showFeedback
                                                        ? feedback.correct
                                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                                            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                                                        : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
                                                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-800 dark:text-gray-200">
                                                    {option.text}
                                                </span>
                                                {isSelected && showFeedback && (
                                                    feedback.correct 
                                                        ? <CheckCircle className="w-5 h-5 text-green-600" />
                                                        : <XCircle className="w-5 h-5 text-red-600" />
                                                )}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between items-center mt-8">
                                <button
                                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentQuestionIndex === 0}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                {currentQuestionIndex === questions.length - 1 ? (
                                    <motion.button
                                        onClick={() => handleSubmit(false)}
                                        disabled={isSubmitting}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Complete Quiz'}
                                    </motion.button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        Next Question
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            {/* Warning Modal */}
            <WarningModal
                isOpen={isWarningModalOpen}
                onClose={() => setIsWarningModalOpen(false)}
                title={warning.title}
                message={warning.message}
            />
        </div>
    );
};

export default BehavioralQuizInterface;