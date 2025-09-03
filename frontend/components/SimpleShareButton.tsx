'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, MessageCircle } from 'lucide-react';

interface SimpleShareButtonProps {
  title: string;
  text?: string;
  url: string;
  className?: string;
  variant?: 'button' | 'icon';
}

const SimpleShareButton: React.FC<SimpleShareButtonProps> = ({ 
  title, 
  text, 
  url, 
  className = '',
  variant = 'button'
}) => {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleShare = async () => {
    // Try Web Share API first (works on mobile and supported browsers)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        // User cancelled or error, show options
      }
    }
    
    // Show share options for desktop
    setShowOptions(true);
  };

  const shareToWhatsApp = () => {
    const shareText = `${text || title}\n\n${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
    setShowOptions(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShowOptions(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const buttonContent = variant === 'icon' ? (
    <Share2 className="w-4 h-4" />
  ) : (
    <>
      <Share2 className="w-4 h-4" />
      <span className="hidden sm:inline">Share</span>
    </>
  );

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleShare}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
          variant === 'icon' 
            ? 'p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
        }`}
        title={`Share ${title}`}
      >
        {copied ? <Check className="w-4 h-4" /> : buttonContent}
        {copied && variant !== 'icon' && <span className="hidden sm:inline">Copied!</span>}
      </button>

      {/* Share options for desktop */}
      {showOptions && (
        <>
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
            <div className="p-2 space-y-1">
              <button
                onClick={shareToWhatsApp}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">WhatsApp</span>
              </button>
              
              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
              
              <button
                onClick={copyLink}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <div className="w-6 h-6 bg-gray-500 rounded-md flex items-center justify-center">
                  <Copy className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Copy Link</span>
              </button>
            </div>
          </div>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowOptions(false)} 
          />
        </>
      )}
    </div>
  );
};

export default SimpleShareButton;