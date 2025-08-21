'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useBehavioralStats, useXPSystem, useStreakSystem, useRewards, useSessionFSM } from '../../hooks/useBehavioral';
import { XPAwardResult, RewardEvent } from '../../lib/behavioral-api';

// Notification types for different behavioral events
export interface BehavioralNotification {
  id: string;
  type: 'xp' | 'levelup' | 'streak' | 'milestone' | 'reward' | 'focus' | 'session';
  title: string;
  message: string;
  data?: any;
  duration: number;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface BehavioralContextValue {
  // Notification system
  notifications: BehavioralNotification[];
  showNotification: (notification: Omit<BehavioralNotification, 'id' | 'createdAt'>) => void;
  dismissNotification: (id: string) => void;
  
  // Real-time behavioral actions
  awardXPForActivity: (activityType: string, context: any) => Promise<void>;
  updateUserStreak: () => Promise<void>;
  triggerReward: (eventType: string, data: any) => void;
  
  // Session management
  currentSessionId: number | null;
  sessionState: string | null;
  createLearningSession: (roadmapId: number) => Promise<void>;
  transitionSession: (newState: string, context?: any) => Promise<void>;
  
  // UI state
  showXPPop: boolean;
  setShowXPPop: (show: boolean) => void;
  pendingRewards: RewardEvent[];
  
  // Behavioral stats
  behavioralStats: any;
}

const BehavioralContext = createContext<BehavioralContextValue | undefined>(undefined);

export const useBehavioralContext = () => {
  const context = useContext(BehavioralContext);
  if (!context) {
    throw new Error('useBehavioralContext must be used within a BehavioralProvider');
  }
  return context;
};

interface BehavioralProviderProps {
  children: ReactNode;
  roadmapId?: number;
}

export const BehavioralProvider: React.FC<BehavioralProviderProps> = ({ 
  children, 
  roadmapId = 1 
}) => {
  // State
  const [notifications, setNotifications] = useState<BehavioralNotification[]>([]);
  const [showXPPop, setShowXPPop] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  // Behavioral hooks
  const { data: behavioralStats } = useBehavioralStats();
  const { awardXP, isAwarding, lastAward } = useXPSystem();
  const { updateStreak } = useStreakSystem();
  const { recentRewards } = useRewards();
  const { 
    currentSession, 
    createSession, 
    transitionSession: transitionSessionHook 
  } = useSessionFSM(roadmapId);

  // Notification management
  const showNotification = useCallback((notification: Omit<BehavioralNotification, 'id' | 'createdAt'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: BehavioralNotification = {
      ...notification,
      id,
      createdAt: new Date()
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-dismiss based on duration and priority
    setTimeout(() => {
      dismissNotification(id);
    }, notification.duration);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Real-time behavioral actions
  const awardXPForActivity = useCallback(async (activityType: string, context: any) => {
    try {
      awardXP({ activityType, context });
      
      // Show XP pop animation (will be handled by lastAward effect)
      setShowXPPop(true);
      
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  }, [awardXP]);

  const updateUserStreak = useCallback(async () => {
    try {
      updateStreak();
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }, [updateStreak]);

  const triggerReward = useCallback((eventType: string, data: any) => {
    // This will be handled by the backend's variable reward system
    // Frontend just needs to display rewards when they occur
    if (Math.random() < 0.35) { // Match backend probability
      showNotification({
        type: 'reward',
        title: 'Great Progress!',
        message: 'You\'re building excellent learning momentum! 🌟',
        duration: 4000,
        priority: 'medium',
        data
      });
    }
  }, [showNotification]);

  const createLearningSession = useCallback(async (roadmapId: number) => {
    try {
      createSession({ sessionPlan: 'adaptive_learning' });
    } catch (error) {
      console.error('Error creating learning session:', error);
    }
  }, [createSession]);

  const transitionSession = useCallback(async (newState: string, context?: any) => {
    if (!currentSessionId) return;
    
    try {
      transitionSessionHook({ newState, context });
    } catch (error) {
      console.error('Error transitioning session:', error);
    }
  }, [currentSessionId, transitionSessionHook]);

  // Handle behavioral events from hooks
  useEffect(() => {
    if (lastAward) {
      // Dispatch XP event for animation
      window.dispatchEvent(new CustomEvent('xpAwarded', { detail: lastAward }));
      
      // Clear XP pop after animation duration
      setTimeout(() => setShowXPPop(false), 2000);
      
      // Show XP gain notification
      showNotification({
        type: 'xp',
        title: `+${lastAward.xp_earned} XP`,
        message: `Level ${lastAward.current_level} • ${lastAward.xp_to_next_level} XP to next level`,
        duration: 5000,
        priority: 'medium',
        data: lastAward
      });

      // Handle level up
      if (lastAward.level_up_occurred) {
        showNotification({
          type: 'levelup',
          title: `Level Up! 🎉`,
          message: `You've reached Level ${lastAward.new_level}!`,
          duration: 5000,
          priority: 'high',
          data: lastAward
        });
      }

      // Handle milestone completion
      if (lastAward.milestone_completed?.just_completed) {
        showNotification({
          type: 'milestone',
          title: 'Milestone Achieved! 🏆',
          message: lastAward.milestone_completed.milestone.milestone_name,
          duration: 6000,
          priority: 'high',
          data: lastAward.milestone_completed
        });
      }
    }
  }, [lastAward, showNotification]);

  // Update current session state
  useEffect(() => {
    if (currentSession) {
      setCurrentSessionId(currentSession.session_id);
    }
  }, [currentSession]);

  // Handle reward events
  useEffect(() => {
    if (recentRewards.length > 0) {
      const latestReward = recentRewards[0];
      if (latestReward && !latestReward.engaged) {
        showNotification({
          type: 'reward',
          title: 'Celebration!',
          message: latestReward.content.title || latestReward.content.content || 'Great work!',
          duration: 4000,
          priority: 'medium',
          data: latestReward
        });
      }
    }
  }, [recentRewards, showNotification]);

  const value: BehavioralContextValue = {
    // Notification system
    notifications,
    showNotification,
    dismissNotification,
    
    // Real-time behavioral actions
    awardXPForActivity,
    updateUserStreak,
    triggerReward,
    
    // Session management
    currentSessionId,
    sessionState: currentSession?.state || null,
    createLearningSession,
    transitionSession,
    
    // UI state
    showXPPop,
    setShowXPPop,
    pendingRewards: recentRewards,
    
    // Behavioral stats
    behavioralStats
  };

  return (
    <BehavioralContext.Provider value={value}>
      {children}
    </BehavioralContext.Provider>
  );
};