'use client';

import React, { useState, useEffect } from 'react';
import { NextSubtopicResponse } from '../../../lib/api';
import { Play, Clock, BookOpen, Zap, Target, Brain, Star, Trophy, ArrowRight } from 'lucide-react';
import { useBehavioralStats, useQuickChallenge, useXPSystem, useStreakSystem, useNudging, useMomentum } from '../../../hooks/useBehavioral';
import { getTimeOfDayMessage } from '../../../lib/behavioral-api';

interface SmartResumeCardProps {
  sessionSummary: any;
  nextRecommendedSubtopic: NextSubtopicResponse | undefined;
  onResume: () => void;
  roadmapId?: number;
}

// Simple time formatting function to replace date-fns
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

const SmartResumeCard: React.FC<SmartResumeCardProps> = ({
  sessionSummary,
  nextRecommendedSubtopic,
  onResume,
  roadmapId
}) => {
  // Behavioral hooks
  const { data: behavioralStats } = useBehavioralStats();
  const { awardXP } = useXPSystem();
  const { updateStreak } = useStreakSystem();
  const { recordInteraction, shouldShow } = useNudging();
  const { momentumScore, momentumLevel } = useMomentum();
  
  // Quick challenge state
  const [showQuickChallenge, setShowQuickChallenge] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const { 
    challenge, 
    challengeState, 
    result: challengeResult,
    startChallenge, 
    answerChallenge 
  } = useQuickChallenge(showQuickChallenge ? sessionSummary?.last_active_subtopic_id : null);

  // Smart nudging state
  const [nudgeMessage, setNudgeMessage] = useState<string>('');
  const [showShortPath, setShowShortPath] = useState(false);

  const lastActiveTimestamp = sessionSummary?.last_active_timestamp
    ? new Date(sessionSummary.last_active_timestamp)
    : null;

  const timeSinceLastSession = lastActiveTimestamp
    ? formatTimeAgo(lastActiveTimestamp)
    : null;

  const isLongIdle = lastActiveTimestamp && 
    (new Date().getTime() - lastActiveTimestamp.getTime()) > (72 * 60 * 60 * 1000); // 72 hours

  // Generate smart welcome message
  useEffect(() => {
    if (behavioralStats) {
      const hour = new Date().getHours();
      const timeMessage = getTimeOfDayMessage(hour);
      
      if (isLongIdle) {
        setNudgeMessage("Let's pick up exactly where you felt momentum!");
        setShowShortPath(true);
      } else if (behavioralStats.streak_stats.current_streak > 0) {
        setNudgeMessage(`${behavioralStats.streak_stats.current_streak}-day streak! Keep the momentum going! 🔥`);
      } else if (momentumScore > 3) {
        setNudgeMessage("You're building great momentum! Time to level up.");
      } else {
        setNudgeMessage(timeMessage);
      }
    }
  }, [behavioralStats, isLongIdle, momentumScore]);

  // Check if we should show quick recall challenge
  useEffect(() => {
    const checkQuickChallenge = async () => {
      if (sessionSummary?.last_active_subtopic_id && timeSinceLastSession) {
        const shouldShowChallenge = await shouldShow('quick_recall');
        if (shouldShowChallenge && !challengeCompleted) {
          // Show quick recall after 5 seconds
          setTimeout(() => setShowQuickChallenge(true), 5000);
        }
      }
    };
    
    checkQuickChallenge();
  }, [sessionSummary, timeSinceLastSession, shouldShow, challengeCompleted]);

  const handleQuickChallengeAnswer = (answer: string) => {
    answerChallenge(answer, 3); // Medium confidence
    setChallengeCompleted(true);
    recordInteraction('quick_recall', 'engaged');
  };

  const handleResume = () => {
    // Award XP for session start
    awardXP('session_start', { timestamp: new Date().toISOString() });
    
    // Update streak
    updateStreak();
    
    onResume();
  };

  const handleShortPath = () => {
    recordInteraction('short_path', 'engaged');
    // Could navigate to a condensed version of the content
    onResume();
  };

  return (
    <div className="bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-blue-900/10 dark:to-purple-900/10 rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 backdrop-blur-sm p-6 lg:p-8 mb-6 lg:mb-8 transition-all duration-300 hover:shadow-2xl">
      {/* Header with dynamic messaging */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
            momentumLevel.level === 'high' 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 animate-pulse' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600'
          }`}>
            {momentumLevel.level === 'high' ? <Zap className="w-6 h-6 text-white" /> : <BookOpen className="w-6 h-6 text-white" />}
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Welcome back! 👋
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {nudgeMessage}
            </p>
          </div>
        </div>
        
        {/* Momentum indicator */}
        {momentumScore > 0 && (
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            momentumLevel.level === 'high' ? 'bg-orange-100 dark:bg-orange-900/30' :
            momentumLevel.level === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
            'bg-blue-100 dark:bg-blue-900/30'
          }`}>
            <Target className={`w-4 h-4 ${
              momentumLevel.level === 'high' ? 'text-orange-600 dark:text-orange-400' :
              momentumLevel.level === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
              'text-blue-600 dark:text-blue-400'
            }`} />
            <span className={`text-xs font-semibold ${
              momentumLevel.level === 'high' ? 'text-orange-700 dark:text-orange-300' :
              momentumLevel.level === 'medium' ? 'text-yellow-700 dark:text-yellow-300' :
              'text-blue-700 dark:text-blue-300'
            }`}>
              {momentumLevel.message}
            </span>
          </div>
        )}
      </div>

      {/* Quick Recall Challenge */}
      {showQuickChallenge && challenge && challengeState === 'active' && !challengeCompleted && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-4 mb-4 border border-indigo-200/50 dark:border-indigo-700/50">
          <div className="flex items-center mb-3">
            <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Quick Recall (3 seconds)</span>
          </div>
          <p className="text-sm text-indigo-900 dark:text-indigo-100 mb-3 font-medium">{challenge.question}</p>
          <div className="grid grid-cols-2 gap-2">
            {challenge.options?.map((option: any) => (
              <button
                key={option.id}
                onClick={() => handleQuickChallengeAnswer(option.id)}
                className="text-left p-2 bg-white dark:bg-gray-800 rounded-lg text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 transition-colors"
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Challenge Result */}
      {challengeResult && challengeCompleted && (
        <div className={`rounded-xl p-4 mb-4 border ${
          challengeResult.correct 
            ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' 
            : 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {challengeResult.correct ? (
              <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            )}
            <span className={`text-sm font-semibold ${
              challengeResult.correct 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-orange-700 dark:text-orange-300'
            }`}>
              {challengeResult.correct ? 'Great recall!' : 'Good attempt!'}
            </span>
            {challengeResult.momentum_bonus && (
              <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
                <Zap className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-xs text-green-700 dark:text-green-300">+{challengeResult.xp_earned} XP</span>
              </div>
            )}
          </div>
          <p className={`text-xs ${
            challengeResult.correct 
              ? 'text-green-700 dark:text-green-300' 
              : 'text-orange-700 dark:text-orange-300'
          }`}>
            {challengeResult.explanation}
          </p>
        </div>
      )}

      {/* Micro-victory memory */}
      {sessionSummary && timeSinceLastSession && (
        <div className="bg-white/70 dark:bg-gray-700/50 rounded-xl p-4 mb-4 border border-gray-200/50 dark:border-gray-600/50">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            <span className="font-medium">Yesterday you made great progress</span>
            <span className="ml-auto text-gray-500 dark:text-gray-400">({timeSinceLastSession})</span>
          </div>
          <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
            {sessionSummary.last_active_subtopic_id}
          </p>
        </div>
      )}

      {/* Next recommended or recap */}
      {isLongIdle ? (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-xl p-4 mb-4 border border-amber-200/50 dark:border-amber-700/50">
          <div className="flex items-center mb-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Recap Available</span>
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
            Get back in the flow with key highlights from your last session
          </p>
          <div className="text-xs text-amber-600 dark:text-amber-400">
            • Review core concepts • Practice examples • Quick assessment
          </div>
        </div>
      ) : nextRecommendedSubtopic ? (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4 mb-4 border border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-center mb-2">
            <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Next Up</span>
          </div>
          <p className="text-blue-900 dark:text-blue-100 font-semibold text-sm mb-1">
            {nextRecommendedSubtopic.subtopic_title}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {nextRecommendedSubtopic.topic_title} • {nextRecommendedSubtopic.module_title}
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4 border border-gray-200/50 dark:border-gray-600/50">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Ready for your next learning adventure!</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <button
          onClick={handleResume}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
        >
          <Play className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span>{isLongIdle ? 'Resume (8m)' : 'Continue Learning'}</span>
        </button>
        
        {showShortPath && (
          <button
            onClick={handleShortPath}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            <Clock className="w-5 h-5" />
            <span>Quick Review (4m)</span>
          </button>
        )}
      </div>

      {/* Streak encouragement */}
      {behavioralStats && behavioralStats.streak_stats.current_streak > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            🔥 {behavioralStats.streak_stats.current_streak} day streak • 
            {behavioralStats.streak_stats.grace_days_remaining > 0 && (
              <span className="text-green-600 dark:text-green-400"> {behavioralStats.streak_stats.grace_days_remaining} grace days left</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartResumeCard;
