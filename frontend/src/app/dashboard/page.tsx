'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { BACKEND_URL } from '../../config/config';
import ActivityFeed from '@/components/ActivityFeed';
import { 
  ArrowLeft,
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  Target,
  CheckCircle,
  Calendar,
  BarChart3,
  Zap,
  Flame,
  Star,
  Users,
  Brain,
  Timer,
  Trophy,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Play,
  Eye,
  Home,
  Map,
  RefreshCw,
  Plus,
  Lightbulb,
  AlertCircle,
  XCircle
} from 'lucide-react';
import ProfileDropdown from '../../components/ProfileDropdown';
import Logo from '../../../components/Logo';

interface DashboardStats {
  totalRoadmaps: number;
  completedRoadmaps: number;
  totalLearningHours: number;
  currentStreak: number;
  completedTopics: number;
  averageScore: number;
  weeklyProgress: number;
  monthlyProgress: number;
}

interface RecentActivity {
  id: string;
  type: 'progress' | 'completion' | 'quiz' | 'roadmap_started';
  title: string;
  description: string;
  timestamp: string;
  score?: number;
  roadmapTitle?: string;
  topicTitle?: string;
}

interface UserRoadmap {
  id: number;
  title: string;
  description: string;
  completion_percentage: number;
  total_topics: number;
  completed_topics: number;
  last_accessed?: string;
  estimated_hours?: number;
  difficulty?: string;
  category?: string;
}

