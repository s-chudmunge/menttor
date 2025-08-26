"use client";

import React, { useState, useEffect } from 'react';

const SimpleLearningAnimation = () => {
  const [animationPhase, setAnimationPhase] = useState(0);
  
  const skills = ["Programming", "Data Science", "Design", "Marketing"];

  useEffect(() => {
    const phases = [
      { delay: 0, phase: 0 },     // Static state - clear message
      { delay: 2000, phase: 1 },  // Simple skill nodes appear
      { delay: 4000, phase: 2 },  // Learning path forms
      { delay: 6000, phase: 3 },  // Completion state
    ];

    phases.forEach(({ delay, phase }) => {
      setTimeout(() => setAnimationPhase(phase), delay);
    });

    // Reset after 8 seconds - much simpler
    const resetTimer = setTimeout(() => {
      setAnimationPhase(0);
    }, 8000);

    return () => clearTimeout(resetTimer);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto h-[400px] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900 rounded-2xl border border-gray-200 dark:border-slate-700">
      
      {/* Clear headline - always visible like LiteLLM */}
      <div className="absolute top-8 left-0 right-0 text-center">
        <div className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
          Learn Any Skill
        </div>
        <div className="text-lg text-slate-600 dark:text-slate-400">
          Personalized roadmaps from beginner to expert
        </div>
      </div>

      {/* Simple central diagram like LiteLLM */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        
        {/* User */}
        <div className="absolute -left-32 top-1/2 transform -translate-y-1/2">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl shadow-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-700 dark:text-slate-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div className="text-center mt-2 text-sm text-slate-600 dark:text-slate-400">You</div>
        </div>

        {/* Central Platform */}
        <div className={`w-32 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl flex flex-col items-center justify-center transition-all duration-1000 ${
          animationPhase >= 1 ? 'scale-100 opacity-100' : 'scale-90 opacity-70'
        }`}>
          <svg className="w-8 h-8 text-white mb-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
          </svg>
          <div className="text-white text-sm font-semibold">Menttor</div>
        </div>

        {/* Skills - appear in sequence */}
        {skills.map((skill, i) => (
          <div
            key={skill}
            className={`absolute transition-all duration-1000 ${
              animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{
              left: `${120 + (i % 2) * 60}px`,
              top: `${-20 + Math.floor(i / 2) * 40}px`,
              transitionDelay: `${i * 300}ms`
            }}
          >
            <div className="w-20 h-12 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-lg shadow-lg flex items-center justify-center">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{skill}</span>
            </div>
          </div>
        ))}

        {/* Connection arrows - simple like LiteLLM */}
        {animationPhase >= 1 && (
          <>
            <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 w-16 h-0.5 bg-gradient-to-r from-slate-400 to-blue-500 opacity-60"></div>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-slate-400 opacity-60"></div>
          </>
        )}
      </div>

      {/* Simple bottom message */}
      {animationPhase >= 3 && (
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Expert-curated learning paths for any career goal
          </div>
        </div>
      )}

    </div>
  );
};

export default SimpleLearningAnimation;