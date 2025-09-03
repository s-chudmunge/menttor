'use client';

import React, { useState } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Share2
} from 'lucide-react';
import { LearningContentResponse, saveLearningContent, unsaveLearningContent, saveNewLearningContent, createShareLink, removeShareLink } from '../../src/lib/api';
import SimpleShareButton from '../SimpleShareButton';

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
    } catch (error) {
      console.error('Failed to remove share link:', error);
    } finally {
      setIsSharing(false);
    }
  };


  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Save Button */}
      <button
        onClick={handleSaveToggle}
        disabled={isSaving}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          content.is_saved
            ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
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
      {content.is_public ? (
        <SimpleShareButton
          title={content.subtopic || 'Learning Content'}
          text={`Check out this learning content: ${content.subtopic || 'Learning Content'}`}
          url={`${window.location.origin}/shared/learn/${content.share_token}`}
          variant="button"
        />
      ) : (
        <button
          onClick={handleCreateShareLink}
          disabled={isSharing}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSharing ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Share</span>
        </button>
      )}

    </div>
  );
};

export default SaveShareButtons;