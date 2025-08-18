// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Target, BookOpen, BarChart3, TrendingUp, Eye, User, LogOut, Trophy, Clock, Menu, X, Zap, Star, Focus, Play, Pause, Timer } from 'lucide-react';
import Logo from '../../../../components/Logo';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../../lib/firebase/client';
import { TimeSummaryResponse } from '../../../lib/api';
import { useBehavioralStats, useProgressCopy, useFocusMode, useBehavioralEvents } from '../../../hooks/useBehavioral';
import { formatXPToNextLevel, getStreakMessage } from '../../../lib/behavioral-api';
import ProfileDropdown from '../../../components/ProfileDropdown';

interface JourneyHeaderProps {
  user?: any;
  overallProgress: number;
  completedTopics: number;
  totalTopics: number;
  onOldRoadmapsClick: () => void;
  onOldLearnPagesClick?: () => void;
  timeSummaryToday?: TimeSummaryResponse;
  timeSummaryWeek?: TimeSummaryResponse;
  roadmapId?: number;
}

const JourneyHeader: React.FC<JourneyHeaderProps> = ({ 
  user,
  overallProgress, 
  completedTopics, 
  totalTopics, 
  onOldRoadmapsClick,
  onOldLearnPagesClick,
  timeSummaryToday,
  timeSummaryWeek,
  roadmapId
}) => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Behavioral Design Hooks
  const { data: behavioralStats } = useBehavioralStats();
  const { copy: progressCopy, copyType } = useProgressCopy(roadmapId || 0);
  const { isEnabled: focusMode, duration, remainingTime, toggleFocus } = useFocusMode();
  
  // Initialize behavioral event listeners
  useBehavioralEvents();

  // Helper to format time from seconds to HH:MM:SS
  const formatTime = (totalSeconds: number | undefined) => {
    if (totalSeconds === undefined) return '00:00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map(v => v < 10 ? '0' + v : v)
      .filter((v, i) => v !== '00' || i > 0) // Remove leading '00:' if hours are zero
      .join(':');
  };

  const navigationItems = [
    { href: '/', label: 'Home', icon: Home, active: false },
    { href: '/journey', label: 'Journey', icon: Target, active: true },
    { href: '/performance-analysis', label: 'Performance', icon: TrendingUp, active: false },
  ];

  return (
    <>
      <header className="bg-gray-900/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-700/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 lg:h-20">
            {/* Logo */}
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
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Additional Action Buttons */}
              <div className="flex items-center space-x-1 ml-4 pl-4 border-l border-gray-600">
                <Link
                  href="/performance-analysis"
                  className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden xl:block">Analytics</span>
                </Link>
                <button 
                  onClick={onOldRoadmapsClick}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden xl:block">Archives</span>
                </button>
                {onOldLearnPagesClick && (
                  <button 
                    onClick={onOldLearnPagesClick}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 text-sm font-medium"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden xl:block">Pages</span>
                  </button>
                )}
              </div>
            </nav>

            {/* Clean Navigation Actions */}
            <div className="flex items-center space-x-2 lg:space-x-3">
              {/* Profile Dropdown */}
              <ProfileDropdown />

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute right-0 top-20 bottom-0 w-80 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        item.active 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                          : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              
              {/* Mobile Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <Link
                  href="/performance-analysis"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>Performance Analytics</span>
                </Link>
                <button 
                  onClick={() => {
                    onOldRoadmapsClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                >
                  <Eye className="w-5 h-5" />
                  <span>Browse Archives</span>
                </button>
                {onOldLearnPagesClick && (
                  <button 
                    onClick={() => {
                      onOldLearnPagesClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Old Learn Pages</span>
                  </button>
                )}
              </div>

              {/* Mobile Progress Summary (Clean) */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">Progress</span>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {overallProgress}%
                  </div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-400">{completedTopics}/{totalTopics} topics completed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JourneyHeader;