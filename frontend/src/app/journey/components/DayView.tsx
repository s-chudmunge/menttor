'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Circle, 
  PlayCircle, 
  Clock, 
  BookOpen, 
  Brain, 
  Code, 
  Trophy,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Target,
  Star,
  Zap
} from 'lucide-react';
import { RoadmapData } from '../../../lib/api';
import { formatSubtopicTitle, formatTitle } from '../utils/textFormatting';
import ReportButton from './ReportButton';

interface DayViewProps {
  roadmapData: RoadmapData;
  progressData: any[] | null;
}

interface DayViewItem {
  day: number;
  date: string;
  topics: Array<{
    id: string;
    title: string;
    module_title: string;
    topic_title: string;
    status: 'completed' | 'current' | 'locked' | 'available';
    has_learn: boolean;
    has_quiz: boolean;
    has_code_challenge?: boolean;
    estimated_time: number; // in minutes
    priority: 'high' | 'medium' | 'low';
    progress?: {
      learn_completed: boolean;
      quiz_completed: boolean;
      quiz_best_score?: number;
    };
  }>;
  totalTime: number;
  completionRate: number;
}

const DayView: React.FC<DayViewProps> = ({ roadmapData, progressData }) => {
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const daysPerPage = 7; // Show 7 days at once (like a week)

  // Early return for invalid roadmap data
  if (!roadmapData) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading roadmap data...</p>
      </div>
    );
  }

  // Transform roadmap data into day-based structure
  const roadmapByDay = useMemo(() => {
    if (!roadmapData?.roadmap_plan) return [];

    const modules = (roadmapData.roadmap_plan as any)?.modules || roadmapData.roadmap_plan || [];
    const allSubtopics: any[] = [];

    // Extract all subtopics with their context
    modules.forEach((module: any) => {
      if (module.topics) {
        module.topics.forEach((topic: any) => {
          if (topic.subtopics) {
            topic.subtopics.forEach((subtopic: any) => {
              allSubtopics.push({
                ...subtopic,
                module_title: formatTitle(module.title),
                topic_title: formatTitle(topic.title),
                estimated_time: 25, // Default 25 minutes per subtopic
              });
            });
          }
        });
      }
    });

    // Group subtopics into days (assuming 2-3 subtopics per day)
    const days: DayViewItem[] = [];
    const subtopicsPerDay = 3;
    
    for (let i = 0; i < allSubtopics.length; i += subtopicsPerDay) {
      const dayTopics = allSubtopics.slice(i, i + subtopicsPerDay).map(subtopic => {
        const progress = progressData?.find(p => p.sub_topic_id === subtopic.id);
        
        let status: 'completed' | 'current' | 'locked' | 'available' = 'available';
        if (progress) {
          if (progress.status === 'completed') status = 'completed';
          else if (progress.learn_completed || progress.quiz_completed) status = 'current';
        }

        return {
          id: subtopic.id || '',
          title: formatSubtopicTitle(subtopic.title),
          module_title: subtopic.module_title || '',
          topic_title: subtopic.topic_title || '',
          status,
          has_learn: Boolean(subtopic.has_learn || true),
          has_quiz: Boolean(subtopic.has_quiz || false),
          has_code_challenge: Boolean(subtopic.has_code_challenge || false),
          estimated_time: Number(subtopic.estimated_time) || 25,
          priority: (i < subtopicsPerDay ? 'high' : i < subtopicsPerDay * 2 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          progress: progress ? {
            learn_completed: progress.learn_completed || false,
            quiz_completed: progress.quiz_completed || false,
            quiz_best_score: progress.quiz_best_score,
          } : undefined,
        };
      });

      const dayNumber = Math.floor(i / subtopicsPerDay) + 1;
      const dayDate = new Date();
      dayDate.setDate(dayDate.getDate() + dayNumber - 1);

      const totalTime = dayTopics.reduce((acc, topic) => acc + topic.estimated_time, 0);
      const completedTopics = dayTopics.filter(topic => topic.status === 'completed').length;
      const completionRate = dayTopics.length > 0 ? (completedTopics / dayTopics.length) * 100 : 0;

      days.push({
        day: dayNumber,
        date: dayDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        }),
        topics: dayTopics,
        totalTime,
        completionRate,
      });
    }

    return days;
  }, [roadmapData, progressData]);

  // Calculate which days to show for current page
  const startDayIndex = currentWeekIndex * daysPerPage;
  const endDayIndex = Math.min(startDayIndex + daysPerPage, roadmapByDay.length);
  const currentPageDays = roadmapByDay.slice(startDayIndex, endDayIndex);
  const totalPages = Math.ceil(roadmapByDay.length / daysPerPage);

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1);
    } else if (direction === 'next' && currentWeekIndex < totalPages - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'current':
        return <PlayCircle className="w-5 h-5 text-blue-500" />;
      case 'locked':
        return <Circle className="w-5 h-5 text-gray-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-zinc-900/20';
    }
  };

  if (!currentPageDays || roadmapByDay.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No daily learning plan available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => handleNavigation('prev')}
          disabled={currentWeekIndex === 0}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-zinc-950 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Days {startDayIndex + 1}-{endDayIndex}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentWeekIndex + 1} of {totalPages}
          </p>
        </div>
        
        <button
          onClick={() => handleNavigation('next')}
          disabled={currentWeekIndex >= totalPages - 1}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-zinc-950 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* All Days for Current Page */}
      {currentPageDays.map((day, dayIndex) => (
        <motion.div
          key={day.day}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: dayIndex * 0.1 }}
        >
            {/* Compact Day Header */}
            <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50 shadow-sm mb-3">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-indigo-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Day {day.day}
                      </h3>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{day.date}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{day.totalTime}m</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Target className="w-3 h-3 mr-1" />
                      <span>{Math.round(day.completionRate)}%</span>
                    </div>
                  </div>
                </div>

                {/* Compact Progress Bar */}
                <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden mt-3">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${day.completionRate}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Topics Grid for this day */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
              {day.topics.map((topic, index) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm rounded-lg border-l-3 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200 ${getPriorityColor(topic.priority)}`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {getStatusIcon(topic.status)}
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white ml-2 line-clamp-2">
                      {topic.title}
                    </h4>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <Clock className="w-3 h-3" />
                    <span>{topic.estimated_time}m</span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span className="capitalize">{topic.priority}</span>
                  </div>

                  {/* Activity Types - Compact */}
                  <div className="flex items-center space-x-1 mb-3">
                    {topic.has_learn && (
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                        Learn
                      </span>
                    )}
                    {topic.has_quiz && (
                      <span className="px-2 py-1 rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                        Quiz
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Indicator - Compact */}
                {topic.progress && (
                  <div className="flex space-x-1">
                    {topic.progress.learn_completed && (
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                    {topic.progress.quiz_completed && (
                      <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <Trophy className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons - Compact */}
              <div className="flex space-x-2">
                {topic.has_learn && (
                  <Link
                    href={`/learn?subtopic=${encodeURIComponent(topic.title)}&subtopic_id=${topic.id}&roadmap_id=${roadmapData.id}`}
                    className={`flex-1 text-center py-2 px-3 text-xs rounded-md font-medium transition-all duration-200 ${
                      topic.progress?.learn_completed
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {topic.progress?.learn_completed ? 'Review' : 'Learn'}
                  </Link>
                )}
                
                {topic.has_quiz && (
                  <Link
                    href={`/quiz?subtopic_id=${topic.id}&subtopic=${encodeURIComponent(topic.title)}&subject=${encodeURIComponent(roadmapData.subject || 'General Subject')}&goal=${encodeURIComponent(roadmapData.goal || roadmapData.description || 'Learn new concepts')}&roadmap_id=${roadmapData.id}`}
                    className="flex-1 text-center py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md font-medium transition-all duration-200"
                  >
                    Quiz
                  </Link>
                )}
              </div>
              
              {/* Report Button */}
              <div className="mt-2">
                <ReportButton subTopicId={topic.id} subtopicTitle={topic.title} />
              </div>
            </div>
          </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
    </div>
  );
};

export default DayView;