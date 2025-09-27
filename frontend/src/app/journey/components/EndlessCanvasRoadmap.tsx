// @ts-nocheck
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  Panel,
  BackgroundVariant,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CheckCircle, Circle, PlayCircle, BookOpen, X, ArrowDown } from 'lucide-react';
import { RoadmapData } from '../../../lib/api';
import { formatSubtopicTitle, formatTitle } from '../utils/textFormatting';
import Link from 'next/link';

interface EndlessCanvasRoadmapProps {
  roadmapData: RoadmapData;
  progressData: any[] | null;
}

interface RoadmapNodeData {
  id: string;
  title: string;
  type: 'module' | 'topic' | 'subtopic';
  status: 'completed' | 'current' | 'available' | 'locked';
  progress?: number;
  moduleData?: any;
  topicData?: any;
  subtopics?: Array<{
    id: string;
    title: string;
    status: string;
    has_learn: boolean;
    has_quiz: boolean;
  }>;
  isCurrent?: boolean;
}

// Custom Node Component
const RoadmapNode: React.FC<{ data: RoadmapNodeData }> = ({ data }) => {
  const getIcon = () => {
    switch (data.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-white" />;
      case 'current':
        return <PlayCircle className="w-6 h-6 text-white" />;
      case 'available':
        return <BookOpen className="w-6 h-6 text-white" />;
      case 'locked':
        return <Circle className="w-6 h-6 text-white" />;
      default:
        return <Circle className="w-6 h-6 text-white" />;
    }
  };

  const getNodeColor = () => {
    switch (data.status) {
      case 'completed':
        return 'bg-green-500';
      case 'current':
        return 'bg-blue-500';
      case 'available':
        return 'bg-yellow-600';
      case 'locked':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="relative">
      {/* "You are here" indicator */}
      {data.isCurrent && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10">
          <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
            YOU ARE HERE
          </div>
          <ArrowDown className="w-4 h-4 text-orange-500 mt-1" />
        </div>
      )}
      
      {/* Node circle */}
      <div 
        className={`
          w-16 h-16 rounded-full ${getNodeColor()} 
          flex items-center justify-center 
          border-4 border-white shadow-lg
          cursor-pointer transition-transform hover:scale-105
        `}
        title={data.title}
      >
        {getIcon()}
        
        {/* Progress percentage */}
        {data.progress !== undefined && data.progress > 0 && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded px-1 py-0.5">
            <span className="text-xs font-bold text-gray-700">{Math.round(data.progress)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Node types for React Flow
const nodeTypes: NodeTypes = {
  roadmapNode: RoadmapNode,
};

const EndlessCanvasRoadmap: React.FC<EndlessCanvasRoadmapProps> = ({ 
  roadmapData, 
  progressData 
}) => {
  const [selectedNode, setSelectedNode] = useState<RoadmapNodeData | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Helper functions
  const getSubtopicStatus = (subtopicId: string) => {
    if (!progressData) return 'available';
    const progress = progressData.find(p => p.sub_topic_id === subtopicId);
    if (!progress) return 'available';
    
    if (progress.status === 'completed') return 'completed';
    if (progress.learn_completed || progress.quiz_completed) return 'current';
    return 'available';
  };

  const getCurrentPosition = () => {
    if (!progressData || progressData.length === 0) return null;
    const currentItem = progressData.find(p => p.status !== 'completed') || progressData[progressData.length - 1];
    return currentItem?.sub_topic_id || null;
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

  const currentPosition = getCurrentPosition();

  // Generate nodes and edges from roadmap data
  const { initialNodes, initialEdges } = useMemo(() => {
    const modules = roadmapData.roadmap_plan?.modules || roadmapData.roadmap_plan || [];
    const nodes: Node<RoadmapNodeData>[] = [];
    const edges: Edge[] = [];
    
    // Layout configuration
    const moduleSpacing = 400; // Horizontal spacing between modules
    const topicSpacing = 200; // Vertical spacing for topics within modules
    const startX = 200;
    const startY = 200;
    
    let currentX = startX;
    let previousModuleId: string | null = null;
    
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

      // Check if this module contains the current position
      const containsCurrentPosition = module.topics?.some((topic: any) =>
        topic.subtopics?.some((subtopic: any) => subtopic.id === currentPosition)
      ) || false;

      const moduleId = `module-${module.id || moduleIndex}`;
      
      // Add module node
      nodes.push({
        id: moduleId,
        type: 'roadmapNode',
        position: { x: currentX, y: startY },
        data: {
          id: moduleId,
          title: formatTitle(module.title),
          type: 'module',
          status: moduleStatus,
          progress: moduleProgress,
          moduleData: module,
          isCurrent: containsCurrentPosition,
          subtopics: module.topics?.flatMap((topic: any) => 
            topic.subtopics?.map((subtopic: any) => ({
              id: subtopic.id,
              title: formatSubtopicTitle(subtopic.title),
              status: getSubtopicStatus(subtopic.id),
              has_learn: subtopic.has_learn,
              has_quiz: subtopic.has_quiz
            })) || []
          ) || []
        },
      });

      // Add edge from previous module
      if (previousModuleId) {
        const edgeColor = moduleStatus === 'completed' ? '#10B981' : 
                         moduleStatus === 'current' ? '#3B82F6' : 
                         moduleStatus === 'available' ? '#CA8A04' : '#9CA3AF';
        
        edges.push({
          id: `edge-${previousModuleId}-${moduleId}`,
          source: previousModuleId,
          target: moduleId,
          type: 'smoothstep',
          style: { 
            stroke: edgeColor, 
            strokeWidth: 3 
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edgeColor,
            width: 20,
            height: 20,
          },
        });
      }

      // Add topic nodes in a vertical layout within the module
      if (module.topics && module.topics.length > 1) {
        const topicStartY = startY - ((module.topics.length - 1) * topicSpacing) / 2;
        
        module.topics.forEach((topic: any, topicIndex: number) => {
          const topicId = `topic-${module.id || moduleIndex}-${topic.id || topicIndex}`;
          const topicY = topicStartY + (topicIndex * topicSpacing);
          
          // Calculate topic status based on subtopics
          let topicStatus: 'completed' | 'current' | 'available' | 'locked' = 'available';
          if (topic.subtopics) {
            const completedSubtopics = topic.subtopics.filter((s: any) => 
              getSubtopicStatus(s.id) === 'completed'
            ).length;
            const totalSubtopics = topic.subtopics.length;
            
            if (completedSubtopics === totalSubtopics) {
              topicStatus = 'completed';
            } else if (completedSubtopics > 0) {
              topicStatus = 'current';
            }
          }

          const topicContainsCurrent = topic.subtopics?.some((subtopic: any) => 
            subtopic.id === currentPosition
          ) || false;

          nodes.push({
            id: topicId,
            type: 'roadmapNode',
            position: { x: currentX + 150, y: topicY },
            data: {
              id: topicId,
              title: formatTitle(topic.title),
              type: 'topic',
              status: topicStatus,
              topicData: topic,
              isCurrent: topicContainsCurrent,
              subtopics: topic.subtopics?.map((subtopic: any) => ({
                id: subtopic.id,
                title: formatSubtopicTitle(subtopic.title),
                status: getSubtopicStatus(subtopic.id),
                has_learn: subtopic.has_learn,
                has_quiz: subtopic.has_quiz
              })) || []
            },
          });

          // Connect module to topic
          edges.push({
            id: `edge-${moduleId}-${topicId}`,
            source: moduleId,
            target: topicId,
            type: 'smoothstep',
            style: { 
              stroke: '#E5E7EB', 
              strokeWidth: 2 
            },
          });
        });
      }

      previousModuleId = moduleId;
      currentX += moduleSpacing;
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [roadmapData, progressData, currentPosition]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<RoadmapNodeData>) => {
    setSelectedNode(node.data);
    setIsPanelOpen(true);
  }, []);

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  return (
    <div className="relative w-full h-full bg-white dark:bg-gray-800 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50 dark:bg-gray-900"
      >
        <Controls 
          position="top-left"
          className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm"
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#E5E7EB"
          className="dark:opacity-20"
        />
      </ReactFlow>

      {/* Details Panel */}
      {isPanelOpen && selectedNode && (
        <div className="absolute top-0 right-0 w-full h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-600 shadow-lg z-50 overflow-y-auto">
          <div className="p-6">
            {/* Panel Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  selectedNode.status === 'completed' ? 'bg-green-500' :
                  selectedNode.status === 'current' ? 'bg-blue-500' :
                  selectedNode.status === 'available' ? 'bg-yellow-600' : 'bg-gray-400'
                }`}>
                  {selectedNode.status === 'completed' && <CheckCircle className="w-4 h-4 text-white" />}
                  {selectedNode.status === 'current' && <PlayCircle className="w-4 h-4 text-white" />}
                  {selectedNode.status === 'available' && <BookOpen className="w-4 h-4 text-white" />}
                  {selectedNode.status === 'locked' && <Circle className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{selectedNode.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {selectedNode.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
            </div>

            {/* Progress Bar */}
            {selectedNode.progress !== undefined && selectedNode.progress > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Progress</span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {Math.round(selectedNode.progress)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${selectedNode.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Subtopics */}
            {selectedNode.subtopics && selectedNode.subtopics.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Topics ({selectedNode.subtopics.length})
                </h4>
                <div className="space-y-3">
                  {selectedNode.subtopics.map((subtopic, index) => (
                    <div 
                      key={subtopic.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                          {subtopic.title}
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
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        {subtopic.has_learn && (
                          <Link
                            href={`/learn?subtopic=${encodeURIComponent(subtopic.title)}&subtopic_id=${subtopic.id}&roadmap_id=${roadmapData.id}`}
                            className="flex-1 text-center py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md font-medium transition-colors"
                          >
                            Learn
                          </Link>
                        )}
                        
                        {subtopic.has_quiz && (
                          <Link
                            href={`/quiz?subtopic_id=${subtopic.id}&subtopic=${encodeURIComponent(subtopic.title)}&subject=${encodeURIComponent(roadmapData.subject || 'General Subject')}&goal=${encodeURIComponent(roadmapData.goal || roadmapData.description || 'Learn new concepts')}&roadmap_id=${roadmapData.id}`}
                            className="flex-1 text-center py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md font-medium transition-colors"
                          >
                            Quiz
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EndlessCanvasRoadmap;