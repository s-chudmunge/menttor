"use client";

import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../config/config';

interface PromotionalImage {
  id: number;
  image_url: string;
  concept: string;
  model: string;
  quality: string;
  usage_count: number;
  last_used?: string;
  created_at: string;
  is_active: boolean;
}

interface PromotionalBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export default function PromotionalBackground({ className = "", children }: PromotionalBackgroundProps) {
  const [currentImage, setCurrentImage] = useState<PromotionalImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentImage = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/promotional-images/current`);
      const data = await response.json();
      
      if (data.success && data.image) {
        setCurrentImage(data.image);
        setError(null);
      } else {
        setError(data.error || 'No promotional images available');
      }
    } catch (err) {
      setError('Failed to load promotional image');
      console.error('Error fetching promotional image:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentImage();
    
    // Refresh image every 3 hours
    const interval = setInterval(() => {
      fetchCurrentImage();
    }, 3 * 60 * 60 * 1000); // 3 hours in milliseconds
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        {/* Fallback gradient background while loading */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-800" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400/10 rounded-full filter blur-3xl" />
        {children}
      </div>
    );
  }

  if (error || !currentImage) {
    return (
      <div className={`relative ${className}`}>
        {/* Fallback gradient background on error */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-800" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400/10 rounded-full filter blur-3xl" />
        {children}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* AI-Generated Promotional Image Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={currentImage.image_url}
          alt={`Promotional background: ${currentImage.concept}`}
          className="w-full h-full object-cover object-center"
          style={{ 
            filter: 'brightness(0.3) blur(1px)',
            transform: 'scale(1.05)' // Slight zoom to avoid edge artifacts
          }}
        />
        {/* Overlay for content readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/30 dark:from-black/60 dark:via-black/20 dark:to-black/50" />
        {/* Additional overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/20 to-white/60 dark:from-gray-900/80 dark:via-gray-900/20 dark:to-gray-900/60" />
      </div>
      
      {/* Floating decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full filter blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}