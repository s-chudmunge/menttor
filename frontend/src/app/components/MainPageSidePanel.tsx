'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Box, BookOpen, ExternalLink, Eye, Play } from 'lucide-react';
import Link from 'next/link';
import { BACKEND_URL } from '../../config/config';

interface CuratedRoadmap {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  is_featured: boolean;
  adoption_count: number;
  slug?: string;
}

interface MainPageSidePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onShow3DGenerator: () => void;
  onShowLearnAboutSomething: () => void;
}

const MainPageSidePanel: React.FC<MainPageSidePanelProps> = ({
  isOpen,
  onToggle,
  onShow3DGenerator,
  onShowLearnAboutSomething
}) => {
  const [roadmaps, setRoadmaps] = useState<CuratedRoadmap[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && roadmaps.length === 0) {
      fetchRoadmaps();
    }
  }, [isOpen]);

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/curated-roadmaps/?per_page=50`);
      if (response.ok) {
        const data = await response.json();
        setRoadmaps(data);
      }
    } catch (error) {
      console.error('Failed to fetch roadmaps:', error);
    } finally {
      setLoading(false);
    }
  };

  const difficultyColors: { [key: string]: string } = {
    beginner: 'bg-green-500',
    intermediate: 'bg-yellow-500',
    advanced: 'bg-red-500'
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Side Panel */}
      <div className={`
        fixed top-14 left-0 h-[calc(100vh-3.5rem)] bg-white dark:bg-black
        border-r border-gray-200 dark:border-gray-700 z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-80 flex flex-col
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-600 dark:bg-purple-500 rounded flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* AI Tools */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">AI Tools</h3>
            <div className="space-y-2">
              <button
                onClick={onShow3DGenerator}
                className="w-full flex items-center px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded"
              >
                <Box className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium">3D Visualization</span>
              </button>
              
              <button
                onClick={onShowLearnAboutSomething}
                className="w-full flex items-center px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded"
              >
                <BookOpen className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium">Learn About Something</span>
              </button>
            </div>
          </div>

          {/* Curated Roadmaps */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Popular Roadmaps</h3>
              <Link 
                href="/explore" 
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
              >
                View All
                <ExternalLink className="w-3 h-3 ml-1" />
              </Link>
            </div>
            
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1 overflow-y-auto">
                {roadmaps.slice(0, 20).map((roadmap) => (
                  <div key={roadmap.id} className="group">
                    <div className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                      <div className="flex-1 min-w-0">
                        <Link href={`/explore/${roadmap.slug || roadmap.id}`}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${difficultyColors[roadmap.difficulty] || 'bg-gray-400'}`}></div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                              {roadmap.title}
                            </h4>
                          </div>
                        </Link>
                        <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{roadmap.adoption_count} learners</span>
                          {roadmap.is_featured && <span className="ml-2 text-yellow-500">★</span>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/explore/${roadmap.slug || roadmap.id}`}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Fast access to tools & roadmaps
          </p>
        </div>
      </div>
    </>
  );
};

export default MainPageSidePanel;