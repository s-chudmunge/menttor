// @ts-nocheck
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoadmapData } from '../../../lib/api';
import { CheckCircle, Circle, PlayCircle, Clock, BookOpen, Brain, Code, MapPin, Flag, Route, AlertTriangle, Star, Zap, Trophy, X, Navigation, Locate, Sparkles, Award, Target } from 'lucide-react';
import Link from 'next/link';
import { formatSubtopicTitle, formatTitle } from '../utils/textFormatting';
import { usePrerequisites, useBehavioralStats } from '../../../hooks/useBehavioral';

interface InteractiveRoadmapProps {
  roadmapData: RoadmapData;
  progressData: any[] | null;
}

interface RoadmapNode {
  id: string;
  title: string;
  type: 'module' | 'topic' | 'subtopic' | 'checkpoint';
  status: 'completed' | 'current' | 'locked' | 'available';
  progress: number;
  position: { x: number; y: number };
  subtopics?: Array<{
    id: string;
    title: string;
    status: 'completed' | 'current' | 'locked' | 'available';
    has_learn: boolean;
    has_quiz: boolean;
    has_code_challenge: boolean;
  }>;
  moduleData?: any;
  topicData?: any;
}

const InteractiveRoadmap: React.FC<InteractiveRoadmapProps> = ({ roadmapData, progressData }) => {
  const { data: behavioralStats } = useBehavioralStats();
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  // Calculate current user position based on progress
  const getCurrentPosition = () => {
    if (!progressData || progressData.length === 0) return null;
    
    // Find the most recent incomplete or in-progress item
    const currentItem = progressData.find(p => p.status !== 'completed') || progressData[progressData.length - 1];
    return currentItem?.sub_topic_id || null;
  };

  const currentPosition = getCurrentPosition();
  const { prerequisites, allSatisfied, weakPrerequisites } = usePrerequisites(selectedSubtopic);

  // Find which module contains the current position
  const getCurrentModuleIndex = () => {
    if (!currentPosition || !roadmapData.roadmap_plan) return 0;
    
    const modules = roadmapData.roadmap_plan?.modules || roadmapData.roadmap_plan || [];
    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
      const module = modules[moduleIndex];
      if (module.topics) {
        for (const topic of module.topics) {
          if (topic.subtopics) {
            for (const subtopic of topic.subtopics) {
              if (subtopic.id === currentPosition) {
                return moduleIndex;
              }
            }
          }
        }
      }
    }
    return 0; // Default to first module if not found
  };

  const getSubtopicStatus = (subtopicId: string) => {
    if (!progressData) return 'available';
    const progress = progressData.find(p => p.sub_topic_id === subtopicId);
    if (!progress) return 'available';
    
    // Debug: Check for recently completed learns
    const recentlyCompleted = sessionStorage.getItem(`learn-completed-${subtopicId}`) === 'true';
    if (recentlyCompleted && progress.learn_completed) {
      console.log(`🔍 Debug: Subtopic ${subtopicId} recently completed and confirmed in progress data`);
      sessionStorage.removeItem(`learn-completed-${subtopicId}`);
    }
    
    if (progress.status === 'completed') return 'completed';
    if (progress.learn_completed || progress.quiz_completed) return 'current';
    return 'available';
  };

  const calculateModuleProgress = (module: any) => {
    if (!module.topics) return 0;
    let totalSubtopics = 0;
    let completedSubtopics = 0;
    
    module.topics.forEach((topic: any) => {
      if (topic.subtopics) {
        topic.subtopics.forEach((subtopic: any) => {
          totalSubtopics++;
          if (getSubtopicStatus(subtopic.id) === 'completed') {
            completedSubtopics++;
          }
        });
      }
    });
    
    return totalSubtopics === 0 ? 0 : (completedSubtopics / totalSubtopics) * 100;
  };

  const roadmapNodes = useMemo(() => {
    const modules = roadmapData.roadmap_plan?.modules || roadmapData.roadmap_plan || [];
    const nodes: RoadmapNode[] = [];
    
    // Simplified mobile-friendly layout
    const nodeSpacing = 280; // Reduced spacing for mobile
    const startX = 150; // Smaller starting position
    const centerY = 200; // Reduced height
    
    let currentX = startX;
    
    modules.forEach((module: any, moduleIndex: number) => {
      const moduleProgress = calculateModuleProgress(module);
      let moduleStatus: 'completed' | 'current' | 'available' | 'locked' = 'available';
      
      if (moduleProgress === 100) {
        moduleStatus = 'completed';
      } else if (moduleProgress > 0) {
        moduleStatus = 'current';
      } else if (moduleIndex === 0) {
        moduleStatus = 'available';
      } else {
        const prevModule = modules[moduleIndex - 1];
        const prevProgress = calculateModuleProgress(prevModule);
        moduleStatus = prevProgress === 100 ? 'available' : 'locked';
      }
      
      // Add only module nodes (removed checkpoints for simplicity)
      nodes.push({
        id: `module-${module.id || moduleIndex}`,
        title: formatTitle(module.title),
        type: 'module',
        status: moduleStatus,
        progress: moduleProgress,
        position: { x: currentX, y: centerY },
        moduleData: module,
        subtopics: module.topics?.flatMap((topic: any) => 
          topic.subtopics?.map((subtopic: any) => ({
            id: subtopic.id,
            title: formatSubtopicTitle(subtopic.title),
            status: getSubtopicStatus(subtopic.id),
            has_learn: subtopic.has_learn,
            has_quiz: subtopic.has_quiz,
            has_code_challenge: subtopic.has_code_challenge
          })) || []
        ) || []
      });
      
      currentX += nodeSpacing;
    });

    return nodes;
  }, [roadmapData, progressData]);

  const getNodeIcon = (node: RoadmapNode) => {
    // Simplified icon logic - only for modules
    if (node.status === 'completed') return CheckCircle;
    if (node.status === 'current') return PlayCircle;
    if (node.status === 'locked') return Circle;
    return BookOpen;
  };

  const getNodeColor = (node: RoadmapNode) => {
    // Simplified color scheme
    switch (node.status) {
      case 'completed':
        return 'from-green-500 to-emerald-500';
      case 'current':
        return 'from-blue-500 to-indigo-500';
      case 'available':
        return 'from-indigo-500 to-green-500';
      case 'locked':
        return 'from-gray-300 to-gray-400';
      default:
        return 'from-gray-300 to-gray-400';
    }
  };

  const getNodeShadow = (node: RoadmapNode) => {
    // Simplified shadows
    switch (node.status) {
      case 'completed':
        return 'shadow-lg shadow-green-500/20 hover:shadow-green-500/30';
      case 'current':
        return 'shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30';
      case 'available':
        return 'shadow-md shadow-green-500/15 hover:shadow-green-500/25';
      case 'locked':
        return 'shadow-sm shadow-gray-300/15';
      default:
        return 'shadow-sm shadow-gray-300/15';
    }
  };

  // Calculate dynamic width based on number of modules - mobile-friendly
  const modules = roadmapData.roadmap_plan?.modules || roadmapData.roadmap_plan || [];
  const roadmapWidth = Math.max(800, modules.length * 280 + 300); // Reduced width for mobile
  const roadmapHeight = 400; // Reduced height for mobile
  const currentModuleIndex = getCurrentModuleIndex();

  // Handle node clicks for better interactivity
  const handleNodeClick = (node: RoadmapNode, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedNode(node === selectedNode ? null : node);
    if (node.subtopics && node.subtopics.length > 0) {
      setSelectedSubtopic(node.subtopics[0].id);
    }
  };

  // Calculate overall progress for header
  const totalModules = modules.length;
  const completedModules = modules.filter(module => calculateModuleProgress(module) === 100).length;

  return (
    <div className="relative w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden">
      {/* Simplified Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 md:p-6 bg-white dark:bg-zinc-950">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Route className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Learning Path</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Track your progress</p>
            </div>
          </div>
          
          {/* Simplified Progress */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {completedModules} / {totalModules} modules
              </span>
              <div className="w-24 h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${totalModules === 0 ? 0 : (completedModules / totalModules) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Simplified Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs md:text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-300">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-gray-600 dark:text-gray-300">Current</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-300">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-gray-400"></div>
            <span className="text-gray-600 dark:text-gray-300">Locked</span>
          </div>
        </div>
      </div>

      {/* Simplified Roadmap Container */}
      <div className="relative overflow-x-auto p-4 md:p-6 bg-blue-50/30 dark:bg-blue-900/10" style={{ height: `${roadmapHeight}px` }}>
        <div className="relative" style={{ width: `${roadmapWidth}px`, height: '100%' }}>
          
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-10 dark:opacity-5">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="questGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#questGrid)" />
            </svg>
          </div>
          
          {/* Simplified Nodes */}
          {roadmapNodes.map((node, index) => {
            const IconComponent = getNodeIcon(node);
            const isCurrentPosition = node.subtopics?.some(subtopic => subtopic.id === currentPosition);
            
            return (
              <div key={node.id}>
                {/* Simplified "You are here" indicator */}
                {isCurrentPosition && (
                  <div 
                    className="absolute transform -translate-x-1/2 flex flex-col items-center z-20"
                    style={{
                      left: `${node.position.x}px`,
                      top: `${node.position.y - 80}px`,
                    }}
                  >
                    <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold mb-2">
                      YOU ARE HERE
                    </div>
                    <div className="w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-orange-500"></div>
                  </div>
                )}

                {/* Simplified Node Circle */}
                <div
                  className={`absolute cursor-pointer transition-all duration-200 ${getNodeShadow(node)} hover:scale-105 rounded-full`}
                  style={{
                    left: `${node.position.x - 30}px`, // Smaller nodes for mobile
                    top: `${node.position.y - 30}px`,
                    width: '60px',
                    height: '60px',
                  }}
                  onClick={(e) => handleNodeClick(node, e)}
                >
                  <div className={`w-full h-full rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 ${getNodeColor(node)}`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Simplified Node Label */}
                <div 
                  className="absolute text-center transform -translate-x-1/2"
                  style={{
                    left: `${node.position.x}px`,
                    top: `${node.position.y + 40}px`,
                    width: '160px',
                  }}
                >
                  <div className="bg-white dark:bg-zinc-950 px-3 py-2 rounded-lg shadow-md border">
                    <div className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                      {node.title}
                    </div>
                    {node.progress > 0 && (
                      <div className="mt-1 w-full h-1 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${node.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Simplified SVG Connections */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            style={{ width: `${roadmapWidth}px` }}
          >            
            {roadmapNodes.map((node, index) => {
              if (index === roadmapNodes.length - 1) return null;
              const nextNode = roadmapNodes[index + 1];
              
              let strokeColor = '#D1D5DB'; // Default gray
              let strokeWidth = 2;
              
              if (node.status === 'completed') {
                strokeColor = '#10B981'; // Green
                strokeWidth = 3;
              } else if (node.status === 'current') {
                strokeColor = '#3B82F6'; // Blue
                strokeWidth = 3;
              } else if (node.status === 'available') {
                strokeColor = '#22C55E'; // Green
                strokeWidth = 2;
              }
              
              return (
                <line
                  key={`connection-${node.id}`}
                  x1={node.position.x + 30}
                  y1={node.position.y}
                  x2={nextNode.position.x - 30}
                  y2={nextNode.position.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Simplified Node Details Panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 w-72 md:w-80 bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-4 z-20 max-h-80 overflow-y-auto">
          {/* Panel Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-lg ${getNodeColor(selectedNode)} flex items-center justify-center`}>
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{selectedNode.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {selectedNode.status.replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Progress Bar */}
          {selectedNode.progress > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Progress</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {Math.round(selectedNode.progress)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${selectedNode.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Subtopics List */}
          {selectedNode.subtopics && selectedNode.subtopics.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                Topics ({selectedNode.subtopics.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedNode.subtopics.slice(0, 5).map((subtopic, index) => (
                  <div 
                    key={subtopic.id}
                    className="p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900 dark:text-white text-xs truncate pr-2">
                        {formatSubtopicTitle(subtopic.title)}
                      </h5>
                      <div className="flex-shrink-0">
                        {subtopic.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {subtopic.status === 'current' && (
                          <PlayCircle className="w-4 h-4 text-blue-500" />
                        )}
                        {subtopic.status === 'available' && (
                          <Circle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {/* Activity Types */}
                    <div className="flex items-center space-x-1 mb-2">
                      {subtopic.has_learn && (
                        <span className="px-2 py-1 rounded-md text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          Learn
                        </span>
                      )}
                      {subtopic.has_quiz && (
                        <span className="px-2 py-1 rounded-md text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          Quiz
                        </span>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex space-x-1">
                      {(() => {
                        const progress = progressData?.find(p => p.sub_topic_id === subtopic.id);
                        const isLearnCompleted = progress?.learn_completed || false;
                        const isCompleted = progress?.status === 'completed';
                        
                        // Show different states: completed (green check), learn completed (blue review), or not started (blue learn)
                        let buttonClass = 'bg-blue-600 hover:bg-blue-700 text-white'; // Default: Learn
                        let buttonText = 'Learn';
                        
                        if (isCompleted) {
                          buttonClass = 'bg-green-600 hover:bg-green-700 text-white';
                          buttonText = '✓ Completed';
                        } else if (isLearnCompleted) {
                          buttonClass = 'bg-orange-500 hover:bg-orange-600 text-white';
                          buttonText = '↻ Review';
                        }
                        
                        return (
                          <Link
                            href={`/learn?subtopic=${encodeURIComponent(subtopic.title)}&subtopic_id=${subtopic.id}&roadmap_id=${roadmapData.id}`}
                            className={`flex-1 text-center py-1.5 px-2 text-xs rounded-md font-medium transition-colors ${buttonClass}`}
                          >
                            {buttonText}
                          </Link>
                        );
                      })()}
                      
                      {subtopic.has_quiz && (
                        <Link
                          href={`/quiz?subtopic_id=${subtopic.id}&subtopic=${encodeURIComponent(subtopic.title)}&subject=${encodeURIComponent(roadmapData.subject || 'General Subject')}&goal=${encodeURIComponent(roadmapData.goal || roadmapData.description || 'Learn new concepts')}&module_title=${encodeURIComponent(selectedNode.moduleData?.title || 'Module')}&topic_title=${encodeURIComponent('Topic')}&roadmap_id=${roadmapData.id}`}
                          className="flex-1 text-center py-1.5 px-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md font-medium transition-colors"
                        >
                          Quiz
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
                {selectedNode.subtopics.length > 5 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                    +{selectedNode.subtopics.length - 5} more topics
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simplified Hover Tooltip */}
      {hoveredNode && !selectedNode && (
        <div 
          className="absolute bg-white dark:bg-zinc-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg shadow-lg text-sm z-30 pointer-events-none"
          style={{
            left: Math.min((roadmapNodes.find(n => n.id === hoveredNode)?.position.x || 0) + 80, roadmapWidth - 150),
            top: (roadmapNodes.find(n => n.id === hoveredNode)?.position.y || 0) - 50,
          }}
        >
          <div className="font-medium">
            {roadmapNodes.find(n => n.id === hoveredNode)?.title}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {roadmapNodes.find(n => n.id === hoveredNode)?.status.replace('_', ' ')}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {selectedNode && (
        <div 
          className="fixed inset-0 z-10"
          onClick={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};

export default InteractiveRoadmap;