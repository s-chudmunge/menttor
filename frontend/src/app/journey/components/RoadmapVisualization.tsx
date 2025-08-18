// @ts-nocheck
'use client';

import React from 'react';
import { RoadmapData, UserProgress, api } from '../../../lib/api'; // Import api
import { CheckCircle, BookOpen, Laptop, Code } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Import useMutation and useQueryClient
import { formatSubtopicTitle, formatTitle, formatQuizQuestion } from '../utils/textFormatting';

interface RoadmapVisualizationProps {
  roadmapData: RoadmapData;
  progressData: UserProgress[] | null;
}

const getSubtopicStatus = (subtopicId: string, progressData: UserProgress[] | null) => {
  if (!progressData) return 'not-started';
  const progress = progressData.find(p => p.sub_topic_id === subtopicId);

  if (!progress) return 'not-started';

  if (progress.status === 'completed') {
    return 'completed';
  } else if (progress.learn_completed && !progress.quiz_completed) {
    return 'ready-for-quiz';
  } else if (!progress.learn_completed && !progress.quiz_completed) {
    return 'learning'; // Or 'in-progress'
  }
  return 'not-started'; // Fallback
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'ready-for-quiz': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'learning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'not-started': return 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300';
  }
};

const getStatusBorderColor = (status: string) => {
  switch (status) {
    case 'completed': return 'border-green-500';
    case 'ready-for-quiz': return 'border-yellow-500';
    case 'learning': return 'border-blue-500';
    case 'not-started': return 'border-gray-300';
    default: return 'border-gray-300';
  }
};

