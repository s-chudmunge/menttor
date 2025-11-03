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
  const [showSignInMessage, setShowSignInMessage] = useState(false);

  const handleLearn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) return;
    
    if (!user) {
      setShowSignInMessage(true);
      setTimeout(() => setShowSignInMessage(false), 3000);
      return;
    }

    setIsGenerating(true);
    
    // Use default free OpenRouter model and navigate to learn page
    const defaultModel = 'openrouter:meta-llama/llama-3.3-8b-instruct:free';
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
    <div className="bg-white dark:bg-black py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            What do you want to learn?
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Enter any topic and get instant personalized learning content
          </p>
        </div>

        <form onSubmit={handleLearn} className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Machine Learning, Python Programming, Quantum Physics, Photography..."
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              disabled={loading || isGenerating}
            />
          </div>
          
          {showSignInMessage && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-center">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                Sign in first!
              </p>
            </div>
          )}
        </form>
        
        {/* CTA Button */}
        <div className="mt-12 text-center">
          <button 
            onClick={() => document.getElementById('generate')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center space-x-3 mx-auto shadow-lg hover:shadow-xl"
          >
            <span>Generate Roadmap</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearnBar;