'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../src/app/context/AuthContext';
import { 
  Box, 
  ArrowRight, 
  Sparkles, 
  Loader2,
  User,
  LogIn,
  X,
  Brain
} from 'lucide-react';

interface ThreeDGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  selectedModelName: string;
  onModelSelect: () => void;
}

const ThreeDGeneratorModal: React.FC<ThreeDGeneratorModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedModel, 
  selectedModelName, 
  onModelSelect 
}) => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [description, setDescription] = useState('');
  // Model is now passed from parent component
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) return;
    
    if (!user) {
      // Redirect to sign in if not authenticated
      router.push('/auth/signin');
      return;
    }

    setIsGenerating(true);
    
    // Open visualization page in new tab
    const visualizeUrl = `/visualize?d=${encodeURIComponent(description.trim())}&m=${selectedModel}`;
    window.open(visualizeUrl, '_blank', 'noopener,noreferrer');
    
    // Reset form and close modal after a short delay
    setTimeout(() => {
      setDescription('');
      setIsGenerating(false);
      onClose();
    }, 1000);
  };

  const isFormValid = description.trim().length >= 5;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl mb-4">
              <Box className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Create 3D Visualization
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Generate interactive 3D models from your ideas
            </p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label htmlFor="3d-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe what you want to visualize
              </label>
              <textarea
                id="3d-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., DNA double helix structure, solar system with planets, molecular structure of caffeine..."
                className="w-full px-3 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none transition-colors"
                rows={4}
                maxLength={500}
                disabled={loading || isGenerating}
              />
              <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                {description.length}/500
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Brain className="w-4 h-4 inline mr-2" />
                AI Model Selection
              </label>
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">{selectedModelName}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Advanced AI for 3D generation</div>
                </div>
                <button
                  type="button"
                  onClick={onModelSelect}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium transition-colors"
                >
                  Change
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFormValid || loading || isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Opening Visualization...</span>
                </>
              ) : !user ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Generate</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Generate 3D Model</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {!user && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-start space-x-2">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Sign in required:</strong> Create an account to generate custom 3D visualizations.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

// Simple card component for triggering the modal
interface ThreeDGeneratorCardProps {
  onClick: () => void;
  className?: string;
}

const ThreeDGeneratorCard: React.FC<ThreeDGeneratorCardProps> = ({ onClick, className = '' }) => {
  return (
    <div 
      onClick={onClick}
      className={`cursor-pointer bg-purple-100 dark:bg-purple-800 rounded p-3 border border-purple-200 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors ${className}`}
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-purple-600 dark:bg-purple-500 rounded flex items-center justify-center">
          <Box className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            3D Visualization
          </h3>
        </div>
        <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      </div>
    </div>
  );
};

export { ThreeDGeneratorModal, ThreeDGeneratorCard };
export default ThreeDGeneratorCard;