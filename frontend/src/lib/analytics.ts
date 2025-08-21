import { track } from '@vercel/analytics';

// Custom events for tracking user behavior
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    track(eventName, properties);
    console.log('📊 Analytics Event:', eventName, properties);
  }
};

// Specific tracking functions for different user actions
export const analytics = {
  // Roadmap Generation
  roadmapGenerated: (data: {
    subject: string;
    timeValue: number;
    timeUnit: string;
    model: string;
  }) => {
    trackEvent('roadmap_generated', {
      subject: data.subject,
      time_value: data.timeValue,
      time_unit: data.timeUnit,
      model: data.model,
    });
  },

  // Learning Activities
  learnStarted: (subtopicId: string, subtopicTitle: string) => {
    trackEvent('learn_started', {
      subtopic_id: subtopicId,
      subtopic_title: subtopicTitle,
    });
  },

  learnCompleted: (data: {
    subtopicId: string;
    subtopicTitle: string;
    timeSpent: number;
    roadmapId?: number;
  }) => {
    trackEvent('learn_completed', {
      subtopic_id: data.subtopicId,
      subtopic_title: data.subtopicTitle,
      time_spent_minutes: data.timeSpent,
      roadmap_id: data.roadmapId,
    });
  },

  // Quiz Activities
  quizStarted: (subtopicId: string, subtopicTitle: string) => {
    trackEvent('quiz_started', {
      subtopic_id: subtopicId,
      subtopic_title: subtopicTitle,
    });
  },

  quizCompleted: (data: {
    subtopicId: string;
    subtopicTitle: string;
    score: number;
    totalQuestions: number;
    timeSpent: number;
  }) => {
    trackEvent('quiz_completed', {
      subtopic_id: data.subtopicId,
      subtopic_title: data.subtopicTitle,
      score: data.score,
      total_questions: data.totalQuestions,
      time_spent_minutes: data.timeSpent,
      accuracy_percentage: Math.round((data.score / data.totalQuestions) * 100),
    });
  },

  // User Authentication
  userSignedUp: (method: string) => {
    trackEvent('user_signed_up', {
      method: method, // 'email', 'google', etc.
    });
  },

  userSignedIn: (method: string) => {
    trackEvent('user_signed_in', {
      method: method,
    });
  },

  // Theme Usage
  themeChanged: (from: string, to: string) => {
    trackEvent('theme_changed', {
      from_theme: from,
      to_theme: to,
    });
  },

  // Feature Usage
  featureUsed: (feature: string, context?: Record<string, any>) => {
    trackEvent('feature_used', {
      feature_name: feature,
      ...context,
    });
  },

  // Navigation
  pageViewed: (pageName: string, referrer?: string) => {
    trackEvent('page_viewed', {
      page_name: pageName,
      referrer: referrer,
    });
  },

  // Journey Progress
  journeyVisited: (roadmapId: number, progressPercentage: number) => {
    trackEvent('journey_visited', {
      roadmap_id: roadmapId,
      progress_percentage: progressPercentage,
    });
  },

  // Button Clicks
  buttonClicked: (buttonName: string, location: string, context?: Record<string, any>) => {
    trackEvent('button_clicked', {
      button_name: buttonName,
      location: location,
      ...context,
    });
  },

  // Search and Discovery
  searchPerformed: (query: string, results: number) => {
    trackEvent('search_performed', {
      query: query,
      results_count: results,
    });
  },

  // Error Tracking
  errorEncountered: (errorType: string, errorMessage: string, page: string) => {
    trackEvent('error_encountered', {
      error_type: errorType,
      error_message: errorMessage,
      page: page,
    });
  },
};