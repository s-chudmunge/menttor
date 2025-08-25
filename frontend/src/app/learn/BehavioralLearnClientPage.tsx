// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Target, Brain, Zap, Star, BookOpen, Play, Pause, 
  Focus, Award, TrendingUp, Eye, Timer, CheckCircle, ArrowRight,
  Home, Map, BarChart3, User, Menu, X
} from 'lucide-react';

import Logo from '../../../components/Logo';
import ProfileDropdown from '../../components/ProfileDropdown';

import LearningContentRenderer from '../../../components/learning/LearningContentRenderer';
import OldLearnPagesModal from './OldLearnPagesModal';
import FloatingTOC from '../../../components/learning/FloatingTOC';
import SaveShareButtons from '../../../components/learning/SaveShareButtons';
import { useBehavioralContext } from '../context/BehavioralContext';
import { useFocusMode, useSessionFSM, useBehavioralStats, useQuickChallenge } from '../../hooks/useBehavioral';
import { api, LearningContentResponse, getNextSubtopic, NextSubtopicResponse, learningAPI } from '../../lib/api';
import { analytics } from '../../lib/analytics';

const TIME_TRACKING_INTERVAL = 30000; // 30 seconds
const FOCUS_SESSION_DURATION = 25; // 25-minute Pomodoro sessions

interface BehavioralLearnClientPageProps {
  initialContent: any;
  error: string | null;
}

