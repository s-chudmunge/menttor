'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Target, Award, Crown, Gem, Shield, Medal, Zap, TrendingUp, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useBehavioralContext } from '../../app/context/BehavioralContext';
import { useBehavioralStats } from '../../hooks/useBehavioral';

interface Milestone {
  id: string;
  name: string;
  description: string;
  type: 'xp' | 'streak' | 'quiz_score' | 'learning_time' | 'topic_completion' | 'consistency';
  target: number;
  current: number;
  icon: React.ReactNode;
  color: string;
  rewards: string[];
  isCompleted: boolean;
  justCompleted?: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  xpReward: number;
}

const MilestoneSystem: React.FC = () => {
  const pathname = usePathname();
  const { behavioralStats, showNotification } = useBehavioralContext();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showMilestonePanel, setShowMilestonePanel] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  
  // Only show on dashboard page
  const isDashboardPage = pathname === '/dashboard';

  // Generate dynamic milestones based on user progress
  const generateMilestones = useCallback((): Milestone[] => {
    if (!behavioralStats) return [];

    const stats = behavioralStats;
    const currentLevel = stats.xp_stats?.current_level || 1;
    const totalXP = stats.xp_stats?.total_xp || 0;
    const currentStreak = stats.streak_stats?.current_streak || 0;
    const longestStreak = stats.streak_stats?.longest_streak || 0;
    const totalFocusTime = stats.engagement_stats?.focus_time || 0;

    return [
      // XP-based milestones
      {
        id: 'xp_100',
        name: 'First Century',
        description: 'Earn your first 100 XP',
        type: 'xp',
        target: 100,
        current: totalXP,
        icon: <Star className="w-6 h-6" />,
        color: 'from-yellow-400 to-orange-500',
        rewards: ['Achievement Badge', 'XP Multiplier +10%'],
        isCompleted: totalXP >= 100
      },
      {
        id: 'xp_500',
        name: 'Knowledge Seeker',
        description: 'Accumulate 500 XP',
        type: 'xp',
        target: 500,
        current: totalXP,
        icon: <Trophy className="w-6 h-6" />,
        color: 'from-blue-400 to-green-500',
        rewards: ['Rare Badge', 'Focus Mode Enhancement'],
        isCompleted: totalXP >= 500
      },
      {
        id: 'xp_1000',
        name: 'Scholar',
        description: 'Master learner with 1000+ XP',
        type: 'xp',
        target: 1000,
        current: totalXP,
        icon: <Crown className="w-6 h-6" />,
        color: 'from-green-500 to-pink-500',
        rewards: ['Epic Badge', 'Advanced Analytics'],
        isCompleted: totalXP >= 1000
      },
      
      // Streak-based milestones
      {
        id: 'streak_3',
        name: 'Getting Started',
        description: 'Maintain a 3-day learning streak',
        type: 'streak',
        target: 3,
        current: currentStreak,
        icon: <Zap className="w-6 h-6" />,
        color: 'from-orange-400 to-red-500',
        rewards: ['Streak Shield', 'Bonus XP +20%'],
        isCompleted: longestStreak >= 3
      },
      {
        id: 'streak_7',
        name: 'Consistent Learner',
        description: 'Achieve a 7-day learning streak',
        type: 'streak',
        target: 7,
        current: currentStreak,
        icon: <Shield className="w-6 h-6" />,
        color: 'from-green-400 to-blue-500',
        rewards: ['Weekly Warrior Badge', 'Grace Days +1'],
        isCompleted: longestStreak >= 7
      },
      {
        id: 'streak_30',
        name: 'Dedication Master',
        description: 'Unstoppable 30-day streak',
        type: 'streak',
        target: 30,
        current: currentStreak,
        icon: <Medal className="w-6 h-6" />,
        color: 'from-green-500 to-green-600',
        rewards: ['Legendary Badge', 'Streak Insurance'],
        isCompleted: longestStreak >= 30
      },
      
      // Level-based milestones
      {
        id: 'level_5',
        name: 'Rising Star',
        description: 'Reach Level 5',
        type: 'xp',
        target: 5,
        current: currentLevel,
        icon: <Target className="w-6 h-6" />,
        color: 'from-cyan-400 to-blue-500',
        rewards: ['Star Badge', 'Advanced Features'],
        isCompleted: currentLevel >= 5
      },
      {
        id: 'level_10',
        name: 'Expert Learner',
        description: 'Achieve Level 10',
        type: 'xp',
        target: 10,
        current: currentLevel,
        icon: <Gem className="w-6 h-6" />,
        color: 'from-emerald-400 to-teal-500',
        rewards: ['Expert Badge', 'Custom Learning Paths'],
        isCompleted: currentLevel >= 10
      },
      
      // Focus time milestones
      {
        id: 'focus_60',
        name: 'Focused Mind',
        description: 'Complete 1 hour of focused learning',
        type: 'learning_time',
        target: 60,
        current: Math.floor(totalFocusTime / 60),
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'from-green-400 to-green-500',
        rewards: ['Focus Master Badge', 'Extended Sessions'],
        isCompleted: totalFocusTime >= 3600 // 1 hour in seconds
      }
    ];
  }, [behavioralStats]);

  // Check for newly completed milestones
  useEffect(() => {
    if (!behavioralStats) return;
    
    const currentMilestones = generateMilestones();
    
    // Only process if we have previous milestones to compare against
    if (milestones.length > 0) {
      // Find newly completed milestones
      const newlyCompleted = currentMilestones.filter(current => {
        const previous = milestones.find(p => p.id === current.id);
        return current.isCompleted && (!previous || !previous.isCompleted);
      });
      
      // Create achievements for newly completed milestones
      const newAchievementsList = newlyCompleted.map(milestone => ({
        id: `achievement_${milestone.id}`,
        name: milestone.name,
        description: milestone.description,
        icon: milestone.icon,
        rarity: milestone.target >= 1000 ? 'legendary' : 
                milestone.target >= 500 ? 'epic' :
                milestone.target >= 100 ? 'rare' : 'common',
        unlockedAt: new Date(),
        xpReward: milestone.target >= 1000 ? 100 :
                  milestone.target >= 500 ? 50 :
                  milestone.target >= 100 ? 25 : 15
      } as Achievement));
      
      if (newAchievementsList.length > 0) {
        setNewAchievements(newAchievementsList);
        setAchievements(prev => [...prev, ...newAchievementsList]);
        
        // Show notifications for new achievements
        newAchievementsList.forEach(achievement => {
          showNotification({
            type: 'milestone',
            title: `🏆 ${achievement.name}`,
            message: `${achievement.description} (+${achievement.xpReward} XP)`,
            duration: 6000,
            priority: 'high',
            data: achievement
          });
        });
      }
    }
    
    setMilestones(currentMilestones);
  }, [behavioralStats]); // Removed dependencies that cause loops

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 via-orange-500 to-red-600';
      case 'epic': return 'from-green-500 via-pink-500 to-red-500';
      case 'rare': return 'from-blue-500 via-green-500 to-pink-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getProgressPercentage = (milestone: Milestone) => {
    return Math.min(100, (milestone.current / milestone.target) * 100);
  };

  return (
    <>
      {/* Professional Milestone Progress Indicator - Only show on dashboard */}
      {isDashboardPage && (
      <motion.div
        className="fixed top-20 left-4 z-40"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
      >
        <motion.button
          onClick={() => setShowMilestonePanel(!showMilestonePanel)}
          className="group relative bg-blue-600 dark:bg-blue-700 text-white rounded-md p-1.5 shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative">
            <Trophy className="w-5 h-5 text-white group-hover:text-yellow-300 transition-colors" />
            
            {/* Active milestone indicator */}
            {milestones.filter(m => !m.isCompleted).length > 0 && (
              <div className="absolute -top-1 -right-1">
                <div className="w-3 h-3 bg-yellow-400 dark:bg-yellow-500 rounded-full shadow-sm" />
              </div>
            )}
            
            {/* Progress count */}
            <div className="absolute -bottom-1 -right-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-bold">
              {milestones.filter(m => m.isCompleted).length}/{milestones.length}
            </div>
          </div>
          
          {/* Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            View Milestones & Achievements
            <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </motion.button>
      </motion.div>
      )}

      {/* Enhanced Milestone Panel */}
      <AnimatePresence>
        {showMilestonePanel && (
          <motion.div
            initial={{ opacity: 0, x: -300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -300, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed top-20 left-20 z-50 w-72 max-h-[75vh] overflow-y-auto"
          >
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                    <div className="w-6 h-6 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <span>Milestones</span>
                  </h3>
                </div>
                <button
                  onClick={() => setShowMilestonePanel(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-2">
                {milestones.map(milestone => (
                  <motion.div
                    key={milestone.id}
                    className={`p-3 rounded-xl transition-all duration-300 cursor-pointer group ${
                      milestone.isCompleted
                        ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-600 shadow-lg shadow-green-500/10'
                        : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg'
                    }`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-lg ${milestone.color.replace('bg-gradient-to-r ', 'bg-')} text-white shadow-md group-hover:scale-105 transition-transform duration-200`}>
                          {milestone.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-0.5">
                            {milestone.name}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                            {milestone.description}
                          </p>
                        </div>
                      </div>
                      
                      {milestone.isCompleted && (
                        <div className="ml-2">
                          <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                            <Trophy className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex justify-between items-center text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <span>Progress</span>
                        <span className="font-bold">{milestone.current}/{milestone.target}</span>
                      </div>
                      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className={`${milestone.color.replace('bg-gradient-to-r ', 'bg-')} h-full rounded-full relative`}
                          initial={{ width: 0 }}
                          animate={{ width: `${getProgressPercentage(milestone)}%` }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        >
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </motion.div>
                        {milestone.isCompleted && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-white drop-shadow-lg">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 text-right">
                        {Math.round(getProgressPercentage(milestone))}%
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rewards:</div>
                      <div className="flex flex-wrap gap-1">
                        {milestone.rewards.slice(0, 2).map((reward, idx) => (
                          <span key={idx} className="text-xs bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-600">
                            {reward.length > 12 ? reward.substring(0, 12) + '...' : reward}
                          </span>
                        ))}
                        {milestone.rewards.length > 2 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-0.5">
                            +{milestone.rewards.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Recent Achievements */}
              {achievements.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
                    <Award className="w-3 h-3" />
                    <span>Recent</span>
                  </h4>
                  <div className="space-y-1">
                    {achievements.slice(-2).map(achievement => (
                      <motion.div
                        key={achievement.id}
                        className={`p-1.5 rounded-lg ${getRarityColor(achievement.rarity).replace('bg-gradient-to-r ', 'bg-')} text-white text-xs`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center space-x-1.5">
                          <div className="w-3 h-3">{achievement.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium text-xs">{achievement.name}</div>
                          </div>
                          <div className="text-xs opacity-75">
                            +{achievement.xpReward}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Celebration Modal */}
      <AnimatePresence>
        {newAchievements.map(achievement => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={() => setNewAchievements(prev => prev.filter(a => a.id !== achievement.id))}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ 
                duration: 0.8, 
                type: "spring", 
                stiffness: 200,
                damping: 15 
              }}
              className={`relative ${getRarityColor(achievement.rarity).replace('bg-gradient-to-br ', 'bg-').replace('bg-gradient-to-r ', 'bg-')} rounded-2xl p-8 shadow-2xl text-white max-w-md text-center`}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
                className="mb-4"
              >
                {achievement.icon}
              </motion.div>
              
              <h2 className="text-2xl font-bold mb-2">Achievement Unlocked!</h2>
              <h3 className="text-xl font-semibold mb-2">{achievement.name}</h3>
              <p className="text-sm opacity-90 mb-4">{achievement.description}</p>
              
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="bg-white/20 rounded-full px-3 py-1">
                  <span className="font-semibold">+{achievement.xpReward} XP</span>
                </div>
                <div className="bg-white/20 rounded-full px-3 py-1 capitalize">
                  {achievement.rarity}
                </div>
              </div>
              
              {/* Sparkle effects */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 2, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
};

export default MilestoneSystem;