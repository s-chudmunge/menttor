// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatSubtopicTitle, formatTitle, formatQuizQuestion } from './utils/textFormatting';

import { api, RoadmapData, UserProgress } from '../../lib/api';
import { useRoadmap } from '../../hooks/useRoadmap';
import { useProgress } from '../../hooks/useProgress';
import { useRecommendedReviews } from '../../hooks/useRecommendedReviews';

import JourneyHeader from './components/JourneyHeader';
import SmartResumeCard from './components/SmartResumeCard';
import RoadmapVisualization from './components/RoadmapVisualization';
import InteractiveRoadmap from './components/InteractiveRoadmap';
import RecommendedReviews from './components/RecommendedReviews';
import OldRoadmapsModal from '../components/OldRoadmapsModal';
import OldLearnPagesModal from '../learn/OldLearnPagesModal';
import ProtectedRoute from '../components/ProtectedRoute';
import LearningGuide from './components/LearningGuide';
import ReportButton from './components/ReportButton';
import QuizReportModal from './components/QuizReportModal';
import BehavioralIndicator from './components/BehavioralIndicator';

import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Trophy, 
  Target, 
  Clock,
  Calendar,
  List,
  Home,
  BarChart3,
  TrendingUp,
  Brain
} from 'lucide-react';

const JourneyPage = () => {
  const [currentView, setCurrentView] = useState<'modules' | 'visual'>('visual');
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [isOldRoadmapsModalOpen, setIsOldRoadmapsModalOpen] = useState(false);
  const [isOldLearnPagesModalOpen, setIsOldLearnPagesModalOpen] = useState(false);
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);

  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Data fetching
  const { data: userRoadmap, isLoading: isLoadingRoadmap } = useRoadmap(user?.uid);
  const { data: progressData, refetch: refetchProgress, isLoading: isLoadingProgress, error: progressError } = useProgress(
    roadmapData?.id && typeof roadmapData.id === 'number' ? roadmapData.id : null
  );
  const { data: recommendedReviews, isLoading: isLoadingReviews } = useRecommendedReviews();

  // Force reload when returning from quiz results
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if returning from quiz results or learn page
        const referrer = document.referrer;
        const isFromQuizResults = referrer.includes('/quiz/results') || 
                                 sessionStorage.getItem('returning-from-quiz') === 'true';
        const isFromLearnPage = referrer.includes('/learn') || 
                               sessionStorage.getItem('returning-from-learn') === 'true';
        
        if (isFromQuizResults || isFromLearnPage) {
          console.log(`🔄 Force reloading journey page data after ${isFromQuizResults ? 'quiz' : 'learn'} completion`);
          console.log('🔍 Session storage flags:', {
            'returning-from-quiz': sessionStorage.getItem('returning-from-quiz'),
            'returning-from-learn': sessionStorage.getItem('returning-from-learn')
          });
          
          // Clear the flags
          sessionStorage.removeItem('returning-from-quiz');
          sessionStorage.removeItem('returning-from-learn');
          
          // Force reload all relevant data
          console.log('🔄 Invalidating all queries...');
          queryClient.invalidateQueries({ queryKey: ['progress'] });
          queryClient.invalidateQueries({ queryKey: ['userProgress'] });
          queryClient.invalidateQueries({ queryKey: ['behavioral'] });
          queryClient.invalidateQueries({ queryKey: ['roadmap'] });
          
          // Also explicitly refetch progress
          if (roadmapData?.id) {
            console.log('🔄 Explicitly refetching progress for roadmap:', roadmapData.id);
            refetchProgress();
          }
        }
      }
    };

    // Listen for page visibility changes (when user switches back to this tab)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also check on component mount in case user navigated directly
    const urlParams = new URLSearchParams(window.location.search);
    const isReturningFromLearn = sessionStorage.getItem('returning-from-learn') === 'true';
    if (urlParams.get('refresh') === 'true' || sessionStorage.getItem('returning-from-quiz') === 'true' || isReturningFromLearn) {
      console.log('Force reloading journey page data on mount');
      sessionStorage.removeItem('returning-from-quiz');
      sessionStorage.removeItem('returning-from-learn');
      
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      queryClient.invalidateQueries({ queryKey: ['behavioral'] });
      
      if (roadmapData?.id) {
        refetchProgress();
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient, refetchProgress, roadmapData?.id]);

  // Progress loading effect for debugging
  useEffect(() => {
    if (roadmapData?.id && progressData) {
      console.log('Journey Progress Update:', {
        roadmapId: roadmapData.id,
        progressCount: progressData.length,
        hasProgress: progressData.length > 0
      });
    }
  }, [roadmapData?.id, progressData]);

  // Simplified: Generate resume data from progress instead of complex session system
  const resumeData = useMemo(() => {
    if (!progressData || progressData.length === 0) return null;
    
    // Find the most recent activity
    const lastActivity = progressData
      .filter(p => p.last_accessed_at)
      .sort((a, b) => new Date(b.last_accessed_at!).getTime() - new Date(a.last_accessed_at!).getTime())[0];
    
    if (!lastActivity) return null;
    
    return {
      last_active_subtopic_id: lastActivity.sub_topic_id,
      last_active_timestamp: lastActivity.last_accessed_at,
      view_mode: 'modules',
      current_index: 0
    };
  }, [progressData]);

  // Load roadmap from session storage or user data
  useEffect(() => {
    const storedRoadmap = sessionStorage.getItem('currentRoadmap');
    if (storedRoadmap) {
      try {
        const parsedRoadmap: RoadmapData = JSON.parse(storedRoadmap);
        setRoadmapData(parsedRoadmap);
      } catch (error) {
        console.error('Error parsing stored roadmap:', error);
        sessionStorage.removeItem('currentRoadmap');
      }
    } else if (userRoadmap && userRoadmap.length > 0) {
      const latestRoadmap = userRoadmap[0];
      setRoadmapData(latestRoadmap);
      sessionStorage.setItem('currentRoadmap', JSON.stringify(latestRoadmap));
    }
  }, [userRoadmap]);

  // Refetch progress when user returns to page (e.g., after completing a quiz)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && roadmapData?.id) {
        // User returned to the page, refetch progress
        refetchProgress();
      }
    };

    const handleFocus = () => {
      if (roadmapData?.id) {
        // Window regained focus, refetch progress
        refetchProgress();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [roadmapData?.id, refetchProgress]);

  // Calculate progress metrics
  const progressMetrics = useMemo(() => {
    if (!roadmapData?.roadmap_plan) {
      return { overallProgress: 0, completedSubtopics: 0, totalSubtopics: 0 };
    }

    // Calculate total subtopics from roadmap structure
    const modules = roadmapData.roadmap_plan?.modules || roadmapData.roadmap_plan || [];
    let totalSubtopicsInRoadmap = 0;
    
    modules.forEach(module => {
      if (module.topics) {
        module.topics.forEach(topic => {
          if (topic.subtopics) {
            totalSubtopicsInRoadmap += topic.subtopics.length;
          }
        });
      }
    });

    // Always show the correct total from roadmap structure
    if (!progressData || progressData.length === 0) {
      return { 
        overallProgress: 0, 
        completedSubtopics: 0, 
        totalSubtopics: totalSubtopicsInRoadmap 
      };
    }

    const completed = progressData.filter(p => p.status === 'completed').length;
    const withQuizCompleted = progressData.filter(p => p.quiz_completed).length;
    const withLearnCompleted = progressData.filter(p => p.learn_completed).length;
    
    // More accurate completion counting
    const actualCompleted = Math.max(completed, withQuizCompleted, withLearnCompleted);
    
    // Use the larger of progressData.length or totalFromRoadmap as the total
    const total = Math.max(progressData.length, totalSubtopicsInRoadmap);
    const overallProgress = total === 0 ? 0 : Math.round((actualCompleted / total) * 100);

    // Progress calculation complete

    return {
      overallProgress,
      completedSubtopics: actualCompleted,
      totalSubtopics: total
    };
  }, [progressData, roadmapData]);

  // Navigation handlers
  const handleModuleNavigation = (direction: 'prev' | 'next') => {
    if (!roadmapData?.roadmap_plan) return;
    
    const maxIndex = roadmapData.roadmap_plan.length - 1;
    if (direction === 'prev' && currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
    } else if (direction === 'next' && currentModuleIndex < maxIndex) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    }
  };

  const handleLoadOldRoadmap = (roadmap: RoadmapData) => {
    setRoadmapData(roadmap);
    sessionStorage.setItem('currentRoadmap', JSON.stringify(roadmap));
    setIsOldRoadmapsModalOpen(false);
  };

  const handleLoadLearningContent = (content: any) => {
    // Open the learning content in a new tab
    window.open(`/learn?content_id=${content.id}`, '_blank');
  };

  // Enhanced loading state
  if (loading || isLoadingRoadmap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 transition-colors duration-300 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-blue-600 rounded-full loading-spin"></div>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Loading Your Journey</h3>
            <p className="text-body">Preparing your personalized learning experience...</p>
            <div className="flex justify-center space-x-1 mt-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full loading-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full loading-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full loading-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No roadmap state
  if (!roadmapData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 transition-colors duration-300 flex items-center justify-center px-4">
          <div className="text-center max-w-md w-full">
            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-4">No Learning Journey Found</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-sm lg:text-base font-medium">
              Create your first personalized roadmap to begin your learning adventure.
            </p>
            <div className="space-y-3">
              <Link 
                href="/" 
                className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-sm lg:text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Generate New Roadmap
              </Link>
              <button
                onClick={() => setIsOldRoadmapsModalOpen(true)}
                className="inline-flex items-center justify-center w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-sm lg:text-base font-semibold rounded-lg text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Browse Previous Roadmaps
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 transition-colors duration-300">
        {/* Header */}
        <JourneyHeader 
          user={user}
          overallProgress={progressMetrics.overallProgress}
          completedTopics={progressMetrics.completedSubtopics}
          totalTopics={progressMetrics.totalSubtopics}
          onOldRoadmapsClick={() => setIsOldRoadmapsModalOpen(true)}
          onOldLearnPagesClick={() => setIsOldLearnPagesModalOpen(true)}
          roadmapId={roadmapData?.id}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
          {/* Smart Resume Card */}
          {resumeData && (
            <SmartResumeCard 
              sessionSummary={resumeData}
              nextRecommendedSubtopic={undefined}
              roadmapId={roadmapData?.id}
              onResume={() => {
                // Handle resume functionality
                if (resumeData.view_mode === 'modules') {
                  setCurrentView('modules');
                  setCurrentModuleIndex(resumeData.current_index || 0);
                }
              }}
            />
          )}

          {/* Course Header */}
          <div className="mb-6 lg:mb-8">
            <div className="bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-8 transition-colors duration-300">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {roadmapData.title || roadmapData.subject}
                  </h1>
                  <p className="text-gray-700 dark:text-gray-200 text-sm lg:text-lg mb-4 font-medium">{roadmapData.description || roadmapData.goal}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs lg:text-sm font-medium">{roadmapData.time_value} {roadmapData.time_unit}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span className="text-xs lg:text-sm font-medium">{(roadmapData.roadmap_plan?.modules || roadmapData.roadmap_plan || []).length} Modules</span>
                    </div>
                  </div>
                </div>
                
                {/* Progress Circle */}
                <div className="relative w-20 h-20 lg:w-24 lg:h-24 self-center lg:self-start">
                  <svg className="w-20 h-20 lg:w-24 lg:h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="6" fill="none" className="dark:stroke-gray-600" />
                    <circle 
                      cx="50" cy="50" r="40" 
                      stroke="url(#gradient)" 
                      strokeWidth="8" 
                      fill="none"
                      strokeDasharray={`${progressMetrics.overallProgress * 2.51} 251`}
                      className="transition-all duration-500"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4F46E5" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{progressMetrics.overallProgress}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* View Controls */}
          <div className="mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 border border-gray-200/50 inline-flex">
              <button
                onClick={() => setCurrentView('visual')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  currentView === 'visual' 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Target className="w-4 h-4" />
                <span>Visual Overview</span>
              </button>
              <button
                onClick={() => setCurrentView('modules')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  currentView === 'modules' 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Module View</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          {currentView === 'visual' ? (
            <InteractiveRoadmap 
              roadmapData={roadmapData}
              progressData={progressData}
            />
          ) : (
            <>
              {/* Module Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => handleModuleNavigation('prev')}
                  disabled={currentModuleIndex === 0}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/50 text-gray-600 hover:text-indigo-600 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex-1 mx-4 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {formatTitle(roadmapData.roadmap_plan[currentModuleIndex]?.title)}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{roadmapData.roadmap_plan[currentModuleIndex]?.timeline}</p>
                </div>

                <button
                  onClick={() => handleModuleNavigation('next')}
                  disabled={currentModuleIndex >= roadmapData.roadmap_plan.length - 1}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/50 text-gray-600 hover:text-indigo-600 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Optimized Module Content */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {roadmapData.roadmap_plan[currentModuleIndex]?.topics.map((topic, topicIndex) => (
                    <div key={topicIndex} className="group relative">
                      {/* Compact topic container */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden smooth-hover">
                        {/* Compact topic header */}
                        <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatTitle(topic.title)}
                              </h3>
                              <p className="text-muted text-xs">Topic {topicIndex + 1} of {roadmapData.roadmap_plan[currentModuleIndex]?.topics.length}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Optimized subtopics grid - more columns, less padding */}
                        <div className="p-3 sm:p-4">
                          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {topic.subtopics.map((subtopic, subtopicIndex) => {
                              // Find progress for this subtopic
                              const subtopicProgress = progressData?.find(p => p.sub_topic_id === subtopic.id);
                              const isCompleted = subtopicProgress?.status === 'completed';
                              const hasProgress = subtopicProgress?.learn_completed || subtopicProgress?.quiz_completed;
                              
                              // Debug logging for learn button state
                              if (subtopic.title.includes('CUDA')) {  // Debug for CUDA or any specific subtopic
                                console.log(`🔍 DEBUG for subtopic "${subtopic.title}"`);
                                console.log('  subtopic.id:', subtopic.id);
                                console.log('  subtopicProgress:', subtopicProgress);
                                console.log('  learn_completed:', subtopicProgress?.learn_completed);
                                console.log('  quiz_completed:', subtopicProgress?.quiz_completed);
                                console.log('  status:', subtopicProgress?.status);
                                console.log('  hasProgress:', hasProgress);
                                console.log('  isCompleted:', isCompleted);
                              }
                              
                              return (
                                <div key={subtopicIndex} className="group/card relative">
                                  {/* Compact subtopic card */}
                                  <div className="relative bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-3 sm:p-4 smooth-hover overflow-hidden hover:shadow-lg transition-all duration-200">
                                    {/* Compact completion indicator */}
                                    <div className="absolute top-2 right-2">
                                      {isCompleted ? (
                                        <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                          <Trophy className="w-2.5 h-2.5 text-white" />
                                        </div>
                                      ) : hasProgress ? (
                                        <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                                          <Clock className="w-2.5 h-2.5 text-white" />
                                        </div>
                                      ) : (
                                        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="relative pr-6">
                                      {/* Compact header */}
                                      <div className="mb-3">
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
                                          {formatSubtopicTitle(subtopic.title)}
                                        </h4>
                                      </div>
                                      
                                      {/* Compact progress indicators */}
                                      <div className="flex flex-wrap gap-1 mb-3">
                                        {subtopic.has_learn && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                            <BookOpen className="w-2.5 h-2.5 mr-1" />
                                            Learn
                                          </span>
                                        )}
                                        {subtopic.has_quiz && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                            <Brain className="w-2.5 h-2.5 mr-1" />
                                            Quiz
                                          </span>
                                        )}
                                        {subtopic.has_code_challenge && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                                            <Target className="w-2.5 h-2.5 mr-1" />
                                            Code
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* Compact action buttons */}
                                      <div className="space-y-2">
                                        <Link 
                                          href={`/learn?subtopic=${encodeURIComponent(subtopic.title)}&subtopic_id=${subtopic.id}&roadmap_id=${roadmapData.id}`}
                                          className={`w-full py-2 text-xs flex items-center justify-center space-x-1.5 group rounded-md font-medium transition-all duration-200 ${
                                            subtopicProgress?.learn_completed 
                                              ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200' 
                                              : 'btn-primary'
                                          }`}
                                          onClick={(e) => {
                                            // Prevent double clicks
                                            const target = e.currentTarget;
                                            if (target.dataset.clicked === 'true') {
                                              e.preventDefault();
                                              return;
                                            }
                                            target.dataset.clicked = 'true';
                                            setTimeout(() => {
                                              target.dataset.clicked = 'false';
                                            }, 1000);
                                          }}
                                        >
                                          {subtopicProgress?.learn_completed ? (
                                            <>
                                              <CheckCircle className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                              <span>Review</span>
                                            </>
                                          ) : (
                                            <>
                                              <BookOpen className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                              <span>Learn</span>
                                            </>
                                          )}
                                        </Link>
                                        
                                        {subtopic.has_quiz && (
                                          <Link
                                            href={`/quiz?subtopic_id=${subtopic.id}&subtopic=${encodeURIComponent(subtopic.title)}&subject=${encodeURIComponent(roadmapData.subject || 'General Subject')}&goal=${encodeURIComponent(roadmapData.goal || roadmapData.description || 'Learn new concepts')}&module_title=${encodeURIComponent(roadmapData.roadmap_plan[currentModuleIndex]?.title || 'Module')}&topic_title=${encodeURIComponent(topic.title)}&roadmap_id=${roadmapData.id}`}
                                            className="btn-secondary w-full py-2 text-xs flex items-center justify-center space-x-1.5 group"
                                          >
                                            <Brain className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                            <span>Quiz</span>
                                          </Link>
                                        )}
                                      </div>
                                      
                                      {/* Compact report button */}
                                      <div className="mt-2">
                                        <ReportButton subTopicId={subtopic.id} subtopicTitle={subtopic.title} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Module Progress Indicator */}
              <div className="mt-8 text-center">
                <div className="inline-flex items-center space-x-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200/50">
                  <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                    Module {currentModuleIndex + 1} of {roadmapData.roadmap_plan.length}
                  </span>
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                      style={{
                        width: `${((currentModuleIndex + 1) / roadmapData.roadmap_plan.length) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Learning Guide */}
          <LearningGuide className="mb-6 lg:mb-8" />

          {/* Recommended Reviews */}
          <RecommendedReviews recommendedReviews={recommendedReviews || []} />
        </main>

        {/* Old Roadmaps Modal */}
        {isOldRoadmapsModalOpen && (
          <OldRoadmapsModal
            isOpen={isOldRoadmapsModalOpen}
            onClose={() => setIsOldRoadmapsModalOpen(false)}
            onLoadRoadmap={handleLoadOldRoadmap}
          />
        )}

        {/* Old Learn Pages Modal */}
        {isOldLearnPagesModalOpen && (
          <OldLearnPagesModal
            isOpen={isOldLearnPagesModalOpen}
            onClose={() => setIsOldLearnPagesModalOpen(false)}
            onLoadLearningContent={handleLoadLearningContent}
          />
        )}

        {/* Quiz Report Modal */}
        <QuizReportModal />

        {/* Floating Behavioral Indicator */}
        <BehavioralIndicator 
          roadmapId={roadmapData?.id}
          overallProgress={progressMetrics.overallProgress}
          completedTopics={progressMetrics.completedSubtopics}
          totalTopics={progressMetrics.totalSubtopics}
        />
      </div>
    </ProtectedRoute>
  );
};

export default JourneyPage;