"use client";

import React from 'react';

export default function SimpleLearningAnimation() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Main Animation Container */}
      <svg 
        viewBox="0 0 400 300" 
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
      >
        {/* Background Circle */}
        <circle
          cx="200"
          cy="150"
          r="120"
          fill="url(#bgGradient)"
          className="animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        
        {/* Central Learning Hub */}
        <circle
          cx="200"
          cy="150"
          r="40"
          fill="url(#centralGradient)"
          className="animate-bounce"
          style={{ animationDuration: '3s' }}
        />
        
        {/* Menttor Logo Icon */}
        <g transform="translate(185, 135)">
          <rect width="30" height="30" rx="6" fill="white" opacity="0.9"/>
          <path 
            d="M8 6l-7 6 4 2.18v6L12 24l7-3.82v-6l2-1.09V18h2V10L8 6zm6.82 6L8 15.72 1.18 12 8 8.28 14.82 12zM13 18.99l-5 2.73-5-2.73v-3.72L8 18l5-2.73v3.72z" 
            fill="url(#logoGradient)" 
            transform="translate(4, 4) scale(0.7)"
          />
        </g>
        
        {/* Learning Nodes */}
        <g>
          {/* Node 1 - Top */}
          <circle
            cx="200"
            cy="80"
            r="18"
            fill="url(#node1Gradient)"
            className="animate-pulse"
            style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}
          />
          <text x="200" y="85" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">AI</text>
          
          {/* Node 2 - Right */}
          <circle
            cx="280"
            cy="150"
            r="18"
            fill="url(#node2Gradient)"
            className="animate-pulse"
            style={{ animationDelay: '1s', animationDuration: '2.5s' }}
          />
          <text x="280" y="155" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Learn</text>
          
          {/* Node 3 - Bottom */}
          <circle
            cx="200"
            cy="220"
            r="18"
            fill="url(#node3Gradient)"
            className="animate-pulse"
            style={{ animationDelay: '1.5s', animationDuration: '2.5s' }}
          />
          <text x="200" y="225" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Path</text>
          
          {/* Node 4 - Left */}
          <circle
            cx="120"
            cy="150"
            r="18"
            fill="url(#node4Gradient)"
            className="animate-pulse"
            style={{ animationDelay: '2s', animationDuration: '2.5s' }}
          />
          <text x="120" y="155" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Smart</text>
        </g>
        
        {/* Connection Lines */}
        <g stroke="url(#lineGradient)" strokeWidth="2" fill="none" opacity="0.7">
          <line x1="200" y1="110" x2="200" y2="98">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" begin="0s"/>
          </line>
          <line x1="240" y1="150" x2="262" y2="150">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" begin="0.75s"/>
          </line>
          <line x1="200" y1="190" x2="200" y2="202">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" begin="1.5s"/>
          </line>
          <line x1="160" y1="150" x2="138" y2="150">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" begin="2.25s"/>
          </line>
        </g>
        
        {/* Floating Particles */}
        <g>
          <circle cx="320" cy="100" r="3" fill="url(#particleGradient)" className="animate-bounce" style={{ animationDelay: '0s', animationDuration: '4s' }}/>
          <circle cx="80" cy="80" r="2" fill="url(#particleGradient)" className="animate-bounce" style={{ animationDelay: '1s', animationDuration: '3.5s' }}/>
          <circle cx="350" cy="200" r="2.5" fill="url(#particleGradient)" className="animate-bounce" style={{ animationDelay: '2s', animationDuration: '4.5s' }}/>
          <circle cx="50" cy="220" r="2" fill="url(#particleGradient)" className="animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }}/>
        </g>
        
        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#EBF4FF', stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: '#DBEAFE', stopOpacity: 0.2 }} />
          </linearGradient>
          
          <linearGradient id="centralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#4F46E5', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
          </linearGradient>
          
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#4F46E5', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
          </linearGradient>
          
          <linearGradient id="node1Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#1D4ED8', stopOpacity: 1 }} />
          </linearGradient>
          
          <linearGradient id="node2Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
          </linearGradient>
          
          <linearGradient id="node3Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#06B6D4', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#0891B2', stopOpacity: 1 }} />
          </linearGradient>
          
          <linearGradient id="node4Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
          </linearGradient>
          
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#4F46E5', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.4 }} />
          </linearGradient>
          
          <linearGradient id="particleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#F59E0B', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#EF4444', stopOpacity: 0.6 }} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}