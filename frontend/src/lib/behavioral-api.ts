/**
 * Behavioral Design API Client
 * Handles all behavioral psychology features on the frontend
 */

import { api } from './api';

// ===== TYPES =====

export interface UserBehaviorStats {
  xp_stats: {
    total_xp: number;
    current_level: number;
    xp_to_next_level: number;
    progress_to_next: number;
  };
  streak_stats: {
    current_streak: number;
    longest_streak: number;
    grace_days_remaining: number;
  };
  engagement_stats: {
    momentum_score: number;
    nudge_intensity: number;
    total_rewards: number;
    focus_time: number;
  };
  learning_patterns: {
    preferred_session_length: number;
    optimal_windows: any;
  };
}

export interface LearningSession {
  session_id: number;
  state: 'WARMUP' | 'FOCUS' | 'CHECKPOINT' | 'REWARD' | 'PRIME_NEXT';
  plan?: string;
  time_bucket: string;
  start_time: string;
  duration_minutes: number;
  activities_completed: {
    warmup: boolean;
    focus: boolean;
    checkpoint: boolean;
    reward: boolean;
  };
  session_data: any;
}

export interface QuickChallenge {
  challenge_id: number;
  type: string;
  question: string;
  options: Array<{ id: string; text: string }>;
  estimated_seconds: number;
}

export interface ChallengeResult {
  correct: boolean;
  explanation: string;
  response_time: number;
  xp_earned: number;
  momentum_bonus: boolean;
}

export interface RewardEvent {
  id: number;
  type: string;
  content: any;
  trigger: string;
  created_at: string;
  engaged: boolean;
}

export interface XPAwardResult {
  xp_earned: number;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  level_up_occurred: boolean;
  new_level?: number;
  milestone_completed?: any;
}

// ===== API CLIENT =====

class BehavioralAPI {
  // USER STATS AND PROGRESSION
  async getUserStats(): Promise<UserBehaviorStats> {
    const response = await api.get('/behavioral/user-stats');
    return response.data;
  }

  async awardXP(activityType: string, context: any): Promise<XPAwardResult> {
    const response = await api.post('/behavioral/award-xp', {
      activity_type: activityType,
      context
    });
    return response.data;
  }

  async updateStreak(): Promise<any> {
    const response = await api.post('/behavioral/update-streak');
    return response.data;
  }

  async getProgressCopy(roadmapId: number, copyType: 'metric' | 'distance' | 'identity' = 'metric'): Promise<{ copy: string; type: string }> {
    const response = await api.get(`/behavioral/progress-copy/${roadmapId}?copy_type=${copyType}`);
    return response.data;
  }

  // SESSION MANAGEMENT
  async createSession(roadmapId: number, sessionPlan?: string): Promise<{ session_id: number; state: string; plan?: string; time_bucket: string }> {
    const response = await api.post('/behavioral/session/create', {
      roadmap_id: roadmapId,
      session_plan: sessionPlan,
      estimated_duration: 20
    });
    return response.data;
  }

  async transitionSession(sessionId: number, newState: string, context?: any): Promise<{ session_id: number; state: string; reward?: any }> {
    const response = await api.post('/behavioral/session/transition', {
      session_id: sessionId,
      new_state: newState,
      context
    });
    return response.data;
  }

  async getSessionStatus(sessionId: number): Promise<LearningSession> {
    const response = await api.get(`/behavioral/session/${sessionId}`);
    return response.data;
  }

  // QUICK CHALLENGES
  async getWarmupChallenge(subtopicId: string): Promise<QuickChallenge> {
    const response = await api.get(`/behavioral/challenges/warmup/${subtopicId}`);
    return response.data;
  }

  async submitChallengeAttempt(challengeId: number, userAnswer: string, responseTimeSeconds: number, confidenceLevel?: number): Promise<ChallengeResult> {
    const response = await api.post('/behavioral/challenges/attempt', {
      challenge_id: challengeId,
      user_answer: userAnswer,
      response_time_seconds: responseTimeSeconds,
      confidence_level: confidenceLevel,
      attempt_context: 'warmup'
    });
    return response.data;
  }

  // ELO SYSTEM
  async getEloRatings(): Promise<Record<string, number>> {
    const response = await api.get('/behavioral/elo-ratings');
    return response.data;
  }

  async updateElo(conceptTag: string, outcome: number, itemDifficulty: number = 1200): Promise<{ concept: string; new_elo: number; outcome: number }> {
    const response = await api.post(`/behavioral/update-elo?concept_tag=${conceptTag}&outcome=${outcome}&item_difficulty=${itemDifficulty}`);
    return response.data;
  }

  // REWARDS
  async getRecentRewards(limit: number = 10): Promise<RewardEvent[]> {
    const response = await api.get(`/behavioral/rewards/recent?limit=${limit}`);
    return response.data;
  }

