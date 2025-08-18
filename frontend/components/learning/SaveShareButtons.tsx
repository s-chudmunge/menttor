'use client';

import React, { useState } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink 
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
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <h4 className="font-medium text-gray-900">Share this page</h4>
              <p className="text-xs text-gray-500">Anyone with the link can view</p>
            </div>
            
            <div className="p-3 space-y-2">
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