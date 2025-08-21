'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Star, Zap, Award, Target, Brain, Heart, Crown, Gem } from 'lucide-react';

interface RewardAnimationProps {
  type: 'confetti' | 'achievement' | 'streak_bonus' | 'level_up' | 'milestone';
  content: any;
  isVisible: boolean;
  onComplete: () => void;
}

// Confetti Particle Component
const ConfettiParticle: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  return (
    <motion.div
      className={`absolute w-3 h-3 ${color} rounded-full`}
      initial={{ 
        opacity: 1, 
        scale: 0,
        x: Math.random() * 100 - 50,
        y: 0,
        rotate: 0
      }}
      animate={{ 
        opacity: 0, 
        scale: 1,
        x: (Math.random() - 0.5) * 400,
        y: -200 + Math.random() * 100,
        rotate: 360
      }}
      transition={{ 
        duration: 2 + Math.random(), 
        delay,
        ease: "easeOut"
      }}
    />
  );
};


// Achievement Badge Animation
const AchievementBadge: React.FC<{ content: any; onClose: () => void }> = ({ content, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
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
        className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full p-12 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-white/50"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative z-10 text-center text-white">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
          >
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-200" />
          </motion.div>
          
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-bold mb-2"
          >
            {content.title || 'Achievement Unlocked!'}
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-yellow-100"
          >
            {content.description || 'Great accomplishment!'}
          </motion.p>
        </div>
        
        {/* Confetti burst */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <ConfettiParticle 
              key={i} 
              delay={i * 0.1} 
              color={`${['bg-yellow-300', 'bg-orange-300', 'bg-red-300', 'bg-pink-300'][i % 4]}`}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Level Up Celebration
const LevelUpCelebration: React.FC<{ content: any; onClose: () => void }> = ({ content, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 to-indigo-900/60 backdrop-blur-sm" />
      
      <motion.div
        initial={{ scale: 0, y: 100 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0, y: -100 }}
        transition={{ 
          duration: 1, 
          type: "spring", 
          stiffness: 150,
          damping: 20 
        }}
        className="relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main level display */}
        <motion.div
          className="relative"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full p-12 shadow-2xl border-4 border-white/30">
            <Crown className="w-20 h-20 text-white mx-auto mb-4" />
            <div className="text-white">
              <div className="text-6xl font-bold mb-2">
                {content.new_level || content.current_level}
              </div>
              <div className="text-xl font-semibold opacity-90">
                LEVEL UP!
              </div>
            </div>
          </div>
          
          {/* Pulse rings */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-yellow-400"
              animate={{
                scale: [1, 2, 3],
                opacity: [0.8, 0.4, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeOut"
              }}
            />
          ))}
        </motion.div>
        
        {/* Celebration text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-white"
        >
          <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
          <p className="text-xl text-yellow-200 mb-4">
            You've reached Level {content.new_level || content.current_level}
          </p>
          <div className="bg-white/20 rounded-full px-6 py-2 inline-block">
            <span className="text-lg font-semibold">
              +{content.xp_earned || 0} Total XP
            </span>
          </div>
        </motion.div>
        
        {/* Massive confetti */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <ConfettiParticle 
              key={i} 
              delay={i * 0.05} 
              color={`${['bg-yellow-400', 'bg-orange-400', 'bg-red-400', 'bg-pink-400', 'bg-purple-400'][i % 5]}`}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Streak Bonus Animation
const StreakBonus: React.FC<{ content: any; onClose: () => void }> = ({ content, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        }}
        transition={{ duration: 1, repeat: 2 }}
        className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 shadow-2xl text-white text-center"
      >
        <div className="flex items-center justify-center mb-3">
          <Zap className="w-8 h-8 text-yellow-300 mr-2" />
          <span className="text-2xl font-bold">
            {content.streak || 0} Day Streak!
          </span>
        </div>
        <p className="text-orange-100 mb-3">{content.description}</p>
        <div className="bg-white/20 rounded-full px-4 py-1 inline-block">
          <span className="font-semibold">+{content.bonus_xp || 0} XP</span>
        </div>
        
        {/* Fire particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-orange-400 rounded-full"
              style={{
                top: `${30 + Math.random() * 40}%`,
                left: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                y: [-10, -30, -50],
                opacity: [1, 0.5, 0],
                scale: [1, 1.5, 0],
              }}
              transition={{
                duration: 1 + Math.random(),
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Simple Confetti Burst
const ConfettiBurst: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {[...Array(30)].map((_, i) => (
        <ConfettiParticle 
          key={i} 
          delay={i * 0.1} 
          color={`${['bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400'][i % 5]}`}
        />
      ))}
    </div>
  );
};

// Main Reward Animation Component
const RewardAnimations: React.FC<RewardAnimationProps> = ({ 
  type, 
  content, 
  isVisible, 
  onComplete 
}) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      
      // Auto-dismiss after appropriate duration
      const duration = type === 'level_up' ? 6000 : 
                      type === 'achievement' ? 5000 : 3000;
      
      const timer = setTimeout(() => {
        setShowAnimation(false);
        setTimeout(onComplete, 300); // Allow exit animation
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, type, onComplete]);

  const handleClose = () => {
    setShowAnimation(false);
    setTimeout(onComplete, 300);
  };

  return (
    <AnimatePresence>
      {showAnimation && (
        <>
          {type === 'confetti' && <ConfettiBurst onComplete={handleClose} />}
          {type === 'achievement' && <AchievementBadge content={content} onClose={handleClose} />}
          {type === 'level_up' && <LevelUpCelebration content={content} onClose={handleClose} />}
          {type === 'streak_bonus' && <StreakBonus content={content} onClose={handleClose} />}
          {type === 'milestone' && <AchievementBadge content={content} onClose={handleClose} />}
        </>
      )}
    </AnimatePresence>
  );
};

export default RewardAnimations;