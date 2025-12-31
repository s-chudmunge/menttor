// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Target, BookOpen, BarChart3, TrendingUp, Eye, User, LogOut, Trophy, Clock, Menu, X, Zap, Star, Focus, Play, Pause, Timer, RefreshCw } from 'lucide-react';
import Logo from '../../../../components/Logo';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

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
  isRefreshing?: boolean;
  isQuickToolsPanelOpen?: boolean;
  onToggleQuickToolsPanel?: () => void;
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
  roadmapId,
  isRefreshing = false,
  isQuickToolsPanelOpen = false,
  onToggleQuickToolsPanel
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
      <header className="bg-white/95 dark:bg-black backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto pr-4 sm:pr-6 lg:pr-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo and Quick Tools Toggle */}
            <div className="flex items-center space-x-3">
              {onToggleQuickToolsPanel && (
                <button
                  onClick={onToggleQuickToolsPanel}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label={isQuickToolsPanelOpen ? "Close tools panel" : "Open tools panel"}
                >
                  <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              )}
              <Logo />
              {/* Progress Refresh Indicator */}
              {isRefreshing && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                  <RefreshCw className="w-3 h-3" />
                  <span className="text-xs font-medium hidden sm:inline">Syncing progress...</span>
                </div>
              )}
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all duration-200 ${
                      item.active 
                        ? 'bg-green-700 text-white' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
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
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all duration-200 text-sm font-medium"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden xl:block">Analytics</span>
                </Link>
                <button 
                  onClick={onOldRoadmapsClick}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all duration-200 text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden xl:block">Archives</span>
                </button>
                {onOldLearnPagesClick && (
                  <button 
                    onClick={onOldLearnPagesClick}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all duration-200 text-sm font-medium"
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
                className="lg:hidden flex items-center justify-center w-10 h-10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors"
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
          <div className="absolute right-0 top-20 bottom-0 w-80 bg-white dark:bg-zinc-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition-all duration-200 ${
                        item.active 
                          ? 'bg-green-700 text-white' 
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              
              {/* Mobile Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600 space-y-2">
                <Link
                  href="/performance-analysis"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all duration-200"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>Performance Analytics</span>
                </Link>
                <button 
                  onClick={() => {
                    onOldRoadmapsClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all duration-200"
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
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all duration-200"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Old Learn Pages</span>
                  </button>
                )}
              </div>

              {/* Mobile Progress Summary (Clean) */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <Trophy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Progress</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {overallProgress}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{completedTopics}/{totalTopics} topics completed</div>
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