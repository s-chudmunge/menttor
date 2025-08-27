"use client";

import React from 'react';

export default function SimpleLearningAnimation() {
  return (
    <div className="relative w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6">
      <svg 
        viewBox="0 0 1000 600" 
        className="w-full h-auto min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px]"
        preserveAspectRatio="xMidYMid meet"
        style={{ maxHeight: '800px' }}
      >
        {/* Background Grid Pattern */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(139, 92, 246, 0.1)" strokeWidth="1"/>
          </pattern>
          
          {/* Background Glows */}
          <radialGradient id="backgroundGlow1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0"/>
          </radialGradient>
          
          <radialGradient id="backgroundGlow2">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0"/>
          </radialGradient>
          
          <radialGradient id="backgroundGlow3">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0"/>
          </radialGradient>
          
          {/* Glass Card Effect */}
          <linearGradient id="glassCard" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" stopOpacity="1"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" stopOpacity="1"/>
          </linearGradient>
          
          {/* Feature Card Gradient */}
          <linearGradient id="featureCard" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.2)" stopOpacity="1"/>
            <stop offset="100%" stopColor="rgba(139,92,246,0.1)" stopOpacity="1"/>
          </linearGradient>
          
          {/* Premium Feature Gradient */}
          <linearGradient id="premiumFeature" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.3)" stopOpacity="1"/>
            <stop offset="50%" stopColor="rgba(168,85,247,0.25)" stopOpacity="1"/>
            <stop offset="100%" stopColor="rgba(192,132,252,0.2)" stopOpacity="1"/>
          </linearGradient>
          
          {/* Icon Background */}
          <radialGradient id="iconBackground">
            <stop offset="0%" stopColor="rgba(139,92,246,0.8)" stopOpacity="1"/>
            <stop offset="100%" stopColor="rgba(139,92,246,0.4)" stopOpacity="1"/>
          </radialGradient>
          
          {/* Border Gradients */}
          <linearGradient id="cardBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.5)" stopOpacity="1"/>
            <stop offset="100%" stopColor="rgba(168,85,247,0.3)" stopOpacity="1"/>
          </linearGradient>
          
          <linearGradient id="featureBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.3)" stopOpacity="1"/>
            <stop offset="100%" stopColor="rgba(139,92,246,0.1)" stopOpacity="1"/>
          </linearGradient>
          
          {/* Connection Gradient */}
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.9"/>
            <stop offset="50%" stopColor="#A855F7" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0.7"/>
          </linearGradient>
        </defs>
        
        {/* Subtle background */}
        <rect width="100%" height="100%" fill="rgba(139, 92, 246, 0.02)"/>
        
        {/* Minimal Background Glows */}
        <circle cx="200" cy="150" r="100" fill="url(#backgroundGlow1)" opacity="0.1"/>
        <circle cx="800" cy="450" r="100" fill="url(#backgroundGlow2)" opacity="0.08"/>
        <circle cx="500" cy="300" r="150" fill="url(#backgroundGlow3)" opacity="0.06"/>
        
        {/* User Box (Left) */}
        <g>
          <rect x="50" y="220" width="180" height="160" rx="20" fill="url(#glassCard)" 
                stroke="url(#cardBorder)" strokeWidth="1"
                className="animate-pulse" style={{ animationDuration: '4s' }}/>
          <circle cx="140" cy="270" r="35" fill="url(#iconBackground)" stroke="url(#cardBorder)" strokeWidth="1"/>
          {/* Modern User Icon */}
          <circle cx="140" cy="260" r="15" fill="white"/>
          <path d="M115 290 C115 278, 125 272, 140 272 C155 272, 165 278, 165 290" 
                fill="white" stroke="none"/>
          <text x="140" y="330" textAnchor="middle" fill="white" fontSize="16" fontWeight="600">User</text>
          <text x="140" y="350" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="12">Learner</text>
        </g>

        {/* Central Menttor Platform Box */}
        <g>
          <rect x="300" y="120" width="400" height="360" rx="25" fill="url(#glassCard)" 
                stroke="url(#cardBorder)" strokeWidth="1"
                className="animate-pulse" style={{ animationDuration: '5s' }}/>
          
          {/* Platform Header with Icon */}
          <circle cx="430" cy="155" r="20" fill="url(#iconBackground)"/>
          <rect x="418" y="143" width="24" height="24" rx="4" fill="white"/>
          <text x="460" y="160" fill="white" fontSize="20" fontWeight="600">Menttor</text>
          
          {/* Feature Grid - 3x3 Layout */}
          {/* Row 1 */}
          <rect x="320" y="190" width="110" height="55" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="375" y="212" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Cost Tracking</text>
          <text x="375" y="228" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11">Monitor Usage</text>
          
          <rect x="445" y="190" width="110" height="55" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="500" y="212" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Elo Ratings</text>
          <text x="500" y="228" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11">Skill Assessment</text>
          
          <rect x="570" y="190" width="110" height="55" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="625" y="212" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Quest Map</text>
          <text x="625" y="228" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11">Learning Path</text>
          
          {/* Row 2 */}
          <rect x="320" y="260" width="110" height="55" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="375" y="282" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Guardrails</text>
          <text x="375" y="298" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11">Safety First</text>
          
          <rect x="445" y="260" width="110" height="55" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="500" y="282" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">XP System</text>
          <text x="500" y="298" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11">Gamification</text>
          
          <rect x="570" y="260" width="110" height="55" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="625" y="282" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Model Access</text>
          <text x="625" y="298" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11">AI Integration</text>
          
          {/* Row 3 */}
          <rect x="320" y="330" width="110" height="55" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="375" y="352" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Budgets</text>
          <text x="375" y="368" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11">Cost Control</text>
          
          <rect x="445" y="330" width="110" height="55" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="500" y="352" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Focus Mode</text>
          <text x="500" y="368" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11">Deep Learning</text>
          
          <rect x="570" y="330" width="110" height="55" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="625" y="352" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Observability</text>
          <text x="625" y="368" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11">Analytics</text>
          
          {/* Bottom Feature - Full Width */}
          <rect x="320" y="400" width="360" height="60" rx="12" fill="url(#premiumFeature)" stroke="url(#cardBorder)" strokeWidth="1"/>
          <text x="500" y="425" textAnchor="middle" fill="white" fontSize="15" fontWeight="600">Behavioral Psychology</text>
          <text x="500" y="445" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="12">Advanced Learning Optimization</text>
        </g>

        {/* Learning Outcomes (Right) */}
        <g>
          {/* Build Real World Skills */}
          <rect x="750" y="140" width="190" height="90" rx="16" fill="url(#glassCard)" 
                stroke="url(#cardBorder)" strokeWidth="1"
                className="animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '3s' }}/>
          <circle cx="775" cy="170" r="15" fill="url(#iconBackground)"/>
          <text x="775" y="175" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">🎯</text>
          <text x="800" y="170" fill="white" fontSize="13" fontWeight="600">Build Real World Skills</text>
          <text x="800" y="188" fill="rgba(255,255,255,0.8)" fontSize="11">From Best Curated Roadmaps</text>
          <text x="800" y="205" fill="rgba(255,255,255,0.6)" fontSize="10">Expert-designed learning paths</text>
          
          {/* Build Projects */}
          <rect x="750" y="250" width="190" height="90" rx="16" fill="url(#glassCard)" 
                stroke="url(#cardBorder)" strokeWidth="1"
                className="animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }}/>
          <circle cx="775" cy="280" r="15" fill="url(#iconBackground)"/>
          <text x="775" y="285" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">🚀</text>
          <text x="800" y="280" fill="white" fontSize="13" fontWeight="600">Build Projects</text>
          <text x="800" y="298" fill="rgba(255,255,255,0.8)" fontSize="11">Hands-on Experience</text>
          <text x="800" y="315" fill="rgba(255,255,255,0.6)" fontSize="10">Real-world applications</text>
          
          {/* Industry Ready */}
          <rect x="750" y="360" width="190" height="90" rx="16" fill="url(#glassCard)" 
                stroke="url(#cardBorder)" strokeWidth="1"
                className="animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '3s' }}/>
          <circle cx="775" cy="390" r="15" fill="url(#iconBackground)"/>
          <text x="775" y="395" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">💼</text>
          <text x="800" y="390" fill="white" fontSize="13" fontWeight="600">Industry Ready</text>
          <text x="800" y="408" fill="rgba(255,255,255,0.8)" fontSize="11">Professional Skills</text>
          <text x="800" y="425" fill="rgba(255,255,255,0.6)" fontSize="10">Career-focused training</text>
        </g>


        {/* Enhanced Connecting Lines */}
        <g>
          {/* Solid base connections */}
          <g stroke="#8B5CF6" strokeWidth="3" fill="none" opacity="0.8" strokeLinecap="round">
            {/* User to Platform - Main connection */}
            <path d="M 230 300 Q 265 285 300 300" strokeWidth="4" opacity="0.9">
              <animate attributeName="stroke-dasharray" values="0,1000;20,980;0,1000" dur="3s" repeatCount="indefinite"/>
            </path>
            
            {/* Platform to Skills - Top connection */}
            <path d="M 700 185 Q 720 175 750 185" strokeWidth="3" opacity="0.85">
              <animate attributeName="stroke-dasharray" values="0,1000;15,985;0,1000" dur="4s" repeatCount="indefinite" begin="0.5s"/>
            </path>
            
            {/* Platform to Projects - Middle connection */}
            <path d="M 700 295 Q 720 285 750 295" strokeWidth="3" opacity="0.85">
              <animate attributeName="stroke-dasharray" values="0,1000;15,985;0,1000" dur="4s" repeatCount="indefinite" begin="1s"/>
            </path>
            
            {/* Platform to Industry - Bottom connection */}
            <path d="M 700 405 Q 720 415 750 405" strokeWidth="3" opacity="0.85">
              <animate attributeName="stroke-dasharray" values="0,1000;15,985;0,1000" dur="4s" repeatCount="indefinite" begin="1.5s"/>
            </path>
          </g>
          
          {/* Data flow indicators */}
          <g>
            {/* Moving dots along connections */}
            <circle r="4" fill="#8B5CF6" opacity="0.9">
              <animateMotion dur="3s" repeatCount="indefinite" path="M 230 300 Q 265 285 300 300"/>
            </circle>
            <circle r="3" fill="#A855F7" opacity="0.8">
              <animateMotion dur="4s" repeatCount="indefinite" begin="0.5s" path="M 700 185 Q 720 175 750 185"/>
            </circle>
            <circle r="3" fill="#C084FC" opacity="0.8">
              <animateMotion dur="4s" repeatCount="indefinite" begin="1s" path="M 700 295 Q 720 285 750 295"/>
            </circle>
            <circle r="3" fill="#DDD6FE" opacity="0.8">
              <animateMotion dur="4s" repeatCount="indefinite" begin="1.5s" path="M 700 405 Q 720 415 750 405"/>
            </circle>
          </g>
        </g>
      </svg>
    </div>
  );
}