'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Cpu, Zap, MessageSquare, X, Eye, EyeOff } from 'lucide-react';
import { useAIState } from '@/store/aiState';

const ModelStatusIndicator = () => {
  const { isGenerating, progress, currentModel, setProgress } = useAIState();
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Simulate progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setProgress(progress + 10 > 90 ? 90 : progress + 10);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGenerating, progress, setProgress]);

  const getModelIcon = (model: string | null) => {
    if (!model) return <Cpu className="w-4 h-4" />;
    if (model.includes('gpt')) return <Brain className="w-4 h-4" />;
    if (model.includes('claude')) return <MessageSquare className="w-4 h-4" />;
    if (model.includes('gemini')) return <Zap className="w-4 h-4" />;
    return <Cpu className="w-4 h-4" />;
  };

  const getModelColor = (model: string | null) => {
    if (!model) return 'bg-purple-500';
    if (model.includes('gpt')) return 'bg-green-500';
    if (model.includes('claude')) return 'bg-orange-500';
    if (model.includes('gemini')) return 'bg-blue-500';
    return 'bg-purple-500';
  };

  if (!isGenerating) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      {!isVisible ? (
        // Minimized Show Button
        <button
          onClick={() => setIsVisible(true)}
          className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-105"
          title="Show model status"
        >
          <Eye className="w-4 h-4" />
        </button>
      ) : (
        <>
          {/* Main Status Card */}
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
            isMinimized ? 'p-2' : 'p-3'
          } min-w-[200px]`}>
            
            {/* Header with controls */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                 AI Brain Active
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  title="Hide status indicator"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${getModelColor(currentModel)} text-white`}>
                  {getModelIcon(currentModel)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Using Model
                    </span>
                    {isGenerating && (
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentModel || '...'}
                  </div>
                  
                  {isGenerating && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Generating...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${getModelColor(currentModel)} transition-all duration-300`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Minimized view */}
            {isMinimized && (
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-full ${getModelColor(currentModel)} text-white`}>
                  {getModelIcon(currentModel)}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {currentModel || '...'}
                </span>
                {isGenerating && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </div>
            )}
          </div>

          {/* Alternative: Minimal Pill Design (optional - can be removed) */}
          <div className="mt-3 bg-gray-900 text-white rounded-full px-3 py-1.5 text-sm flex items-center gap-2 opacity-75 hover:opacity-100 transition-opacity">
            {getModelIcon(currentModel)}
            <span>{currentModel || '...'}</span>
            {isGenerating && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ModelStatusIndicator;