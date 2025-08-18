'use client';

import React from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  Target,
  CheckCircle,
  Calendar,
  BarChart3
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please sign in to view your dashboard</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Roadmaps Completed',
      value: '3',
      change: '+2 this month',
      changeType: 'positive',
      icon: <CheckCircle className="w-6 h-6" />
    },
    {
      label: 'Learning Hours',
      value: '47',
      change: '+12 this week',
      changeType: 'positive',
      icon: <Clock className="w-6 h-6" />
    },
    {
      label: 'Topics Mastered',
      value: '24',
      change: '+5 this week',
      changeType: 'positive',
      icon: <Target className="w-6 h-6" />
    },
    {
      label: 'Achievement Score',
      value: '8.5',
      change: '+0.3 this month',
      changeType: 'positive',
      icon: <Award className="w-6 h-6" />
    }
  ];

  const recentActivity = [
    {
      type: 'completed',
      title: 'Completed: React Fundamentals',
      time: '2 hours ago',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />
    },
    {
      type: 'started',
      title: 'Started: Advanced JavaScript',
      time: '1 day ago',
      icon: <BookOpen className="w-5 h-5 text-blue-500" />
    },
    {
      type: 'achievement',
      title: 'Earned: Quick Learner Badge',
      time: '3 days ago',
      icon: <Award className="w-5 h-5 text-yellow-500" />
    }
  ];

  const currentGoals = [
    {
      title: 'Complete React Roadmap',
      progress: 75,
      dueDate: 'Dec 31, 2024'
    },
    {
      title: 'Master TypeScript',
      progress: 45,
      dueDate: 'Jan 15, 2025'
    },
    {
      title: 'Build Portfolio Project',
      progress: 20,
      dueDate: 'Feb 28, 2025'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Track your learning progress and achievements</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.displayName || 'Learner'}! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what you've accomplished so far
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg lg:rounded-xl p-3 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
                <div className="p-1.5 lg:p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-fit mb-2 lg:mb-0">
                  <div className="text-blue-600 dark:text-blue-400">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4 text-green-500 mr-1" />
                <span className="text-xs lg:text-sm text-green-600 dark:text-green-400">{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Current Goals */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Goals</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                {currentGoals.map((goal, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{goal.title}</h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {goal.dueDate}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{goal.progress}% complete</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
              
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All Activity
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => router.push('/#generate')}
                className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-600 dark:text-blue-400">Generate New Roadmap</span>
              </button>
              
              <button 
                onClick={() => router.push('/journey')}
                className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-600 dark:text-green-400">Continue Learning</span>
              </button>
              
              <button className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-purple-600 dark:text-purple-400">View Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}