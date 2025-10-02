'use client';

import React, { useState } from 'react';
import { Info, Clock, CheckCircle, Code, AlertCircle } from 'lucide-react';

interface FeatureTooltipProps {
  type: 'learn' | 'quiz' | 'code';
  isAvailable: boolean;
  className?: string;
}

const FeatureTooltip: React.FC<FeatureTooltipProps> = ({ type, isAvailable, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getFeatureInfo = () => {
    switch (type) {
      case 'learn':
        return {
          title: 'Learn Module',
          icon: CheckCircle,
          description: 'Smart learning interactive experience with personalized explanations and examples',
          features: [
            'Adaptive content based on your pace',
            'Interactive Q&A with smart tutor',
            'Real-time progress tracking',
            'Comprehensive examples and practice'
          ],
          availability: 'Available immediately',
          color: 'blue'
        };
      
      case 'quiz':
        return {
          title: 'Knowledge Assessment',
          icon: Clock,
          description: 'Timed assessment with 5 multiple-choice questions to validate understanding',
          features: [
            'Configurable time limits (5-10 min)',
            'Instant results with explanations',
            'Performance analytics',
            'Fullscreen integrity mode'
          ],
          availability: isAvailable ? 'Available now' : 'Complete Learn module first',
          color: isAvailable ? 'green' : 'yellow'
        };
      
      case 'code':
        return {
          title: 'Code Challenge',
          icon: Code,
          description: 'Hands-on coding exercises with automated testing and real-time feedback',
          features: [
            'Browser-based coding environment',
            'Automated test case validation',
            'Performance optimization tips',
            'Progressive difficulty levels'
          ],
          availability: 'Coming soon - In active development',
          color: 'green'
        };
    }
  };

  const info = getFeatureInfo();
  const IconComponent = info.icon;

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-500',
        border: 'border-blue-200 dark:border-blue-700',
        text: 'text-blue-900 dark:text-blue-100',
        accent: 'text-blue-600 dark:text-blue-400'
      },
      green: {
        bg: 'bg-green-500',
        border: 'border-green-200 dark:border-green-700',
        text: 'text-green-900 dark:text-green-100',
        accent: 'text-green-600 dark:text-green-400'
      },
      yellow: {
        bg: 'bg-yellow-500',
        border: 'border-yellow-200 dark:border-yellow-700',
        text: 'text-yellow-900 dark:text-yellow-100',
        accent: 'text-yellow-600 dark:text-yellow-400'
      },
      green: {
        bg: 'bg-green-500',
        border: 'border-green-200 dark:border-green-700',
        text: 'text-green-900 dark:text-green-100',
        accent: 'text-green-600 dark:text-green-400'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const colorClasses = getColorClasses(info.color);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="group p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-gray-600 transition-colors duration-200"
      >
        <Info className="w-4 h-4 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300" />
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className={`bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border ${colorClasses.border} p-4 w-80 max-w-sm`}>
            {/* Header */}
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-8 h-8 ${colorClasses.bg} rounded-lg flex items-center justify-center`}>
                <IconComponent className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className={`font-bold text-sm ${colorClasses.text}`}>
                  {info.title}
                </h4>
                <p className={`text-xs ${colorClasses.accent}`}>
                  {info.availability}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
              {info.description}
            </p>

            {/* Features */}
            <div>
              <h5 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Key Features:</h5>
              <ul className="space-y-1">
                {info.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className={`w-1 h-1 ${colorClasses.bg} rounded-full mt-2 flex-shrink-0`}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Availability status for quiz */}
            {type === 'quiz' && !isAvailable && (
              <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700/50">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
                    Complete the Learn module to unlock
                  </span>
                </div>
              </div>
            )}

            {/* Coming soon status for code */}
            {type === 'code' && (
              <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700/50">
                <div className="flex items-center space-x-2">
                  <Code className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-800 dark:text-green-300">
                    In active development - Stay tuned!
                  </span>
                </div>
              </div>
            )}

            {/* Arrow pointer */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className={`w-3 h-3 bg-white dark:bg-zinc-800 border-r border-b ${colorClasses.border} transform rotate-45`}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureTooltip;