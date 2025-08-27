"use client";

import React, { useState, useEffect } from 'react';

interface PromotionalBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

// Static list of available background images
const BACKGROUND_IMAGES = [
  '/bg-images/cat-bg-1.png',
  '/bg-images/cat-bg-2.png',
  '/bg-images/cat-bg-3.png',
  '/bg-images/cat-bg-4.png',
  '/bg-images/cat-bg-5.png',
  '/bg-images/cat-bg-6.png',
  '/bg-images/cat-bg-7.png',
  '/bg-images/cat-bg-8.png',
  '/bg-images/cat-bg-9.png',
  '/bg-images/cat-bg-10.png',
  '/bg-images/cat-bg-11.png',
  '/bg-images/cat-bg-12.png',
];

export default function PromotionalBackground({ className = "", children }: PromotionalBackgroundProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const getCurrentImage = () => {
    // Rotate image based on day of year and hour for consistent but changing display
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000));
    const hour = now.getHours();
    const index = (dayOfYear + Math.floor(hour / 3)) % BACKGROUND_IMAGES.length; // Change every 3 hours
    return BACKGROUND_IMAGES[index];
  };

  useEffect(() => {
    // Set initial image
    const initialIndex = BACKGROUND_IMAGES.indexOf(getCurrentImage());
    setCurrentImageIndex(initialIndex >= 0 ? initialIndex : 0);
    setLoading(false);
    
    // Update image every 3 hours
    const interval = setInterval(() => {
      const newIndex = BACKGROUND_IMAGES.indexOf(getCurrentImage());
      setCurrentImageIndex(newIndex >= 0 ? newIndex : 0);
    }, 3 * 60 * 60 * 1000); // 3 hours in milliseconds
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        {/* Fallback gradient background while loading - Mobile optimized */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/60 dark:from-gray-900 dark:via-blue-900/25 dark:to-gray-800" />
        <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-400/15 dark:bg-blue-400/10 rounded-full filter blur-2xl sm:blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-400/15 dark:bg-indigo-400/10 rounded-full filter blur-2xl sm:blur-3xl" />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }

  const currentImageSrc = BACKGROUND_IMAGES[currentImageIndex];

  return (
    <div className={`relative ${className}`}>
      {/* Responsive Background Solution */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Mobile-optimized background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat sm:hidden"
          style={{ 
            backgroundImage: `url(${currentImageSrc})`,
            filter: 'brightness(0.3) blur(1px)',
            backgroundPosition: 'center center',
            backgroundSize: 'cover'
          }}
        />
        
        {/* Desktop background with object-fit */}
        <img
          src={currentImageSrc}
          alt={`Promotional background featuring tech cat mascot - Image ${currentImageIndex + 1}`}
          className="hidden sm:block w-full h-full object-cover object-center min-h-full min-w-full"
          style={{ 
            filter: 'brightness(0.3) blur(1px)',
            transform: 'scale(1.02)' // Minimal zoom to avoid edge artifacts
          }}
          onError={(e) => {
            // Fallback to first image if current image fails to load
            if (currentImageIndex !== 0) {
              setCurrentImageIndex(0);
            }
          }}
        />
        
        {/* Gradient overlays for content readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/10 to-black/30 dark:from-black/50 dark:via-black/15 dark:to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/30 to-white/60 dark:from-gray-900/75 dark:via-gray-900/15 dark:to-gray-900/50" />
        
        {/* Mobile-specific overlay for better text readability */}
        <div className="absolute inset-0 bg-white/20 dark:bg-gray-900/20 sm:hidden" />
      </div>
      
      {/* Floating decorative elements - Enhanced for mobile */}
      <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-400/25 dark:bg-blue-400/15 rounded-full filter blur-2xl sm:blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-400/25 dark:bg-indigo-400/15 rounded-full filter blur-2xl sm:blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}