'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../app/context/AuthContext';
import { useRouter } from 'next/navigation';
import VisitorOnboardingForm from './VisitorOnboardingForm';
import { api } from '../lib/api';

interface OnboardingData {
  interests: string[];
  goal: string;
  timeline: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  learningStyle: string;
}

interface VisitorOnboardingTimerProps {
  children: React.ReactNode;
}

const TIMER_DURATION = 39000; // 39 seconds in milliseconds
const STORAGE_KEY = 'visitor_onboarding_data';
const SHOWN_KEY = 'visitor_onboarding_shown';

const VisitorOnboardingTimer: React.FC<VisitorOnboardingTimerProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [showRoadmap, setShowRoadmap] = useState(false);

  useEffect(() => {
    // Don't start timer if user is authenticated or still loading
    if (loading || user) {
      return;
    }

    // Check if onboarding was already shown in this session
    const alreadyShown = sessionStorage.getItem(SHOWN_KEY);
    if (alreadyShown) {
      return;
    }

    // Start the timer
    const timer = setTimeout(() => {
      // Double-check user is still not authenticated
      if (!user && !loading) {
        setShowOnboarding(true);
        sessionStorage.setItem(SHOWN_KEY, 'true');
      }
    }, TIMER_DURATION);

    return () => clearTimeout(timer);
  }, [user, loading]);

  const handleOnboardingComplete = async (data: OnboardingData) => {
    setOnboardingData(data);
    
    // Store data in localStorage for after login
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    console.log('Onboarding data saved to localStorage:', data);

    setShowOnboarding(false);
  };


  const handleClose = () => {
    setShowOnboarding(false);
    // Mark as shown so it doesn't appear again in this session
    sessionStorage.setItem(SHOWN_KEY, 'true');
  };

  // Clean up stored data when user authenticates and generate roadmap
  useEffect(() => {
    if (user && !loading) {
      const storedData = localStorage.getItem(STORAGE_KEY);
      
      console.log('User authenticated, checking stored data:', { storedData: !!storedData });
      
      if (storedData) {
        // Generate roadmap from stored onboarding data
        try {
          const data = JSON.parse(storedData);
          console.log('Found stored onboarding data, generating roadmap:', data);
          generateRoadmapFromOnboardingData(data);
          localStorage.removeItem(STORAGE_KEY); // Clean up
        } catch (error) {
          console.error('Error parsing stored onboarding data:', error);
        }
      }
    }
  }, [user, loading]);

  const generateRoadmapFromOnboardingData = async (data: OnboardingData) => {
    try {
      // Generate roadmap using authenticated endpoint with onboarding data
      const roadmapRequest = {
        subject: data.interests.join(', '),
        goal: data.goal,
        time_value: data.timeline.value,
        time_unit: data.timeline.unit,
        model: 'openrouter:qwen/qwen-2-7b-instruct:free'
      };

      console.log('Generating roadmap from onboarding data:', roadmapRequest);
      const response = await api.post('/roadmaps/generate', roadmapRequest);
      
      if (response.data) {
        console.log('Roadmap generated successfully:', response.data);
        // Show success modal after a short delay
        setTimeout(() => {
          setShowRoadmap(true);
        }, 500);
      }
    } catch (error) {
      console.error('Error generating roadmap from onboarding data:', error);
    }
  };

  return (
    <>
      {children}
      {showOnboarding && (
        <VisitorOnboardingForm
          onClose={handleClose}
          onComplete={handleOnboardingComplete}
          onLogin={() => {}} // No longer needed, authentication handled inline
        />
      )}
      {showRoadmap && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Your Learning Journey! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your personalized roadmap has been created and saved to your profile. 
                Ready to start learning?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    router.push('/journey');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex-1"
                >
                  Start Learning Now
                </button>
                <button
                  onClick={() => setShowRoadmap(false)}
                  className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VisitorOnboardingTimer;