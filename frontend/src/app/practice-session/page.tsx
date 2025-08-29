'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Lightbulb,
  CheckCircle,
  XCircle,
  Timer,
  Brain,
  Target,
  PenTool,
  AlertTriangle
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '@/app/context/AuthContext';
import { api } from '@/lib/api';
import CodeBlock from '../../../components/learning/CodeBlock';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface PracticeConfig {
  subtopicIds: string[];
  questionCount: number;
  questionTypes: string[];
  timeLimit: number; // in minutes
  hintsEnabled: boolean;
  roadmapId: number;
  subject: string;
  goal: string;
}

interface Question {
  id: string;
  type: 'mcq' | 'numerical' | 'caseStudy' | 'codeCompletion' | 'debugging';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
  subtopicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  codeSnippet?: string;
}

interface Answer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  hintUsed: boolean;
}

const QUESTION_TYPE_LABELS = {
  mcq: 'Multiple Choice',
  numerical: 'Numerical Answer',
  caseStudy: 'Case Study',
  codeCompletion: 'Code Completion',
  debugging: 'Debug Code'
};

const PracticeSessionContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [config, setConfig] = useState<PracticeConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [hintUsedForCurrent, setHintUsedForCurrent] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Parse session token or config from URL params
  useEffect(() => {
    const token = searchParams?.get('session_token');
    const configParam = searchParams?.get('config');
    const streaming = searchParams?.get('streaming') === 'true';
    
    if (token) {
      // Use real API with session token
      setSessionToken(token);
      
      if (streaming) {
        // If streaming=true, poll until all questions are generated
        pollForQuestions(token);
      } else {
        // Regular fetch for existing sessions
        fetchSessionData(token);
      }
    } else if (configParam) {
      // Fallback to mock data for testing
      try {
        const parsedConfig = JSON.parse(configParam);
        setConfig(parsedConfig);
        setTimeRemaining(parsedConfig.timeLimit * 60);
        generateMockQuestions(parsedConfig);
      } catch (error) {
        console.error('Invalid config:', error);
        router.push('/journey');
      }
    } else {
      router.push('/journey');
    }
  }, [searchParams, router]);

  const pollForQuestions = async (token: string) => {
    const maxAttempts = 30; // Poll for up to 30 seconds
    let attempts = 0;
    
    const poll = async () => {
      try {
        attempts++;
        console.log(`Polling attempt ${attempts}/${maxAttempts} for questions...`);
        
        const response = await api.get(`/practice/sessions/${token}`);
        const sessionData = response.data;
        
        console.log(`Attempt ${attempts}: Found ${sessionData.questions?.length || 0} questions`);
        
        // Check if we have the expected number of questions
        if (sessionData.questions && sessionData.questions.length >= sessionData.question_count) {
          console.log(`✅ All ${sessionData.questions.length} questions ready, starting session`);
          await processSessionData(sessionData);
          return;
        }
        
        // If we haven't reached max attempts, try again
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000); // Poll every second
        } else {
          console.log(`⚠️ Timeout after ${maxAttempts} attempts, using ${sessionData.questions?.length || 0} questions`);
          await processSessionData(sessionData);
        }
      } catch (error) {
        console.error(`Polling attempt ${attempts} failed:`, error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          alert('Failed to load practice session. Please try again.');
          router.push('/journey');
        }
      }
    };
    
    poll();
  };

  const processSessionData = async (sessionData: any) => {
    // Set up config from session data
    setConfig({
      subtopicIds: sessionData.subtopic_ids || [],
      questionCount: sessionData.question_count,
      questionTypes: sessionData.question_types || [],
      timeLimit: sessionData.time_limit,
      hintsEnabled: sessionData.hints_enabled,
      roadmapId: sessionData.roadmap_id,
      subject: sessionData.subject,
      goal: sessionData.goal
    });

    setTimeRemaining(sessionData.time_limit * 60);
    
    // Convert API questions to frontend format
    console.log(`Received ${sessionData.questions?.length || 0} questions from backend:`, sessionData.questions);
    
    const convertedQuestions = sessionData.questions.map((q: any, index: number) => ({
      id: q.id.toString(),
      type: q.question_type,
      question: q.question,
      options: q.options || [],
      correctAnswer: q.options?.[0] || 'Sample answer', // Will be validated on backend
      explanation: 'Explanation will be provided after submission',
      hint: q.hint,
      subtopicId: q.subtopic_id,
      difficulty: q.difficulty,
      codeSnippet: q.code_snippet
    }));

    console.log(`Converted ${convertedQuestions.length} questions for frontend:`, convertedQuestions);
    setQuestions(convertedQuestions);
    setIsLoading(false);
  };

  const fetchSessionData = async (token: string) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/practice/sessions/${token}`);
      const sessionData = response.data;
      
      await processSessionData(sessionData);
      
    } catch (error) {
      console.error('Error fetching session data:', error);
      alert('Failed to load practice session. Please try again.');
      router.push('/journey');
    }
  };

  const generateMockQuestions = (config: PracticeConfig) => {
    if (!config) return [];

    const mockQuestions: Question[] = [];
    const questionTypesCount = Math.floor(config.questionCount / config.questionTypes.length);

    config.questionTypes.forEach((type) => {
      for (let i = 0; i < questionTypesCount; i++) {
        const questionId = `${type}-${i}`;
        
        switch (type) {
          case 'mcq':
            mockQuestions.push({
              id: questionId,
              type: 'mcq',
              question: `Which of the following concepts is most important for understanding the fundamentals in this subtopic?`,
              options: [
                'Basic theoretical foundations',
                'Advanced practical applications',
                'Historical context and development',
                'Future implications and trends'
              ],
              correctAnswer: 'Basic theoretical foundations',
              explanation: 'Basic theoretical foundations provide the essential groundwork needed to understand more complex concepts.',
              hint: 'Think about what knowledge you need before advancing to complex topics.',
              subtopicId: config.subtopicIds[i % config.subtopicIds.length],
              difficulty: 'medium'
            });
            break;
          
          case 'numerical':
            mockQuestions.push({
              id: questionId,
              type: 'numerical',
              question: 'Calculate the result of the following expression: (25 × 4) ÷ 5 + 12',
              correctAnswer: '32',
              explanation: 'Following order of operations: (25 × 4) ÷ 5 + 12 = 100 ÷ 5 + 12 = 20 + 12 = 32',
              hint: 'Remember to follow the order of operations (PEMDAS).',
              subtopicId: config.subtopicIds[i % config.subtopicIds.length],
              difficulty: 'easy'
            });
            break;
          
          case 'caseStudy':
            mockQuestions.push({
              id: questionId,
              type: 'caseStudy',
              question: `Scenario: A company is implementing a new system to improve efficiency. They have limited budget and time constraints. What would be the most effective approach?`,
              options: [
                'Implement a comprehensive solution all at once',
                'Start with a pilot program and scale gradually',
                'Outsource the entire implementation',
                'Wait for more budget to become available'
              ],
              correctAnswer: 'Start with a pilot program and scale gradually',
              explanation: 'A pilot program allows for testing and refinement while managing risk and resources effectively.',
              hint: 'Consider an approach that minimizes risk while maximizing learning.',
              subtopicId: config.subtopicIds[i % config.subtopicIds.length],
              difficulty: 'hard'
            });
            break;
          
          case 'codeCompletion':
            mockQuestions.push({
              id: questionId,
              type: 'codeCompletion',
              question: 'Complete the following function to return the sum of two numbers:',
              codeSnippet: `function addNumbers(a, b) {
    // Complete this function
    return _____;
}`,
              correctAnswer: 'a + b',
              explanation: 'The function should return the sum of parameters a and b.',
              hint: 'Use the addition operator with the two parameters.',
              subtopicId: config.subtopicIds[i % config.subtopicIds.length],
              difficulty: 'easy'
            });
            break;
          
          case 'debugging':
            mockQuestions.push({
              id: questionId,
              type: 'debugging',
              question: 'Find the error in the following code:',
              codeSnippet: `for (let i = 0; i <= 10; i++) {
    if (i = 5) {
        console.log("Found five!");
    }
}`,
              correctAnswer: 'i = 5 should be i === 5 (assignment instead of comparison)',
              explanation: 'The condition uses assignment (=) instead of comparison (===), which will always be true.',
              hint: 'Look at the conditional statement in the if block.',
              subtopicId: config.subtopicIds[i % config.subtopicIds.length],
              difficulty: 'medium'
            });
            break;
        }
      }
    });

    const finalQuestions = mockQuestions.slice(0, config.questionCount);
    setQuestions(finalQuestions);
    setIsLoading(false);
  };


  // Timer countdown
  useEffect(() => {
    if (!sessionStarted || sessionCompleted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setSessionCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStarted, sessionCompleted]);

  const currentQuestion = questions[currentQuestionIndex];
  
  // Safety check to prevent crashes
  if (!currentQuestion || !currentQuestion.type) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <Brain className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading Question...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we prepare your question.
          </p>
        </div>
      </div>
    );
  }
  
  const handleAnswerSubmit = async () => {
    if (!currentQuestion || currentAnswer.trim() === '') return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    
    // For real API, submit answer and get correctness from backend
    if (sessionToken) {
      try {
        const response = await api.post(`/practice/sessions/${sessionToken}/answers`, {
          question_id: parseInt(currentQuestion.id),
          user_answer: currentAnswer,
          time_spent: timeSpent,
          hint_used: hintUsedForCurrent
        });

        const result = response.data;
        
        const newAnswer: Answer = {
          questionId: currentQuestion.id,
          answer: currentAnswer,
          isCorrect: result.is_correct || false,
          timeSpent,
          hintUsed: hintUsedForCurrent
        };

        setAnswers(prev => [...prev, newAnswer]);
        
      } catch (error) {
        console.error('Error submitting answer:', error);
        // Fallback to local evaluation
        const isCorrect = currentAnswer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
        const newAnswer: Answer = {
          questionId: currentQuestion.id,
          answer: currentAnswer,
          isCorrect,
          timeSpent,
          hintUsed: hintUsedForCurrent
        };
        setAnswers(prev => [...prev, newAnswer]);
      }
    } else {
      // Mock mode - local evaluation
      const isCorrect = currentAnswer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
      const newAnswer: Answer = {
        questionId: currentQuestion.id,
        answer: currentAnswer,
        isCorrect,
        timeSpent,
        hintUsed: hintUsedForCurrent
      };
      setAnswers(prev => [...prev, newAnswer]);
    }
    
    // Move to next question or complete session
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer('');
      setShowHint(false);
      setHintUsedForCurrent(false);
      setQuestionStartTime(Date.now());
    } else {
      setSessionCompleted(true);
    }
  };

  const handleNavigateQuestion = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
    setCurrentAnswer('');
    setShowHint(false);
    setHintUsedForCurrent(false);
    setQuestionStartTime(Date.now());
  };

  const handleShowHint = () => {
    if (config?.hintsEnabled && currentQuestion?.hint) {
      setShowHint(true);
      setHintUsedForCurrent(true);
    }
  };

  const handleFinishSession = async () => {
    if (sessionToken) {
      try {
        // Complete session via API and get results
        const response = await api.post(`/practice/sessions/${sessionToken}/complete`);
        
        const results = response.data;
        sessionStorage.setItem('practiceResults', JSON.stringify(results));
        router.push('/practice-results');
        return;
      } catch (error) {
        console.error('Error completing session via API:', error);
      }
    }
    
    // Fallback: Calculate results locally
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const totalQuestions = questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const totalTime = (config?.timeLimit || 0) * 60 - timeRemaining;
    
    const results = {
      score,
      correctAnswers,
      totalQuestions,
      totalTime,
      answers,
      questions,
      config
    };
    
    sessionStorage.setItem('practiceResults', JSON.stringify(results));
    router.push('/practice-results');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <Brain className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Preparing Practice Session
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Generating questions based on your selections...
          </p>
        </div>
      </div>
    );
  }

  if (!sessionStarted) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 max-w-2xl w-full mx-4"
          >
            <div className="text-center mb-6">
              <PenTool className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Practice Session Ready
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Review your session details before starting
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-300">Questions</span>
                <span className="font-bold text-gray-900 dark:text-white">{config.questionCount}</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-300">Time Limit</span>
                <span className="font-bold text-gray-900 dark:text-white">{config.timeLimit} minutes</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-300">Question Types</span>
                <span className="font-bold text-gray-900 dark:text-white">{config.questionTypes.length} types</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-300">Hints Enabled</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {config.hintsEnabled ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setSessionStarted(true);
                setQuestionStartTime(Date.now());
              }}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <Timer className="w-5 h-5" />
              <span>Start Practice Session</span>
            </button>
          </motion.div>
        </div>
      </ProtectedRoute>
    );
  }

  if (sessionCompleted) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 max-w-2xl w-full mx-4 text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Session Complete!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Great job! Let's see how you performed.
            </p>
            
            <button
              onClick={handleFinishSession}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              View Results & Analysis
            </button>
          </motion.div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Practice Session
                </h1>
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 rounded-full text-sm font-medium">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span className={`font-mono font-bold ${
                    timeRemaining < 300 ? 'text-red-600 dark:text-red-400' : ''
                  }`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                
                <button
                  onClick={() => setSessionCompleted(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Flag className="w-4 h-4" />
                  <span>Finish</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Question Type Badge */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium">
                  {QUESTION_TYPE_LABELS[currentQuestion.type]}
                </span>
                
                {config.hintsEnabled && currentQuestion.hint && (
                  <button
                    onClick={handleShowHint}
                    disabled={showHint}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>{showHint ? 'Hint Shown' : 'Show Hint'}</span>
                  </button>
                )}
              </div>

              {/* Question */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
                <div className="mb-6">
                  <ReactMarkdown
                    className="text-xl font-bold text-gray-900 dark:text-white prose prose-lg dark:prose-invert max-w-none"
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const inline = props.inline;
                        
                        if (!inline && children) {
                          return (
                            <CodeBlock language={language}>
                              {String(children).replace(/\n$/, '')}
                            </CodeBlock>
                          );
                        }
                        
                        // Inline code
                        return (
                          <code className="bg-gray-100 text-gray-800 px-1 sm:px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => <>{children}</>, // Remove default pre wrapper
                      // Handle math blocks
                      div: ({ className, children, ...props }) => {
                        if (className === 'math math-display') {
                          return <div className="math-display my-3 sm:my-4 text-center overflow-x-auto" {...props}>{children}</div>;
                        }
                        return <div className={className} {...props}>{children}</div>;
                      },
                      span: ({ className, children, ...props }) => {
                        if (className === 'math math-inline') {
                          return <span className="math-inline" {...props}>{children}</span>;
                        }
                        return <span className={className} {...props}>{children}</span>;
                      },
                    }}
                  >
                    {currentQuestion.question}
                  </ReactMarkdown>
                </div>

                {/* Code Snippet */}
                {currentQuestion.codeSnippet && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {currentQuestion.type === 'codeCompletion' ? 'Code to Complete:' : 'Code to Debug:'}
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <pre className="font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto">
                        {currentQuestion.codeSnippet}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Answer Input */}
                {currentQuestion.type === 'mcq' && currentQuestion.options ? (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          currentAnswer === option
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={option}
                          checked={currentAnswer === option}
                          onChange={(e) => setCurrentAnswer(e.target.value)}
                          className="mr-3"
                        />
                        <div className="text-gray-900 dark:text-white flex-1">
                          <ReactMarkdown
                            className="prose dark:prose-invert max-w-none"
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              p: ({ children }) => <span>{children}</span>, // Inline for options
                              code: ({ children, ...props }) => (
                                <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {option}
                          </ReactMarkdown>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="mb-6">
                    {(currentQuestion.type === 'codeCompletion' || currentQuestion.type === 'debugging') ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {currentQuestion.type === 'codeCompletion' ? 'Your Answer (complete the missing parts):' : 'Your Answer (identify and fix the error):'}
                        </label>
                        <textarea
                          value={currentAnswer}
                          onChange={(e) => setCurrentAnswer(e.target.value)}
                          placeholder={
                            currentQuestion.type === 'codeCompletion' 
                              ? "Write only the code that goes in the blank (_____)" 
                              : "Describe what's wrong and how to fix it"
                          }
                          className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          rows={currentQuestion.type === 'codeCompletion' ? 3 : 4}
                        />
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {currentQuestion.type === 'codeCompletion' ? 
                            '💡 Write just the missing code, not the entire function' : 
                            '💡 Explain the error and provide the corrected line(s)'
                          }
                        </div>
                      </div>
                    ) : (
                      // Regular textarea for other question types
                      <textarea
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        rows={currentQuestion.type === 'caseStudy' ? 4 : 2}
                      />
                    )}
                  </div>
                )}

                {/* Hint */}
                <AnimatePresence>
                  {showHint && currentQuestion.hint && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800 dark:text-yellow-200">Hint:</span>
                      </div>
                      <ReactMarkdown
                        className="text-yellow-700 dark:text-yellow-300 prose dark:prose-invert max-w-none"
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          p: ({ children }) => <p className="text-yellow-700 dark:text-yellow-300">{children}</p>,
                          code: ({ children, ...props }) => (
                            <code className="bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {currentQuestion.hint}
                      </ReactMarkdown>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => handleNavigateQuestion('prev')}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={handleAnswerSubmit}
                    disabled={currentAnswer.trim() === ''}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next Question'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

const PracticeSessionPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <Brain className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading Practice Session
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait...
          </p>
        </div>
      </div>
    }>
      <PracticeSessionContent />
    </Suspense>
  );
};

export default PracticeSessionPage;