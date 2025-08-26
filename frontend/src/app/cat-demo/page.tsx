"use client";

import React from 'react';
import ProfessionalLearningAnimation from '../../components/CatLearningAnimation';

export default function LearningAnimationDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 flex items-center justify-center p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Professional Learning Animation
          </h1>
          <p className="text-xl text-slate-600 dark:text-gray-300 mb-8">
            Clean, modern animation perfect for an enterprise learning platform
          </p>
          <div className="text-sm text-slate-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/50 rounded-xl p-6 inline-block border border-slate-200 dark:border-gray-700">
            <strong className="text-slate-700 dark:text-gray-300">Animation Sequence:</strong><br/>
            <div className="mt-3 space-y-1 text-left">
              <div>1. 📍 Knowledge nodes appear (Code, Data, Design, Cloud, AI/ML)</div>
              <div>2. 🔗 Connection lines form between nodes</div>
              <div>3. 📈 Progress indicator shows learning paths</div>
              <div>4. 🏆 Skill badges unlock (Expert, Certified, Advanced)</div>
              <div>5. 🎯 Professional brand reveal</div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-300 dark:border-gray-600">
              <em>Loops every 10 seconds • Dark/Light mode compatible</em>
            </div>
          </div>
        </div>

        {/* Main Animation */}
        <div className="flex justify-center mb-12">
          <ProfessionalLearningAnimation />
        </div>

        {/* Features */}
        <div className="bg-white/70 dark:bg-gray-800/30 rounded-2xl p-8 text-center border border-slate-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Perfect for Professional Platforms</h3>
          <div className="grid md:grid-cols-4 gap-6 text-slate-600 dark:text-gray-300">
            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6 border border-slate-200 dark:border-gray-600">
              <div className="text-blue-600 dark:text-blue-400 font-bold text-lg mb-2">Enterprise Ready</div>
              <div className="text-sm">Clean, professional aesthetic suitable for corporate environments</div>
            </div>
            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6 border border-slate-200 dark:border-gray-600">
              <div className="text-indigo-600 dark:text-indigo-400 font-bold text-lg mb-2">Performance First</div>
              <div className="text-sm">Optimized SVG and CSS animations with minimal bundle impact</div>
            </div>
            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6 border border-slate-200 dark:border-gray-600">
              <div className="text-purple-600 dark:text-purple-400 font-bold text-lg mb-2">Responsive Design</div>
              <div className="text-sm">Works perfectly across all screen sizes and devices</div>
            </div>
            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6 border border-slate-200 dark:border-gray-600">
              <div className="text-green-600 dark:text-green-400 font-bold text-lg mb-2">Theme Adaptive</div>
              <div className="text-sm">Seamlessly switches between light and dark modes</div>
            </div>
          </div>
        </div>

        {/* Integration Guide */}
        <div className="mt-8 bg-slate-100 dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Integration Options</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium text-slate-700 dark:text-gray-300">Hero Section:</div>
              <div className="text-slate-600 dark:text-gray-400">Perfect as main page centerpiece animation</div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-slate-700 dark:text-gray-300">Loading States:</div>
              <div className="text-slate-600 dark:text-gray-400">Great for course loading or onboarding</div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-slate-700 dark:text-gray-300">Feature Highlights:</div>
              <div className="text-slate-600 dark:text-gray-400">Showcase learning pathways and skills</div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-slate-700 dark:text-gray-300">About/Demo Pages:</div>
              <div className="text-slate-600 dark:text-gray-400">Explain platform capabilities visually</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <button 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            onClick={() => window.location.href = '/'}
          >
            Back to Main Page
          </button>
        </div>
      </div>
    </div>
  );
}