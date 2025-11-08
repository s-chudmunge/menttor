'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { analytics } from '../lib/analytics';

export default function SessionTracker() {
  const { user } = useAuth();
  const sessionStartRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());
  const isActiveRef = useRef<boolean>(true);
  
  useEffect(() => {
    const updateLastActivity = () => {
      lastActivityRef.current = Date.now();
      if (!isActiveRef.current) {
        isActiveRef.current = true;
        console.log('📊 User became active again');
      }
    };

    // Track user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateLastActivity, { passive: true });
    });

    // Check for inactivity
    const inactivityTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      const fiveMinutes = 5 * 60 * 1000;

      if (timeSinceLastActivity > fiveMinutes && isActiveRef.current) {
        isActiveRef.current = false;
        console.log('📊 User became inactive');
        analytics.featureUsed('session_inactive', {
          inactive_duration_minutes: Math.floor(timeSinceLastActivity / 60000),
          total_session_minutes: Math.floor((now - sessionStartRef.current) / 60000),
        });
      }
    }, 60000); // Check every minute

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        analytics.featureUsed('page_hidden', {
          session_duration_minutes: Math.floor((Date.now() - sessionStartRef.current) / 60000),
        });
      } else {
        analytics.featureUsed('page_visible', {
          session_duration_minutes: Math.floor((Date.now() - sessionStartRef.current) / 60000),
        });
        updateLastActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track session end
    const handleBeforeUnload = () => {
      const sessionDuration = Math.floor((Date.now() - sessionStartRef.current) / 60000);
      analytics.featureUsed('session_end', {
        session_duration_minutes: sessionDuration,
        user_authenticated: !!user,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateLastActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(inactivityTimer);
    };
  }, [user]);

  // Track user authentication changes
  useEffect(() => {
    if (user) {
      analytics.featureUsed('authenticated_session_start', {
        user_method: user.app_metadata?.provider || 'unknown',
      });
    }
  }, [user]);

  return null;
}