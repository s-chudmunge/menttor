// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatSubtopicTitle, formatTitle, formatQuizQuestion } from './utils/textFormatting';

import { api, RoadmapData, UserProgress } from '../../lib/api';
import { BACKEND_URL } from '../../config/config';
import { useRoadmap } from '../../hooks/useRoadmap';
import { useProgress } from '../../hooks/useProgress';
import { useRecommendedReviews } from '../../hooks/useRecommendedReviews';

import JourneyHeader from './components/JourneyHeader';
import EndlessCanvasRoadmap from './components/EndlessCanvasRoadmap';
import RecommendedReviews from './components/RecommendedReviews';
import OldRoadmapsModal from '../components/OldRoadmapsModal';
import OldLearnPagesModal from '../learn/OldLearnPagesModal';
import ProtectedRoute from '../components/ProtectedRoute';
import { ThreeDGeneratorModal } from '../../../components/ThreeDGenerator';
import { LearnAboutSomethingModal } from '../../../components/LearnAboutSomething';
import D3ModelMapModal from '../components/ModelSelectionMap';
import LearningGuide from './components/LearningGuide';
import ReportButton from './components/ReportButton';
import QuizReportModal from './components/QuizReportModal';
import DayView from './components/DayView';
import ModuleView from './components/ModuleView';
import PracticeView from './components/PracticeView';
import QuickToolsSidePanel from './components/QuickToolsSidePanel';

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
  Brain,
  RefreshCw,
  Box,
  PenTool,
  ExternalLink,
  X,
  Play
} from 'lucide-react';

interface LearningResource {
  id: number;
  title: string;
  url: string;
  type: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

const JourneyPage = () => {
  const [currentView, setCurrentView] = useState<'day' | 'modules' | 'practice'>('day');
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [learningResources, setLearningResources] = useState<LearningResource[]>([]);
  const [isOldRoadmapsModalOpen, setIsOldRoadmapsModalOpen] = useState(false);
  const [isOldLearnPagesModalOpen, setIsOldLearnPagesModalOpen] = useState(false);
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  
  // Quick tools state
  const [show3DGenerator, setShow3DGenerator] = useState(false);
  const [threeDModel, setThreeDModel] = useState('vertexai:gemini-2.5-flash');
  const [threeDModelName, setThreeDModelName] = useState('Gemini 2.5 Flash');
  const [show3DModelModal, setShow3DModelModal] = useState(false);
  const [showLearnAboutSomething, setShowLearnAboutSomething] = useState(false);
  const [learnModel, setLearnModel] = useState('openrouter:meta-llama/llama-3.3-8b-instruct:free');
  const [learnModelName, setLearnModelName] = useState('Meta Llama 3.3 8B (free)');
  const [showLearnModelModal, setShowLearnModelModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isQuickToolsPanelOpen, setIsQuickToolsPanelOpen] = useState(true);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);

  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();


  // Data fetching
  const { data: userRoadmap, isLoading: isLoadingRoadmap } = useRoadmap(user?.id);
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
          queryClient.removeQueries({ queryKey: ['progress'] });
          queryClient.invalidateQueries({ queryKey: ['userProgress'] });
          queryClient.invalidateQueries({ queryKey: ['behavioral'] });
          queryClient.invalidateQueries({ queryKey: ['roadmap'] });
          
