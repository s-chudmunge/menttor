// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Clock, Target, Zap, BookOpen, Trophy, Star, 
  TrendingUp, Focus, Calendar, X, ChevronRight, Lightbulb,
  Timer, Award, ArrowRight, Eye, Coffee, Sunset
} from 'lucide-react';
import { useBehavioralContext } from '../../app/context/BehavioralContext';
import { useBehavioralStats, useNudging, useMomentum, useLearningPatterns } from '../../hooks/useBehavioral';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

interface NudgeConfig {
  id: string;
  type: 'reminder' | 'encouragement' | 'suggestion' | 'celebration' | 'optimization';
  priority: 'low' | 'medium' | 'high';
  frequency: 'once' | 'daily' | 'session' | 'contextual';
  pages: string[];
  conditions: (stats: any, context: any) => boolean;
  content: {
    title: string;
    message: string;
    action?: string;
    actionUrl?: string;
  };
  icon: React.ReactNode;
  color: string;
  dismissible: boolean;
  autoHide?: number; // seconds
}

const SmartNudgeSystem: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: behavioralStats } = useBehavioralStats();
  const { recordInteraction, shouldShow } = useNudging();
  const { momentumScore, momentumLevel } = useMomentum();
  const { optimalTime, hasData: hasOptimalTimeData } = useLearningPatterns();
  
  const [activeNudges, setActiveNudges] = useState<string[]>([]);
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());
  const [lastNudgeTime, setLastNudgeTime] = useState<Date | null>(null);

  // Smart nudge configurations
  const nudgeConfigs: NudgeConfig[] = [
    // Learning Streak Nudges
    {
      id: 'streak_reminder',
      type: 'reminder',
      priority: 'medium',
      frequency: 'daily',
      pages: ['/journey', '/learn', '/'],
      conditions: (stats) => {
        if (!stats?.streak_stats) return false;
        const { current_streak, grace_days_remaining } = stats.streak_stats;
        const lastActivity = new Date(stats.last_activity || Date.now());
        const hoursAgo = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
        
        return current_streak > 0 && hoursAgo > 18 && grace_days_remaining > 0;
      },
      content: {
        title: 'Don\'t Break the Chain! 🔥',
        message: 'You have a {streak}-day streak going. A quick 5-minute session will keep it alive!',
        action: 'Continue Learning',
        actionUrl: '/learn'
      },
      icon: <Zap className="w-5 h-5 text-orange-500" />,
      color: 'from-orange-500 to-red-500',
      dismissible: true,
      autoHide: 30
    },
    
    // Momentum-Based Nudges
    {
      id: 'high_momentum',
      type: 'optimization',
      priority: 'high',
      frequency: 'contextual',
      pages: ['/journey', '/learn'],
      conditions: (stats, { momentumScore }) => momentumScore >= 5,
      content: {
        title: 'Perfect Learning State! ⚡',
        message: 'Your momentum is at peak levels. This is the ideal time to tackle challenging material.',
        action: 'Take on Advanced Content',
      },
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
      color: 'from-blue-500 to-indigo-600',
      dismissible: true,
      autoHide: 15
    },
    
    // Optimal Time Nudges
    {
      id: 'optimal_time',
      type: 'suggestion',
      priority: 'medium',
      frequency: 'daily',
      pages: ['/journey', '/'],
      conditions: (stats, { optimalTime, currentHour }) => {
        if (!optimalTime?.best_window) return false;
        const [bestTime, data] = optimalTime.best_window;
        const timeRanges = {
          morning: [5, 12],
          afternoon: [12, 17], 
          evening: [17, 22],
          night: [22, 5]
        };
        const [start, end] = timeRanges[bestTime] || [0, 24];
        return currentHour >= start && currentHour < end && data.completion_rate > 0.8;
      },
      content: {
        title: 'Prime Learning Time! 🌟',
        message: 'You typically learn best during this time with {completion_rate}% completion rate.',
        action: 'Start Learning Session',
        actionUrl: '/learn'
      },
      icon: <Clock className="w-5 h-5 text-green-500" />,
      color: 'from-green-500 to-emerald-600',
      dismissible: true
    },
    
    // Level Up Preparation
    {
      id: 'near_level_up',
      type: 'encouragement',
      priority: 'high',
      frequency: 'contextual',
      pages: ['/journey', '/quiz', '/learn'],
      conditions: (stats) => {
        if (!stats?.xp_stats) return false;
        const { progress_to_next } = stats.xp_stats;
        return progress_to_next >= 0.8; // 80% to next level
      },
      content: {
        title: 'Level Up! 🏆',
        message: '{percentage}% to Level {next_level}! One more session!',
        action: 'Continue'
      },
      icon: <Trophy className="w-5 h-5 text-yellow-500" />,
      color: 'from-yellow-500 to-orange-500',
      dismissible: true,
      autoHide: 20
    },
    
    // Focus Mode Suggestions
    {
      id: 'focus_suggestion',
      type: 'suggestion',
      priority: 'medium',
      frequency: 'session',
      pages: ['/learn', '/quiz'],
      conditions: (stats, { pageTime }) => {
        return pageTime > 300 && !stats?.engagement_stats?.focus_mode_enabled; // 5+ minutes on page
      },
      content: {
        title: 'Focus Mode Available 🎯',
        message: 'You\'ve been learning for a while. Enable Focus Mode for deeper concentration and bonus XP.',
        action: 'Enable Focus Mode'
      },
      icon: <Focus className="w-5 h-5 text-indigo-500" />,
      color: 'from-indigo-500 to-purple-600',
      dismissible: true
    },
    
    // Return Nudges (for users who haven't been active)
    {
      id: 'welcome_back',
      type: 'encouragement',
      priority: 'low',
      frequency: 'once',
      pages: ['/journey', '/'],
      conditions: (stats) => {
        if (!stats?.last_activity) return false;
        const daysAgo = (Date.now() - new Date(stats.last_activity).getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo >= 3 && daysAgo <= 7; // Been away for 3-7 days
      },
      content: {
        title: 'Welcome Back! 👋',
        message: 'Ready to continue your learning journey? Your progress is waiting for you.',
        action: 'Resume Learning',
        actionUrl: '/journey'
      },
      icon: <BookOpen className="w-5 h-5 text-blue-500" />,
      color: 'from-blue-500 to-cyan-600',
      dismissible: true
    },
    
    // Quiz Performance Nudges - DISABLED FOR BETTER UX
    /*
    {
      id: 'quiz_streak_suggestion',
      type: 'suggestion',
      priority: 'medium',
      frequency: 'contextual',
      pages: ['/learn', '/journey'],
      conditions: (stats) => {
        // Suggest quiz after learning session
        const recentXP = stats?.xp_stats?.total_xp || 0;
        // This is a simplified check - in practice would track recent learning activity
        return recentXP > 0 && pathname === '/learn';
      },
      content: {
        title: 'Test Your Knowledge! 🧠',
        message: 'You\'ve been learning well. A quick quiz will reinforce your understanding and earn bonus XP.',
        action: 'Take Quiz',
        actionUrl: '/quiz'
      },
      icon: <Brain className="w-5 h-5 text-purple-500" />,
      color: 'from-purple-500 to-pink-600',
      dismissible: true
    },
    */
    
    // Consistency Encouragement - DISABLED
    // {
    //   id: 'consistency_milestone',
    //   type: 'celebration',
    //   priority: 'high',
    //   frequency: 'once',
    //   pages: ['/journey', '/results'],
    //   conditions: (stats) => {
    //     const streak = stats?.streak_stats?.current_streak || 0;
    //     return [7, 14, 30, 60, 100].includes(streak); // Milestone streaks
    //   },
    //   content: {
    //     title: 'Consistency Master! 🎉',
    //     message: '{streak} days of consistent learning! You\'re building incredible learning habits.',
    //     action: 'View Progress'
    //   },
    //   icon: <Award className="w-5 h-5 text-gold-500" />,
    //   color: 'from-yellow-400 via-orange-500 to-red-500',
    //   dismissible: true,
    //   autoHide: 10
    // }
  ];

  // Context for nudge evaluation
  const getNudgeContext = useCallback(() => {
    return {
      pathname,
      currentHour: new Date().getHours(),
      momentumScore,
      momentumLevel,
      optimalTime,
      hasOptimalTimeData,
      pageTime: 0, // Would track actual page time in real implementation
      dayOfWeek: new Date().getDay(),
      timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                 new Date().getHours() < 17 ? 'afternoon' : 
                 new Date().getHours() < 22 ? 'evening' : 'night'
    };
  }, [pathname, momentumScore, momentumLevel, optimalTime, hasOptimalTimeData]);

  // Evaluate which nudges should be shown
  const evaluateNudges = useCallback(async () => {
    if (!behavioralStats) return;

    const context = getNudgeContext();
    const potentialNudges = [];

    for (const config of nudgeConfigs) {
      // Skip if already dismissed
      if (dismissedNudges.has(config.id)) continue;
      
      // Skip if not on relevant page
      if (!config.pages.some(page => pathname.startsWith(page))) continue;
      
      // Check backend permission
      const shouldShowNudge = await shouldShow(config.id);
      if (!shouldShowNudge) continue;
      
      // Evaluate conditions
      if (config.conditions(behavioralStats, context)) {
        potentialNudges.push(config);
      }
    }

    // Sort by priority and limit to prevent overwhelming
    const sortedNudges = potentialNudges
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 2); // Max 2 nudges at once

    // Respect timing - don't show nudges too frequently
    if (lastNudgeTime && (Date.now() - lastNudgeTime.getTime()) < 300000) { // 5 minutes
      return;
    }

    if (sortedNudges.length > 0) {
      setActiveNudges(sortedNudges.map(n => n.id));
      setLastNudgeTime(new Date());
    }
  }, [behavioralStats, dismissedNudges, pathname, lastNudgeTime, shouldShow, getNudgeContext]);

  // Periodic nudge evaluation
  useEffect(() => {
    const interval = setInterval(() => {
      evaluateNudges();
    }, 60000); // Check every minute

    // Initial evaluation
    setTimeout(() => evaluateNudges(), 2000); // Slight delay on page load

    return () => clearInterval(interval);
  }, [evaluateNudges]);

  const handleNudgeAction = useCallback((nudge: NudgeConfig) => {
    recordInteraction(nudge.id, 'engaged');
    
    if (nudge.content.actionUrl) {
      router.push(nudge.content.actionUrl);
    }
    
    setActiveNudges(prev => prev.filter(id => id !== nudge.id));
  }, [recordInteraction, router]);

  const handleNudgeDismiss = useCallback((nudgeId: string) => {
    recordInteraction(nudgeId, 'dismissed');
    setDismissedNudges(prev => new Set([...prev, nudgeId]));
    setActiveNudges(prev => prev.filter(id => id !== nudgeId));
  }, [recordInteraction]);

  const interpolateNudgeContent = (content: NudgeConfig['content'], stats: any) => {
    const replacements = {
      '{streak}': stats?.streak_stats?.current_streak || 0,
      '{percentage}': Math.round((stats?.xp_stats?.progress_to_next || 0) * 100),
      '{next_level}': (stats?.xp_stats?.current_level || 0) + 1,
      '{completion_rate}': Math.round(((optimalTime?.best_window?.[1]?.completion_rate || 0) * 100))
    };

    return {
      ...content,
      title: Object.entries(replacements).reduce((str, [key, value]) => 
        str.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), String(value)), content.title),
      message: Object.entries(replacements).reduce((str, [key, value]) => 
        str.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), String(value)), content.message)
    };
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 space-y-3 max-w-sm">
      <AnimatePresence mode="popLayout">
        {activeNudges.map((nudgeId) => {
          const config = nudgeConfigs.find(n => n.id === nudgeId);
          if (!config) return null;

          const interpolatedContent = interpolateNudgeContent(config.content, behavioralStats);

          return (
            <motion.div
              key={nudgeId}
              initial={{ opacity: 0, x: -300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -300, scale: 0.9 }}
              transition={{ 
                duration: 0.4,
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              className={`
                ${config.color.replace('bg-gradient-to-r ', 'bg-')} text-white rounded-xl p-3 shadow-lg 
                border border-white/20 backdrop-blur-sm cursor-pointer group
                hover:shadow-xl hover:scale-105 transition-all duration-200 max-w-xs
              `}
            >
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  {React.cloneElement(config.icon, { className: "w-4 h-4" })}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-xs">
                      {interpolatedContent.title}
                    </h4>
                    {config.dismissible && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNudgeDismiss(nudgeId);
                        }}
                        className="text-white/70 hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  <p className="text-xs text-white/90 leading-tight mb-2">
                    {interpolatedContent.message}
                  </p>
                  
                  {interpolatedContent.action && (
                    <button
                      onClick={() => handleNudgeAction(config)}
                      className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-medium transition-all duration-200 group/button"
                    >
                      <span>{interpolatedContent.action}</span>
                      <ChevronRight className="w-3 h-3 group-hover/button:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Auto-hide progress bar */}
              {config.autoHide && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/40 rounded-b-2xl"
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ 
                    duration: config.autoHide,
                    ease: "linear" 
                  }}
                  onAnimationComplete={() => handleNudgeDismiss(nudgeId)}
                />
              )}
              
              {/* Priority indicator */}
              {config.priority === 'high' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default SmartNudgeSystem;