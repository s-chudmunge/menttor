"use client";

import React, { useState, useEffect } from 'react';

const CatLearningAnimation = () => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [showBrand, setShowBrand] = useState(false);

  useEffect(() => {
    // Animation sequence timing
    const phases = [
      { delay: 0, phase: 0 },     // Cat appears
      { delay: 1500, phase: 1 },  // Cat starts learning (books appear)
      { delay: 3000, phase: 2 },  // Knowledge sparkles
      { delay: 4500, phase: 3 },  // Transformation/enlightenment
      { delay: 6000, phase: 4 },  // Brand reveal
    ];

    phases.forEach(({ delay, phase }) => {
      setTimeout(() => {
        setAnimationPhase(phase);
        if (phase === 4) setShowBrand(true);
      }, delay);
    });

    // Reset animation after 8 seconds
    const resetTimer = setTimeout(() => {
      setAnimationPhase(0);
      setShowBrand(false);
    }, 8000);

    return () => clearTimeout(resetTimer);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto h-96 overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl">
      {/* Background starfield */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-300 rounded-full opacity-60 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main cat character - SVG for performance */}
      <div className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 transition-all duration-1000 ${
        animationPhase >= 1 ? 'scale-110' : 'scale-100'
      } ${animationPhase >= 3 ? 'translate-y-[-20px]' : ''}`}>
        
        <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-lg">
          {/* Cat body */}
          <ellipse cx="60" cy="85" rx="35" ry="25" fill="#6b7280" stroke="#374151" strokeWidth="2"/>
          
          {/* Cat head */}
          <circle cx="60" cy="50" r="30" fill="#6b7280" stroke="#374151" strokeWidth="2"/>
          
          {/* Ears */}
          <path d="M35 35 L40 15 L50 35 Z" fill="#6b7280" stroke="#374151" strokeWidth="2"/>
          <path d="M70 35 L80 15 L85 35 Z" fill="#6b7280" stroke="#374151" strokeWidth="2"/>
          <path d="M38 32 L42 20 L47 32 Z" fill="#ec4899"/>
          <path d="M73 32 L78 20 L82 32 Z" fill="#ec4899"/>
          
          {/* Futuristic glasses */}
          <rect x="25" y="45" width="70" height="15" rx="7" fill="none" stroke="#10b981" strokeWidth="3"/>
          <rect x="30" y="47" width="25" height="11" rx="5" fill="url(#glassGradient)" opacity="0.8"/>
          <rect x="65" y="47" width="25" height="11" rx="5" fill="url(#glassGradient)" opacity="0.8"/>
          
          {/* Nose */}
          <path d="M55 58 L60 62 L65 58 Z" fill="#1f2937"/>
          
          {/* Whiskers */}
          <line x1="20" y1="55" x2="35" y2="52" stroke="#374151" strokeWidth="2"/>
          <line x1="20" y1="60" x2="35" y2="60" stroke="#374151" strokeWidth="2"/>
          <line x1="85" y1="52" x2="100" y2="55" stroke="#374151" strokeWidth="2"/>
          <line x1="85" y1="60" x2="100" y2="60" stroke="#374151" strokeWidth="2"/>

          {/* Gradient for holographic glasses */}
          <defs>
            <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4"/>
              <stop offset="50%" stopColor="#3b82f6"/>
              <stop offset="100%" stopColor="#8b5cf6"/>
            </linearGradient>
          </defs>
        </svg>

        {/* Learning elements that appear */}
        {animationPhase >= 1 && (
          <>
            {/* Floating books */}
            <div className={`absolute -top-16 -left-8 transition-all duration-1000 ${
              animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <div className="w-6 h-8 bg-blue-500 rounded-sm transform rotate-12 shadow-lg"></div>
            </div>
            <div className={`absolute -top-12 -right-6 transition-all duration-1000 delay-300 ${
              animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <div className="w-6 h-8 bg-purple-500 rounded-sm transform -rotate-6 shadow-lg"></div>
            </div>
            
            {/* Knowledge sparkles */}
            {animationPhase >= 2 && [...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${-30 + Math.random() * 40}%`,
                  animationDelay: `${i * 200}ms`
                }}
              />
            ))}
          </>
        )}

        {/* Enlightenment glow */}
        {animationPhase >= 3 && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-30 blur-xl animate-pulse scale-150"></div>
        )}
      </div>

      {/* Brand reveal */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ${
        showBrand ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="text-center">
          {/* Brand logo */}
          <div className="mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-white">
                <path 
                  fill="currentColor" 
                  d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"
                />
              </svg>
            </div>
          </div>
          
          {/* Brand name with typewriter effect */}
          <div className="text-4xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Menttor
            </span>
          </div>
          <div className="text-lg text-gray-300 font-medium">
            Smart Learning Unlocked
          </div>
        </div>
      </div>

      {/* Performance-optimized styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CatLearningAnimation;