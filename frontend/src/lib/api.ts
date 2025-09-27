import axios from 'axios';
import { auth } from './firebase/client';

// Base API URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://menttor-backend-144050828172.asia-south1.run.app';

export const api = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true
});

// Request Interceptor to attach Firebase ID token
api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        try {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
            console.error('Failed to get Firebase ID token:', error);
            // Don't add any authorization header if token fails
            delete config.headers.Authorization;
        }
    } else {
        // If no user is logged in, don't add authorization header
        delete config.headers.Authorization;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor to handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Log errors for debugging but don't interfere with error handling
        if (error.response?.status === 401) {
            console.log('API Authentication required:', error.config?.url);
        } else if (error.response?.status === 404 && !error.config?.url?.includes('/sessions/resume/')) {
            console.log('API Resource not found:', error.config?.url);
        } else if (error.response?.status >= 500) {
            console.error('API Server error:', error.response?.status, error.config?.url);
        }
        
        return Promise.reject(error);
    }
);

// Learning API functions with behavioral tracking
export const learningAPI = {
    // Track time spent learning
    trackTime: async (subtopicId: string, timeSpentMinutes: number) => {
        const response = await api.post('/track-time', {
            subtopic_id: subtopicId,
            time_spent_minutes: timeSpentMinutes
        });
        return response.data;
    },

    // Mark learning as complete
    completeSubtopic: async (subtopicId: string, timeSpentMinutes?: number) => {
        const response = await api.post('/complete-learning', {
            subtopic_id: subtopicId,
            time_spent_minutes: timeSpentMinutes || 0
        });
        return response.data;
    }
};

// Type definitions
export interface QuestionResult {
    question_id: number;
    selected_answer_id: number | null;
    correct_answer_id: string | null;
    is_correct: boolean;
    explanation: string | null;
}

export interface QuizResult {
    sub_topic_id: string;
    score: number;
    total_questions: number;
    completed: boolean;
    timestamp: string;
    question_results?: QuestionResult[];
}

export interface RecommendedReview {
    sub_topic_id: string;
    sub_topic_title: string;
    module_title: string;
    topic_title: string;
    subject: string;
    next_review_date: string; // Date string from backend
}

export interface Topic {
    title: string;
    sub_topics: string[];
}

export interface DayViewSubtopic {
    moduleTitle: string;
    topicTitle: string;
    subTopicTitle: string;
}

export interface RoadmapItem {
    title: string;
    timeline: string;
    topics: Topic[];
}

export interface RoadmapData {
    id: number; // Added roadmap ID
    title: string;
    description: string;
    roadmap_plan: RoadmapItem[];
    subject?: string;
    goal?: string;
    time_value?: number;
    time_unit?: string;
    model?: string;
}

export interface UserSessionRead {
    id: string; // UUID
    user_id: number;
    roadmap_id: number;
    current_section_id?: string;
    current_topic_id?: string;
    current_subtopic_id?: string;
    last_active_timestamp: string; // ISO string
    session_duration: number;
    scroll_position: number;
    view_mode: string;
    current_index: number;
    completion_percentage: number;
    context_data?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface LearningContentResponse {
    id?: number;
    content: any[];
    model: string;
    subject?: string;
    goal?: string;
    subtopic?: string;
    subtopic_id?: string;
    roadmap_id?: number;
    
    // Enhanced fields for save/share functionality
    is_saved: boolean;
    is_generated: boolean;
    is_public: boolean;
    share_token?: string;
    created_at?: string;
    updated_at?: string;
}

export interface NextSubtopicResponse {
    module_title: string;
    topic_title: string;
    subtopic_title: string;
    subtopic_id: string;
    status: string;
}

// Query function for fetching a single quiz result
export const fetchQuizResult = async (subTopicId: string): Promise<QuizResult | null> => {
  const response = await api.get(`/quizzes/results/subtopic/${subTopicId}`);
  return response.data;
};


// Query function for fetching all quiz results
export const fetchQuizResults = async ({ pageParam = 1 }) => {
    const response = await api.get('/quizzes/results', { params: { page: pageParam, size: 10 } });
    // The backend now returns a dictionary with 'items', 'total', 'page', 'size'
    // We return the whole response data, and useInfiniteQuery will handle the structure.
    return response.data;
};

// Query function for fetching recommended reviews
export const fetchRecommendedReviews = async (): Promise<RecommendedReview[]> => {
    const response = await api.get('/reviews/recommended-for-review');
    return response.data;
};

// Query function for fetching user roadmap
export const fetchUserRoadmap = async (): Promise<RoadmapData[]> => {
    const response = await api.get('/roadmaps/');
    return response.data;
};

// Enhanced learning content API functions
export const saveLearningContent = async (contentId: number) => {
  return api.post(`/${contentId}/save`);
};

export const saveNewLearningContent = async (contentData: LearningContentResponse) => {
  return api.post('/save', contentData);
};

export const unsaveLearningContent = async (contentId: number) => {
  return api.delete(`/${contentId}/save`);
};

export const createShareLink = async (contentId: number) => {
  return api.post(`/${contentId}/share`);
};

// New functions for saved learn pages
export const getSavedLearnPage = async (subtopicId: string, roadmapId: number): Promise<LearningContentResponse | null> => {
  try {
    const response = await api.get(`/ml/learn/saved?subtopic_id=${subtopicId}&roadmap_id=${roadmapId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // No saved content found
    }
    throw error;
  }
};

export const saveGeneratedLearnPage = async (contentData: LearningContentResponse): Promise<LearningContentResponse> => {
  const response = await api.post('/ml/learn/save', {
    ...contentData,
    is_generated: true,
    is_saved: true
  });
  return response.data;
};

export const getUserSavedLearnPages = async (roadmapId?: number) => {
  const endpoint = roadmapId 
    ? `/ml/learn/saved/user?roadmap_id=${roadmapId}`
    : '/ml/learn/saved/user';
  const response = await api.get(endpoint);
  return response.data;
};

export const removeShareLink = async (contentId: number) => {
  return api.delete(`/${contentId}/share`);
};

export const getSharedContent = async (shareToken: string) => {
  return api.get(`/shared/learn/${shareToken}`);
};

export const getSavedLearningContent = async () => {
  return api.get('/saved');
};

// Get next subtopic in roadmap sequence
export const getNextSubtopic = async (roadmapId: number, currentSubtopicId: string): Promise<NextSubtopicResponse | null> => {
  try {
    const response = await api.get(`/roadmaps/${roadmapId}`);
    const roadmap = response.data;
    
    if (!roadmap?.roadmap_plan) return null;
    
    let foundCurrent = false;
    
    // Iterate through roadmap to find current subtopic and return the next one
    for (const module of roadmap.roadmap_plan) {
      if (!module.topics) continue;
      
      for (const topic of module.topics) {
        if (!topic.subtopics) continue;
        
        for (const subtopic of topic.subtopics) {
          if (foundCurrent) {
            // Return the next subtopic after finding current
            return {
              module_title: module.title,
              topic_title: topic.title,
              subtopic_title: subtopic.title,
              subtopic_id: subtopic.id,
              status: 'available'
            };
          }
          
          if (subtopic.id === currentSubtopicId) {
            foundCurrent = true;
          }
        }
      }
    }
    
    return null; // No next subtopic found
  } catch (error) {
    console.error('Error getting next subtopic:', error);
    return null;
  }
};

