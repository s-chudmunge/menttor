'use client';

import React, { useState } from 'react';
import { useOnboardingStatus } from '../hooks/useOnboarding';
import UserOnboarding from './UserOnboarding';
import { useAuth } from '../app/context/AuthContext';

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { data: onboardingStatus, isLoading: statusLoading } = useOnboardingStatus();
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Don't show anything while loading
  if (authLoading || statusLoading) {
    return <>{children}</>;
  }

  // Don't show onboarding if user is not authenticated
  if (!user) {
    return <>{children}</>;
  }

  // Don't show onboarding if user doesn't need it or has dismissed it
  if (!onboardingStatus?.needs_onboarding || !showOnboarding) {
    return <>{children}</>;
  }

  // Show onboarding card at the top of the content
  return (
    <>
      <UserOnboarding onComplete={() => setShowOnboarding(false)} />
      {children}
    </>
  );
};

export default OnboardingWrapper;