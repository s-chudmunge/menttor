'use client';

import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  ExternalLink,
  MessageCircle,
  Send,
  Mail,
  Twitter,
  Facebook,
  Linkedin,
  X
} from 'lucide-react';

interface CuratedRoadmap {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  tags: string[];
  slug?: string;
}

interface RoadmapShareButtonProps {
  roadmap: CuratedRoadmap;
  className?: string;
  variant?: 'button' | 'icon';
}

const RoadmapShareButton: React.FC<RoadmapShareButtonProps> = ({ 
  roadmap, 
  className = '',
  variant = 'button'
}) => {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate sharing URLs and text
  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/explore/${roadmap.slug || roadmap.id}`;
  };

  const getShareTitle = () => {
    return `${roadmap.title} - Free ${roadmap.category.charAt(0).toUpperCase() + roadmap.category.slice(1)} Learning Roadmap`;
  };

  const getShareText = () => {
    const categoryName = roadmap.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `🚀 Master ${roadmap.title} with this comprehensive ${roadmap.difficulty} learning roadmap! Perfect for ${categoryName} enthusiasts. #Learning #${roadmap.category.replace(/-/g, '')} #TechEducation`;
  };

  const getShareDescription = () => {
    return roadmap.description || `Learn ${roadmap.title} step by step with our expertly curated roadmap. Perfect for ${roadmap.difficulty} level learners.`;
  };

  // Copy link to clipboard
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = getShareUrl();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Social media sharing functions
  const shareToTwitter = () => {
    const url = getShareUrl();
    const text = getShareText();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=Learning,Programming,TechEducation`;
    window.open(twitterUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

  const shareToFacebook = () => {
    const url = getShareUrl();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(getShareText())}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

  const shareToLinkedIn = () => {
    const url = getShareUrl();
    const title = getShareTitle();
    const summary = getShareDescription();
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

  const shareToWhatsApp = () => {
    const url = getShareUrl();
    const text = `🎯 ${getShareTitle()}\n\n${getShareDescription()}\n\n${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareToTelegram = () => {
    const url = getShareUrl();
    const text = `🎯 ${getShareTitle()}\n\n${getShareDescription()}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank');
  };

  const shareViaEmail = () => {
    const url = getShareUrl();
    const subject = `Check out this ${roadmap.category} learning roadmap: ${roadmap.title}`;
    const body = `Hi!\n\nI found this excellent learning roadmap that might interest you:\n\n📚 ${getShareTitle()}\n\n${getShareDescription()}\n\n🔗 ${url}\n\nHappy learning!`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
  };

  const shareToReddit = () => {
    const url = getShareUrl();
    const title = `[Resource] ${getShareTitle()}`;
    const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    window.open(redditUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

  // Native Web Share API (for mobile)
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: getShareTitle(),
          text: getShareDescription(),
          url: getShareUrl(),
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
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
        onClick={() => setShowShareOptions(!showShareOptions)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
          variant === 'icon' 
            ? 'p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
        }`}
        title="Share this roadmap"
      >
        {buttonContent}
      </button>

      {/* Share Options Dropdown */}
      {showShareOptions && (
        <>
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-[9999] max-h-[80vh] overflow-y-auto xl:right-0 lg:right-0 md:right-0 sm:right-[-12rem] right-[-12rem]">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white">Share Roadmap</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {roadmap.title} - {roadmap.difficulty} level
              </p>
            </div>
            
            <div className="p-3 space-y-2">
              {/* Native Share (Mobile) */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Share via...</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Use device's share menu</div>
                  </div>
                </button>
              )}

              {/* Social Media Platforms */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 pt-2">Social Media</p>
                
                <button
                  onClick={shareToWhatsApp}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-left hover:bg-green-50 dark:hover:bg-green-900/10 rounded-lg transition-colors group"
                >
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">WhatsApp</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Share with friends</div>
                  </div>
                </button>
                
                <button
                  onClick={shareToTwitter}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors group"
                >
                  <div className="w-8 h-8 bg-black dark:bg-gray-900 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">X (Twitter)</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Tweet to your followers</div>
                  </div>
                </button>
                
                <button
                  onClick={shareToLinkedIn}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors group"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">LinkedIn</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Share with your network</div>
                  </div>
                </button>
                
                <button
                  onClick={shareToFacebook}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors group"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Facebook</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Post to your timeline</div>
                  </div>
                </button>
                
                <button
                  onClick={shareToTelegram}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors group"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Telegram</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Send to contacts</div>
                  </div>
                </button>
                
                <button
                  onClick={shareToReddit}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-left hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-lg transition-colors group"
                >
                  <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Reddit</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Post to communities</div>
                  </div>
                </button>
                
                <button
                  onClick={shareViaEmail}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group"
                >
                  <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Email</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Send via email</div>
                  </div>
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                <button
                  onClick={copyShareLink}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    copySuccess 
                      ? 'bg-green-500' 
                      : 'bg-gray-500 group-hover:bg-gray-600'
                  }`}>
                    {copySuccess ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <Copy className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {copySuccess ? 'Copied!' : 'Copy Link'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {copySuccess ? 'Link copied to clipboard' : 'Copy roadmap URL'}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Click outside to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowShareOptions(false)}
          />
        </>
      )}
    </div>
  );
};

export default RoadmapShareButton;