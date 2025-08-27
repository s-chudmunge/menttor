"use client";

import React from 'react';

export default function SimpleLearningAnimation() {
  return (
    <div className="relative w-full max-w-6xl mx-auto p-4">
      <svg 
        viewBox="0 0 1000 600" 
        className="w-full h-auto min-h-[600px]"
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
          <rect x="80" y="220" width="150" height="160" rx="20" fill="url(#glassCard)" 
                stroke="url(#cardBorder)" strokeWidth="1"
                className="animate-pulse" style={{ animationDuration: '4s' }}/>
          <circle cx="155" cy="270" r="35" fill="url(#iconBackground)" stroke="url(#cardBorder)" strokeWidth="1"/>
          {/* Modern User Icon */}
          <circle cx="155" cy="260" r="15" fill="white"/>
          <path d="M130 290 C130 278, 140 272, 155 272 C170 272, 180 278, 180 290" 
                fill="white" stroke="none"/>
          <text x="155" y="330" textAnchor="middle" fill="white" fontSize="16" fontWeight="600">User</text>
          <text x="155" y="350" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="12">Learner</text>
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
          <rect x="320" y="190" width="110" height="50" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="375" y="210" textAnchor="middle" fill="white" fontSize="12" fontWeight="500">Cost Tracking</text>
          <text x="375" y="225" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">Monitor Usage</text>
          
          <rect x="445" y="190" width="110" height="50" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="500" y="210" textAnchor="middle" fill="white" fontSize="12" fontWeight="500">Elo Ratings</text>
          <text x="500" y="225" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">Skill Assessment</text>
          
          <rect x="570" y="190" width="110" height="50" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="625" y="210" textAnchor="middle" fill="white" fontSize="12" fontWeight="500">Quest Map</text>
          <text x="625" y="225" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">Learning Path</text>
          
          {/* Row 2 */}
          <rect x="320" y="255" width="110" height="50" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="375" y="275" textAnchor="middle" fill="white" fontSize="12" fontWeight="500">Guardrails</text>
          <text x="375" y="290" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">Safety First</text>
          
          <rect x="445" y="255" width="110" height="50" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="500" y="275" textAnchor="middle" fill="white" fontSize="12" fontWeight="500">XP System</text>
          <text x="500" y="290" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">Gamification</text>
          
          <rect x="570" y="255" width="110" height="50" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="625" y="275" textAnchor="middle" fill="white" fontSize="12" fontWeight="500">Model Access</text>
          <text x="625" y="290" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">AI Integration</text>
          
          {/* Row 3 */}
          <rect x="320" y="320" width="110" height="50" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="375" y="340" textAnchor="middle" fill="white" fontSize="12" fontWeight="500">Budgets</text>
          <text x="375" y="355" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">Cost Control</text>
          
          <rect x="445" y="320" width="110" height="50" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="500" y="340" textAnchor="middle" fill="white" fontSize="12" fontWeight="500">Focus Mode</text>
          <text x="500" y="355" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">Deep Learning</text>
          
          <rect x="570" y="320" width="110" height="50" rx="12" fill="url(#featureCard)" stroke="url(#featureBorder)" strokeWidth="0.5"/>
          <text x="625" y="340" textAnchor="middle" fill="white" fontSize="12" fontWeight="500">Observability</text>
          <text x="625" y="355" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">Analytics</text>
          
          {/* Bottom Feature - Full Width */}
          <rect x="320" y="385" width="360" height="50" rx="12" fill="url(#premiumFeature)" stroke="url(#cardBorder)" strokeWidth="1"/>
          <text x="500" y="405" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">Behavioral Psychology</text>
          <text x="500" y="420" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="12">Advanced Learning Optimization</text>
        </g>

        {/* Learning Outcomes (Right) */}
        <g>
          {/* Build Real World Skills */}
          <rect x="770" y="150" width="150" height="80" rx="16" fill="url(#glassCard)" 
                stroke="url(#cardBorder)" strokeWidth="1"
                className="animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '3s' }}/>
          <circle cx="820" cy="175" r="15" fill="url(#iconBackground)"/>
          <text x="820" y="180" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">🎯</text>
          <text x="845" y="180" fill="white" fontSize="12" fontWeight="600">Build Real World</text>
          <text x="845" y="195" fill="white" fontSize="12" fontWeight="600">Skills</text>
          <text x="845" y="210" fill="rgba(255,255,255,0.7)" fontSize="10">From Best Curated</text>
          <text x="845" y="222" fill="rgba(255,255,255,0.7)" fontSize="10">Roadmaps</text>
          
          {/* Build Projects */}
          <rect x="770" y="250" width="150" height="80" rx="16" fill="url(#glassCard)" 
                stroke="url(#cardBorder)" strokeWidth="1"
                className="animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }}/>
          <circle cx="820" cy="275" r="15" fill="url(#iconBackground)"/>
          <text x="820" y="280" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">🚀</text>
          <text x="845" y="280" fill="white" fontSize="12" fontWeight="600">Build Projects</text>
          <text x="845" y="300" fill="rgba(255,255,255,0.7)" fontSize="10">Hands-on Experience</text>
          
          {/* Industry Ready */}
          <rect x="770" y="350" width="150" height="80" rx="16" fill="url(#glassCard)" 
                stroke="url(#cardBorder)" strokeWidth="1"
                className="animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '3s' }}/>
          <circle cx="820" cy="375" r="15" fill="url(#iconBackground)"/>
          <text x="820" y="380" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">💼</text>
          <text x="845" y="380" fill="white" fontSize="12" fontWeight="600">Industry Ready</text>
          <text x="845" y="400" fill="rgba(255,255,255,0.7)" fontSize="10">Professional Skills</text>
        </g>

        {/* Modern Connection Lines with Glow Effect */}
        <g stroke="url(#connectionGradient)" strokeWidth="2" fill="none" opacity="0.8" strokeLinecap="round">
          {/* User to Platform */}
          <path d="M 230 300 Q 265 300 300 300" strokeWidth="3">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="strokeWidth" values="2;4;2" dur="3s" repeatCount="indefinite"/>
          </path>
          
          {/* Platform to Real World Skills */}
          <path d="M 700 190 Q 735 190 770 190" strokeWidth="2">
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="4s" repeatCount="indefinite" begin="0.5s"/>
          </path>
          
          {/* Platform to Build Projects */}
          <path d="M 700 290 Q 735 290 770 290" strokeWidth="2">
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="4s" repeatCount="indefinite" begin="1s"/>
          </path>
          
          {/* Platform to Industry Ready */}
          <path d="M 700 390 Q 735 390 770 390" strokeWidth="2">
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="4s" repeatCount="indefinite" begin="1.5s"/>
          </path>
        </g>

        {/* Floating Data Particles */}
        <g>
          <circle cx="265" cy="295" r="3" fill="#8B5CF6" opacity="0.8">
            <animate attributeName="cx" values="265;280;265" dur="2.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="735" cy="185" r="2.5" fill="#A855F7" opacity="0.7">
            <animate attributeName="cx" values="735;750;735" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3s" repeatCount="indefinite"/>
          </circle>
          <circle cx="735" cy="285" r="2.5" fill="#C084FC" opacity="0.7">
            <animate attributeName="cx" values="735;750;735" dur="2.8s" repeatCount="indefinite" begin="1s"/>
            <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.8s" repeatCount="indefinite" begin="1s"/>
          </circle>
          <circle cx="735" cy="385" r="2.5" fill="#DDD6FE" opacity="0.7">
            <animate attributeName="cx" values="735;750;735" dur="3.2s" repeatCount="indefinite" begin="0.5s"/>
            <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3.2s" repeatCount="indefinite" begin="0.5s"/>
          </circle>
        </g>
      </svg>
    </div>
  );
}