          // Specifically invalidate progress for this roadmap
          if (roadmapData?.id) {
            console.log('🔄 Invalidating progress queries for roadmap:', roadmapData.id);
            queryClient.removeQueries({ 
              queryKey: ['progress', roadmapData.id],
              exact: false // Match all variants of progress queries for this roadmap
            });
            
            // Also explicitly refetch progress
            console.log('🔄 Explicitly refetching progress for roadmap:', roadmapData.id);
            refetchProgress();
            
            // Force a second refetch after a small delay to ensure fresh data
            setTimeout(() => {
              console.log('🔄 Second progress refetch for roadmap:', roadmapData.id);
              refetchProgress();
            }, 1000);
          }
        }
      }
    };

    // Listen for page visibility changes (when user switches back to this tab)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also check on component mount in case user navigated directly
    const urlParams = new URLSearchParams(window.location.search);
    const isReturningFromLearn = sessionStorage.getItem('returning-from-learn') === 'true';
    const forceRefreshFlag = sessionStorage.getItem('force-progress-refresh');
    
    if (urlParams.get('refresh') === 'true' || sessionStorage.getItem('returning-from-quiz') === 'true' || isReturningFromLearn || forceRefreshFlag) {
      console.log('Force reloading journey page data on mount');
      sessionStorage.removeItem('returning-from-quiz');
      sessionStorage.removeItem('returning-from-learn');
      sessionStorage.removeItem('force-progress-refresh');
      
      // More aggressive cache clearing
      queryClient.removeQueries({ 
        predicate: query => query.queryKey[0] === 'progress'
      });
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      queryClient.invalidateQueries({ queryKey: ['behavioral'] });
      queryClient.invalidateQueries({ queryKey: ['roadmap'] });
      
      // Also invalidate specific progress queries
      if (roadmapData?.id) {
        queryClient.removeQueries({ 
          queryKey: ['progress', roadmapData.id],
          exact: false
        });
        refetchProgress();
        
        // Force a second refetch after a small delay to ensure fresh data
        setTimeout(() => {
          refetchProgress();
        }, 1000);
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient, refetchProgress, roadmapData?.id]);

  // Progress loading effect for debugging
  useEffect(() => {
    console.log('🔍 Journey Progress Update:', {
      roadmapId: roadmapData?.id,
      progressData: progressData,
      progressCount: progressData?.length || 0,
      hasProgress: progressData && progressData.length > 0,
      isLoadingProgress: isLoadingProgress
    });
    if (progressData && progressData.length > 0) {
      console.log('📊 First few progress records:', progressData.slice(0, 3));
    }
  }, [roadmapData?.id, progressData, isLoadingProgress]);


  // Load roadmap from session storage or user data
  useEffect(() => {
    const newlyAdoptedId = sessionStorage.getItem('newlyAdoptedRoadmapId');
    const storedRoadmap = sessionStorage.getItem('currentRoadmap');
    
    if (newlyAdoptedId && userRoadmap && userRoadmap.length > 0) {
      // User just adopted a roadmap, find and load it
      const adoptedRoadmap = userRoadmap.find(roadmap => roadmap.id === parseInt(newlyAdoptedId));
      if (adoptedRoadmap) {
        setRoadmapData(adoptedRoadmap);
        sessionStorage.setItem('currentRoadmap', JSON.stringify(adoptedRoadmap));
        sessionStorage.removeItem('newlyAdoptedRoadmapId'); // Clear the flag
        return;
      }
    }
    
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

  // Fetch learning resources when roadmap data changes
  useEffect(() => {
    const fetchLearningResources = async () => {
      if (!roadmapData?.id) return;
      
      try {
        const response = await fetch(`${BACKEND_URL}/learning-resources/${roadmapData.id}`);
        if (response.ok) {
          const data = await response.json();
          setLearningResources(data.resources || []);
        }
      } catch (error) {
        console.error('Failed to fetch learning resources:', error);
      }
    };

    if (roadmapData?.id) {
      fetchLearningResources();
    }
  }, [roadmapData?.id]);


  // Polling mechanism for progress updates after learn completion
  useEffect(() => {
    const checkForProgressUpdates = () => {
      const lastCompletion = sessionStorage.getItem('last-learn-completion');
      const forceRefresh = sessionStorage.getItem('force-progress-refresh');
      
      if (lastCompletion || forceRefresh) {
        const completionTime = parseInt(lastCompletion || '0');
        const now = Date.now();
        
        // If completion was within the last 30 seconds, keep polling
        if (now - completionTime < 30000) {
          console.log('🔄 Polling for progress updates after recent learn completion');
          setIsRefreshing(true);
          
          if (roadmapData?.id) {
            // Force refetch progress data
            refetchProgress().then(() => {
              console.log('✅ Progress data refreshed via polling');
              setIsRefreshing(false);
            }).catch(() => {
              setIsRefreshing(false);
            });
          }
        } else {
          // Clean up old timestamps
          sessionStorage.removeItem('last-learn-completion');
          setIsRefreshing(false);
        }
      }
    };

    // Check immediately
    checkForProgressUpdates();
    
    // Set up polling every 3 seconds for recent completions
    const pollInterval = setInterval(checkForProgressUpdates, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [roadmapData?.id, refetchProgress]);

  // Check for welcome message flag
  useEffect(() => {
    const shouldShowWelcome = sessionStorage.getItem('showWelcomeMessage');
    if (shouldShowWelcome === 'true') {
      setShowWelcomeMessage(true);
      sessionStorage.removeItem('showWelcomeMessage'); // Clear the flag
    }
  }, []);

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
    
    // Handle different roadmap plan structures
    const modules = roadmapData.roadmap_plan?.modules || roadmapData.roadmap_plan || [];
    const maxIndex = modules.length - 1;
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

  // Quick tools handlers
  const handleSelect3DModel = (modelId: string, modelName: string) => {
    setThreeDModel(modelId);
    setThreeDModelName(modelName);
    setShow3DModelModal(false);
  };

  const handleSelectLearnModel = (modelId: string, modelName: string) => {
    setLearnModel(modelId);
    setLearnModelName(modelName);
    setShowLearnModelModal(false);
  };

  // Enhanced loading state
  if (loading || isLoadingRoadmap) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-900 transition-colors duration-300 flex items-center justify-center px-4">
        <div className="text-center text-gray-700 dark:text-gray-300">
          Loading...
        </div>
      </div>
    );
  }

  // No roadmap state
  if (!roadmapData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-blue-50 dark:bg-gray-900 transition-colors duration-300 flex items-center justify-center px-4">
          <div className="text-center max-w-md w-full">
            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-100 dark:bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-6">
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
                className="inline-flex items-center justify-center w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-sm lg:text-base font-semibold rounded-lg text-gray-800 dark:text-gray-200 bg-white dark:bg-zinc-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
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
      <div className="min-h-screen bg-blue-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Header */}
        <JourneyHeader 
          user={user}
          overallProgress={progressMetrics.overallProgress}
          completedTopics={progressMetrics.completedSubtopics}
          totalTopics={progressMetrics.totalSubtopics}
          onOldRoadmapsClick={() => setIsOldRoadmapsModalOpen(true)}
          onOldLearnPagesClick={() => setIsOldLearnPagesModalOpen(true)}
          roadmapId={roadmapData?.id}
          isRefreshing={isRefreshing}
          isQuickToolsPanelOpen={isQuickToolsPanelOpen}
          onToggleQuickToolsPanel={() => setIsQuickToolsPanelOpen(!isQuickToolsPanelOpen)}
        />

        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 transition-all duration-300 ${isQuickToolsPanelOpen ? 'lg:ml-72' : 'lg:ml-0'}`}>

          {/* Welcome Message Box */}
          {showWelcomeMessage && (
            <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      🎉 Welcome to Your Learning Journey!
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                      Your personalized roadmap is ready! Here's what you can do to start learning:
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Play className="w-4 h-4 text-green-600" />
                        <span>Click on any topic to start learning</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span>Track your progress as you go</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Brain className="w-4 h-4 text-green-600" />
                        <span>Take quizzes to test your knowledge</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span>Follow your custom timeline</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowWelcomeMessage(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Compact View Controls */}
          <div className="mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 inline-flex shadow-sm">
              <button
                onClick={() => setCurrentView('day')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === 'day' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Day View</span>
                <span className="sm:hidden">Day</span>
              </button>
              <button
                onClick={() => setCurrentView('modules')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === 'modules' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Module View</span>
                <span className="sm:hidden">Modules</span>
              </button>
              <button
                onClick={() => setCurrentView('practice')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === 'practice' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span className="hidden sm:inline">Practice</span>
                <span className="sm:hidden">Practice</span>
              </button>
            </div>
          </div>

          {/* Enhanced Course Header */
          <div className="mb-4">
            <div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 transition-all duration-300 hover:shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="mb-3">
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                      {roadmapData.title || roadmapData.subject}
                    </h1>
                    <p className="text-gray-700 dark:text-gray-200 text-sm lg:text-base mb-3 leading-relaxed">
                      {roadmapData.description || roadmapData.goal}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="flex items-center space-x-2 bg-white/50 dark:bg-gray-800/50 rounded-md p-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Duration</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{roadmapData.time_value} {roadmapData.time_unit}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-white/50 dark:bg-gray-800/50 rounded-md p-2">
                      <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center">
                        <Target className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Modules</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{(roadmapData.roadmap_plan?.modules || roadmapData.roadmap_plan || []).length}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-white/50 dark:bg-gray-800/50 rounded-md p-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                        <Trophy className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Completed</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{progressMetrics.completedSubtopics}/{progressMetrics.totalSubtopics}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-white/50 dark:bg-gray-800/50 rounded-md p-2">
                      <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center">
                        <BarChart3 className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Progress</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{progressMetrics.overallProgress}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Roadmap Trigger Card */}
                  <div className="mt-4">
                    <button
                      onClick={() => setIsRoadmapModalOpen(true)}
                      className="w-full flex items-center justify-between p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Target className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm">Interactive Roadmap</p>
                          <p className="text-xs text-blue-100">Click to explore your learning path</p>
                        </div>
                      </div>
                      <div className="transform group-hover:translate-x-1 transition-transform duration-200">
                        <ChevronRight className="w-5 h-5 text-white" />
                      </div>
                    </button>
                  </div>
                </div>
                
                {/* Enhanced Progress Circle */}
                <div className="relative w-16 h-16 lg:w-20 lg:h-20 self-center lg:self-start">
                  <svg className="w-16 h-16 lg:w-20 lg:h-20 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="3" fill="none" className="dark:stroke-gray-600" />
                    <circle 
                      cx="50" cy="50" r="40" 
                      stroke="#4F46E5" 
                      strokeWidth="4" 
                      fill="none"
                      strokeDasharray={`${progressMetrics.overallProgress * 2.51} 251`}
                      strokeLinecap="round"
                      className="transition-all duration-500 drop-shadow-sm"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4F46E5" />
                        <stop offset="50%" stopColor="#7C3AED" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm lg:text-base font-bold text-gray-900 dark:text-white">{progressMetrics.overallProgress}%</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Complete</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }


          {/* Content Area */}
          {currentView === 'day' ? (
            <DayView 
              roadmapData={roadmapData}
              progressData={progressData}
            />
          ) : currentView === 'practice' ? (
            <PracticeView 
              roadmapData={roadmapData}
              progressData={progressData}
            />
          ) : (
            <ModuleView 
              roadmapData={roadmapData}
              progressData={progressData}
              currentModuleIndex={currentModuleIndex}
              onModuleNavigation={handleModuleNavigation}
            />
          )}

          {/* Learning Guide */}
          <LearningGuide className="mb-6 lg:mb-8" />

          {/* Recommended Reviews */}
          <RecommendedReviews recommendedReviews={recommendedReviews || []} />

          {/* Learning Resources */}
          {learningResources.length > 0 && (
            <div className="mt-12 bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
                Learning Resources
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Curated external resources to enhance your learning journey with {roadmapData.title || roadmapData.subject}.
              </p>
              
              <div className="space-y-2">
                {learningResources.map((resource) => (
                  <div key={resource.id}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      title={resource.description}
                    >
                      {resource.title}
                    </a>
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                      ({resource.type})
                    </span>
                    {resource.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {resource.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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

        {/* Quick Tools Modals */}
        <ThreeDGeneratorModal
          isOpen={show3DGenerator}
          onClose={() => setShow3DGenerator(false)}
          selectedModel={threeDModel}
          selectedModelName={threeDModelName}
          onModelSelect={() => setShow3DModelModal(true)}
        />

        <LearnAboutSomethingModal
          isOpen={showLearnAboutSomething}
          onClose={() => setShowLearnAboutSomething(false)}
          selectedModel={learnModel}
          selectedModelName={learnModelName}
          onModelSelect={() => setShowLearnModelModal(true)}
        />

        {/* Model Selection Modals */}
        {show3DModelModal && (
          <D3ModelMapModal
            isOpen={show3DModelModal}
            onClose={() => setShow3DModelModal(false)}
            onSelectModel={handleSelect3DModel}
            currentModelId={threeDModel.includes(':') ? threeDModel : `vertexai:${threeDModel}`}
          />
        )}

        {showLearnModelModal && (
          <D3ModelMapModal
            isOpen={showLearnModelModal}
            onClose={() => setShowLearnModelModal(false)}
            onSelectModel={handleSelectLearnModel}
            currentModelId={learnModel.includes(':') ? learnModel : `vertexai:${learnModel}`}
          />
        )}

        {/* Quiz Report Modal */}
        <QuizReportModal />

        {/* Roadmap Modal */}
        {isRoadmapModalOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsRoadmapModalOpen(false)}
            />
            
            {/* Modal Content */}
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <div className="w-full max-w-6xl h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Interactive Learning Roadmap</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Explore your personalized learning path</p>
                  </div>
                  <button
                    onClick={() => setIsRoadmapModalOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </button>
                </div>

                {/* Canvas Container */}
                <div className="h-[calc(90vh-88px)]">
                  <EndlessCanvasRoadmap 
                    roadmapData={roadmapData}
                    progressData={progressData}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Tools Side Panel */}
        <QuickToolsSidePanel
          isOpen={isQuickToolsPanelOpen}
          onToggle={() => setIsQuickToolsPanelOpen(!isQuickToolsPanelOpen)}
          onShow3DGenerator={() => setShow3DGenerator(true)}
          onShowLearnAboutSomething={() => setShowLearnAboutSomething(true)}
          roadmapData={roadmapData}
        />

      </div>
    </ProtectedRoute>
  );
};

export default JourneyPage;