'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseQuizIntegrityProps {
  onViolation: (type: 'fullscreen' | 'visibility') => void;
}

export const useQuizIntegrity = ({ onViolation }: UseQuizIntegrityProps) => {
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);

  const requestFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setFullscreenError(null);
    } catch (error) {
      console.error('Fullscreen request failed:', error);
      setFullscreenError('Could not enter fullscreen mode. Please enable it in your browser settings.');
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Exit fullscreen failed:', error);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onViolation('fullscreen');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        onViolation('visibility');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onViolation]);

  return { requestFullscreen, exitFullscreen, fullscreenError };
};