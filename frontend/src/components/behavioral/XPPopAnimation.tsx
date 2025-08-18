'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, Zap } from 'lucide-react';
import { useBehavioralContext } from '../../app/context/BehavioralContext';

interface XPPopProps {
  xpAmount?: number;
  activityType?: string;
  position?: { x: number; y: number };
}

const XPPopAnimation: React.FC<XPPopProps> = ({ 
  xpAmount = 0, 
  activityType = 'activity',
  position 
}) => {
  const { showXPPop, setShowXPPop } = useBehavioralContext();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (showXPPop && xpAmount > 0) {
      setShouldShow(true);
      const timer = setTimeout(() => {
        setShouldShow(false);
        setShowXPPop(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showXPPop, xpAmount, setShowXPPop]);

  const getActivityMessage = (type: string) => {
    switch (type) {
      case 'quiz_completion': return 'Quiz Complete!';
      case 'subtopic_completion': return 'Topic Mastered!';
      case 'focus_time': return 'Focused Study!';
      case 'streak_bonus': return 'Streak Bonus!';
      case 'quick_challenge': return 'Quick Win!';
      default: return 'Great Progress!';
    }
  };

  const popVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.5, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 600,
        damping: 20,
        duration: 0.3
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: -30,
      transition: {
        duration: 0.4
      }
    }
  };

  const sparkleVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        delay: 0.2,
        duration: 0.3
      }
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          style={{
            left: position?.x ? `${position.x}px` : '50%',
            top: position?.y ? `${position.y}px` : '50%',
            transform: position ? 'translate(-50%, -50%)' : undefined
          }}
        >
          <motion.div
            variants={popVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative"
          >
            {/* Main XP bubble */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-6 py-3 shadow-2xl border-2 border-white/30">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-lg">
                  +{xpAmount} XP
                </span>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="text-center text-xs text-white/90 font-medium mt-1">
                {getActivityMessage(activityType)}
              </div>
            </div>

            {/* Sparkle effects */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                variants={sparkleVariants}
                initial="hidden"
                animate="visible"
                className={`absolute w-2 h-2 bg-yellow-300 rounded-full ${
                  i === 0 ? '-top-2 -left-2' :
                  i === 1 ? '-top-2 -right-2' :
                  i === 2 ? '-bottom-2 -left-2' :
                  i === 3 ? '-bottom-2 -right-2' :
                  i === 4 ? 'top-0 -left-4' :
                  'top-0 -right-4'
                }`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}

            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-yellow-400"
              animate={{
                scale: [1, 1.5, 2],
                opacity: [0.8, 0.4, 0],
              }}
              transition={{
                duration: 1,
                times: [0, 0.5, 1],
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Global XP Pop that can be triggered from anywhere
export const GlobalXPPop: React.FC = () => {
  const { showXPPop } = useBehavioralContext();
  const [lastXPAmount, setLastXPAmount] = useState(0);
  
  // Listen for XP award events to capture the actual earned amount
  useEffect(() => {
    const handleXPAward = (event: CustomEvent) => {
      if (event.detail?.xp_earned) {
        setLastXPAmount(event.detail.xp_earned);
      }
    };
    
    window.addEventListener('xpAwarded', handleXPAward as EventListener);
    return () => window.removeEventListener('xpAwarded', handleXPAward as EventListener);
  }, []);
  
  return (
    <XPPopAnimation 
      xpAmount={showXPPop ? lastXPAmount : 0}
      activityType="quiz_question"
    />
  );
};

export default XPPopAnimation;