'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Brain, Code, CheckCircle, Clock, Users, Target, Award, Info } from 'lucide-react';

interface LearningGuideProps {
  className?: string;
}

const LearningGuide: React.FC<LearningGuideProps> = ({ className = '' }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isExpanded = (sectionId: string) => expandedSections.includes(sectionId);

  const sections = [
    {
      id: 'learn',
      title: 'Learn Module',
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      darkBgColor: 'from-blue-900/20 to-indigo-900/20',
      availability: 'Available immediately for all subtopics',
      description: 'Interactive learning experience with AI-powered content',
      features: [
        {
          icon: Target,
          title: 'Personalized Content',
          description: 'AI-generated explanations tailored to your learning goals and pace'
        },
        {
          icon: Brain,
          title: 'Interactive Explanations',
          description: 'Dynamic content that adapts to your questions and comprehension level'
        },
        {
          icon: CheckCircle,
          title: 'Progress Tracking',
          description: 'Real-time monitoring of your understanding and completion status'
        },
        {
          icon: Users,
          title: 'Examples & Practice',
          description: 'Comprehensive examples with step-by-step problem-solving guides'
        }
      ]
    },
    {
      id: 'quiz',
      title: 'Knowledge Assessment',
      icon: Brain,
      color: 'from-emerald-500 to-green-600',
      bgColor: 'from-emerald-50 to-green-50',
      darkBgColor: 'from-emerald-900/20 to-green-900/20',
      availability: 'Available after completing the Learn module',
      description: 'Comprehensive assessment to validate your understanding',
      features: [
        {
          icon: Clock,
          title: 'Timed Assessment',
          description: 'Configurable time limits (5, 7, or 10 minutes) to test knowledge retention'
        },
        {
          icon: CheckCircle,
          title: 'Multiple Choice Questions',
          description: '5 carefully crafted questions covering key concepts from the subtopic'
        },
        {
          icon: Award,
          title: 'Instant Results',
          description: 'Immediate feedback with detailed explanations for each answer'
        },
        {
          icon: Target,
          title: 'Performance Analytics',
          description: 'Detailed breakdown of strengths and areas for improvement'
        }
      ],
      requirements: [
        'Complete the Learn module first',
        'Ensure stable internet connection',
        'Fullscreen mode recommended for best experience'
      ]
    },
    {
      id: 'code',
      title: 'Code Challenge',
      icon: Code,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'from-purple-50 to-violet-50',
      darkBgColor: 'from-purple-900/20 to-violet-900/20',
      availability: 'Coming Soon - In Development',
      description: 'Hands-on coding exercises to apply theoretical knowledge',
      features: [
        {
          icon: Code,
          title: 'Interactive Coding Environment',
          description: 'Browser-based IDE with syntax highlighting and real-time execution'
        },
        {
          icon: CheckCircle,
          title: 'Automated Testing',
          description: 'Instant validation with comprehensive test cases and feedback'
        },
        {
          icon: Target,
          title: 'Progressive Difficulty',
          description: 'Challenges that scale from basic implementation to advanced optimization'
        },
        {
          icon: Award,
          title: 'Code Quality Analysis',
          description: 'Performance metrics, best practices, and optimization suggestions'
        }
      ],
      comingSoon: true
    }
  ];

  return (
    <div className={`bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg p-6 transition-all duration-300 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
          <Info className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Learning Guide</h2>
          <p className="text-sm text-gray-300">Understand what each module offers and when it's available</p>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const IconComponent = section.icon;
          const expanded = isExpanded(section.id);
          
          return (
            <div key={section.id} className="group">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full text-left transition-all duration-300"
              >
                <div className="bg-slate-700/50 rounded-lg border border-slate-600/30 p-4 hover:bg-slate-700/70 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 ${
                        section.id === 'learn' ? 'bg-blue-600' :
                        section.id === 'quiz' ? 'bg-green-600' :
                        'bg-purple-600'
                      } rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-white flex items-center space-x-2">
                          <span>{section.title}</span>
                          {section.comingSoon && (
                            <span className="px-2 py-1 text-xs font-medium bg-orange-900/30 text-orange-300 rounded">
                              Coming Soon
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-300 mt-1">
                          <span className="font-medium text-gray-200">Availability:</span> {section.availability}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {expanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 transition-transform duration-200" />
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {expanded && (
                <div className="mt-3 ml-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-slate-700/30 rounded-lg border border-slate-600/30 p-4 shadow-md">
                    <p className="text-gray-200 mb-6 leading-relaxed">
                      {section.description}
                    </p>

                    {section.requirements && (
                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Requirements</span>
                        </h4>
                        <ul className="space-y-2">
                          {section.requirements.map((req, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-bold text-white mb-4">Features & Benefits</h4>
                      <div className="grid gap-3 md:grid-cols-2">
                        {section.features.map((feature, index) => {
                          const FeatureIcon = feature.icon;
                          return (
                            <div key={index} className="bg-slate-600/30 rounded-lg p-3 border border-slate-500/30">
                              <div className="flex items-start space-x-3">
                                <div className={`w-7 h-7 ${
                                  section.id === 'learn' ? 'bg-blue-600' :
                                  section.id === 'quiz' ? 'bg-green-600' :
                                  'bg-purple-600'
                                } rounded-lg flex items-center justify-center flex-shrink-0`}>
                                  <FeatureIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-sm font-semibold text-white mb-1">
                                    {feature.title}
                                  </h5>
                                  <p className="text-xs text-gray-300 leading-relaxed">
                                    {feature.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-3 h-3 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Pro Tip</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Follow the sequential learning path: Start with <strong className="text-white">Learn</strong> to build understanding, 
              then take the <strong className="text-white">Quiz</strong> to validate knowledge, and finally apply concepts with 
              <strong className="text-white">Code Challenges</strong> when available. This progression ensures optimal learning outcomes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningGuide;