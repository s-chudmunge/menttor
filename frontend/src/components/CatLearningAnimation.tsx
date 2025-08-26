"use client";

import React, { useState, useEffect } from 'react';

const CyberpunkCatAnimation = () => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [showBrand, setShowBrand] = useState(false);

  useEffect(() => {
    const phases = [
      { delay: 0, phase: 0 },     // Scene setup
      { delay: 2000, phase: 1 },  // Cat starts typing/learning
      { delay: 4000, phase: 2 },  // Code/data streams appear
      { delay: 6000, phase: 3 },  // Breakthrough moment
      { delay: 8000, phase: 4 },  // Brand reveal
    ];

    phases.forEach(({ delay, phase }) => {
      setTimeout(() => {
        setAnimationPhase(phase);
        if (phase === 4) setShowBrand(true);
      }, delay);
    });

    const resetTimer = setTimeout(() => {
      setAnimationPhase(0);
      setShowBrand(false);
    }, 12000);

    return () => clearTimeout(resetTimer);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto h-[500px] overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-700">
      
      {/* Cyberpunk background - brick wall pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-30">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-slate-600 border border-slate-500"
              style={{
                width: `${40 + Math.random() * 20}px`,
                height: `${15 + Math.random() * 10}px`,
                left: `${(i % 8) * 12.5}%`,
                top: `${Math.floor(i / 8) * 15}%`,
              }}
            />
          ))}
        </div>
        
        {/* Atmospheric particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-40 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Ground area with stones */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-800 to-transparent">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-slate-600 rounded-full border border-slate-500"
            style={{
              width: `${6 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 6}px`,
              left: `${Math.random() * 95}%`,
              bottom: `${Math.random() * 15}px`,
            }}
          />
        ))}
      </div>

      {/* Campfire */}
      <div className="absolute bottom-16 right-32">
        <div className="relative">
          {/* Fire base */}
          <div className="w-8 h-8 bg-orange-600 rounded-full opacity-80"></div>
          
          {/* Animated flames */}
          <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 transition-all duration-1000 ${
            animationPhase >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}>
            <div className="w-6 h-12 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-1 w-4 h-8 bg-gradient-to-t from-red-500 via-orange-400 to-transparent rounded-full animate-pulse"></div>
          </div>
          
          {/* Fire glow */}
          <div className="absolute inset-0 w-12 h-12 bg-orange-400 rounded-full opacity-20 blur-md -translate-x-2 -translate-y-2"></div>
        </div>
      </div>

      {/* Main cyberpunk cat */}
      <div className={`absolute bottom-16 left-1/4 transform transition-all duration-1000 ${
        animationPhase >= 1 ? 'scale-105' : 'scale-100'
      }`}>
        
        <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-2xl">
          <defs>
            {/* Holographic visor gradient */}
            <linearGradient id="visorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ff9f"/>
              <stop offset="30%" stopColor="#00b4ff"/>
              <stop offset="70%" stopColor="#7b2ff7"/>
              <stop offset="100%" stopColor="#f72585"/>
            </linearGradient>
            
            {/* Hoodie gradient */}
            <linearGradient id="hoodieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1f2937"/>
              <stop offset="100%" stopColor="#111827"/>
            </linearGradient>
            
            {/* Backpack tech glow */}
            <linearGradient id="techGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981"/>
              <stop offset="100%" stopColor="#34d399"/>
            </linearGradient>
          </defs>

          {/* Tech backpack */}
          <rect x="140" y="50" width="25" height="35" rx="8" fill="#1f2937" stroke="#374151" strokeWidth="2"/>
          <rect x="142" y="52" width="21" height="31" rx="6" fill="#111827"/>
          
          {/* Backpack LED indicators */}
          <circle cx="147" cy="60" r="2" fill="url(#techGlow)" className="animate-pulse"/>
          <circle cx="157" cy="60" r="2" fill="url(#techGlow)" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
          <rect x="145" y="70" width="12" height="2" rx="1" fill="url(#techGlow)" className="animate-pulse" style={{animationDelay: '1s'}}/>

          {/* Cat body in hoodie */}
          <ellipse cx="100" cy="120" rx="45" ry="35" fill="url(#hoodieGradient)"/>
          
          {/* Hoodie details */}
          <path d="M70 105 Q100 95 130 105 L130 140 Q100 150 70 140 Z" fill="url(#hoodieGradient)" stroke="#374151" strokeWidth="1"/>
          
          {/* Hood */}
          <path d="M75 85 Q100 75 125 85 L125 110 Q100 105 75 110 Z" fill="url(#hoodieGradient)" stroke="#374151" strokeWidth="1"/>
          
          {/* Cat head (gray) */}
          <circle cx="100" cy="85" r="25" fill="#6b7280"/>
          
          {/* Cat ears peeking out of hood */}
          <path d="M85 70 L90 55 L95 70 Z" fill="#6b7280"/>
          <path d="M105 70 L110 55 L115 70 Z" fill="#6b7280"/>
          <path d="M87 68 L90 58 L93 68 Z" fill="#ec4899"/>
          <path d="M107 68 L110 58 L113 68 Z" fill="#ec4899"/>
          
          {/* Holographic visor - the key feature! */}
          <path d="M75 78 Q100 75 125 78 L125 88 Q100 91 75 88 Z" fill="url(#visorGradient)" opacity="0.9" stroke="#ffffff" strokeWidth="2"/>
          <path d="M75 78 Q100 75 125 78 L125 88 Q100 91 75 88 Z" fill="none" stroke="#00ff9f" strokeWidth="1" className="animate-pulse"/>
          
          {/* Visor reflection/glow effect */}
          <rect x="80" y="79" width="15" height="6" rx="3" fill="#ffffff" opacity="0.3"/>
          <rect x="105" y="79" width="15" height="6" rx="3" fill="#ffffff" opacity="0.3"/>
          
          {/* Cat nose (subtle, under visor) */}
          <path d="M97 90 L100 93 L103 90 Z" fill="#1f2937" opacity="0.6"/>
          
          {/* Hoodie strings */}
          <circle cx="95" cy="100" r="2" fill="#9ca3af"/>
          <circle cx="105" cy="100" r="2" fill="#9ca3af"/>
          
          {/* Arms/sleeves */}
          <ellipse cx="75" cy="115" rx="12" ry="20" fill="url(#hoodieGradient)" transform="rotate(-20 75 115)"/>
          <ellipse cx="125" cy="115" rx="12" ry="20" fill="url(#hoodieGradient)" transform="rotate(20 125 115)"/>
          
          {/* Tech details on sleeves */}
          <rect x="72" y="110" width="6" height="2" rx="1" fill="url(#techGlow)" opacity="0.8"/>
          <rect x="122" y="110" width="6" height="2" rx="1" fill="url(#techGlow)" opacity="0.8"/>
        </svg>

        {/* Learning/coding elements */}
        {animationPhase >= 1 && (
          <>
            {/* Holographic data streams */}
            <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 transition-all duration-1000 ${
              animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-xs font-mono text-cyan-400 animate-pulse whitespace-nowrap"
                  style={{
                    left: `${-40 + i * 15}px`,
                    top: `${i * 8}px`,
                    animationDelay: `${i * 300}ms`
                  }}
                >
                  {['class Learn:', 'def study():', 'import knowledge', 'while True:', '  learn()', 'return wisdom'][i]}
                </div>
              ))}
            </div>
            
            {/* Knowledge acquisition sparkles */}
            {animationPhase >= 2 && [...Array(10)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-ping"
                style={{
                  left: `${30 + Math.random() * 40}%`,
                  top: `${-20 + Math.random() * 40}%`,
                  animationDelay: `${i * 150}ms`
                }}
              />
            ))}
          </>
        )}

        {/* Enlightenment glow */}
        {animationPhase >= 3 && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 opacity-20 blur-2xl animate-pulse scale-150"></div>
        )}
      </div>

      {/* Brand reveal */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ${
        showBrand ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
              <svg viewBox="0 0 24 24" className="w-12 h-12 text-white">
                <path 
                  fill="currentColor" 
                  d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"
                />
              </svg>
            </div>
          </div>
          
          <div className="text-5xl font-bold text-white mb-3">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Menttor
            </span>
          </div>
          <div className="text-xl text-gray-300 font-medium">
            Level Up Your Skills
          </div>
        </div>
      </div>
    </div>
  );
};

export default CyberpunkCatAnimation;