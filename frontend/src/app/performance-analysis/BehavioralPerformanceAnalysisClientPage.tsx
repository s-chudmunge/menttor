// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Brain, Target, Zap, Clock, Trophy, Star, 
  BarChart3, PieChart, Activity, Calendar, Award, Focus,
  ChevronRight, Lightbulb, BookOpen, Timer, Flame, ArrowUp,
  ChevronDown, Info, CheckCircle, AlertCircle, Sparkles, Map,
  Home, BarChart2
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { useBehavioralStats, useEloSystem, useLearningPatterns, useMomentum } from '../../hooks/useBehavioral';
import { useBehavioralContext } from '../context/BehavioralContext';
import { useProgress } from '../../hooks/useProgress';
import ProfileDropdown from '../../components/ProfileDropdown';
import Logo from '../../../components/Logo';
import ActivityFeed from '../../components/ActivityFeed';
import { api } from '../../lib/api';

interface BehavioralPerformanceAnalysisClientPageProps {
  performanceDetails: any;
  error: string | null;
}

const BehavioralPerformanceAnalysisClientPage: React.FC<BehavioralPerformanceAnalysisClientPageProps> = ({
  performanceDetails,
  error: initialError
}) => {
  // Behavioral hooks
  const { data: behavioralStats } = useBehavioralStats();
  const { showNotification } = useBehavioralContext();
  const { eloRatings } = useEloSystem();
  const { optimalTime, hasData: hasOptimalTimeData } = useLearningPatterns();
  const { momentumScore, momentumLevel } = useMomentum();

  // Get recent activity data
  const { data: recentActivity } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      try {
        const response = await api.get('/behavioral/rewards/recent?limit=7');
        return response.data || [];
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        return [];
      }
    },
    enabled: !!behavioralStats
  });

  // Get current roadmap ID for progress data
  const storedRoadmap = typeof window !== 'undefined' ? sessionStorage.getItem('currentRoadmap') : null;
  const currentRoadmapId = storedRoadmap ? JSON.parse(storedRoadmap)?.id : null;
  
  // Get progress data for activity calculation
  const { data: progressData } = useProgress(currentRoadmapId);

  // State for future enhancements
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('week');

  // Generate behavioral insights
  const generateBehavioralInsights = () => {
    if (!behavioralStats) return [];

    const insights = [];
    const stats = behavioralStats;
    
    // XP and level insights
    if (stats.xp_stats.current_level >= 5) {
      insights.push({
        type: 'achievement',
        icon: <Trophy className="w-5 h-5 text-yellow-600" />,
        title: 'High Achiever',
        message: `You've reached Level ${stats.xp_stats.current_level}! This puts you in the top 20% of learners.`,
        action: 'Keep pushing for Level ' + (stats.xp_stats.current_level + 1)
      });
    }

    // Streak insights
    if (stats.streak_stats.current_streak >= 7) {
      insights.push({
        type: 'consistency',
        icon: <Flame className="w-5 h-5 text-orange-600" />,
        title: 'Consistency Champion',
        message: `Your ${stats.streak_stats.current_streak}-day streak shows excellent learning discipline.`,
        action: 'Maintain this momentum for exponential growth'
      });
    }

    // Momentum insights
    if (momentumScore >= 5) {
      insights.push({
        type: 'momentum',
        icon: <Zap className="w-5 h-5 text-blue-600" />,
        title: 'Peak Learning State',
        message: `Your momentum score of ${momentumScore.toFixed(1)} indicates optimal learning flow.`,
        action: 'This is the perfect time for challenging topics'
      });
    }

    // Focus time insights
    if (stats.engagement_stats.focus_time >= 3600) { // 1+ hour
      const hours = Math.floor(stats.engagement_stats.focus_time / 3600);
      insights.push({
        type: 'focus',
        icon: <Focus className="w-5 h-5 text-indigo-600" />,
        title: 'Deep Focus Mastery',
        message: `${hours} hours of focused learning demonstrates exceptional concentration skills.`,
        action: 'Try extending focus sessions for even deeper learning'
      });
    }

    // Optimal learning time insight
    if (hasOptimalTimeData && optimalTime?.best_window) {
      const [timeSlot, data] = optimalTime.best_window;
      insights.push({
        type: 'timing',
        icon: <Clock className="w-5 h-5 text-green-600" />,
        title: 'Optimal Learning Window',
        message: `You learn best during ${timeSlot} with ${Math.round(data.completion_rate * 100)}% completion rate.`,
        action: 'Schedule important topics during this time'
      });
    }

    return insights;
  };

  const insights = generateBehavioralInsights();

  // Generate recent activity chart data
  const getRecentActivityData = () => {
    if (!progressData || progressData.length === 0) {
      // Fallback to demo data for empty states
      return [65, 80, 45, 90, 75, 85, 70];
    }

    // Create activity data from progress and behavioral stats
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      // Count activities for each day
      const dayProgress = progressData.filter(p => {
        const progressDate = p.last_accessed_at ? new Date(p.last_accessed_at).toISOString().split('T')[0] : null;
        return progressDate === date;
      }).length;
      
      // Convert to percentage (max 10 activities per day = 100%)
      return Math.min(100, (dayProgress / 10) * 100);
    });
  };

  const activityChartData = getRecentActivityData();

  if (initialError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 max-w-md text-center shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Performance Analysis Unavailable
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{initialError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 transition-colors duration-300">
      {/* Enhanced Header with Professional Design */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-6">
              <Logo />
              <div className="hidden sm:block w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart2 className="w-5 h-5 text-white" />
                  </div>
                  <span>Performance Analysis</span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base mt-1 font-medium">Track your learning progress and insights</p>
              </div>
            </div>
            
            {/* Enhanced Navigation */}
            <div className="flex items-center space-x-3">
              <Link 
                href="/"
                className="flex items-center space-x-2 px-4 py-2.5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Home</span>
              </Link>
              
              <Link 
                href="/journey"
                className="flex items-center space-x-2 px-4 py-2.5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl"
              >
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Journey</span>
              </Link>
              
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 space-y-8">
        {/* Main Performance Summary */}
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 lg:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Learning Summary</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base mt-1 font-medium">Your learning progress at a glance</p>
            </div>
            {behavioralStats && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-full border border-green-200 dark:border-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 dark:text-green-300 font-medium">Active Learner</span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-full border border-blue-200 dark:border-blue-800">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Level {behavioralStats.xp_stats.current_level}</span>
                </div>
              </div>
            )}
          </div>
          
          {behavioralStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Enhanced Key Metrics with Professional Cards */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 dark:text-blue-100">Level</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Learning progress</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-3">
                  {behavioralStats.xp_stats.current_level}
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 shadow-sm"
                    style={{ width: `${behavioralStats.xp_stats.progress_to_next * 100}%` }}
                  />
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  {behavioralStats.xp_stats.total_xp} XP total
                </p>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl p-6 border border-orange-200 dark:border-orange-800 shadow-lg hover:shadow-xl transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-orange-900 dark:text-orange-100">Streak</h3>
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Daily learning</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-3">
                  {behavioralStats.streak_stats.current_streak} days
                </div>
                <div className="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-1000 shadow-sm"
                    style={{ width: `${Math.min(100, (behavioralStats.streak_stats.current_streak / 30) * 100)}%` }}
                  />
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                  Best: {behavioralStats.streak_stats.longest_streak} days
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl p-6 border border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-900 dark:text-green-100">Momentum</h3>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Learning flow</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-3">
                  {momentumScore.toFixed(1)}
                </div>
                <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000 shadow-sm"
                    style={{ width: `${Math.min(100, (momentumScore / 10) * 100)}%` }}
                  />
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  {momentumLevel.message}
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-900 dark:text-purple-100">Focus</h3>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Study time</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-3">
                  {Math.floor(behavioralStats.engagement_stats.focus_time / 3600)}h {Math.floor((behavioralStats.engagement_stats.focus_time % 3600) / 60)}m
                </div>
                <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 shadow-sm"
                    style={{ width: `${Math.min(100, (behavioralStats.engagement_stats.focus_time / 10800) * 100)}%` }}
                  />
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                  Total concentrated time
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Activity className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Building Your Profile</h3>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Complete learning activities to see your performance metrics</p>
              <Link
                href="/journey"
                className="inline-flex items-center space-x-2 mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span>Start Learning</span>
              </Link>
            </div>
          )}
        </div>

        {/* Enhanced AI Insights Section */}
        {insights.length > 0 && (
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 lg:p-8 shadow-xl">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">AI Insights</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base font-medium">Personalized recommendations based on your learning patterns</p>
              </div>
            </div>
            
            <div className="grid gap-6">
              {insights.slice(0, 3).map((insight, index) => (
                <motion.div 
                  key={index} 
                  className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg border border-gray-200 dark:border-gray-600">
                      {insight.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{insight.title}</h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 leading-relaxed">{insight.message}</p>
                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                        <p className="text-blue-700 dark:text-blue-300 text-sm font-semibold">{insight.action}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Patterns - Enhanced */}
        {hasOptimalTimeData && (
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 lg:p-8 shadow-xl">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Learning Patterns</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base font-medium">Optimize your study schedule</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {['morning', 'afternoon', 'evening', 'night'].map((timeSlot) => {
                const data = optimalTime.optimal_windows?.[timeSlot];
                const isOptimal = optimalTime.best_window?.[0] === timeSlot;
                
                return (
                  <div key={timeSlot} className={`p-6 rounded-2xl border-2 shadow-lg transition-all duration-200 ${isOptimal ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-white capitalize text-lg">{timeSlot}</h3>
                      {isOptimal && <Star className="w-5 h-5 text-green-500" />}
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {data ? Math.round(data.completion_rate * 100) : 0}%
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Completion rate</p>
                  </div>
                );
              })}
            </div>
            
            {optimalTime.best_window && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                <div className="flex items-center space-x-3 text-green-700 dark:text-green-300">
                  <Target className="w-5 h-5" />
                  <span className="font-bold text-lg">Best learning time:</span>
                  <span className="capitalize font-semibold">{optimalTime.best_window[0]}</span>
                  <span>with {Math.round(optimalTime.best_window[1].completion_rate * 100)}% success rate</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Concept Mastery - Enhanced */}
        {Object.keys(eloRatings).length > 0 && (
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 lg:p-8 shadow-xl">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Concept Mastery</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base font-medium">Your skill levels across different topics</p>
              </div>
            </div>
            
            <div className="grid gap-4">
              {Object.entries(eloRatings).slice(0, 6).map(([concept, rating]) => (
                <div key={concept} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/20 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
                  <span className="text-gray-900 dark:text-white font-semibold text-lg">{concept}</span>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-gray-900 dark:text-white font-bold text-xl">{Math.round(rating as number)}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">ELO Rating</div>
                    </div>
                    <div className={`w-3 h-12 rounded-full ${
                      (rating as number) >= 1200 ? 'bg-gradient-to-t from-green-500 to-emerald-500' :
                      (rating as number) >= 1000 ? 'bg-gradient-to-t from-yellow-500 to-orange-500' : 'bg-gradient-to-t from-red-500 to-pink-500'
                    } shadow-lg`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GitHub-style Activity Calendar */}
        <ActivityFeed 
          showCalendar={true} 
          showFeed={true} 
          maxFeedItems={12}
        />

        {/* Progress Trend - Enhanced */}
        {behavioralStats && (
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 lg:p-8 shadow-xl">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Learning Progress</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base font-medium">Your learning journey over time</p>
              </div>
            </div>
            
            <div className="space-y-8">
              {/* XP Progress */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-900 dark:text-white font-bold text-lg">Experience Points</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">{behavioralStats.xp_stats.total_xp} XP</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-4 rounded-full transition-all duration-1000 shadow-sm"
                    style={{ width: `${Math.min(100, (behavioralStats.xp_stats.total_xp / 1000) * 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                  {Math.round(behavioralStats.xp_stats.progress_to_next * 100)}% to Level {behavioralStats.xp_stats.current_level + 1}
                </p>
              </div>

              {/* Enhanced Recent Activity */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-900 dark:text-white font-bold text-lg">Weekly Summary</span>
                  <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                    <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">Last 7 days</span>
                  </div>
                </div>
                <div className="flex items-end space-x-3 h-24 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  {activityChartData.map((height, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg flex items-end relative overflow-hidden" style={{ height: '80px' }}>
                        <motion.div 
                          className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t-lg transition-all duration-1000 shadow-sm"
                          style={{ height: `${height}%` }}
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ delay: index * 100, duration: 800 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-3 px-4 font-medium">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BehavioralPerformanceAnalysisClientPage;