  async engageWithReward(rewardId: number, engaged: boolean, engagementTime?: number): Promise<{ status: string }> {
    const response = await api.post('/behavioral/rewards/engage', {
      reward_id: rewardId,
      engaged,
      engagement_time_seconds: engagementTime
    });
    return response.data;
  }

  // NUDGING
  async recordNudgeInteraction(nudgeType: string, interaction: 'dismissed' | 'engaged' | 'ignored'): Promise<{ nudge_type: string; interaction: string; new_intensity: number }> {
    const response = await api.post('/behavioral/nudge/interaction', {
      nudge_type: nudgeType,
      interaction
    });
    return response.data;
  }

  async shouldShowNudge(nudgeType: string): Promise<{ should_show: boolean }> {
    const response = await api.get(`/behavioral/nudge/should-show/${nudgeType}`);
    return response.data;
  }

  // LEARNING PATTERNS
  async getOptimalLearningTime(): Promise<any> {
    const response = await api.get('/behavioral/learning-patterns/optimal-time');
    return response.data;
  }

  async getPrerequisiteStatus(subtopicId: string): Promise<any> {
    const response = await api.get(`/behavioral/prerequisites/${subtopicId}`);
    return response.data;
  }

  async getMomentumScore(): Promise<{ momentum_score: number }> {
    const response = await api.get('/behavioral/momentum');
    return response.data;
  }

  // FOCUS MODE
  async toggleFocusMode(enable: boolean, durationMinutes: number = 20): Promise<{ focus_mode_enabled: boolean; total_focus_time: number; session_length: number }> {
    const response = await api.post(`/behavioral/focus/toggle?enable=${enable}&duration_minutes=${durationMinutes}`);
    return response.data;
  }
}

export const behavioralAPI = new BehavioralAPI();

// ===== UTILITY FUNCTIONS =====

export const calculateLevelFromXP = (xp: number): { level: number; xpInLevel: number; xpForNextLevel: number } => {
  let level = 1;
  let totalXPRequired = 0;
  
  while (totalXPRequired + (level * 100) <= xp) {
    totalXPRequired += level * 100;
    level++;
  }
  
  const xpInLevel = xp - totalXPRequired;
  const xpForNextLevel = level * 100;
  
  return { level, xpInLevel, xpForNextLevel };
};

export const formatXPToNextLevel = (currentXP: number): string => {
  const { level, xpInLevel, xpForNextLevel } = calculateLevelFromXP(currentXP);
  const remaining = xpForNextLevel - xpInLevel;
  
  if (remaining <= 50) return `${remaining} XP to Level ${level + 1}`;
  if (remaining <= 180) return `Level up in ~${Math.ceil(remaining / 20)} activities`;
  return `${Math.round(remaining / 100 * 10) / 10}% to Level ${level + 1}`;
};

export const getStreakMessage = (streak: number, graceDays: number): string => {
  if (streak === 0) return "Start your learning streak today!";
  if (streak === 1) return "Great start! Keep the momentum going.";
  if (streak < 7) return `${streak}-day streak! Building consistency.`;
  if (streak < 14) return `${streak}-day streak! You're on fire! 🔥`;
  if (streak < 30) return `${streak}-day streak! Amazing dedication! ⭐`;
  return `${streak}-day streak! Learning legend! 🏆`;
};

export const getMilestoneProgress = (current: number, target: number): { percentage: number; message: string } => {
  const percentage = Math.min(100, (current / target) * 100);
  
  let message = "";
  if (percentage >= 100) {
    message = "Milestone achieved! 🎉";
  } else if (percentage >= 80) {
    message = `Almost there! ${target - current} to go`;
  } else if (percentage >= 50) {
    message = `Halfway to your milestone!`;
  } else if (percentage >= 25) {
    message = `Making solid progress`;
  } else {
    message = `Starting your journey`;
  }
  
  return { percentage, message };
};

export const getTimeOfDayMessage = (hour: number): string => {
  if (hour >= 5 && hour < 12) return "Good morning! Perfect time to learn something new.";
  if (hour >= 12 && hour < 17) return "Good afternoon! Ready for a learning session?";
  if (hour >= 17 && hour < 22) return "Good evening! Time to level up your skills.";
  return "Late night learning session? You're dedicated!";
};

export const shouldShowReward = (rewardType: string, lastReward?: Date): boolean => {
  if (!lastReward) return true;
  
  const hoursSinceReward = (new Date().getTime() - lastReward.getTime()) / (1000 * 60 * 60);
  
  // Variable reward schedule logic
  const minHours = rewardType === 'milestone' ? 0 : 1; // Milestones can always show
  return hoursSinceReward >= minHours;
};