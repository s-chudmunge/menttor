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
    
    // Enhanced layout with better spacing
    const nodeSpacing = 400; // Increased spacing between nodes
    const startX = 200; // Better starting position
    const centerY = 250; // More centered vertically
    
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
      
      // Add module node
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

      // Add checkpoint between modules
      if (moduleIndex < modules.length - 1) {
        const checkpointX = currentX + nodeSpacing / 2;
        const checkpointNames = [
          "🎯 Foundations Gate", "🌟 Knowledge Bridge", "⭐ Mastery Peak", "🏔️ Algorithm Summit",
          "🎪 Practice Arena", "🗼 Challenge Tower", "👑 Expert Level", "🏆 Mastery Crown"
        ];
        
        let checkpointStatus: 'completed' | 'current' | 'available' | 'locked' = 'locked';
        if (moduleStatus === 'completed') {
          checkpointStatus = 'completed';
        } else if (moduleStatus === 'current') {
          checkpointStatus = 'current';
        } else if (moduleStatus === 'available') {
          checkpointStatus = 'available';
        }
        
        nodes.push({
          id: `checkpoint-${moduleIndex}`,
          title: checkpointNames[moduleIndex] || `🚩 Checkpoint ${moduleIndex + 1}`,
          type: 'checkpoint',
          status: checkpointStatus,
          progress: checkpointStatus === 'completed' ? 100 : checkpointStatus === 'current' ? 50 : 0,
          position: { x: checkpointX, y: centerY }
        });
      }
      
      currentX += nodeSpacing;
    });

    return nodes;
  }, [roadmapData, progressData]);

  const getNodeIcon = (node: RoadmapNode) => {
    switch (node.type) {
      case 'module':
        return node.status === 'completed' ? CheckCircle : 
               node.status === 'current' ? PlayCircle : 
               node.status === 'locked' ? Circle :
               BookOpen;
      case 'checkpoint':
        return node.status === 'completed' ? Trophy : 
               node.status === 'current' ? Star : 
               Flag;
      default:
        return Circle;
    }
  };

  const getNodeColor = (node: RoadmapNode) => {
    switch (node.status) {
      case 'completed':
        return node.type === 'checkpoint' ? 
          'from-yellow-500 via-orange-500 to-red-500' : 
          'from-green-500 via-emerald-500 to-teal-500';
      case 'current':
        return node.type === 'checkpoint' ? 
          'from-blue-500 via-indigo-500 to-purple-500' : 
          'from-blue-500 via-indigo-500 to-blue-600';
      case 'available':
        return node.type === 'checkpoint' ? 
          'from-gray-400 via-gray-500 to-gray-600' : 
          'from-indigo-500 via-purple-500 to-indigo-600';
      case 'locked':
        return 'from-gray-300 via-gray-400 to-gray-500';
      default:
        return 'from-gray-300 via-gray-400 to-gray-500';
    }
  };

  const getNodeShadow = (node: RoadmapNode) => {
    switch (node.status) {
      case 'completed':
        return node.type === 'checkpoint' ? 
          'shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40' :
          'shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40';
      case 'current':
        return node.type === 'checkpoint' ? 
          'shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40' :
          'shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40';
      case 'available':
        return 'shadow-lg shadow-gray-400/20 hover:shadow-xl hover:shadow-gray-400/30';
      case 'locked':
        return 'shadow-md shadow-gray-300/20';
      default:
        return 'shadow-md shadow-gray-300/20';
    }
  };

  // Calculate dynamic width based on number of modules
  const modules = roadmapData.roadmap_plan?.modules || roadmapData.roadmap_plan || [];
  const roadmapWidth = Math.max(1200, modules.length * 400 + 600); // Increased width for better spacing
  const roadmapHeight = 600; // Increased height for better vertical spacing
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
    <div className="relative w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden">
      {/* Enhanced Header */}
      <div className="border-b border-gray-200/50 dark:border-gray-700/50 p-6 lg:p-8 bg-gradient-to-r from-white to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Route className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Quest Map</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base font-medium">Your learning adventure awaits</p>
            </div>
          </div>
          
          {/* Enhanced Progress Indicators */}
          <div className="flex items-center space-x-6">
            {behavioralStats && (
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    Level {behavioralStats.xp_stats.current_level}
                  </span>
                </div>
                <div className="w-28 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${behavioralStats.xp_stats.progress_to_next * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {completedModules} of {totalModules} completed
                </span>
              </div>
              <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalModules === 0 ? 0 : (completedModules / totalModules) * 100}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Legend */}
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <PlayCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Checkpoint</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center shadow-lg">
              <Circle className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Locked</span>
          </div>
        </div>
      </div>

      {/* Enhanced Roadmap Container */}
      <div className="relative overflow-x-auto p-8 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10" style={{ height: `${roadmapHeight}px` }}>
        <div className="relative" style={{ width: `${roadmapWidth}px`, height: '100%' }}>
          
          {/* Enhanced Background Pattern */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Render Enhanced Nodes */}
          {roadmapNodes.map((node, index) => {
            const IconComponent = getNodeIcon(node);
            const isCurrentPosition = node.subtopics?.some(subtopic => subtopic.id === currentPosition);
            const isUserHere = node.type === 'module' && index === currentModuleIndex * 2;
            
            return (
              <motion.div 
                key={node.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
              >
                {/* Enhanced "You are here" indicator */}
                <AnimatePresence>
                  {(isCurrentPosition || isUserHere) && (
                    <motion.div 
                      className="absolute transform -translate-x-1/2 flex flex-col items-center z-30"
                      style={{
                        left: `${node.position.x}px`,
                        top: `${node.position.y - 130}px`, // Moved higher for better visibility
                      }}
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      {/* Enhanced label - moved above the icon */}
                      <motion.div 
                        className="mb-4 relative"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
                      >
                        <div className="bg-gradient-to-r from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/20 px-4 py-2 rounded-full shadow-xl border-2 border-orange-200 dark:border-orange-700">
                          <div className="flex items-center space-x-2">
                            <Locate className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            <span className="text-sm text-orange-700 dark:text-orange-300 font-bold tracking-wide">
                              YOU ARE HERE
                            </span>
                          </div>
                        </div>
                        {/* Arrow pointing down */}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800"></div>
                      </motion.div>

                      {/* Static map icon */}
                      <div className="relative">
                        {/* Main indicator with static design */}
                        <div className="w-14 h-14 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-800 relative">
                          <MapPin className="w-7 h-7 text-white drop-shadow-lg" />
                          {/* Single static pulse ring */}
                          <div className="absolute inset-0 w-14 h-14 rounded-full bg-orange-500/30 border-2 border-orange-400/50" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Enhanced Node Circle */}
                <motion.div
                  className={`absolute cursor-pointer transition-all duration-300 ${getNodeShadow(node)}`}
                  style={{
                    left: `${node.position.x - 50}px`, // Increased for larger nodes
                    top: `${node.position.y - 50}px`, // Increased for larger nodes
                    width: node.type === 'checkpoint' ? '90px' : '100px', // Increased size
                    height: node.type === 'checkpoint' ? '90px' : '100px', // Increased size
                  }}
                  onClick={(e) => handleNodeClick(node, e)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  whileHover={{ scale: 1.08, y: -5 }} // Enhanced hover effect
                  whileTap={{ scale: 0.92 }}
                >
                  <div
                    className={`w-full h-full rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 transition-all duration-300 bg-gradient-to-r ${getNodeColor(node)}`}
                  >
                    <IconComponent className={`${node.type === 'checkpoint' ? 'w-9 h-9' : 'w-10 h-10'} text-white drop-shadow-lg`} />
                  </div>
                  
                  {/* Sparkle effects for completed nodes */}
                  {node.status === 'completed' && (
                    <motion.div 
                      className="absolute inset-0"
                      animate={{
                        rotate: [0, 360]
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-yellow-400" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Enhanced Node Label */}
                <div 
                  className="absolute text-center transform -translate-x-1/2"
                  style={{
                    left: `${node.position.x}px`,
                    top: `${node.position.y + 75}px`, // Adjusted for larger nodes
                    width: '160px', // Increased width for better text layout
                  }}
                >
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                    <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                      {node.title}
                    </div>
                    {node.progress > 0 && (
                      <div className="mt-1 w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${node.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Subtopic Progress Dots */}
                {node.type === 'module' && node.subtopics && node.subtopics.length > 0 && (
                  <div 
                    className="absolute flex items-center justify-center space-x-2 transform -translate-x-1/2"
                    style={{
                      left: `${node.position.x}px`,
                      top: `${node.position.y - 85}px`, // Adjusted for larger nodes
                    }}
                  >
                    {node.subtopics.slice(0, 5).map((subtopic, subIndex) => (
                      <motion.div
                        key={subIndex}
                        className="w-3 h-3 rounded-full shadow-lg"
                        style={{
                          backgroundColor: subtopic.status === 'completed' ? '#10B981' :
                                         subtopic.status === 'current' ? '#3B82F6' :
                                         '#CBD5E1',
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: (index * 0.1) + (subIndex * 0.05) }}
                        whileHover={{ scale: 1.3 }}
                      />
                    ))}
                    {node.subtopics.length > 5 && (
                      <span className="text-xs text-gray-600 dark:text-gray-400 ml-1 font-medium">+{node.subtopics.length - 5}</span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Enhanced SVG Connections with Better Path Design */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            style={{ width: `${roadmapWidth}px` }}
          >
            <defs>
              {/* Enhanced gradients */}
              <linearGradient id="completedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#059669" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="currentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id="availableGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
              <linearGradient id="defaultGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
              
              {/* Path patterns for different states */}
              <pattern id="dotPattern" patternUnits="userSpaceOnUse" width="12" height="12">
                <circle cx="6" cy="6" r="2" fill="#6366F1" opacity="0.6"/>
              </pattern>
              
              {/* Drop shadow filter */}
              <filter id="pathShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.1"/>
              </filter>
            </defs>
            
            {roadmapNodes.map((node, index) => {
              if (index === roadmapNodes.length - 1) return null;
              const nextNode = roadmapNodes[index + 1];
              
              let strokeUrl = "url(#defaultGradient)";
              let strokeWidth = "4";
              let strokeOpacity = "0.7";
              let pathPattern = null;
              
              if (node.status === 'completed' && nextNode.status === 'completed') {
                strokeUrl = "url(#completedGradient)";
                strokeWidth = "6";
                strokeOpacity = "1";
              } else if (node.status === 'completed' || node.status === 'current') {
                strokeUrl = "url(#currentGradient)";
                strokeWidth = "5";
                strokeOpacity = "0.9";
              } else if (node.status === 'available') {
                strokeUrl = "url(#availableGradient)";
                strokeWidth = "4";
                strokeOpacity = "0.7";
              }
              
              // Calculate path with slight curve
              const midX = (node.position.x + nextNode.position.x) / 2;
              const midY = node.position.y - 20; // Slight curve upward
              
              return (
                <motion.g 
                  key={`connection-${node.id}`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: index * 0.15, duration: 1, ease: "easeInOut" }}
                >
                  {/* Background path for glow effect */}
                  <path
                    d={`M ${node.position.x + 50} ${node.position.y} Q ${midX} ${midY} ${nextNode.position.x - 50} ${nextNode.position.y}`}
                    stroke={strokeUrl}
                    strokeWidth={parseInt(strokeWidth) + 4}
                    strokeOpacity="0.2"
                    fill="none"
                    filter="url(#pathShadow)"
                  />
                  
                  {/* Main path */}
                  <motion.path
                    d={`M ${node.position.x + 50} ${node.position.y} Q ${midX} ${midY} ${nextNode.position.x - 50} ${nextNode.position.y}`}
                    stroke={strokeUrl}
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-500"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: index * 0.2, duration: 1.2, ease: "easeInOut" }}
                  />
                  
                  {/* Animated dots for active paths */}
                  {(node.status === 'completed' || node.status === 'current') && (
                    <motion.circle
                      r="3"
                      fill="#FFFFFF"
                      stroke={strokeUrl}
                      strokeWidth="2"
                      initial={{ 
                        offsetDistance: "0%",
                        opacity: 0
                      }}
                      animate={{ 
                        offsetDistance: "100%",
                        opacity: [0, 1, 1, 0]
                      }}
                      transition={{
                        offsetDistance: { duration: 3, repeat: Infinity, ease: "linear" },
                        opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                      }}
                      style={{
                        offsetPath: `path('M ${node.position.x + 50} ${node.position.y} Q ${midX} ${midY} ${nextNode.position.x - 50} ${nextNode.position.y}')`,
                        offsetRotate: "0deg"
                      }}
                    />
                  )}
                  
                  {/* Progress indicators along the path */}
                  {node.status === 'completed' && Array.from({ length: 3 }).map((_, dotIndex) => (
                    <motion.circle
                      key={`dot-${index}-${dotIndex}`}
                      cx={node.position.x + 50 + ((nextNode.position.x - 50 - node.position.x - 50) * (dotIndex + 1) / 4)}
                      cy={node.position.y}
                      r="3"
                      fill="#10B981"
                      opacity="0.8"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.2 + dotIndex * 0.1 }}
                    />
                  ))}
                </motion.g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Enhanced Interactive Node Details Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            className="absolute top-4 right-4 w-80 md:w-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-6 z-20 max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Enhanced Panel Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-r ${getNodeColor(selectedNode)} flex items-center justify-center shadow-lg`}>
                  {selectedNode.type === 'checkpoint' && <Trophy className="w-5 h-5 text-white" />}
                  {selectedNode.type === 'module' && <BookOpen className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{selectedNode.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize font-medium">
                    {selectedNode.type} • {selectedNode.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Enhanced Progress Bar */}
            {selectedNode.progress > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(selectedNode.progress)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedNode.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Enhanced Subtopics List */}
            {selectedNode.subtopics && selectedNode.subtopics.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Learning Topics ({selectedNode.subtopics.length})</span>
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedNode.subtopics.map((subtopic, index) => (
                    <motion.div 
                      key={subtopic.id}
                      className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {formatSubtopicTitle(subtopic.title)}
                        </h5>
                        <div className="flex items-center space-x-1">
                          {subtopic.status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {subtopic.status === 'current' && (
                            <PlayCircle className="w-5 h-5 text-blue-500" />
                          )}
                          {subtopic.status === 'available' && (
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {/* Enhanced Activity Types */}
                      <div className="flex items-center space-x-2 mb-4">
                        {subtopic.has_learn && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            📚 Learn
                          </span>
                        )}
                        {subtopic.has_quiz && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                            🧠 Quiz
                          </span>
                        )}
                        {subtopic.has_code_challenge && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            💻 Code
                          </span>
                        )}
                      </div>

                      {/* Enhanced Quick Actions */}
                      <div className="flex space-x-2">
                        <Link
                          href={`/learn?subtopic=${encodeURIComponent(subtopic.title)}&subtopic_id=${subtopic.id}`}
                          className="flex-1 text-center py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          Start Learning
                        </Link>
                        {subtopic.has_quiz && (
                          <Link
                            href={`/quiz?subtopic_id=${subtopic.id}&subtopic=${encodeURIComponent(subtopic.title)}&subject=${encodeURIComponent(roadmapData.subject || 'General Subject')}&goal=${encodeURIComponent(roadmapData.goal || roadmapData.description || 'Learn new concepts')}&module_title=${encodeURIComponent(selectedNode.moduleData?.title || 'Module')}&topic_title=${encodeURIComponent('Topic')}&roadmap_id=${roadmapData.id}`}
                            className="flex-1 text-center py-2.5 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            Take Quiz
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Module Stats */}
            {selectedNode.type === 'module' && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-2xl border border-green-200 dark:border-green-800">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {selectedNode.subtopics?.filter(s => s.status === 'completed').length || 0}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300 font-medium">Completed</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedNode.subtopics?.length || 0}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Total Topics</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Hover Tooltip */}
      <AnimatePresence>
        {hoveredNode && !selectedNode && (
          <motion.div 
            className="absolute bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium z-30 pointer-events-none"
            style={{
              left: Math.min((roadmapNodes.find(n => n.id === hoveredNode)?.position.x || 0) + 100, roadmapWidth - 200),
              top: (roadmapNodes.find(n => n.id === hoveredNode)?.position.y || 0) - 60,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="font-semibold">
              {roadmapNodes.find(n => n.id === hoveredNode)?.title}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
              {roadmapNodes.find(n => n.id === hoveredNode)?.status.replace('_', ' ')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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