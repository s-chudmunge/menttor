// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Target, Brain, Zap, Star, BookOpen, Play, Pause, 
  Focus, Award, TrendingUp, Eye, Timer, CheckCircle, ArrowRight
} from 'lucide-react';

import LearningContentRenderer from '../../../components/learning/LearningContentRenderer';
import OldLearnPagesModal from './OldLearnPagesModal';
import FloatingTOC from '../../../components/learning/FloatingTOC';
import SaveShareButtons from '../../../components/learning/SaveShareButtons';
import { useBehavioralContext } from '../context/BehavioralContext';
import { useFocusMode, useSessionFSM, useBehavioralStats, useQuickChallenge } from '../../hooks/useBehavioral';
import { api, LearningContentResponse } from '../../lib/api';

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
  
  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const timeSpentRef = useRef(0);
  const phaseStartTimeRef = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // URL parameters
  const searchParams = useSearchParams();
  const subtopic = searchParams.get('subtopic');
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
    } else {
      setIsLoading(false);
    }
  }, [subtopic]);

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
    <div className="min-h-screen bg-white">
      {/* Clean Learning Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {subtopic || 'Learning Session'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Save and Share Buttons */}
              {contentData && (
                <SaveShareButtons 
                  content={contentData}
                  onContentUpdate={setContentData}
                />
              )}
              
              {/* Simple Progress */}
              <span className="text-sm text-gray-600">{readingProgress}% complete</span>
              
              {/* Focus Mode Toggle */}
              <button
                onClick={() => toggleFocus(!focusMode, FOCUS_SESSION_DURATION)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  focusMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {focusMode ? 'Focus ON' : 'Focus Mode'}
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Learning Content with TOC */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {fetchError ? (
          <div className="bg-red-50 border border-red-200 p-8 text-center">
            <div className="text-red-800 text-lg font-semibold mb-2">
              Content Loading Error
            </div>
            <div className="text-red-700 text-sm mb-4">
              {fetchError}
            </div>
            <button
              onClick={() => subtopic && handleLoadLearningContent(subtopic)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading learning content...</p>
            </div>
          </div>
        ) : content ? (
          <div className="flex gap-8">
            {/* TOC Sidebar */}
            <FloatingTOC content={content} />
            
            {/* Main Content */}
            <div ref={contentRef} className="flex-1 max-w-4xl">
              <LearningContentRenderer 
                content={content} 
                subject={learningContext.subject}
                subtopic={learningContext.subtopic}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              No Learning Content Available
            </h2>
            <p className="text-gray-500 mb-4">
              Please select a topic to start your learning session.
            </p>
            <button
              onClick={() => setIsOldLearnPagesModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 transition-colors"
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