const BehavioralLearnClientPage: React.FC<BehavioralLearnClientPageProps> = ({ 
  initialContent, 
  error: initialError 
}) => {
  // State
  const [contentData, setContentData] = useState<LearningContentResponse | null>(null);
  const [content, setContent] = useState(initialContent);
  const [fetchError, setFetchError] = useState(initialError);
  const [isLoading, setIsLoading] = useState(true);
  const [learningContext, setLearningContext] = useState<{subject?: string, goal?: string, subtopic?: string}>({});
  const [readingProgress, setReadingProgress] = useState(0);
  const [isOldLearnPagesModalOpen, setIsOldLearnPagesModalOpen] = useState(false);
  const [sessionPhase, setSessionPhase] = useState<'warmup' | 'focus' | 'checkpoint' | 'reward' | 'prime_next'>('warmup');
  const [timeInCurrentPhase, setTimeInCurrentPhase] = useState(0);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [showPhaseTransition, setShowPhaseTransition] = useState(false);
  const [currentMicrogoal, setCurrentMicrogoal] = useState('');
  const [completedMicrogoals, setCompletedMicrogoals] = useState<string[]>([]);
  const [nextSubtopic, setNextSubtopic] = useState<NextSubtopicResponse | null>(null);
  const [isLoadingNextSubtopic, setIsLoadingNextSubtopic] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const timeSpentRef = useRef(0);
  const phaseStartTimeRef = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // URL parameters
  const searchParams = useSearchParams();
  const subtopic = searchParams.get('subtopic');
  const roadmapTitle = searchParams.get('roadmap_title') || '';
  const subtopicId = searchParams.get('subtopic_id');
  const roadmapId = parseInt(searchParams.get('roadmap_id') || '1');

  // Behavioral hooks
  const { 
    awardXPForActivity, 
    showNotification, 
    createLearningSession,
    transitionSession,
    currentSessionId,
    sessionState 
  } = useBehavioralContext();
  
  const { data: behavioralStats } = useBehavioralStats();
  const { isEnabled: focusMode, toggleFocus, remainingTime } = useFocusMode();
  const { 
    currentSession,
    createSession: createSessionHook,
    transitionSession: transitionSessionHook
  } = useSessionFSM(roadmapId);

  // Quick challenges for warmup
  const {
    challenge,
    challengeState,
    startChallenge,
    answerChallenge,
    result: challengeResult
  } = useQuickChallenge(sessionPhase === 'warmup' ? subtopicId : null);

  const queryClient = useQueryClient();

  // Time tracking mutation with XP rewards
  const trackTimeMutation = useMutation({
    mutationFn: async (data: { subtopicId: string, timeSpent: number, focusTime?: number }) => {
      await api.patch(`/progress/${data.subtopicId}/track-time`, { 
        time_spent: data.timeSpent,
        focus_time: data.focusTime || 0,
        session_phase: sessionPhase
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['timeSummary']);
      queryClient.invalidateQueries(['progress']);
    },
  });

  // Learning completion mutation
  const completeLearnMutation = useMutation({
    mutationFn: async () => {
      if (!subtopicId) throw new Error('No subtopic ID');
      console.log('🔄 Starting learn completion for subtopicId:', subtopicId);
      const result = await learningAPI.completeSubtopic(subtopicId, Math.floor(timeSpentRef.current / 60));
      console.log('✅ Learn completion API response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('🎉 Learn completion success callback triggered');
      console.log('📊 Completion API response:', data);
      console.log('📊 Invalidating queries for roadmapId:', roadmapId, 'subtopicId:', subtopicId);
      
      // Track learn completion
      if (subtopic && subtopicId) {
        analytics.learnCompleted({
          subtopicId: subtopicId,
          subtopicTitle: subtopic,
          timeSpent: Math.floor(timeSpentRef.current / 60), // Convert to minutes
          roadmapId: roadmapId ? parseInt(roadmapId) : undefined,
        });
      }
      
      setIsCompleted(true);
      
      // More aggressive cache busting - remove all cached data and force refetch
      queryClient.removeQueries({ 
        predicate: query => query.queryKey[0] === 'progress'
      });
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      queryClient.invalidateQueries(['timeSummary']);
      
      // Also invalidate progress for the specific roadmap
      if (roadmapId) {
        queryClient.invalidateQueries({ 
          queryKey: ['progress', roadmapId],
          exact: false // This will match any query that starts with ['progress', roadmapId]
        });
        
        // Force immediate refetch with new data
        queryClient.refetchQueries({
          queryKey: ['progress', roadmapId],
          exact: false
        });
      }
      
      // Set session storage flags for journey page reload
      sessionStorage.setItem('returning-from-learn', 'true');
      sessionStorage.setItem(`learn-completed-${subtopicId}`, 'true');
      sessionStorage.setItem('force-progress-refresh', Date.now().toString());
      
      // Set a timestamp for when this completion happened
      sessionStorage.setItem('last-learn-completion', Date.now().toString());
      
      console.log('🔄 Query invalidation completed');
    },
    onError: (error) => {
      console.error('❌ Failed to mark learning as complete:', error);
    }
  });

  // Session phase management
  const advancePhase = useCallback(async () => {
    const phaseTransitions = {
      'warmup': 'focus',
      'focus': 'checkpoint',
      'checkpoint': 'reward',
      'reward': 'prime_next',
      'prime_next': 'focus'
    };

    const nextPhase = phaseTransitions[sessionPhase] as typeof sessionPhase;
    
    setShowPhaseTransition(true);
    
    // Award XP based on phase completion
    const phaseXP = {
      'warmup': 5,
      'focus': Math.round(timeInCurrentPhase / 60 * 2), // 2 XP per minute of focus
      'checkpoint': 10,
      'reward': 3,
      'prime_next': 8
    };

    await awardXPForActivity('phase_completion', {
      phase: sessionPhase,
      time_spent: timeInCurrentPhase,
      focus_mode: focusMode,
      reading_progress: readingProgress
    });

    // Transition session in backend
    if (currentSessionId) {
      await transitionSession(nextPhase.toUpperCase(), {
        previous_phase: sessionPhase,
        phase_duration: timeInCurrentPhase,
        reading_progress: readingProgress,
        microgoals_completed: completedMicrogoals.length
      });
    }

    // Show phase transition feedback
    showNotification({
      type: 'session',
      title: `${sessionPhase.charAt(0).toUpperCase() + sessionPhase.slice(1)} Complete!`,
      message: `+${phaseXP[sessionPhase]} XP • Moving to ${nextPhase.replace('_', ' ')} phase`,
      duration: 3000,
      priority: 'medium'
    });

    setTimeout(() => {
      setSessionPhase(nextPhase);
      setTimeInCurrentPhase(0);
      phaseStartTimeRef.current = Date.now();
      setShowPhaseTransition(false);
      
      // Set focus mode for focus phase
      if (nextPhase === 'focus' && !focusMode) {
        toggleFocus(true, FOCUS_SESSION_DURATION);
      }
      
      // Generate microgoal for focus phase
      if (nextPhase === 'focus') {
        generateMicrogoal();
      }
    }, 2000);
  }, [sessionPhase, timeInCurrentPhase, focusMode, readingProgress, completedMicrogoals, awardXPForActivity, showNotification, transitionSession, currentSessionId, toggleFocus]);

  // Generate contextual microgoals
  const generateMicrogoal = useCallback(() => {
    const microgoals = [
      'Read and understand the next 2 paragraphs thoroughly',
      'Identify 3 key concepts in this section',
      'Summarize the main idea in your own words',
      'Connect this concept to something you already know',
      'Find one practical application of this knowledge',
      'Complete this section without distractions',
    ];
    
    const goal = microgoals[Math.floor(Math.random() * microgoals.length)];
    setCurrentMicrogoal(goal);
    
    showNotification({
      type: 'focus',
      title: 'Focus Goal',
      message: goal,
      duration: 5000,
      priority: 'low'
    });
  }, [showNotification]);

  // Complete microgoal
  const completeMicrogoal = useCallback(async () => {
    if (currentMicrogoal && !completedMicrogoals.includes(currentMicrogoal)) {
      setCompletedMicrogoals(prev => [...prev, currentMicrogoal]);
      
      await awardXPForActivity('microgoal_completion', {
        goal: currentMicrogoal,
        session_phase: sessionPhase,
        focus_mode: focusMode
      });
      
      showNotification({
        type: 'xp',
        title: 'Microgoal Achieved! 🎯',
        message: '+15 XP for focused learning',
        duration: 2000,
        priority: 'medium'
      });
      
      // Generate next microgoal if still in focus phase
      if (sessionPhase === 'focus') {
        setTimeout(() => generateMicrogoal(), 3000);
      }
    }
  }, [currentMicrogoal, completedMicrogoals, sessionPhase, focusMode, awardXPForActivity, showNotification, generateMicrogoal]);

  // Initialize learning session
  useEffect(() => {
    const initializeSession = async () => {
      if (subtopicId && !currentSessionId) {
        await createLearningSession(roadmapId);
        
        // Start with warmup challenge if available
        if (sessionPhase === 'warmup' && subtopicId) {
          setTimeout(() => startChallenge(), 2000);
        }
      }
    };
    
    initializeSession();
  }, [subtopicId, currentSessionId, createLearningSession, roadmapId, sessionPhase, startChallenge]);

  // Phase timing and progression
  useEffect(() => {
    const phaseDurations = {
      'warmup': 3 * 60, // 3 minutes
      'focus': 25 * 60, // 25 minutes
      'checkpoint': 2 * 60, // 2 minutes
      'reward': 1 * 60, // 1 minute
      'prime_next': 2 * 60 // 2 minutes
    };

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - phaseStartTimeRef.current) / 1000);
      setTimeInCurrentPhase(elapsed);
      setTotalSessionTime(prev => prev + 1);
      
      // Auto-advance phase when duration is reached
      if (elapsed >= phaseDurations[sessionPhase]) {
        advancePhase();
      }
      
      // Award XP for sustained focus
      if (sessionPhase === 'focus' && elapsed % 300 === 0 && elapsed > 0) { // Every 5 minutes
        awardXPForActivity('sustained_focus', {
          focus_duration: elapsed,
          reading_progress: readingProgress,
          focus_mode: focusMode
        });
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionPhase, advancePhase, readingProgress, focusMode, awardXPForActivity]);

  // Time tracking for learning analytics
  useEffect(() => {
    if (!subtopicId) return;

    const trackingInterval = setInterval(() => {
      timeSpentRef.current += TIME_TRACKING_INTERVAL / 1000;
      
      if (timeSpentRef.current >= TIME_TRACKING_INTERVAL / 1000) {
        trackTimeMutation.mutate({ 
          subtopicId, 
          timeSpent: timeSpentRef.current,
          focusTime: focusMode ? timeSpentRef.current : 0
        });
        timeSpentRef.current = 0;
      }
    }, TIME_TRACKING_INTERVAL);

    return () => {
      clearInterval(trackingInterval);
      if (timeSpentRef.current > 0) {
        trackTimeMutation.mutate({ 
          subtopicId, 
          timeSpent: timeSpentRef.current,
          focusTime: focusMode ? timeSpentRef.current : 0
        });
      }
    };
  }, [subtopicId, trackTimeMutation, focusMode]);

  // Reading progress tracking
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const progress = Math.min(100, (scrollTop / (scrollHeight - clientHeight)) * 100);
        const newProgress = Math.round(progress);
        
        if (newProgress > readingProgress && newProgress % 25 === 0) {
          // Award XP for reading progress milestones
          awardXPForActivity('reading_progress', {
            progress_milestone: newProgress,
            session_phase: sessionPhase,
            focus_mode: focusMode
          });
        }
        
        setReadingProgress(newProgress);
      }
    };

    const contentElement = contentRef.current;
    contentElement?.addEventListener('scroll', handleScroll);

    return () => {
      contentElement?.removeEventListener('scroll', handleScroll);
    };
  }, [readingProgress, sessionPhase, focusMode, awardXPForActivity]);

  // Load learning content
  const handleLoadLearningContent = async (subtopic: string) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await api.get(`/ml/learn?subtopic=${encodeURIComponent(subtopic)}&subtopic_id=${subtopicId}`);
      const data: LearningContentResponse = response.data;
      setContentData(data);
      setContent(data.content);
      setLearningContext({
        subject: data.subject,
        goal: data.goal,
        subtopic: data.subtopic
      });
      
      // Award XP for starting learning session
      await awardXPForActivity('learning_session_start', {
        subtopic: subtopic,
        subtopic_id: subtopicId
      });
    } catch (err: any) {
      setFetchError(err.response?.data?.detail || err.message || 'Failed to load learning content');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize content loading
  useEffect(() => {
    if (subtopic) {
      handleLoadLearningContent(subtopic);
      // Track learn started
      if (subtopicId) {
        analytics.learnStarted(subtopicId, subtopic);
      }
    } else {
      setIsLoading(false);
    }
  }, [subtopic]);

  // Load next subtopic information and check completion status
  useEffect(() => {
    const loadNextSubtopic = async () => {
      if (subtopicId && roadmapId) {
        setIsLoadingNextSubtopic(true);
        try {
          const nextSubtopicData = await getNextSubtopic(roadmapId, subtopicId);
          setNextSubtopic(nextSubtopicData);
          
          // Check if current topic is already completed
          const progressResponse = await api.get(`/progress/${roadmapId}`);
          const currentProgress = progressResponse.data.find((p: any) => p.sub_topic_id === subtopicId);
          if (currentProgress?.learn_completed) {
            setIsCompleted(true);
          }
        } catch (error) {
          console.error('Error loading next subtopic:', error);
        } finally {
          setIsLoadingNextSubtopic(false);
        }
      }
    };

    loadNextSubtopic();
  }, [subtopicId, roadmapId]);

  const getPhaseColor = (phase: string) => {
    const colors = {
      'warmup': 'from-orange-500 to-red-500',
      'focus': 'from-blue-600 to-indigo-600',
      'checkpoint': 'from-green-500 to-emerald-500',
      'reward': 'from-purple-500 to-pink-500',
      'prime_next': 'from-indigo-500 to-purple-500'
    };
    return colors[phase as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'warmup': return <Zap className="w-5 h-5" />;
      case 'focus': return <Target className="w-5 h-5" />;
      case 'checkpoint': return <CheckCircle className="w-5 h-5" />;
      case 'reward': return <Award className="w-5 h-5" />;
      case 'prime_next': return <ArrowRight className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 transition-colors duration-300" data-theme="light" style={{colorScheme: 'light'}}>
      {/* Enhanced Learning Header */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 lg:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Logo />
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              <Link 
                href="/" 
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm">Home</span>
              </Link>
              <Link 
                href="/explore" 
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">Explore</span>
              </Link>
              <Link 
                href="/journey" 
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Target className="w-4 h-4" />
                <span className="text-sm">Journey</span>
              </Link>
              <Link 
                href="/performance-analysis" 
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Performance</span>
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Save and Share Buttons */}
              {contentData && (
                <div className="hidden lg:block">
                  <SaveShareButtons 
                    content={contentData}
                    onContentUpdate={setContentData}
                  />
                </div>
              )}
              
              {/* Profile Dropdown */}
              <ProfileDropdown />

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden flex items-center justify-center w-10 h-10 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute right-0 top-20 bottom-0 w-80 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="space-y-2">
                <Link 
                  href="/"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </Link>
                <Link 
                  href="/explore"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Explore</span>
                </Link>
                <Link 
                  href="/journey"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  <Target className="w-5 h-5" />
                  <span>Journey</span>
                </Link>
                <Link 
                  href="/performance-analysis"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Performance</span>
                </Link>
              </div>
              
              {/* Mobile Save and Share */}
              {contentData && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <SaveShareButtons 
                    content={contentData}
                    onContentUpdate={setContentData}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Learning Context Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 truncate">
                {subtopic || 'Learning Session'}
              </h1>
              {roadmapTitle && (
                <p className="text-sm text-gray-600 mt-1">
                  Part of: {roadmapTitle}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Simple Progress */}
              <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">{readingProgress}% complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Content with TOC */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {fetchError ? (
          <div className="bg-red-50 border border-red-200 p-4 sm:p-8 text-center rounded-lg">
            <div className="text-red-800 text-base sm:text-lg font-semibold mb-2">
              Content Loading Error
            </div>
            <div className="text-red-700 text-sm mb-4">
              {fetchError}
            </div>
            <button
              onClick={() => subtopic && handleLoadLearningContent(subtopic)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8 sm:py-16">
            <div className="text-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base">Loading learning content...</p>
            </div>
          </div>
        ) : content ? (
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            {/* TOC Sidebar - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:block">
              <FloatingTOC content={content} />
            </div>
            
            {/* Main Content */}
            <div ref={contentRef} className="flex-1 max-w-none lg:max-w-4xl overflow-x-auto">
              <LearningContentRenderer 
                content={content} 
                subject={learningContext.subject}
                subtopic={learningContext.subtopic}
              />
              
              {/* Completion and Next Actions */}
              <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
                <div className="text-center space-y-4">
                  {/* Mark as Complete Button */}
                  {!isCompleted && (
                    <div>
                      <p className="text-gray-600 text-sm sm:text-base mb-3">Finished reading? Mark this topic as learned!</p>
                      <button
                        onClick={() => completeLearnMutation.mutate()}
                        disabled={completeLearnMutation.isPending}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {completeLearnMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>Marking Complete...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Mark as Learned</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Completion Success Message */}
                  {isCompleted && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-center text-green-800 mb-3">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span className="font-medium">Learning completed! Great job! 🎉</span>
                      </div>
                      <div className="text-center">
                        <Link
                          href="/journey"
                          onClick={() => sessionStorage.setItem('returning-from-learn', 'true')}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-sm"
                        >
                          <ArrowRight className="w-4 h-4 rotate-180" />
                          <span>Back to Journey</span>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Quiz Button for Current Subtopic */}
                  {subtopic && subtopicId && roadmapId && (
                    <div className="mb-6">
                      <p className="text-gray-600 text-sm sm:text-base mb-2">Test your knowledge!</p>
                      <p className="text-gray-500 text-xs sm:text-sm mb-3">
                        Take a quiz on: {subtopic}
                      </p>
                      <Link 
                        href={`/quiz?subtopic_id=${subtopicId}&subtopic=${encodeURIComponent(subtopic)}&subject=${encodeURIComponent(learningContext.subject || 'General Subject')}&goal=${encodeURIComponent(learningContext.goal || 'Learn new concepts')}&roadmap_id=${roadmapId}`}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                        onClick={() => {
                          // Track that user is going to quiz from learn page
                          sessionStorage.setItem('returning-from-learn', 'true');
                          analytics?.track('quiz_started_from_learn', {
                            subtopic_id: subtopicId,
                            subtopic: subtopic,
                            roadmap_id: roadmapId
                          });
                        }}
                      >
                        <Brain className="w-4 h-4" />
                        <span>Take Quiz</span>
                      </Link>
                    </div>
                  )}

                  {/* Next Subtopic Button */}
                  {nextSubtopic && (
                    <div>
                      <p className="text-gray-600 text-sm sm:text-base mb-2">Ready for the next topic?</p>
                      <p className="text-gray-500 text-xs sm:text-sm mb-3">
                        {nextSubtopic.topic_title} • {nextSubtopic.subtopic_title}
                      </p>
                      <Link 
                        href={`/learn?subtopic=${encodeURIComponent(nextSubtopic.subtopic_title)}&subtopic_id=${nextSubtopic.subtopic_id}&roadmap_id=${roadmapId}`}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                      >
                        <span>Continue Learning</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}

                  {!nextSubtopic && !isLoadingNextSubtopic && subtopicId && roadmapId && (
                    <div className="text-gray-500 text-sm">🎊 You've reached the end of your roadmap!</div>
                  )}
                </div>
              </div>
              
              {isLoadingNextSubtopic && (
                <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 text-center">
                  <div className="text-gray-500 text-sm">Loading next topic...</div>
                </div>
              )}
              
            </div>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-16 px-4">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
              No Learning Content Available
            </h2>
            <p className="text-gray-500 mb-4 text-sm sm:text-base">
              Please select a topic to start your learning session.
            </p>
            <button
              onClick={() => setIsOldLearnPagesModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded transition-colors text-sm sm:text-base"
            >
              Browse Learning Content
            </button>
          </div>
        )}
      </div>

      {/* Old Learn Pages Modal */}
      <OldLearnPagesModal
        isOpen={isOldLearnPagesModalOpen}
        onClose={() => setIsOldLearnPagesModalOpen(false)}
        onLoadLearningContent={(content) => {
          setContentData(content);
          setContent(content.content);
          setLearningContext({
            subject: content.subject,
            goal: content.goal,
            subtopic: content.subtopic
          });
          setIsOldLearnPagesModalOpen(false);
        }}
      />
    </div>
  );
};

export default BehavioralLearnClientPage;