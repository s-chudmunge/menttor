"use client";

import React from 'react';

export default function SimpleLearningAnimation() {
  return (
    <div className="relative w-full max-w-7xl mx-auto">
      <svg 
        viewBox="0 0 1000 600" 
        className="w-full h-auto min-h-[500px]"
        style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.15))' }}
      >
        {/* Background Glow */}
        <circle cx="500" cy="300" r="400" fill="url(#backgroundGlow)" opacity="0.1"/>
        
        {/* User Box (Left) */}
        <g>
          <rect x="80" y="220" width="150" height="160" rx="25" fill="url(#userBoxGradient)" 
                className="animate-pulse" style={{ animationDuration: '4s' }}/>
          <circle cx="155" cy="270" r="30" fill="white" opacity="0.9"/>
          {/* Standard User Icon */}
          <circle cx="155" cy="260" r="12" fill="url(#iconGradient)"/>
          <path d="M135 285 C135 275, 143 270, 155 270 C167 270, 175 275, 175 285" 
                fill="url(#iconGradient)" stroke="none"/>
          <text x="155" y="330" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">Learner</text>
          <text x="155" y="350" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="12">Professional Goals</text>
        </g>

        {/* Central Menttor Platform Box */}
        <g>
          <rect x="320" y="150" width="360" height="300" rx="30" fill="url(#platformGradient)" 
                className="animate-pulse" style={{ animationDuration: '5s' }}/>
          
          {/* Platform Header */}
          <text x="500" y="185" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">🧠 Menttor Platform</text>
          
          {/* Feature Boxes - Row 1 */}
          <rect x="340" y="210" width="130" height="40" rx="10" fill="rgba(255,255,255,0.15)"/>
          <text x="405" y="233" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">📊 Elo Ratings</text>
          
          <rect x="530" y="210" width="130" height="40" rx="10" fill="rgba(255,255,255,0.15)"/>
          <text x="595" y="233" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">🎯 Quest Map</text>
          
          {/* Feature Boxes - Row 2 */}
          <rect x="340" y="270" width="130" height="40" rx="10" fill="rgba(255,255,255,0.15)"/>
          <text x="405" y="293" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">⚡ XP System</text>
          
          <rect x="530" y="270" width="130" height="40" rx="10" fill="rgba(255,255,255,0.15)"/>
          <text x="595" y="293" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">🔁 Spaced Repetition</text>
          
          {/* Feature Boxes - Row 3 */}
          <rect x="340" y="330" width="130" height="40" rx="10" fill="rgba(255,255,255,0.15)"/>
          <text x="405" y="353" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">🔥 Streak System</text>
          
          <rect x="530" y="330" width="130" height="40" rx="10" fill="rgba(255,255,255,0.15)"/>
          <text x="595" y="353" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">🚀 Focus Mode</text>
          
          {/* Feature Boxes - Row 4 */}
          <rect x="340" y="390" width="320" height="40" rx="10" fill="rgba(255,255,255,0.2)"/>
          <text x="500" y="413" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">🧠 Behavioral Psychology</text>
        </g>

        {/* Data Sources (Right) */}
        <g>
          {/* Vertex AI Source */}
          <rect x="770" y="180" width="100" height="100" rx="20" fill="url(#dataSource1)" 
                className="animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '3s' }}/>
          <circle cx="820" cy="215" r="18" fill="white" opacity="0.9"/>
          <rect x="808" y="203" width="24" height="24" rx="3" fill="url(#iconGradient)"/>
          <text x="820" y="250" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">🧠 Vertex AI</text>
          <text x="820" y="265" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10">ML Models</text>
          
          {/* Analytics Source */}
          <rect x="770" y="300" width="100" height="100" rx="20" fill="url(#dataSource2)" 
                className="animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }}/>
          <circle cx="820" cy="335" r="18" fill="white" opacity="0.9"/>
          <path d="M808 325l24 10-24 10v-8h-12v-4h12v-8z" fill="url(#iconGradient)"/>
          <text x="820" y="370" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">📊 Analytics</text>
          <text x="820" y="385" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10">Tracking</text>
          
          {/* Performance Source */}
          <rect x="770" y="420" width="100" height="100" rx="20" fill="url(#dataSource3)" 
                className="animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '3s' }}/>
          <circle cx="820" cy="455" r="18" fill="white" opacity="0.9"/>
          <circle cx="820" cy="455" r="12" fill="none" stroke="url(#iconGradient)" strokeWidth="3"/>
          <circle cx="820" cy="455" r="4" fill="url(#iconGradient)"/>
          <text x="820" y="490" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">⚡ Performance</text>
          <text x="820" y="505" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10">Optimization</text>
        </g>

        {/* Connection Lines - Clearly Visible */}
        <g stroke="url(#connectionGradient)" strokeWidth="3" fill="none" opacity="0.9" strokeLinecap="round">
          {/* User to Platform - Main connection */}
          <path d="M 230 300 Q 275 300 320 300" strokeWidth="4">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite"/>
          </path>
          
          {/* Platform to Vertex AI Source */}
          <path d="M 680 230 Q 725 230 770 230" strokeWidth="3">
            <animate attributeName="opacity" values="0.6;0.9;0.6" dur="4s" repeatCount="indefinite" begin="0.5s"/>
          </path>
          
          {/* Platform to Analytics Source */}
          <path d="M 680 350 Q 725 350 770 350" strokeWidth="3">
            <animate attributeName="opacity" values="0.6;0.9;0.6" dur="4s" repeatCount="indefinite" begin="1s"/>
          </path>
          
          {/* Platform to Performance Source */}
          <path d="M 680 420 Q 725 435 770 470" strokeWidth="3">
            <animate attributeName="opacity" values="0.6;0.9;0.6" dur="4s" repeatCount="indefinite" begin="1.5s"/>
          </path>
          
          {/* Additional connecting lines for better flow visualization */}
          <path d="M 680 300 Q 710 280 740 260" stroke="url(#connectionGradient)" strokeWidth="2" opacity="0.7">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="5s" repeatCount="indefinite" begin="0.5s"/>
          </path>
          <path d="M 680 300 Q 710 380 740 460" stroke="url(#connectionGradient)" strokeWidth="2" opacity="0.7">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="5s" repeatCount="indefinite" begin="2.5s"/>
          </path>
        </g>

        {/* Data Flow Indicators */}
        <g>
          <circle cx="275" cy="295" r="5" fill="#10B981">
            <animate attributeName="cx" values="275;295;275" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="725" cy="225" r="4" fill="#F59E0B">
            <animate attributeName="cx" values="725;745;725" dur="2.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="725" cy="345" r="4" fill="#8B5CF6">
            <animate attributeName="cx" values="725;745;725" dur="3s" repeatCount="indefinite" begin="1s"/>
            <animate attributeName="opacity" values="1;0.3;1" dur="3s" repeatCount="indefinite" begin="1s"/>
          </circle>
          <circle cx="725" cy="450" r="4" fill="#EF4444">
            <animate attributeName="cx" values="725;745;725" dur="2.8s" repeatCount="indefinite" begin="0.5s"/>
            <animate attributeName="opacity" values="1;0.3;1" dur="2.8s" repeatCount="indefinite" begin="0.5s"/>
          </circle>
        </g>

        {/* Gradient Definitions */}
        <defs>
          <radialGradient id="backgroundGlow">
            <stop offset="0%" style={{ stopColor: '#4F46E5', stopOpacity: 0.1 }}/>
            <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.05 }}/>
          </radialGradient>
          
          <linearGradient id="userBoxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1E293B', stopOpacity: 0.9 }}/>
            <stop offset="100%" style={{ stopColor: '#334155', stopOpacity: 0.9 }}/>
          </linearGradient>
          
          <linearGradient id="platformGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1E293B', stopOpacity: 0.9 }}/>
            <stop offset="50%" style={{ stopColor: '#334155', stopOpacity: 0.9 }}/>
            <stop offset="100%" style={{ stopColor: '#475569', stopOpacity: 0.9 }}/>
          </linearGradient>
          
          <linearGradient id="dataSource1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1E293B', stopOpacity: 0.9 }}/>
            <stop offset="100%" style={{ stopColor: '#334155', stopOpacity: 0.9 }}/>
          </linearGradient>
          
          <linearGradient id="dataSource2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1E293B', stopOpacity: 0.9 }}/>
            <stop offset="100%" style={{ stopColor: '#334155', stopOpacity: 0.9 }}/>
          </linearGradient>
          
          <linearGradient id="dataSource3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1E293B', stopOpacity: 0.9 }}/>
            <stop offset="100%" style={{ stopColor: '#334155', stopOpacity: 0.9 }}/>
          </linearGradient>
          
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 1 }}/>
            <stop offset="50%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.9 }}/>
            <stop offset="100%" style={{ stopColor: '#A855F7', stopOpacity: 0.8 }}/>
          </linearGradient>
          
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#4F46E5', stopOpacity: 1 }}/>
            <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }}/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}