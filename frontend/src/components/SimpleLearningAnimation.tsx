"use client";

import React from 'react';

export default function SimpleLearningAnimation() {
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <svg 
        viewBox="0 0 800 500" 
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.15))' }}
      >
        {/* Background Glow */}
        <circle cx="400" cy="250" r="300" fill="url(#backgroundGlow)" opacity="0.1"/>
        
        {/* User Box (Left) */}
        <g>
          <rect x="50" y="180" width="120" height="140" rx="20" fill="url(#userBoxGradient)" 
                className="animate-pulse" style={{ animationDuration: '4s' }}/>
          <circle cx="110" cy="220" r="25" fill="white" opacity="0.9"/>
          <path d="M95 205h30a15 15 0 0 1 15 15v10a5 5 0 0 1-5 5h-50a5 5 0 0 1-5-5v-10a15 15 0 0 1 15-15z" 
                fill="url(#iconGradient)"/>
          <text x="110" y="280" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">User</text>
          <text x="110" y="300" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10">Learning Goal</text>
        </g>

        {/* Central Menttor Platform Box */}
        <g>
          <rect x="250" y="120" width="300" height="260" rx="25" fill="url(#platformGradient)" 
                className="animate-pulse" style={{ animationDuration: '5s' }}/>
          
          {/* Platform Header */}
          <text x="400" y="155" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">🎓 Menttor Platform</text>
          
          {/* Feature Boxes - Row 1 */}
          <rect x="270" y="170" width="110" height="35" rx="8" fill="rgba(255,255,255,0.15)"/>
          <text x="325" y="190" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Path Generation</text>
          
          <rect x="420" y="170" width="110" height="35" rx="8" fill="rgba(255,255,255,0.15)"/>
          <text x="475" y="190" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Skill Assessment</text>
          
          {/* Feature Boxes - Row 2 */}
          <rect x="270" y="220" width="110" height="35" rx="8" fill="rgba(255,255,255,0.15)"/>
          <text x="325" y="240" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Progress Tracking</text>
          
          <rect x="420" y="220" width="110" height="35" rx="8" fill="rgba(255,255,255,0.15)"/>
          <text x="475" y="240" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Adaptive Engine</text>
          
          {/* Feature Boxes - Row 3 */}
          <rect x="270" y="270" width="110" height="35" rx="8" fill="rgba(255,255,255,0.15)"/>
          <text x="325" y="290" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Content Curation</text>
          
          <rect x="420" y="270" width="110" height="35" rx="8" fill="rgba(255,255,255,0.15)"/>
          <text x="475" y="290" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">User Profiles</text>
          
          {/* Feature Boxes - Row 4 */}
          <rect x="270" y="320" width="260" height="35" rx="8" fill="rgba(255,255,255,0.2)"/>
          <text x="400" y="340" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">AI-Powered Personalization</text>
        </g>

        {/* Data Sources (Right) */}
        <g>
          {/* Database Source */}
          <rect x="620" y="140" width="80" height="80" rx="15" fill="url(#dataSource1)" 
                className="animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '3s' }}/>
          <circle cx="660" cy="170" r="15" fill="white" opacity="0.9"/>
          <rect x="652" y="162" width="16" height="16" rx="2" fill="url(#iconGradient)"/>
          <text x="660" y="200" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Knowledge</text>
          <text x="660" y="212" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="8">Database</text>
          
          {/* API Source */}
          <rect x="620" y="250" width="80" height="80" rx="15" fill="url(#dataSource2)" 
                className="animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }}/>
          <circle cx="660" cy="280" r="15" fill="white" opacity="0.9"/>
          <path d="M652 272l16 8-16 8v-6h-8v-4h8v-6z" fill="url(#iconGradient)"/>
          <text x="660" y="310" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">External</text>
          <text x="660" y="322" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="8">APIs</text>
          
          {/* AI Source */}
          <rect x="620" y="360" width="80" height="80" rx="15" fill="url(#dataSource3)" 
                className="animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '3s' }}/>
          <circle cx="660" cy="390" r="15" fill="white" opacity="0.9"/>
          <circle cx="660" cy="390" r="8" fill="none" stroke="url(#iconGradient)" strokeWidth="2"/>
          <circle cx="660" cy="390" r="3" fill="url(#iconGradient)"/>
          <text x="660" y="420" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">AI Models</text>
          <text x="660" y="432" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="8">Integration</text>
        </g>

        {/* Connection Lines with Animation */}
        <g stroke="url(#connectionGradient)" strokeWidth="3" fill="none" opacity="0.8">
          {/* User to Platform */}
          <path d="M 170 250 Q 210 250 250 250">
            <animate attributeName="stroke-dasharray" values="0,300;150,150;300,0;0,300" dur="4s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite"/>
          </path>
          
          {/* Platform to Data Sources */}
          <path d="M 550 200 Q 585 200 620 200">
            <animate attributeName="stroke-dasharray" values="0,200;100,100;200,0;0,200" dur="3s" repeatCount="indefinite" begin="1s"/>
            <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" begin="1s"/>
          </path>
          <path d="M 550 290 Q 585 290 620 290">
            <animate attributeName="stroke-dasharray" values="0,200;100,100;200,0;0,200" dur="3s" repeatCount="indefinite" begin="1.5s"/>
            <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" begin="1.5s"/>
          </path>
          <path d="M 550 340 Q 585 370 620 400">
            <animate attributeName="stroke-dasharray" values="0,200;100,100;200,0;0,200" dur="3s" repeatCount="indefinite" begin="2s"/>
            <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" begin="2s"/>
          </path>
        </g>

        {/* Data Flow Indicators */}
        <g>
          <circle cx="200" cy="240" r="4" fill="#10B981">
            <animate attributeName="cy" values="240;260;240" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="580" cy="190" r="3" fill="#F59E0B">
            <animate attributeName="cx" values="580;600;580" dur="2.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite"/>
          </circle>
        </g>

        {/* Gradient Definitions */}
        <defs>
          <radialGradient id="backgroundGlow">
            <stop offset="0%" style={{ stopColor: '#4F46E5', stopOpacity: 0.1 }}/>
            <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.05 }}/>
          </radialGradient>
          
          <linearGradient id="userBoxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }}/>
            <stop offset="100%" style={{ stopColor: '#1D4ED8', stopOpacity: 1 }}/>
          </linearGradient>
          
          <linearGradient id="platformGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#4F46E5', stopOpacity: 1 }}/>
            <stop offset="50%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }}/>
            <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }}/>
          </linearGradient>
          
          <linearGradient id="dataSource1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 1 }}/>
            <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }}/>
          </linearGradient>
          
          <linearGradient id="dataSource2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }}/>
            <stop offset="100%" style={{ stopColor: '#D97706', stopOpacity: 1 }}/>
          </linearGradient>
          
          <linearGradient id="dataSource3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#EF4444', stopOpacity: 1 }}/>
            <stop offset="100%" style={{ stopColor: '#DC2626', stopOpacity: 1 }}/>
          </linearGradient>
          
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#4F46E5', stopOpacity: 0.8 }}/>
            <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.6 }}/>
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