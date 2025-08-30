'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Brain, Code, CheckCircle, Clock, Users, Target, Award, Info } from 'lucide-react';

interface LearningGuideProps {
  className?: string;
}

const LearningGuide: React.FC<LearningGuideProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sections = [
    {
      id: 'learn',
      title: 'Learn',
      icon: BookOpen,
      iconColor: 'bg-blue-600 dark:bg-blue-500',
      status: 'Available now',
      statusColor: 'text-green-600 dark:text-green-400',
      description: 'Smart learning interactive content tailored to your pace'
    },
    {
      id: 'quiz',
      title: 'Quiz',
      icon: Brain,
      iconColor: 'bg-green-600 dark:bg-green-500',
      status: 'After Learn completion',
      statusColor: 'text-amber-600 dark:text-amber-400',
      description: 'Timed assessments with instant feedback'
    },
    {
      id: 'code',
      title: 'Code Challenge',
      icon: Code,
      iconColor: 'bg-purple-600 dark:bg-purple-500',
      status: 'Coming Soon',
      statusColor: 'text-gray-500 dark:text-gray-400',
      description: 'Hands-on coding practice with automated testing'
    }
  ];

  return (
    <div className={`bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6 transition-all duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Info className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Learning Path</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Three ways to master each topic</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {isExpanded ? (
            <>
              <span className="mr-1">Less</span>
              <ChevronDown className="w-4 h-4" />
            </>
          ) : (
            <>
              <span className="mr-1">More</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Compact Module Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {sections.map((section) => {
          const IconComponent = section.icon;
          
          return (
            <div key={section.id} className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/30 dark:border-gray-600/30 hover:shadow-md transition-all duration-200">
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 ${section.iconColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                    {section.title}
                  </h3>
                  <p className={`text-xs font-medium ${section.statusColor} mb-2`}>
                    {section.status}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-600/50 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/30 dark:border-blue-700/30">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target className="w-3 h-3 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Recommended Learning Flow</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Learn:</strong> Start here to understand concepts with smart learning explanations
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Quiz:</strong> Test your knowledge with timed questions and instant feedback
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Code:</strong> Apply skills with hands-on challenges (coming soon)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningGuide;