"use client";

import React, { useState, useEffect } from 'react';

interface PromotionalBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

// Static list of available background images for dark theme
const DARK_BACKGROUND_IMAGES = [
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

// Static list of available background images for light theme
const LIGHT_BACKGROUND_IMAGES = [
  '/bg-images/cat-bg-light-1.png',
  '/bg-images/cat-bg-light-2.png',
  '/bg-images/cat-bg-light-3.png',
  '/bg-images/cat-bg-light-4.png',
  '/bg-images/cat-bg-light-5.png',
  '/bg-images/cat-bg-light-6.png',
  '/bg-images/cat-bg-light-7.png',
  '/bg-images/cat-bg-light-8.png',
  '/bg-images/cat-bg-light-9.png',
  '/bg-images/cat-bg-light-10.png',
];

export default function PromotionalBackground({ className = "", children }: PromotionalBackgroundProps) {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const getCurrentImage = () => {
    // Get the appropriate image array based on theme
    const imageArray = currentTheme === 'light' ? LIGHT_BACKGROUND_IMAGES : DARK_BACKGROUND_IMAGES;
    
    // Rotate image based on day of year and hour for consistent but changing display
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000));
    const hour = now.getHours();
    const index = (dayOfYear + Math.floor(hour / 3)) % imageArray.length; // Change every 3 hours
    return imageArray[index];
  };

  useEffect(() => {
    // Detect browser theme preference
    const detectTheme = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    };

    // Set initial image when theme changes
    const updateImage = () => {
      const detectedTheme = detectTheme();
      setCurrentTheme(detectedTheme);
      const imageArray = detectedTheme === 'light' ? LIGHT_BACKGROUND_IMAGES : DARK_BACKGROUND_IMAGES;
      const currentImage = getCurrentImage();
      const newIndex = imageArray.indexOf(currentImage);
      setCurrentImageIndex(newIndex >= 0 ? newIndex : 0);
    };

    updateImage();
    setLoading(false);
    
    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      updateImage();
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    
    // Update image every 3 hours
    const interval = setInterval(updateImage, 3 * 60 * 60 * 1000);
    
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        {/* Fallback gradient background while loading - Mobile optimized */}
        <div className="absolute inset-0 bg-blue-50/60 dark:bg-gray-900" />
        <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-400/15 dark:bg-blue-400/10 rounded-full filter blur-2xl sm:blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-400/15 dark:bg-indigo-400/10 rounded-full filter blur-2xl sm:blur-3xl" />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }

  const imageArray = currentTheme === 'light' ? LIGHT_BACKGROUND_IMAGES : DARK_BACKGROUND_IMAGES;
  const currentImageSrc = imageArray[currentImageIndex];

  return (
    <div className={`relative ${className}`}>
      {/* Responsive Background Solution */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Mobile-optimized background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat sm:hidden"
          style={{ 
            backgroundImage: `url(${currentImageSrc})`,
            filter: currentTheme === 'light' ? 'brightness(0.7)' : 'brightness(0.3)',
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
            filter: currentTheme === 'light' ? 'brightness(0.7)' : 'brightness(0.3)',
            transform: 'scale(1.02)' // Minimal zoom to avoid edge artifacts
          }}
          onError={(e) => {
            // Fallback to first image if current image fails to load
            if (currentImageIndex !== 0) {
              setCurrentImageIndex(0);
            }
          }}
        />
        
        {/* Gradient overlays for content readability - optimized for theme */}
        <div className="absolute inset-0 bg-black/20 dark:bg-black/50" />
        <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/75" />
        
        {/* Mobile-specific overlay for better text readability */}
        <div className="absolute inset-0 bg-white/30 dark:bg-gray-900/20 sm:hidden" />
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