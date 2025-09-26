'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../app/context/AuthContext';
import { useRoadmap } from '../hooks/useRoadmap';
import LoggedInUserOnboardingForm from './LoggedInUserOnboardingForm';

interface LoggedInUserOnboardingTimerProps {
  children: React.ReactNode;
}

const TIMER_DURATION = 39000; // 39 seconds in milliseconds
const SHOWN_KEY = 'logged_user_onboarding_shown';

const LoggedInUserOnboardingTimer: React.FC<LoggedInUserOnboardingTimerProps> = ({ children }) => {
  const { user, dbId, loading } = useAuth();
  const { data: roadmaps, isLoading: roadmapsLoading } = useRoadmap(dbId?.toString());
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Don't start timer if user is not authenticated, still loading, or roadmaps are loading
    if (loading || !user || !dbId || roadmapsLoading) {
      return;
    }

    // Don't show if user has roadmaps
    if (roadmaps && roadmaps.length > 0) {
      return;
    }

    // Check if onboarding was already shown in this session
    const alreadyShown = sessionStorage.getItem(SHOWN_KEY);
    if (alreadyShown) {
      return;
    }

    // Start the timer
    const timer = setTimeout(() => {
      // Double-check conditions are still valid
      if (user && dbId && (!roadmaps || roadmaps.length === 0) && !loading && !roadmapsLoading) {
        setShowOnboarding(true);
        sessionStorage.setItem(SHOWN_KEY, 'true');
      }
    }, TIMER_DURATION);

    return () => clearTimeout(timer);
  }, [user, dbId, loading, roadmaps, roadmapsLoading]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Force a refresh of roadmaps data since we just created one
    window.location.reload();
  };

  const handleClose = () => {
    setShowOnboarding(false);
    // Mark as shown so it doesn't appear again in this session
    sessionStorage.setItem(SHOWN_KEY, 'true');
  };

  return (
    <>
      {children}
      {showOnboarding && (
        <LoggedInUserOnboardingForm
          onClose={handleClose}
          onComplete={handleOnboardingComplete}
        />
      )}
    </>
  );
};

export default LoggedInUserOnboardingTimer;