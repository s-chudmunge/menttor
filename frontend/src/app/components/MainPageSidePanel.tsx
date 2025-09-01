'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Box, BookOpen, ExternalLink, Eye, Play, Search } from 'lucide-react';
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
  onShow3DGenerator: () => void;
  onShowLearnAboutSomething: () => void;
}

const MainPageSidePanel: React.FC<MainPageSidePanelProps> = ({
  onShow3DGenerator,
  onShowLearnAboutSomething
}) => {
  const [roadmaps, setRoadmaps] = useState<CuratedRoadmap[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/curated-roadmaps/?per_page=100`);
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

  const filteredRoadmaps = useMemo(() => {
    if (!searchQuery.trim()) return roadmaps;
    
    const query = searchQuery.toLowerCase();
    return roadmaps.filter(roadmap => 
      roadmap.title.toLowerCase().includes(query) ||
      roadmap.description.toLowerCase().includes(query) ||
      roadmap.category.toLowerCase().includes(query)
    );
  }, [roadmaps, searchQuery]);

  return (
    <div className="fixed top-14 left-0 h-[calc(100vh-3.5rem)] bg-white dark:bg-black border-r border-gray-200 dark:border-gray-700 w-80 flex flex-col z-30">
        {/* Header */}
        <div className="p-1 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* AI Tools */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 px-1">Tools</h3>
            <div className="space-y-1">
              <button
                onClick={onShow3DGenerator}
                className="w-full flex items-center px-2 py-1.5 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded"
              >
                <Box className="w-3.5 h-3.5 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium">3D Visualization</span>
              </button>
              
              <button
                onClick={onShowLearnAboutSomething}
                className="w-full flex items-center px-2 py-1.5 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded"
              >
                <BookOpen className="w-3.5 h-3.5 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium">Learn Something</span>
              </button>
            </div>
          </div>

          {/* Curated Roadmaps */}
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1">All Roadmaps</h3>
              <Link 
                href="/explore" 
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center px-1"
              >
                Explore
                <ExternalLink className="w-2.5 h-2.5 ml-1" />
              </Link>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                type="text"
                placeholder="Search roadmaps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {loading ? (
              <div className="space-y-1">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-0.5 overflow-y-auto">
                {filteredRoadmaps.map((roadmap) => (
                  <div key={roadmap.id} className="group">
                    <Link href={`/explore/${roadmap.slug || roadmap.id}`}>
                      <div className="flex items-center justify-between p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${difficultyColors[roadmap.difficulty] || 'bg-gray-400'}`}></div>
                            <h4 className="text-xs font-medium text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400">
                              {roadmap.title}
                            </h4>
                            {roadmap.is_featured && <span className="text-yellow-500 text-xs">★</span>}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 ml-3 truncate">
                            {roadmap.adoption_count} learners
                          </div>
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-2.5 h-2.5 text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-1 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {filteredRoadmaps.length} roadmaps
          </p>
        </div>
    </div>
  );
};

export default MainPageSidePanel;