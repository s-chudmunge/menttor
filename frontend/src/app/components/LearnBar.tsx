'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  Loader2,
  LogIn,
  Search
} from 'lucide-react';

const LearnBar: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleLearn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) return;
    
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    setIsGenerating(true);
    
    // Use default Vertex AI model and navigate to learn page
    const defaultModel = 'vertexai:gemini-2.5-flash-lite';
    const learnUrl = `/learn?subtopic=${encodeURIComponent(topic.trim())}&subject=${encodeURIComponent('Custom Learning')}&goal=${encodeURIComponent('Learn about: ' + topic.trim())}&model=${encodeURIComponent(defaultModel)}&custom=true`;
    router.push(learnUrl);
    
    // Reset form after navigation
    setTimeout(() => {
      setTopic('');
      setIsGenerating(false);
    }, 500);
  };

  const isFormValid = topic.trim().length >= 3;

  return (
    <div className="bg-white dark:bg-black py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            What do you want to learn?
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Enter any topic and get instant personalized learning content
          </p>
        </div>

        <form onSubmit={handleLearn} className="max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Machine Learning, Python Programming, Quantum Physics, Photography..."
              className="w-full pl-12 pr-32 py-4 text-lg border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              maxLength={100}
              disabled={loading || isGenerating}
            />
            <button
              type="submit"
              disabled={!isFormValid || loading || isGenerating}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Loading...</span>
                </>
              ) : isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Learning...</span>
                </>
              ) : !user ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Learn</span>
                  <ArrowRight className="w-4 h-4 sm:hidden" />
                </>
              )}
            </button>
          </div>
          
          {!user && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-center">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Sign in required</strong> to access personalized learning content
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LearnBar;