interface RecommendedRoadmap {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_hours?: number;
  adoption_count: number;
  average_rating: number;
  reason: string;
  slug?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'activity'>('overview');

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      try {
        const [progressRes, activityRes] = await Promise.all([
          api.get('/progress/time-summary'),
          api.get('/activity/stats')
        ]);
        
        const progressData = progressRes.data;
        const activityData = activityRes.data;
        
        return {
          totalRoadmaps: activityData.total_roadmaps || 0,
          completedRoadmaps: activityData.completed_roadmaps || 0,
          totalLearningHours: Math.round((progressData.total_time_spent || 0) / 60), // Convert minutes to hours
          currentStreak: activityData.current_streak || 0,
          completedTopics: activityData.completed_topics || 0,
          averageScore: activityData.average_score || 0,
          weeklyProgress: activityData.weekly_progress || 0,
          monthlyProgress: activityData.monthly_progress || 0
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
          totalRoadmaps: 0,
          completedRoadmaps: 0,
          totalLearningHours: 0,
          currentStreak: 0,
          completedTopics: 0,
          averageScore: 0,
          weeklyProgress: 0,
          monthlyProgress: 0
        };
      }
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Fetch user roadmaps
  const { data: userRoadmaps, isLoading: roadmapsLoading } = useQuery<UserRoadmap[]>({
    queryKey: ['userRoadmaps'],
    queryFn: async () => {
      try {
        const response = await api.get('/roadmaps/');
        return response.data || [];
      } catch (error) {
        console.error('Error fetching user roadmaps:', error);
        return [];
      }
    },
    enabled: !!user
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery<RecentActivity[]>({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      try {
        const response = await api.get('/activity/recent?limit=10');
        return response.data || [];
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        return [];
      }
    },
    enabled: !!user
  });

  // Fetch personalized recommendations
  const { data: recommendations } = useQuery<RecommendedRoadmap[]>({
    queryKey: ['recommendations'],
    queryFn: async () => {
      try {
        // Get user's completed categories and generate recommendations
        const response = await fetch(`${BACKEND_URL}/curated-roadmaps/?per_page=6`);
        if (response.ok) {
          const allRoadmaps = await response.json();
          // Simple recommendation logic: different categories from user's current roadmaps
          const userCategories = new Set(userRoadmaps?.map(rm => rm.category) || []);
          const recommended = allRoadmaps
            .filter((rm: any) => !userCategories.has(rm.category) && rm.is_featured)
            .slice(0, 4)
            .map((rm: any) => ({
              ...rm,
              reason: `Recommended based on your progress in ${Array.from(userCategories).join(', ')}`
            }));
          return recommended;
        }
        return [];
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
      }
    },
    enabled: !!user && !!userRoadmaps
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 dark:from-gray-900 dark:to-blue-950/20 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50"
        >
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Your Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Sign in to track your learning progress and achievements</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  const navigationItems = [
    { href: '/', label: 'Home', icon: Home, active: false },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3, active: true },
    { href: '/journey', label: 'Journey', icon: Map, active: false },
    { href: '/explore', label: 'Explore', icon: BookOpen, active: false },
  ];

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completion':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'quiz':
        return <Brain className="w-4 h-4 text-purple-500" />;
      case 'roadmap_started':
        return <Target className="w-4 h-4 text-blue-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⚡';
    if (streak >= 7) return '💪';
    if (streak >= 3) return '🌟';
    return '👍';
  };

  const getMomentumLevel = (weeklyProgress: number) => {
    if (weeklyProgress >= 80) return { level: 'Blazing', color: 'text-red-500', emoji: '🚀' };
    if (weeklyProgress >= 60) return { level: 'Hot', color: 'text-orange-500', emoji: '🔥' };
    if (weeklyProgress >= 40) return { level: 'Warm', color: 'text-yellow-500', emoji: '⭐' };
    if (weeklyProgress >= 20) return { level: 'Cool', color: 'text-blue-500', emoji: '❄️' };
    return { level: 'Starting', color: 'text-gray-500', emoji: '🌱' };
  };

  const momentum = getMomentumLevel(stats?.weeklyProgress || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 dark:from-gray-900 dark:to-blue-950/20">
      {/* Header */}
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 lg:h-20">
            <div className="flex items-center space-x-3">
              <Logo />
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                      item.active 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {user.displayName?.split(' ')[0] || 'Learner'}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Here's your learning progress and achievements
              </p>
            </div>
            {stats?.currentStreak > 0 && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-right"
              >
                <div className="flex items-center space-x-2 text-2xl">
                  <span>{getStreakEmoji(stats.currentStreak)}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{stats.currentStreak}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Day Streak</p>
              </motion.div>
            )}
          </div>

          {/* Momentum Indicator */}
          {stats?.weeklyProgress > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50"
            >
              <span className="text-lg">{momentum.emoji}</span>
              <span className={`font-semibold ${momentum.color}`}>{momentum.level} Momentum</span>
              <span className="text-gray-500 dark:text-gray-400">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{stats.weeklyProgress}% this week</span>
            </motion.div>
          )}
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200/50 dark:border-gray-700/50 w-fit">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'progress', label: 'Progress', icon: TrendingUp },
            { key: 'activity', label: 'Activity', icon: Clock }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    label: 'Active Roadmaps',
                    value: statsLoading ? '...' : stats?.totalRoadmaps?.toString() || '0',
                    change: `${stats?.completedRoadmaps || 0} completed`,
                    changeType: 'neutral',
                    icon: <Map className="w-5 h-5" />,
                    color: 'blue'
                  },
                  {
                    label: 'Learning Hours',
                    value: statsLoading ? '...' : stats?.totalLearningHours?.toString() || '0',
                    change: '+' + (stats?.weeklyProgress || 0) + '% this week',
                    changeType: 'positive',
                    icon: <Clock className="w-5 h-5" />,
                    color: 'green'
                  },
                  {
                    label: 'Topics Mastered',
                    value: statsLoading ? '...' : stats?.completedTopics?.toString() || '0',
                    change: 'Across all subjects',
                    changeType: 'neutral',
                    icon: <Target className="w-5 h-5" />,
                    color: 'purple'
                  },
                  {
                    label: 'Average Score',
                    value: statsLoading ? '...' : (stats?.averageScore ? `${stats.averageScore.toFixed(1)}%` : '0%'),
                    change: '+' + (stats?.monthlyProgress || 0) + '% this month',
                    changeType: stats?.monthlyProgress > 0 ? 'positive' : 'neutral',
                    icon: <Trophy className="w-5 h-5" />,
                    color: 'yellow'
                  }
                ].map((stat, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2 rounded-lg ${
                        stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                        stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{stat.label}</p>
                      <p className={`text-xs ${
                        stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {stat.change}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Active Roadmaps & Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Roadmaps */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Learning</h3>
                    <Link 
                      href="/journey"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                    >
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                  
                  <div className="space-y-4">
                    {roadmapsLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          </div>
                        ))}
                      </div>
                    ) : userRoadmaps && userRoadmaps.length > 0 ? (
                      userRoadmaps.slice(0, 3).map((roadmap, index) => (
                        <div key={roadmap.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1">{roadmap.title}</h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800 px-2 py-1 rounded-full">
                              {roadmap.completion_percentage || 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${roadmap.completion_percentage || 0}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {roadmap.completed_topics || 0} of {roadmap.total_topics || 0} topics completed
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">No active roadmaps yet</p>
                        <Link 
                          href="/explore"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Explore Roadmaps
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Personalized Recommendations */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recommended for You</h3>
                    </div>
                    <Link 
                      href="/explore"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                    >
                      See More <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                  
                  <div className="space-y-4">
                    {recommendations && recommendations.length > 0 ? (
                      recommendations.slice(0, 3).map((roadmap, index) => (
                        <div key={roadmap.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1 flex-1">{roadmap.title}</h4>
                            <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                              {roadmap.average_rating > 0 && (
                                <>
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">{roadmap.average_rating.toFixed(1)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{roadmap.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                              <span className="px-2 py-1 bg-white/80 dark:bg-gray-800 rounded-full">{roadmap.difficulty}</span>
                              {roadmap.estimated_hours && (
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {roadmap.estimated_hours}h
                                </span>
                              )}
                            </div>
                            <Link
                              href={`/explore/${roadmap.slug || roadmap.id}`}
                              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center"
                            >
                              View <ArrowRight className="w-3 h-3 ml-1" />
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Sparkles className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Start learning to get personalized recommendations</p>
                        <Link 
                          href="/explore"
                          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Explore All Roadmaps
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Quick Actions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button 
                    onClick={() => router.push('/#generate')}
                    className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 transition-all duration-200 group"
                  >
                    <div className="p-2 bg-blue-600 text-white rounded-lg group-hover:scale-110 transition-transform">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-blue-700 dark:text-blue-300">Generate Roadmap</span>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/journey')}
                    className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-800/30 transition-all duration-200 group"
                  >
                    <div className="p-2 bg-green-600 text-white rounded-lg group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-green-700 dark:text-green-300">Continue Learning</span>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/explore')}
                    className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30 transition-all duration-200 group"
                  >
                    <div className="p-2 bg-purple-600 text-white rounded-lg group-hover:scale-110 transition-transform">
                      <Eye className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-purple-700 dark:text-purple-300">Explore Roadmaps</span>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/performance-analysis')}
                    className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30 transition-all duration-200 group"
                  >
                    <div className="p-2 bg-orange-600 text-white rounded-lg group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-orange-700 dark:text-orange-300">View Analytics</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Learning Progress</h3>
                
                {/* Detailed Progress */}
                <div className="space-y-6">
                  {userRoadmaps && userRoadmaps.length > 0 ? (
                    userRoadmaps.map((roadmap, index) => (
                      <motion.div 
                        key={roadmap.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{roadmap.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{roadmap.description}</p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{roadmap.completion_percentage || 0}%</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Complete</div>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-4">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${roadmap.completion_percentage || 0}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-4">
                            <span>{roadmap.completed_topics || 0} / {roadmap.total_topics || 0} topics</span>
                            {roadmap.estimated_hours && (
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {roadmap.estimated_hours}h total
                              </span>
                            )}
                            {roadmap.difficulty && (
                              <span className="px-2 py-1 bg-white/80 dark:bg-gray-800 rounded-full text-xs">
                                {roadmap.difficulty}
                              </span>
                            )}
                          </div>
                          {roadmap.last_accessed && (
                            <span>Last studied {formatTimeAgo(roadmap.last_accessed)}</span>
                          )}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Learning Progress Yet</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Start your first roadmap to track your progress</p>
                      <Link 
                        href="/explore"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Explore Roadmaps
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
                
                <div className="space-y-4">
                  {activityLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-start space-x-3 animate-pulse">
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentActivity && recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <motion.div 
                        key={activity.id || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start space-x-3 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex-shrink-0 p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </p>
                          {activity.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {activity.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimeAgo(activity.timestamp)}
                            </span>
                            {activity.score && (
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                                {activity.score}% score
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Activity Yet</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Your learning activities will appear here</p>
                      <Link 
                        href="/journey"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Learning
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Activity Feed */}
              <ActivityFeed 
                showCalendar={true} 
                showFeed={true} 
                maxFeedItems={15}
                className="mt-8"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}