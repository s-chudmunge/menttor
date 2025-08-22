'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Trophy, 
  Target, 
  Clock,
  Brain,
  CheckCircle
} from 'lucide-react';
import { RoadmapData } from '../../../lib/api';
import { formatSubtopicTitle, formatTitle } from '../utils/textFormatting';
import ReportButton from './ReportButton';

interface ModuleViewProps {
  roadmapData: RoadmapData;
  progressData: any[] | null;
  currentModuleIndex: number;
  onModuleNavigation: (direction: 'prev' | 'next') => void;
}

const ModuleView: React.FC<ModuleViewProps> = ({ 
  roadmapData, 
  progressData, 
  currentModuleIndex, 
  onModuleNavigation 
}) => {
  // Early return for invalid roadmap data
  if (!roadmapData) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading roadmap data...</p>
      </div>
    );
  }
  // Handle different roadmap plan structures with defensive checks
  const roadmapPlan = roadmapData?.roadmap_plan;
  if (!roadmapPlan) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No roadmap plan available.</p>
      </div>
    );
  }

  const modules = (roadmapPlan as any)?.modules || roadmapPlan || [];
  if (!Array.isArray(modules) || modules.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No modules available in roadmap.</p>
      </div>
    );
  }

  const currentModule = modules[currentModuleIndex];
  if (!currentModule) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Module not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Module Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <button
          onClick={() => onModuleNavigation('prev')}
          disabled={currentModuleIndex === 0}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 mx-4 text-center">
          <motion.h2 
            key={currentModuleIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1"
          >
            {formatTitle(currentModule.title)}
          </motion.h2>
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            {currentModule.timeline}
          </p>
        </div>

        <button
          onClick={() => onModuleNavigation('next')}
          disabled={currentModuleIndex >= modules.length - 1}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Module Content */}
      <motion.div 
        key={currentModuleIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
      >
        <div className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {currentModule.topics && Array.isArray(currentModule.topics) ? currentModule.topics.map((topic: any, topicIndex: number) => (
              <motion.div 
                key={topicIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: topicIndex * 0.1 }}
                className="group relative"
              >
                {/* Topic Container */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Topic Header */}
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatTitle(topic.title)}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">
                          Topic {topicIndex + 1} of {currentModule.topics.length}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subtopics Grid */}
                  <div className="p-3 sm:p-4">
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {topic.subtopics && Array.isArray(topic.subtopics) ? topic.subtopics.map((subtopic: any, subtopicIndex: number) => {
                        const subtopicProgress = progressData?.find(p => p.sub_topic_id === subtopic.id);
                        const isCompleted = subtopicProgress?.status === 'completed';
                        const hasProgress = subtopicProgress?.learn_completed || subtopicProgress?.quiz_completed;
                        
                        return (
                          <motion.div 
                            key={subtopicIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: subtopicIndex * 0.05 }}
                            className="group/card relative"
                          >
                            {/* Subtopic Card */}
                            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-3 sm:p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 overflow-hidden">
                              {/* Completion Indicator */}
                              <div className="absolute top-2 right-2 z-10">
                                {isCompleted ? (
                                  <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                    <Trophy className="w-2.5 h-2.5 text-white" />
                                  </div>
                                ) : hasProgress ? (
                                  <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                                    <Clock className="w-2.5 h-2.5 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="relative pr-6">
                                {/* Header */}
                                <div className="mb-3">
                                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
                                    {formatSubtopicTitle(subtopic.title)}
                                  </h4>
                                </div>
                                
                                {/* Activity Indicators */}
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
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                      <Target className="w-2.5 h-2.5 mr-1" />
                                      Code
                                    </span>
                                  )}
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="space-y-2">
                                  <Link 
                                    href={`/learn?subtopic=${encodeURIComponent(subtopic.title)}&subtopic_id=${subtopic.id}&roadmap_id=${roadmapData.id}`}
                                    className={`w-full py-2 text-xs flex items-center justify-center space-x-1.5 group rounded-md font-medium transition-all duration-200 ${
                                      subtopicProgress?.learn_completed 
                                        ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/50' 
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                                    }`}
                                    onClick={(e) => {
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
                                      href={`/quiz?subtopic_id=${subtopic.id}&subtopic=${encodeURIComponent(subtopic.title)}&subject=${encodeURIComponent(roadmapData.subject || 'General Subject')}&goal=${encodeURIComponent(roadmapData.goal || roadmapData.description || 'Learn new concepts')}&module_title=${encodeURIComponent(currentModule.title || 'Module')}&topic_title=${encodeURIComponent(topic.title)}&roadmap_id=${roadmapData.id}`}
                                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 w-full py-2 text-xs flex items-center justify-center space-x-1.5 group rounded-md font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                      <Brain className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                      <span>Quiz</span>
                                    </Link>
                                  )}
                                </div>
                                
                                {/* Report Button */}
                                <div className="mt-2">
                                  <ReportButton subTopicId={subtopic.id} subtopicTitle={subtopic.title} />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      }) : (
                        <div className="col-span-full text-center py-4">
                          <p className="text-gray-500 dark:text-gray-400">No subtopics available for this topic.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No topics available in this module.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Module Progress Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <div className="inline-flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
            Module {currentModuleIndex + 1} of {modules.length}
          </span>
          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
              style={{
                width: `${((currentModuleIndex + 1) / modules.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModuleView;