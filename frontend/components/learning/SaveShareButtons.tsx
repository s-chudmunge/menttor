'use client';

import React, { useState } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink,
  MessageCircle,
  Send,
  Mail
} from 'lucide-react';
import { LearningContentResponse, saveLearningContent, unsaveLearningContent, saveNewLearningContent, createShareLink, removeShareLink } from '../../src/lib/api';

interface SaveShareButtonsProps {
  content: LearningContentResponse;
  onContentUpdate: (updatedContent: LearningContentResponse) => void;
  className?: string;
}

const SaveShareButtons: React.FC<SaveShareButtonsProps> = ({ 
  content, 
  onContentUpdate, 
  className = '' 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleSaveToggle = async () => {
    setIsSaving(true);
    try {
      if (content.is_saved && content.id) {
        // Unsave existing saved content
        await unsaveLearningContent(content.id);
        onContentUpdate({ ...content, is_saved: false });
      } else if (content.id) {
        // Save existing content (for compatibility)
        await saveLearningContent(content.id);
        onContentUpdate({ ...content, is_saved: true });
      } else {
        // Save new content that wasn't previously saved
        const response = await saveNewLearningContent(content);
        onContentUpdate({ 
          ...content, 
          is_saved: true,
          id: response.data.id,
          created_at: response.data.created_at,
          updated_at: response.data.updated_at
        });
      }
    } catch (error) {
      console.error('Failed to toggle save status:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateShareLink = async () => {
    // If content doesn't have an ID, save it first
    if (!content.id) {
      try {
        setIsSharing(true);
        const saveResponse = await saveNewLearningContent(content);
        const savedContent = { 
          ...content, 
          is_saved: true,
          id: saveResponse.data.id,
          created_at: saveResponse.data.created_at,
          updated_at: saveResponse.data.updated_at
        };
        
        // Now create share link for the saved content
        const shareResponse = await createShareLink(saveResponse.data.id);
        const updatedContent = {
          ...savedContent,
          is_public: true,
          share_token: shareResponse.data.share_token
        };
        onContentUpdate(updatedContent);
        setShowShareOptions(true);
      } catch (error) {
        console.error('Failed to save and share content:', error);
      } finally {
        setIsSharing(false);
      }
      return;
    }
    
    setIsSharing(true);
    try {
      const response = await createShareLink(content.id);
      const updatedContent = {
        ...content,
        is_public: true,
        share_token: response.data.share_token
      };
      onContentUpdate(updatedContent);
      setShowShareOptions(true);
    } catch (error) {
      console.error('Failed to create share link:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveShareLink = async () => {
    if (!content.id) return;
    
    setIsSharing(true);
    try {
      await removeShareLink(content.id);
      onContentUpdate({ ...content, is_public: false });
      setShowShareOptions(false);
    } catch (error) {
      console.error('Failed to remove share link:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const copyShareLink = async () => {
    if (!content.share_token) return;
    
    const shareUrl = `${window.location.origin}/shared/learn/${content.share_token}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const openShareLink = () => {
    if (!content.share_token) return;
    const shareUrl = `${window.location.origin}/shared/learn/${content.share_token}`;
    window.open(shareUrl, '_blank');
  };

  // Social media share functions
  const getShareUrl = () => {
    if (!content.share_token) return '';
    return `${window.location.origin}/shared/learn/${content.share_token}`;
  };

  const getShareText = () => {
    const subtopic = content.subtopic || 'Learning Content';
    return `Check out this learning content: ${subtopic}`;
  };

  const shareToTwitter = () => {
    const url = getShareUrl();
    const text = getShareText();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const shareToFacebook = () => {
    const url = getShareUrl();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
  };

  const shareToLinkedIn = () => {
    const url = getShareUrl();
    const text = getShareText();
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
    window.open(linkedInUrl, '_blank', 'width=550,height=420');
  };

  const shareToWhatsApp = () => {
    const url = getShareUrl();
    const text = getShareText();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareToTelegram = () => {
    const url = getShareUrl();
    const text = getShareText();
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank');
  };

  const shareViaEmail = () => {
    const url = getShareUrl();
    const text = getShareText();
    const subject = content.subtopic ? `Learning Resource: ${content.subtopic}` : 'Learning Resource';
    const body = `${text}\n\n${url}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
  };

  const shareToReddit = () => {
    const url = getShareUrl();
    const text = getShareText();
    const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
    window.open(redditUrl, '_blank', 'width=550,height=420');
  };

  // Native Web Share API (for mobile)
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: content.subtopic || 'Learning Content',
          text: getShareText(),
          url: getShareUrl(),
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Save Button */}
      <button
        onClick={handleSaveToggle}
        disabled={isSaving}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
          content.is_saved
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isSaving ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : content.is_saved ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">
          {content.is_saved ? 'Saved' : 'Save'}
        </span>
      </button>

      {/* Share Button */}
      <div className="relative">
        <button
          onClick={content.is_public ? () => setShowShareOptions(!showShareOptions) : handleCreateShareLink}
          disabled={isSharing}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            content.is_public
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } ${isSharing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSharing ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {content.is_public ? 'Shared' : 'Share'}
          </span>
        </button>

        {/* Share Options Dropdown */}
        {showShareOptions && content.is_public && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <h4 className="font-medium text-gray-900">Share this learning content</h4>
              <p className="text-xs text-gray-500">Anyone with the link can view</p>
            </div>
            
            <div className="p-3 space-y-3">
              {/* Native Share (Mobile) */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Share via...</span>
                </button>
              )}

              {/* Social Media Platforms */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3">Social Media</p>
                
                <button
                  onClick={shareToWhatsApp}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-green-50 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">WhatsApp</span>
                </button>
                
                <button
                  onClick={shareToTwitter}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  <span className="text-sm text-gray-700">Twitter</span>
                </button>
                
                <button
                  onClick={shareToFacebook}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-sm text-gray-700">Facebook</span>
                </button>
                
                <button
                  onClick={shareToLinkedIn}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span className="text-sm text-gray-700">LinkedIn</span>
                </button>
                
                <button
                  onClick={shareToTelegram}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-700">Telegram</span>
                </button>
                
                <button
                  onClick={shareToReddit}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                  </svg>
                  <span className="text-sm text-gray-700">Reddit</span>
                </button>
                
                <button
                  onClick={shareViaEmail}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Email</span>
                </button>
              </div>

              <hr className="my-2" />

              {/* Copy Link and Open in New Tab */}
              <button
                onClick={copyShareLink}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                {copySuccess ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-sm text-gray-700">
                  {copySuccess ? 'Copied!' : 'Copy link'}
                </span>
              </button>
              
              <button
                onClick={openShareLink}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Open in new tab</span>
              </button>
              
              <hr className="my-2" />
              
              <button
                onClick={handleRemoveShareLink}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Stop sharing</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showShareOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareOptions(false)}
        />
      )}
    </div>
  );
};

export default SaveShareButtons;