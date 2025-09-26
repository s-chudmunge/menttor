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

const TIMER_DURATION = 90000; // 1.5 minutes in milliseconds
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
    
    // Trigger roadmap generation
    try {
      const roadmapRequest = {
        subject: data.interests.join(', '),
        goal: data.goal,
        time_value: data.timeline.value,
        time_unit: data.timeline.unit,
        model: 'vertexai:gemini-2.5-flash-lite' // Default model
      };

      // Generate roadmap without authentication
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://menttor-backend-144050828172.asia-south1.run.app'}/roadmaps/generate-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roadmapRequest),
      });

      if (response.ok) {
        const roadmapData = await response.json();
        // Store the generated roadmap
        sessionStorage.setItem('preview_roadmap', JSON.stringify(roadmapData));
        setShowRoadmap(true);
      } else {
        console.error('Failed to generate roadmap preview');
      }
    } catch (error) {
      console.error('Error generating roadmap preview:', error);
    }

    setShowOnboarding(false);
  };

  const handleLogin = () => {
    router.push('/auth/signin');
  };

  const handleClose = () => {
    setShowOnboarding(false);
    // Mark as shown so it doesn't appear again in this session
    sessionStorage.setItem(SHOWN_KEY, 'true');
  };

  // Clean up stored data when user authenticates
  useEffect(() => {
    if (user && !loading) {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        // Save the onboarding data to user profile
        try {
          const data = JSON.parse(storedData);
          saveOnboardingDataToProfile(data);
          localStorage.removeItem(STORAGE_KEY); // Clean up
        } catch (error) {
          console.error('Error parsing stored onboarding data:', error);
        }
      }
    }
  }, [user, loading]);

  const saveOnboardingDataToProfile = async (data: OnboardingData) => {
    try {
      await api.post('/auth/save-onboarding-preferences', {
        interests: data.interests,
        goal: data.goal,
        timeline_value: data.timeline.value,
        timeline_unit: data.timeline.unit,
        learning_style: data.learningStyle
      });
      console.log('Onboarding preferences saved to profile');
    } catch (error) {
      console.error('Error saving onboarding preferences:', error);
    }
  };

  return (
    <>
      {children}
      {showOnboarding && (
        <VisitorOnboardingForm
          onClose={handleClose}
          onComplete={handleOnboardingComplete}
          onLogin={handleLogin}
        />
      )}
      {showRoadmap && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Your Learning Roadmap is Ready! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We've created a personalized learning path based on your preferences. 
                Login to save your progress and access advanced features.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex-1"
                >
                  Login to Save & Start Learning
                </button>
                <button
                  onClick={() => setShowRoadmap(false)}
                  className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Maybe Later
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