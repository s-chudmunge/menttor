'use client';

import React, { useState, useEffect } from 'react';
import { Star, Zap, Trophy, Timer, Brain, X, TrendingUp, Target } from 'lucide-react';
import { useBehavioralStats, useProgressCopy, useFocusMode } from '../../../hooks/useBehavioral';
import { formatXPToNextLevel, getStreakMessage } from '../../../lib/behavioral-api';

interface BehavioralIndicatorProps {
  roadmapId?: number;
  overallProgress: number;
  completedTopics: number;
  totalTopics: number;
}

const BehavioralIndicator: React.FC<BehavioralIndicatorProps> = ({
  roadmapId,
  overallProgress,
  completedTopics,
  totalTopics
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentNudge, setCurrentNudge] = useState<string | null>(null);
  
  // Behavioral hooks
  const { data: behavioralStats } = useBehavioralStats();
  const { copy: progressCopy } = useProgressCopy(roadmapId || 0);
  const { isEnabled: focusMode, duration, remainingTime, toggleFocus } = useFocusMode();

  // Show nudges periodically (much less frequent)
  useEffect(() => {
    if (!behavioralStats) return;
    
    const nudges: string[] = [];
    
    // Progress nudges (only show at certain milestones)
    if (overallProgress > 0 && overallProgress < 100) {
      // Only show at 25%, 50%, 75% milestones
      if ([25, 50, 75].some(milestone => Math.abs(overallProgress - milestone) < 5)) {
        nudges.push(`You're ${overallProgress}% there - keep the momentum going! 🚀`);
      }
    }
    
    // XP nudges (fix duplicate text and only show when close to leveling up)
    if (behavioralStats.xp_stats && behavioralStats.xp_stats.progress_to_next > 0.7) {
      const toNextLevel = formatXPToNextLevel(behavioralStats.xp_stats.total_xp);
      if (toNextLevel.includes('activities')) {
        nudges.push(`Almost there! ${toNextLevel} 🌟`);
      }
    }
    
    // Streak nudges (only for streaks >= 3 days)
    if (behavioralStats.streak_stats.current_streak >= 3) {
      nudges.push(`🔥 ${behavioralStats.streak_stats.current_streak} day streak - you're on fire!`);
    }
    
    // Show random nudge much less frequently (every 5 minutes instead of 30 seconds)
    if (nudges.length > 0) {
      // Show first nudge after 2 minutes, then every 5 minutes
      const firstTimeout = setTimeout(() => {
        const randomNudge = nudges[Math.floor(Math.random() * nudges.length)];
        setCurrentNudge(randomNudge);
        
        // Auto-hide after 8 seconds
        setTimeout(() => setCurrentNudge(null), 8000);
        
        // Set up interval for subsequent nudges
        const interval = setInterval(() => {
          const randomNudge = nudges[Math.floor(Math.random() * nudges.length)];
          setCurrentNudge(randomNudge);
          
          // Auto-hide after 8 seconds
          setTimeout(() => setCurrentNudge(null), 8000);
        }, 300000); // 5 minutes
        
        return () => clearInterval(interval);
      }, 120000); // 2 minutes
      
      return () => clearTimeout(firstTimeout);
    }
  }, [behavioralStats, overallProgress]);

  if (!behavioralStats) return null;

  return (
    <>
      {/* Floating Indicator Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Brain className="w-6 h-6" />
          
          {/* Notification Badge */}
          {currentNudge && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* Nudge Popup */}
        {currentNudge && (
          <div className="absolute bottom-16 right-0 w-80 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 transform transition-all duration-300">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-gray-900 dark:text-white">Motivation Boost</span>
              </div>
              <button
                onClick={() => setCurrentNudge(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {currentNudge}
            </p>
          </div>
        )}

        {/* Stats Panel */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 w-96 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-6 transform transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                <span>Learning Stats</span>
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Progress */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">Progress</span>
                  </div>
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {overallProgress}%
                  </span>
                </div>
                <div className="w-full h-3 bg-indigo-200 dark:bg-indigo-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 rounded-full"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <div className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                  {completedTopics}/{totalTopics} topics completed
                </div>
              </div>

              {/* XP & Level */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-100 dark:border-yellow-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-semibold text-yellow-700 dark:text-yellow-300">Level & XP</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    L{behavioralStats.xp_stats.current_level}
                  </span>
                </div>
                
                {/* Current XP Display */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    {behavioralStats.xp_stats.total_xp || 0} XP
                  </span>
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">
                    {behavioralStats.xp_stats.xp_to_next_level ? 
                      `${behavioralStats.xp_stats.xp_to_next_level} XP to go` : 
                      formatXPToNextLevel(behavioralStats.xp_stats.total_xp || 0)
                    }
                  </span>
                </div>
                
                {/* XP Progress Bar */}
                <div className="w-full h-2 bg-yellow-200 dark:bg-yellow-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500 rounded-full"
                    style={{ width: `${behavioralStats.xp_stats.progress_to_next * 100}%` }}
                  />
                </div>
                
                {/* XP Breakdown */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-yellow-700 dark:text-yellow-300">This Level</div>
                    <div className="text-yellow-600 dark:text-yellow-400">
                      {Math.round(behavioralStats.xp_stats.progress_to_next * 100)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-yellow-700 dark:text-yellow-300">To Next</div>
                    <div className="text-yellow-600 dark:text-yellow-400">
                      {behavioralStats.xp_stats.xp_to_next_level} XP
                    </div>
                  </div>
                </div>
              </div>

              {/* Streak */}
              {behavioralStats.streak_stats.current_streak > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 text-red-600 dark:text-red-400">🔥</div>
                      <span className="font-semibold text-red-700 dark:text-red-300">Streak</span>
                    </div>
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {behavioralStats.streak_stats.current_streak}d
                    </span>
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {getStreakMessage(behavioralStats.streak_stats.current_streak, behavioralStats.streak_stats.grace_days_remaining)}
                  </div>
                </div>
              )}

              {/* Focus Mode */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Timer className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="font-semibold text-purple-700 dark:text-purple-300">Focus Mode</span>
                  </div>
                  <button
                    onClick={() => toggleFocus(!focusMode, 25)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      focusMode 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-700'
                    }`}
                  >
                    {focusMode ? 'ON' : 'OFF'}
                  </button>
                </div>
                {focusMode ? (
                  <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                    {Math.ceil(remainingTime / 60)} minutes left
                  </div>
                ) : (
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    Eliminate distractions while learning
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {(isOpen || currentNudge) && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => {
            setIsOpen(false);
            setCurrentNudge(null);
          }}
        />
      )}
    </>
  );
};

export default BehavioralIndicator;