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
    <div className="relative w-full max-w-4xl mx-auto h-[500px] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900 rounded-3xl border border-gray-200 dark:border-slate-700">
      
      {/* Clear headline - always visible like LiteLLM */}
      <div className="absolute top-12 left-0 right-0 text-center">
        <div className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Learn Any Skill
        </div>
        <div className="text-xl text-slate-600 dark:text-slate-400">
          Personalized roadmaps from beginner to expert
        </div>
      </div>

      {/* Spacious central diagram */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        
        {/* User - more spacious positioning */}
        <div className="absolute -left-48 top-1/2 transform -translate-y-1/2">
          <div className={`w-20 h-20 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-1000 ${
            animationPhase >= 0 ? 'scale-100 opacity-100' : 'scale-90 opacity-50'
          }`}>
            <svg className="w-10 h-10 text-slate-700 dark:text-slate-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div className="text-center mt-3 text-base font-medium text-slate-600 dark:text-slate-400">You</div>
        </div>

        {/* Central Platform - larger and more prominent */}
        <div className={`w-40 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl flex flex-col items-center justify-center transition-all duration-1000 ease-out ${
          animationPhase >= 1 ? 'scale-100 opacity-100 rotate-0' : 'scale-90 opacity-70 rotate-1'
        }`}>
          <svg className="w-12 h-12 text-white mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
          </svg>
          <div className="text-white text-lg font-bold">Menttor</div>
          <div className="text-blue-100 text-xs">Learning Platform</div>
        </div>

        {/* Skills - more spacious grid layout */}
        {skills.map((skill, i) => (
          <div
            key={skill}
            className={`absolute transition-all duration-1000 ease-out ${
              animationPhase >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-90'
            }`}
            style={{
              left: `${180 + (i % 2) * 80}px`,
              top: `${-40 + Math.floor(i / 2) * 60}px`,
              transitionDelay: `${i * 400}ms`
            }}
          >
            <div className="w-24 h-16 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow duration-300">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">{skill}</span>
            </div>
          </div>
        ))}

        {/* Animated connection lines with better flow */}
        {animationPhase >= 1 && (
          <svg className="absolute -left-24 -top-24 w-96 h-48" style={{ zIndex: -1 }}>
            <defs>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.3"/>
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3"/>
              </linearGradient>
            </defs>
            
            {/* Smooth curved line from user to platform */}
            <path
              d="M24 24 Q120 24 144 24"
              fill="none"
              stroke="url(#connectionGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              className={`transition-all duration-1000 ${
                animationPhase >= 1 ? 'opacity-100' : 'opacity-0'
              }`}
            />
            
            {/* Flowing connections to skills */}
            {animationPhase >= 2 && skills.map((_, i) => (
              <path
                key={i}
                d={`M164 24 Q${180 + (i % 2) * 40} ${20 + Math.floor(i / 2) * 30} ${204 + (i % 2) * 80} ${-16 + Math.floor(i / 2) * 60}`}
                fill="none"
                stroke="url(#connectionGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="5,5"
                className="animate-pulse"
                style={{
                  animationDelay: `${i * 400 + 500}ms`,
                  opacity: 0.6
                }}
              />
            ))}
          </svg>
        )}

        {/* Subtle floating particles for ambiance */}
        {animationPhase >= 1 && (
          <div className="absolute -inset-32">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-blue-400/30 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Enhanced bottom message with better spacing */}
      {animationPhase >= 3 && (
        <div className="absolute bottom-12 left-0 right-0 text-center">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-lg inline-block">
            <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expert-curated learning paths
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Tailored for your career goals and learning style
            </div>
          </div>
        </div>
      )}

      {/* Custom enhanced animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SimpleLearningAnimation;