const RoadmapVisualization: React.FC<RoadmapVisualizationProps> = ({
  roadmapData,
  progressData,
}) => {
  const queryClient = useQueryClient(); // Initialize queryClient

  const markLearnCompletedMutation = useMutation({
    mutationFn: async (subtopicId: string) => {
      await api.patch(`/progress/${subtopicId}/learn-completed`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['progress', roadmapData.id]); // Invalidate progress query to refetch
    },
  });

  const calculateModuleProgress = (module: any) => {
    let totalSubtopics = 0;
    let completedSubtopics = 0;

    module.topics.forEach((topic: any) => {
      topic.subtopics.forEach((subtopic: any) => {
        totalSubtopics++;
        if (getSubtopicStatus(subtopic.id, progressData) === 'completed') {
          completedSubtopics++;
        }
      });
    });
    return totalSubtopics === 0 ? 0 : (completedSubtopics / totalSubtopics) * 100;
  };

  // Handle both possible data structures
  const modules = roadmapData.roadmap_plan?.modules || roadmapData.roadmap_plan || [];

  if (!modules || !Array.isArray(modules)) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No roadmap modules available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-12">
      {modules.map((module: any) => {
        const moduleProgress = calculateModuleProgress(module);
        return (
          <div key={module.id} className="group relative">
            {/* Modern module container with glassmorphism */}
            <div className="bg-gradient-to-br from-white/90 to-blue-50/70 dark:from-gray-800/90 dark:to-blue-900/20 backdrop-blur-lg rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6 lg:p-10 transition-all duration-300 hover:shadow-3xl">
              {/* Module header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <h3 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center space-x-3">
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg"></div>
                    <span>{formatTitle(module.title)}</span>
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm lg:text-base font-medium">{module.timeline}</p>
                </div>
                
                {/* Modern progress circle */}
                <div className="relative w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      className="text-gray-200/50 dark:text-gray-600/50"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      r="15"
                      cx="18"
                      cy="18"
                    />
                    <circle
                      className="text-indigo-500 dark:text-indigo-400"
                      strokeWidth="4"
                      strokeDasharray={`${moduleProgress * 0.94} 94.2`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      stroke="url(#progressGradient)"
                      fill="none"
                      r="15"
                      cx="18"
                      cy="18"
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.2))' }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm lg:text-base font-bold text-gray-900 dark:text-white">
                      {Math.round(moduleProgress)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Topics timeline with modern design */}
              <div className="relative">
                {/* Modern vertical line */}
                <div className="absolute left-4 lg:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/30 via-purple-500/30 to-indigo-500/30 dark:from-indigo-400/40 dark:via-purple-400/40 dark:to-indigo-400/40"></div>
                
                <div className="space-y-8 lg:space-y-10">
                  {module.topics.map((topic: any, topicIndex: number) => (
                    <div key={topic.id} className="relative pl-10 lg:pl-14">
                      {/* Modern topic node */}
                      <div className="absolute left-2 lg:left-4 top-2 w-5 h-5 lg:w-6 lg:h-6 bg-gradient-to-r from-indigo-500 to-purple-500 border-2 border-white dark:border-gray-800 rounded-full shadow-lg flex items-center justify-center">
                        <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 bg-white rounded-full"></div>
                      </div>
                      
                      {/* Topic content */}
                      <div className="bg-gradient-to-r from-white/80 to-indigo-50/60 dark:from-gray-700/80 dark:to-indigo-900/30 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-600/30 shadow-lg p-6 lg:p-8 transition-all duration-300 hover:shadow-xl">
                        <h4 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-3">
                          <span>{formatTitle(topic.title)}</span>
                        </h4>
                        
                        {/* Subtopics grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                          {topic.subtopics.map((subtopic: any) => {
                            const status = getSubtopicStatus(subtopic.id, progressData);
                            const statusColor = getStatusColor(status);

                            return (
                              <div key={subtopic.id} className="group/card relative">
                                {/* Modern subtopic card */}
                                <div className="relative bg-gradient-to-br from-white/90 to-gray-50/70 dark:from-gray-700/90 dark:to-gray-800/70 backdrop-blur-sm rounded-xl border border-white/40 dark:border-gray-600/40 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                                  {/* Status indicator */}
                                  <div className={`absolute top-0 left-0 w-full h-1 ${status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : status === 'ready-for-quiz' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : status === 'learning' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-300'}`}></div>
                                  
                                  <div className="p-5 lg:p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                      <h5 className="font-bold text-sm lg:text-base text-gray-900 dark:text-white flex-1 leading-relaxed">
                                        {formatSubtopicTitle(subtopic.title)}
                                      </h5>
                                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor} ml-2 whitespace-nowrap`}>
                                        {status.replace(/-/g, ' ').toUpperCase()}
                                      </span>
                                    </div>
                                    
                                    {/* Modern action buttons */}
                                    <div className="flex flex-wrap gap-2">
                                      {subtopic.has_learn && (
                                        <button
                                          onClick={() => markLearnCompletedMutation.mutate(subtopic.id)}
                                          className={`group/btn relative overflow-hidden px-3 py-2 rounded-lg font-medium text-xs lg:text-sm transition-all duration-300 shadow-md hover:shadow-lg ${
                                            status === 'completed' 
                                              ? 'bg-gray-400 cursor-not-allowed' 
                                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                                          } text-white`}
                                          disabled={status === 'completed'}
                                        >
                                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500"></div>
                                          <div className="relative flex items-center space-x-1">
                                            <BookOpen className="w-3 h-3 lg:w-4 lg:h-4" />
                                            <span>Learn</span>
                                          </div>
                                        </button>
                                      )}
                                      {subtopic.has_quiz && (
                                        <Link
                                          href={`/quiz?subtopic_id=${subtopic.id}&subtopic_title=${encodeURIComponent(subtopic.title)}&module_title=${encodeURIComponent(module.title)}&topic_title=${encodeURIComponent(topic.title)}`}
                                          className={`group/btn relative overflow-hidden px-3 py-2 rounded-lg font-medium text-xs lg:text-sm transition-all duration-300 shadow-md hover:shadow-lg ${
                                            status === 'not-started' || status === 'learning' 
                                              ? 'bg-gray-400 opacity-50 cursor-not-allowed' 
                                              : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'
                                          } text-white`}
                                          aria-disabled={status === 'not-started' || status === 'learning'}
                                          tabIndex={status === 'not-started' || status === 'learning' ? -1 : 0}
                                        >
                                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500"></div>
                                          <div className="relative flex items-center space-x-1">
                                            <Laptop className="w-3 h-3 lg:w-4 lg:h-4" />
                                            <span>Quiz</span>
                                          </div>
                                        </Link>
                                      )}
                                      {subtopic.has_code_challenge && (
                                        <button
                                          onClick={() => alert('Code Challenge coming soon!')}
                                          className="group/btn relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-3 py-2 rounded-lg font-medium text-xs lg:text-sm transition-all duration-300 shadow-md hover:shadow-lg"
                                        >
                                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500"></div>
                                          <div className="relative flex items-center space-x-1">
                                            <Code className="w-3 h-3 lg:w-4 lg:h-4" />
                                            <span>Code</span>
                                          </div>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoadmapVisualization;