import React from 'react';

const SpiralMark = ({ size = 50 }: { size?: number }) => (
  <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" style={{ height: `${size}px`, width: `${size}px` }}>
    <defs>
      {/* Enhanced gradient matching dark theme */}
      <linearGradient id="spiralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: '#60a5fa', stopOpacity: 1}} />
        <stop offset="30%" style={{stopColor: '#3b82f6', stopOpacity: 1}} />
        <stop offset="70%" style={{stopColor: '#1d4ed8', stopOpacity: 1}} />
        <stop offset="100%" style={{stopColor: '#1e1b4b', stopOpacity: 1}} />
      </linearGradient>
      
      {/* Secondary gradient for accents */}
      <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{stopColor: '#8b5cf6', stopOpacity: 1}} />
        <stop offset="100%" style={{stopColor: '#3b82f6', stopOpacity: 1}} />
      </linearGradient>

      {/* Enhanced multi-layer glow */}
      <filter id="enhanced-glow">
        <feGaussianBlur stdDeviation="2" result="innerGlow"/>
        <feGaussianBlur stdDeviation="4" result="outerGlow"/>
        <feMerge>
          <feMergeNode in="outerGlow"/>
          <feMergeNode in="innerGlow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      {/* Subtle glow for accents */}
      <filter id="accent-glow">
        <feGaussianBlur stdDeviation="1.5" result="accentBlur"/>
        <feMerge>
          <feMergeNode in="accentBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <style>
      {`
        @keyframes fractal-zoom {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes quantum-flicker {
          0%, 100% { opacity: 1; transform: translateX(0); }
          25% { opacity: 0.7; transform: translateX(-0.5px); }
          50% { opacity: 0.3; transform: translateX(0.5px); }
          75% { opacity: 0.8; transform: translateX(-0.2px); }
        }
        @keyframes spiral-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .fractal-element {
          animation: fractal-zoom 4s ease-in-out infinite;
        }
        .quantum-element {
          animation: quantum-flicker 3s ease-in-out infinite;
        }
        .outer-ring {
          animation: spiral-rotate 30s linear infinite reverse;
          transform-origin: center;
        }
      `}
    </style>

    <g className="fractal-element">
      <path d="M 25 5 
               Q 40 10, 42 25
               Q 40 40, 25 42
               Q 10 40, 8 25
               Q 10 15, 18 13
               Q 28 15, 30 25
               Q 28 32, 22 34
               Q 18 32, 17 28
               Q 18 25, 21 24
               Q 24 25, 25 27" 
            fill="none" 
            stroke="url(#spiralGradient)" 
            strokeWidth="2.8" 
            strokeLinecap="round"
            filter="url(#enhanced-glow)"
            className="quantum-element"/>
      <circle cx="25" cy="27" r="2.5" fill="url(#spiralGradient)" className="quantum-element"/>
      <g opacity="0.6">
        <line x1="15" y1="12" x2="18" y2="15" stroke="url(#accentGradient)" strokeWidth="1"/>
        <line x1="35" y1="12" x2="32" y2="15" stroke="url(#accentGradient)" strokeWidth="1"/>
        <circle cx="15" cy="12" r="1.2" fill="url(#accentGradient)"/>
        <circle cx="35" cy="12" r="1.2" fill="url(#accentGradient)"/>
      </g>
    </g>
  </svg>
);

export default SpiralMark;
