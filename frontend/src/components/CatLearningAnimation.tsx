"use client";

import React, { useState, useEffect } from 'react';

const ProfessionalLearningAnimation = () => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [showBrand, setShowBrand] = useState(false);
  const [textIndex, setTextIndex] = useState(0);

  const learningScenarios = [
    { skill: "Python Programming", time: "6 weeks", outcome: "Build real applications" },
    { skill: "Data Science", time: "8 weeks", outcome: "Analyze complex datasets" },
    { skill: "Machine Learning", time: "10 weeks", outcome: "Create AI models" },
    { skill: "Web Development", time: "12 weeks", outcome: "Launch full websites" },
    { skill: "Cloud Computing", time: "8 weeks", outcome: "Deploy scalable apps" }
  ];

  const valueProps = [
    "Personalized Learning Paths",
    "Expert-Curated Content", 
    "Hands-on Projects",
    "Industry Certification",
    "Career Advancement"
  ];

  useEffect(() => {
    const phases = [
      { delay: 0, phase: 0 },      // Value proposition shows immediately
      { delay: 2000, phase: 1 },   // Learning ecosystem appears  
      { delay: 4000, phase: 2 },   // Skill connections form
      { delay: 6000, phase: 3 },   // Real outcomes demonstrated
      { delay: 8000, phase: 4 },   // Social proof & achievements
      { delay: 10000, phase: 5 },  // Call-to-action phase
    ];

    phases.forEach(({ delay, phase }) => {
      setTimeout(() => {
        setAnimationPhase(phase);
        if (phase === 5) setShowBrand(true);
      }, delay);
    });

    // Cycle through learning scenarios slower for comprehension
    const scenarioInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % learningScenarios.length);
    }, 3000);

    // Much longer cycle - 18 seconds total
    const resetTimer = setTimeout(() => {
      setAnimationPhase(0);
      setShowBrand(false);
      setTextIndex(0);
    }, 18000);

    return () => {
      clearTimeout(resetTimer);
      clearInterval(scenarioInterval);
    };
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto h-[400px] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900 rounded-2xl border border-gray-200 dark:border-slate-700">
      
      {/* Professional grid background */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-slate-600"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Immediate Value Proposition - Always Visible */}
      <div className="absolute top-6 left-0 right-0 text-center z-10">
        <div className="inline-block bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-600 shadow-lg">
          <div className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Master Any Skill in Weeks, Not Years
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {valueProps[Math.floor(textIndex / 1) % valueProps.length]}
          </div>
        </div>
      </div>

      {/* Current Learning Scenario Display */}
      <div className={`absolute bottom-6 left-0 right-0 text-center transition-all duration-1000 ${
        animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="inline-block bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-6 py-4 rounded-xl border border-blue-200 dark:border-blue-700 shadow-lg max-w-md mx-auto">
          <div className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Learn {learningScenarios[textIndex].skill}
          </div>
          <div className="flex justify-between items-center text-sm text-blue-700 dark:text-blue-300">
            <span>📅 {learningScenarios[textIndex].time}</span>
            <span>🎯 {learningScenarios[textIndex].outcome}</span>
          </div>
        </div>
      </div>

      {/* Floating knowledge nodes */}
      <div className="absolute inset-0">
        {[
          { topic: "Code", x: 20, y: 25, delay: 0 },
          { topic: "Data", x: 75, y: 20, delay: 300 },
          { topic: "Design", x: 15, y: 65, delay: 600 },
          { topic: "Cloud", x: 80, y: 70, delay: 900 },
          { topic: "AI/ML", x: 50, y: 40, delay: 1200 },
        ].map((node, i) => (
          <div
            key={i}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${
              animationPhase >= 1 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-8 scale-50'
            }`}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transitionDelay: `${node.delay}ms`
            }}
          >
            <div className="relative">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl shadow-lg flex items-center justify-center">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{node.topic}</span>
              </div>
              
              {/* Node glow effect */}
              <div className="absolute inset-0 w-16 h-16 bg-blue-400 dark:bg-blue-500 rounded-xl opacity-20 blur-md animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Connection lines between nodes */}
      {animationPhase >= 2 && (
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6"/>
            </linearGradient>
          </defs>
          
          {[
            { x1: '20%', y1: '25%', x2: '50%', y2: '40%' },
            { x1: '75%', y1: '20%', x2: '50%', y2: '40%' },
            { x1: '15%', y1: '65%', x2: '50%', y2: '40%' },
            { x1: '80%', y1: '70%', x2: '50%', y2: '40%' },
          ].map((line, i) => (
            <line
              key={i}
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              stroke="url(#connectionGradient)"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="animate-pulse"
              style={{
                animationDelay: `${i * 200}ms`
              }}
            />
          ))}
        </svg>
      )}

      {/* Central learning hub */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className={`transition-all duration-1000 ${
          animationPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}>
          <div className="relative">
            {/* Main learning circle */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
              </svg>
            </div>
            
            {/* Rotating rings */}
            <div className={`absolute inset-0 w-24 h-24 border-2 border-blue-300 dark:border-blue-400 rounded-full transition-all duration-1000 ${
              animationPhase >= 2 ? 'animate-spin opacity-60' : 'opacity-0'
            }`} style={{ animationDuration: '8s' }}></div>
            
            <div className={`absolute -inset-2 w-28 h-28 border border-indigo-300 dark:border-indigo-400 rounded-full transition-all duration-1000 ${
              animationPhase >= 2 ? 'animate-spin opacity-40' : 'opacity-0'
            }`} style={{ animationDuration: '12s', animationDirection: 'reverse' }}></div>

            {/* Progress indicator - More descriptive */}
            {animationPhase >= 2 && (
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-xl shadow-xl border border-gray-200 dark:border-slate-600 min-w-[200px]">
                  <div className="text-sm font-semibold text-center text-slate-700 dark:text-slate-300 mb-2">
                    🎯 Structured Learning Path
                  </div>
                  <div className="text-xs text-center text-slate-600 dark:text-slate-400 mb-3">
                    Beginner → Intermediate → Expert
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-3000 ease-out"
                      style={{
                        width: animationPhase >= 4 ? '100%' : animationPhase >= 3 ? '66%' : '33%'
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>Start</span>
                    <span>Practice</span>
                    <span>Master</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Metrics that appear */}
      {animationPhase >= 4 && (
        <div className="absolute top-20 right-4 space-y-2">
          {[
            { metric: "95%", label: "Job Placement Rate" },
            { metric: "50K+", label: "Successful Graduates" }, 
            { metric: "6 weeks", label: "Average to Career Ready" }
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-lg opacity-0 animate-fade-in"
              style={{ 
                animationDelay: `${i * 600}ms`,
                animationFillMode: 'forwards'
              }}
            >
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stat.metric}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Social proof badges */}
      {animationPhase >= 4 && (
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          {[
            { icon: "🏆", text: "Industry Certified" },
            { icon: "💼", text: "Career Ready" },
            { icon: "🚀", text: "Job Guaranteed" }
          ].map((badge, i) => (
            <div
              key={badge.text}
              className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs font-semibold rounded-full border border-green-200 dark:border-green-700 opacity-0 animate-fade-in flex items-center gap-1"
              style={{ 
                animationDelay: `${i * 400}ms`,
                animationFillMode: 'forwards'
              }}
            >
              <span>{badge.icon}</span>
              <span>{badge.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Call-to-Action Brand reveal */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm transition-all duration-1000 ${
        showBrand ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white">
                <path 
                  fill="currentColor" 
                  d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"
                />
              </svg>
            </div>
          </div>
          
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Menttor
            </span>
          </div>
          
          <div className="text-base text-slate-600 dark:text-slate-400 font-medium mb-4">
            Transform Your Career in Weeks
          </div>
          
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
            Start Your Learning Journey →
          </div>
          
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            Join 50,000+ professionals advancing their careers
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fade-in {
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProfessionalLearningAnimation;