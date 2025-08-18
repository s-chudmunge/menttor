'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Star, Trophy, Zap, Target, Brain, Clock, Award } from 'lucide-react';
import { useBehavioralContext, BehavioralNotification } from '../../app/context/BehavioralContext';

const BehavioralNotifications: React.FC = () => {
  const { notifications, dismissNotification } = useBehavioralContext();
  const [visibleNotifications, setVisibleNotifications] = useState<BehavioralNotification[]>([]);

  // Limit visible notifications to avoid overwhelming the user
  useEffect(() => {
    const maxVisible = 3;
    const sortedByPriority = [...notifications]
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, maxVisible);
    
    setVisibleNotifications(sortedByPriority);
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'xp': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'levelup': return <Trophy className="w-5 h-5 text-gold-500" />;
      case 'streak': return <Zap className="w-5 h-5 text-orange-500" />;
      case 'milestone': return <Award className="w-5 h-5 text-purple-500" />;
      case 'reward': return <Target className="w-5 h-5 text-blue-500" />;
      case 'focus': return <Brain className="w-5 h-5 text-indigo-500" />;
      case 'session': return <Clock className="w-5 h-5 text-green-500" />;
      default: return <Star className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'levelup':
        return {
          bg: 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30',
          border: 'border-yellow-200 dark:border-yellow-700',
          title: 'text-yellow-800 dark:text-yellow-200',
          message: 'text-yellow-700 dark:text-yellow-300'
        };
      case 'milestone':
        return {
          bg: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30',
          border: 'border-purple-200 dark:border-purple-700',
          title: 'text-purple-800 dark:text-purple-200',
          message: 'text-purple-700 dark:text-purple-300'
        };
      case 'reward':
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30',
          border: 'border-blue-200 dark:border-blue-700',
          title: 'text-blue-800 dark:text-blue-200',
          message: 'text-blue-700 dark:text-blue-300'
        };
      default:
        return {
          bg: 'bg-white/95 dark:bg-gray-800/95',
          border: 'border-gray-200 dark:border-gray-700',
          title: 'text-gray-800 dark:text-gray-200',
          message: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification) => {
          const styles = getNotificationStyles(notification.type);
          const icon = getNotificationIcon(notification.type);
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ 
                duration: 0.4,
                type: "spring",
                stiffness: 400,
                damping: 25
              }}
              className={`
                ${styles.bg} ${styles.border}
                backdrop-blur-sm border rounded-2xl p-4 shadow-xl max-w-sm
                pointer-events-auto cursor-pointer hover:shadow-2xl transition-shadow
              `}
              onClick={() => dismissNotification(notification.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${styles.title}`}>
                    {notification.title}
                  </div>
                  <div className={`text-xs mt-1 ${styles.message}`}>
                    {notification.message}
                  </div>
                  
                  {/* Special handling for XP notifications */}
                  {notification.type === 'xp' && notification.data && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="flex-1 bg-yellow-200 dark:bg-yellow-800 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(notification.data.total_xp % notification.data.xp_to_next_level) / notification.data.xp_to_next_level * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                        L{notification.data.current_level}
                      </span>
                    </div>
                  )}
                  
                  {/* Special handling for milestone notifications */}
                  {notification.type === 'milestone' && notification.data && (
                    <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                      Progress: {Math.round(notification.data.progress_percentage)}%
                    </div>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification(notification.id);
                  }}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Progress bar for notification duration */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ 
                  duration: notification.duration / 1000,
                  ease: "linear"
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default BehavioralNotifications;