"use client";

import React from 'react';
import CatLearningAnimation from '../../components/CatLearningAnimation';

export default function CatDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Cat Learning Animation Demo
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Our futuristic cat discovers the power of learning!
          </p>
          <div className="text-sm text-gray-400 bg-gray-800/50 rounded-lg p-4 inline-block">
            <strong>Animation Sequence:</strong><br/>
            1. Cat appears → 2. Books float in → 3. Knowledge sparkles → 4. Enlightenment glow → 5. Brand reveal
            <br/><em>Loops every 8 seconds</em>
          </div>
        </div>

        {/* Main Animation */}
        <div className="flex justify-center mb-8">
          <CatLearningAnimation />
        </div>

        {/* Performance Info */}
        <div className="bg-gray-800/30 rounded-xl p-6 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">Performance Optimized</h3>
          <div className="grid md:grid-cols-3 gap-4 text-gray-300">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-green-400 font-semibold">SVG Graphics</div>
              <div className="text-sm">Vector-based for crisp scaling</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-blue-400 font-semibold">CSS Animations</div>
              <div className="text-sm">Hardware accelerated transforms</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-purple-400 font-semibold">Lazy Loading</div>
              <div className="text-sm">Won't impact main page load</div>
            </div>
          </div>
        </div>

        {/* Integration Preview */}
        <div className="mt-8 text-center">
          <button 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => window.location.href = '/'}
          >
            Back to Main Page
          </button>
        </div>
      </div>
    </div>
  );
}