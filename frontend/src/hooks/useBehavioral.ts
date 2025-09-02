/**
 * Behavioral Design Hooks
 * React hooks for the behavioral psychology features
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import { behavioralAPI, UserBehaviorStats, LearningSession, QuickChallenge, RewardEvent, XPAwardResult } from '@/lib/behavioral-api';
import { useState, useEffect, useCallback } from 'react';

// ===== USER STATS HOOK =====

export const useBehavioralStats = () => {
  const { user, loading } = useAuth();
  
  return useQuery<UserBehaviorStats>({
    queryKey: ['behavioral-stats', user?.uid],
    queryFn: () => behavioralAPI.getUserStats(),
    enabled: !!user && !loading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    }
  });
};

// ===== XP AND PROGRESSION HOOKS =====

export const useXPSystem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const awardXP = useMutation({
    mutationFn: ({ activityType, context }: { activityType: string; context: any }) => 
      behavioralAPI.awardXP(activityType, context),
    onSuccess: (data: XPAwardResult) => {
      // Invalidate stats to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['behavioral-stats', user?.uid] });
      
      // Show level up celebration if it occurred
      if (data.level_up_occurred) {
        // Trigger level up animation/notification
        window.dispatchEvent(new CustomEvent('levelUp', { detail: data }));
      }
      
      // Show milestone completion if it occurred
      if (data.milestone_completed?.just_completed) {
        window.dispatchEvent(new CustomEvent('milestoneCompleted', { detail: data.milestone_completed }));
      }
    }
  });

  return {
    awardXP: awardXP.mutate,
    isAwarding: awardXP.isPending,
    lastAward: awardXP.data
  };
};

export const useStreakSystem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const updateStreak = useMutation({
    mutationFn: () => behavioralAPI.updateStreak(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-stats', user?.uid] });
    }
  });

  return {
    updateStreak: updateStreak.mutate,
    isUpdating: updateStreak.isPending,
    streakData: updateStreak.data
  };
};

// ===== PROGRESS COPY HOOK =====

export const useProgressCopy = (roadmapId: number) => {
  const [copyType, setCopyType] = useState<'metric' | 'distance' | 'identity'>('metric');
  
  const { data: copyData, refetch } = useQuery({
    queryKey: ['progress-copy', roadmapId, copyType],
    queryFn: () => behavioralAPI.getProgressCopy(roadmapId, copyType),
    enabled: !!roadmapId,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  // Rotate copy types every 30-90 seconds
  useEffect(() => {
    const rotateInterval = setInterval(() => {
      const types: Array<'metric' | 'distance' | 'identity'> = ['metric', 'distance', 'identity'];
      const currentIndex = types.indexOf(copyType);
      const nextIndex = (currentIndex + 1) % types.length;
      setCopyType(types[nextIndex]);
    }, 30000 + Math.random() * 60000); // 30-90 seconds

    return () => clearInterval(rotateInterval);
  }, [copyType]);

  return {
    copy: copyData?.copy || '',
    copyType: copyData?.type || 'metric',
    refreshCopy: refetch
  };
};

// ===== SESSION STATE MACHINE HOOK =====

export const useSessionFSM = (roadmapId: number) => {
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const createSession = useMutation({
    mutationFn: ({ sessionPlan }: { sessionPlan?: string }) => 
      behavioralAPI.createSession(roadmapId, sessionPlan),
    onSuccess: (data) => {
      setCurrentSessionId(data.session_id);
    }
  });

  const transitionSession = useMutation({
    mutationFn: ({ newState, context }: { newState: string; context?: any }) => 
      behavioralAPI.transitionSession(currentSessionId!, newState, context),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session-status', currentSessionId] });
      
      // Show reward if provided
      if (data.reward) {
        window.dispatchEvent(new CustomEvent('rewardReceived', { detail: data.reward }));
      }
    }
  });

  const { data: sessionStatus } = useQuery<LearningSession>({
    queryKey: ['session-status', currentSessionId],
    queryFn: () => behavioralAPI.getSessionStatus(currentSessionId!),
    enabled: !!currentSessionId,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  return {
    currentSession: sessionStatus,
    createSession: createSession.mutate,
    transitionSession: transitionSession.mutate,
    isCreating: createSession.isPending,
    isTransitioning: transitionSession.isPending
  };
};

// ===== QUICK CHALLENGES HOOK =====

export const useQuickChallenge = (subtopicId: string | null) => {
  const [challengeState, setChallengeState] = useState<'idle' | 'loading' | 'active' | 'completed'>('idle');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  const { data: challenge } = useQuery<QuickChallenge>({
    queryKey: ['warmup-challenge', subtopicId],
    queryFn: () => behavioralAPI.getWarmupChallenge(subtopicId!),
    enabled: !!subtopicId && challengeState === 'loading'
  });

  const submitAttempt = useMutation({
    mutationFn: ({ userAnswer, confidenceLevel }: { userAnswer: string; confidenceLevel?: number }) => {
      const responseTime = startTime ? (new Date().getTime() - startTime.getTime()) / 1000 : 0;
      return behavioralAPI.submitChallengeAttempt(challenge!.challenge_id, userAnswer, responseTime, confidenceLevel);
    },
    onSuccess: (result) => {
      setChallengeState('completed');
      queryClient.invalidateQueries({ queryKey: ['behavioral-stats'] });
      
      // Trigger momentum bonus animation if correct
      if (result.momentum_bonus) {
        window.dispatchEvent(new CustomEvent('momentumBonus', { detail: result }));
      }
    }
  });

  const startChallenge = useCallback(() => {
    setChallengeState('loading');
    setStartTime(new Date());
  }, []);

  const answerChallenge = useCallback((answer: string, confidence?: number) => {
    submitAttempt.mutate({ userAnswer: answer, confidenceLevel: confidence });
  }, [submitAttempt]);

  return {
    challenge,
    challengeState,
    result: submitAttempt.data,
    startChallenge,
    answerChallenge,
    isSubmitting: submitAttempt.isPending
  };
};

// ===== FOCUS MODE HOOK =====

export const useFocusMode = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [duration, setDuration] = useState(20); // minutes
  const queryClient = useQueryClient();

  const toggleFocus = useMutation({
    mutationFn: ({ enable, durationMinutes }: { enable: boolean; durationMinutes: number }) => 
      behavioralAPI.toggleFocusMode(enable, durationMinutes),
    onSuccess: (data) => {
      setIsEnabled(data.focus_mode_enabled);
      if (data.focus_mode_enabled) {
        setSessionStart(new Date());
        setDuration(data.session_length);
      } else {
        setSessionStart(null);
      }
      queryClient.invalidateQueries({ queryKey: ['behavioral-stats'] });
    }
  });

  const remainingTime = sessionStart ? 
    Math.max(0, duration * 60 - Math.floor((new Date().getTime() - sessionStart.getTime()) / 1000)) : 0;

  return {
    isEnabled,
    duration,
    remainingTime,
    sessionStart,
    toggleFocus: (enable: boolean, minutes?: number) => toggleFocus.mutate({ enable, durationMinutes: minutes || 20 }),
    isToggling: toggleFocus.isPending
  };
};

// ===== REWARDS HOOK =====

export const useRewards = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const { data: recentRewards } = useQuery<RewardEvent[]>({
    queryKey: ['recent-rewards'],
    queryFn: () => behavioralAPI.getRecentRewards(10),
    enabled: !!user && !loading,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    }
  });

  return {
    recentRewards: recentRewards || []
  };
};

// ===== NUDGING HOOK =====

export const useNudging = () => {
  const queryClient = useQueryClient();

  const recordInteraction = useMutation({
    mutationFn: ({ nudgeType, interaction }: { nudgeType: string; interaction: 'dismissed' | 'engaged' | 'ignored' }) =>
      behavioralAPI.recordNudgeInteraction(nudgeType, interaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-stats'] });
    }
  });

  const shouldShow = useCallback(async (nudgeType: string): Promise<boolean> => {
    try {
      const result = await behavioralAPI.shouldShowNudge(nudgeType);
      return result.should_show;
    } catch (error) {
      console.error('Error checking nudge visibility:', error);
      return false;
    }
  }, []);

  return {
    recordInteraction: recordInteraction.mutate,
    shouldShow,
    isRecording: recordInteraction.isPending
  };
};

// ===== ELO SYSTEM HOOK =====

export const useEloSystem = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const { data: eloRatings } = useQuery<Record<string, number>>({
    queryKey: ['elo-ratings'],
    queryFn: () => behavioralAPI.getEloRatings(),
    enabled: !!user && !loading,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    }
  });

  const updateElo = useMutation({
    mutationFn: ({ concept, outcome, difficulty }: { concept: string; outcome: number; difficulty?: number }) =>
      behavioralAPI.updateElo(concept, outcome, difficulty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elo-ratings'] });
    }
  });

  return {
    eloRatings: eloRatings || {},
    updateElo: updateElo.mutate,
    isUpdating: updateElo.isPending
  };
};

// ===== MOMENTUM TRACKING HOOK =====

export const useMomentum = () => {
  const { user, loading } = useAuth();
  
  const { data: momentum } = useQuery({
    queryKey: ['momentum-score'],
    queryFn: () => behavioralAPI.getMomentumScore(),
    enabled: !!user && !loading,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    }
  });

  const getMomentumLevel = (score: number): { level: string; color: string; message: string } => {
    if (score >= 5) return { level: 'high', color: 'green', message: 'You\'re on fire! 🔥' };
    if (score >= 3) return { level: 'medium', color: 'yellow', message: 'Building momentum! ⚡' };
    if (score >= 1) return { level: 'low', color: 'blue', message: 'Getting started 🌟' };
    return { level: 'none', color: 'gray', message: 'Ready to begin?' };
  };

  return {
    momentumScore: momentum?.momentum_score || 0,
    momentumLevel: getMomentumLevel(momentum?.momentum_score || 0)
  };
};

// ===== LEARNING PATTERNS HOOK =====

export const useLearningPatterns = () => {
  const { user, loading } = useAuth();
  
  const { data: optimalTime } = useQuery({
    queryKey: ['optimal-learning-time'],
    queryFn: () => behavioralAPI.getOptimalLearningTime(),
    enabled: !!user && !loading,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    }
  });

  return {
    optimalTime,
    hasData: optimalTime?.status !== 'insufficient_data'
  };
};

// ===== PREREQUISITES HOOK =====

export const usePrerequisites = (subtopicId: string | null) => {
  const { data: prerequisiteStatus } = useQuery({
    queryKey: ['prerequisites', subtopicId],
    queryFn: () => behavioralAPI.getPrerequisiteStatus(subtopicId!),
    enabled: !!subtopicId,
    staleTime: 5 * 60 * 1000
  });

  return {
    prerequisites: prerequisiteStatus?.prerequisites || {},
    allSatisfied: prerequisiteStatus?.all_satisfied || false,
    weakPrerequisites: prerequisiteStatus?.weak_prerequisites || []
  };
};

// ===== BEHAVIORAL EVENT LISTENERS =====

export const useBehavioralEvents = () => {
  useEffect(() => {
    const handleLevelUp = (event: CustomEvent) => {
      console.log('Level up!', event.detail);
      // Could trigger toast notification, confetti, etc.
    };

    const handleMilestone = (event: CustomEvent) => {
      console.log('Milestone completed!', event.detail);
      // Could trigger milestone celebration modal
    };

    const handleReward = (event: CustomEvent) => {
      console.log('Reward received!', event.detail);
      // Could trigger reward animation
    };

    const handleMomentum = (event: CustomEvent) => {
      console.log('Momentum bonus!', event.detail);
      // Could trigger momentum celebration
    };

    window.addEventListener('levelUp', handleLevelUp as EventListener);
    window.addEventListener('milestoneCompleted', handleMilestone as EventListener);
    window.addEventListener('rewardReceived', handleReward as EventListener);
    window.addEventListener('momentumBonus', handleMomentum as EventListener);

    return () => {
      window.removeEventListener('levelUp', handleLevelUp as EventListener);
      window.removeEventListener('milestoneCompleted', handleMilestone as EventListener);
      window.removeEventListener('rewardReceived', handleReward as EventListener);
      window.removeEventListener('momentumBonus', handleMomentum as EventListener);
    };
  }, []);
};