'use client';

import React, { useState, useEffect } from 'react';
import { CameraOff, RefreshCw } from 'lucide-react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  showUrl?: boolean;
}

const SmartImage: React.FC<SmartImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallbackText = 'Image not available',
  showUrl = false
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [actualSrc, setActualSrc] = useState(src);

  // Helper function to fix common image URL issues
  const fixImageUrl = (url: string): string => {
    if (!url) return url;
    
    // Fix Wikimedia Commons URLs
    if (url.includes('commons.wikimedia.org') && url.includes('/wiki/File:')) {
      // For now, just return the original URL since Wikimedia has complex URL structures
      // In a production app, you'd want to use the Wikimedia API to get the actual image URL
      return url;
    }
    
    // Remove any timestamp parameters that might cause issues
    if (url.includes('?t=')) {
      return url.split('?t=')[0];
    }
    
    return url;
  };

  useEffect(() => {
    setImageState('loading');
    const fixedSrc = fixImageUrl(src);
    setActualSrc(fixedSrc);
  }, [src]);

  const handleImageLoad = () => {
    setImageState('loaded');
  };

  const handleImageError = () => {
    setImageState('error');
  };

  const retryImage = () => {
    setImageState('loading');
    // Add timestamp to bypass cache
    setActualSrc(`${src}${src.includes('?') ? '&' : '?'}t=${Date.now()}`);
  };

  if (imageState === 'error') {
    return (
      <div className="w-full aspect-video flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
        <CameraOff className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium text-center mb-2">{fallbackText}</p>
        {showUrl && src && (
          <p className="text-gray-400 text-xs text-center break-all mb-3 max-w-full">
            {src}
          </p>
        )}
        <button
          onClick={retryImage}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {imageState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm text-gray-500">Loading image...</span>
          </div>
        </div>
      )}
      <img
        src={actualSrc}
        alt={alt}
        className={`${className} ${imageState === 'loading' ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default SmartImage;