'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  BookOpen,
  Brain,
  Target,
  Award,
  Clock,
  TrendingUp,
  Flame,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';
import { useAuth } from '../app/context/AuthContext';
import { api } from '../lib/api';

interface ActivityDay {
  date: string;
  count: number;
  level: number; // 0-4 intensity level
  activities: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'learn' | 'quiz' | 'milestone' | 'streak' | 'xp';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    xp_earned?: number;
    score?: number;
    subtopic?: string;
    streak_count?: number;
  };
}

interface ActivityFeedProps {
  showCalendar?: boolean;
  showFeed?: boolean;
  maxFeedItems?: number;
  className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  showCalendar = true, 
  showFeed = true, 
  maxFeedItems = 10,
  className = ""
}) => {
  const { user } = useAuth();
  const [activityData, setActivityData] = useState<ActivityDay[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<ActivityDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalContributions, setTotalContributions] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Generate last 365 days
  const generateCalendarDays = (): ActivityDay[] => {
    const days: ActivityDay[] = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 364); // 365 days total

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        count: 0,
        level: 0,
        activities: []
      });
    }
    return days;
  };

  // Fetch activity data from backend
  const fetchActivityData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Fetch activity calendar data from new API
      const calendarResponse = await api.get('/activity/calendar?days=365');
      const calendarData = calendarResponse.data;

      // Fetch recent activities
      const recentResponse = await api.get(`/activity/recent?limit=${maxFeedItems}`);
      const recentData = recentResponse.data;

      // Process calendar data
      const calendarDays: ActivityDay[] = calendarData.calendar.map((day: any) => ({
        date: day.date,
        count: day.count,
        level: day.level,
        activities: day.activities.map((activity: any) => ({
          id: `${activity.type}-${day.date}-${Math.random()}`,
          type: activity.type,
          title: activity.title,
          description: activity.description,
          timestamp: day.date,
          metadata: activity
        }))
      }));

      // Process recent activities
      const activities: ActivityItem[] = recentData.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        timestamp: activity.timestamp,
        metadata: activity.metadata
      }));
      
      setActivityData(calendarDays);
      setRecentActivities(activities);
      setTotalContributions(calendarData.summary.total_contributions);
      setCurrentStreak(calendarData.summary.current_streak);

    } catch (error) {
      console.error('Failed to fetch activity data:', error);
      // Fallback to old method on error
      try {
        // Fetch progress data (learning activities) as fallback
        const progressResponse = await api.get('/progress/1'); // Assuming roadmap_id 1
        const progressData = progressResponse.data;

        // Process fallback data
        const calendarDays = generateCalendarDays();
        const activities: ActivityItem[] = [];

        progressData.forEach((progress: any) => {
          if (progress.completed_at || progress.last_accessed_at) {
            const date = progress.completed_at || progress.last_accessed_at;
            const dayStr = new Date(date).toISOString().split('T')[0];
            const dayIndex = calendarDays.findIndex(day => day.date === dayStr);
            
            if (dayIndex !== -1) {
              calendarDays[dayIndex].count += 1;
              activities.push({
                id: `learn-${progress.id}`,
                type: 'learn',
                title: progress.learn_completed ? 'Completed Learning' : 'Started Learning',
                description: `Subtopic: ${progress.sub_topic_id}`,
                timestamp: date,
                metadata: {
                  subtopic: progress.sub_topic_id
                }
              });
            }
          }
        });

        // Calculate activity levels
        const maxActivityCount = Math.max(...calendarDays.map(day => day.count));
        calendarDays.forEach(day => {
          if (day.count === 0) day.level = 0;
          else if (day.count <= maxActivityCount * 0.25) day.level = 1;
          else if (day.count <= maxActivityCount * 0.5) day.level = 2;
          else if (day.count <= maxActivityCount * 0.75) day.level = 3;
          else day.level = 4;
        });

        setActivityData(calendarDays);
        setRecentActivities(activities.slice(0, maxFeedItems));
        setTotalContributions(calendarDays.reduce((sum, day) => sum + day.count, 0));
        setCurrentStreak(0);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setActivityData(generateCalendarDays());
        setRecentActivities([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityData();
  }, [user]);

  const getActivityColor = (level: number): string => {
    const colors = {
      0: 'bg-gray-100 dark:bg-gray-800',
      1: 'bg-green-200 dark:bg-green-900',
      2: 'bg-green-300 dark:bg-green-700',
      3: 'bg-green-500 dark:bg-green-600',
      4: 'bg-green-700 dark:bg-green-500'
    };
    return colors[level as keyof typeof colors] || colors[0];
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'learn': return <BookOpen className="w-4 h-4" />;
      case 'quiz': return <Brain className="w-4 h-4" />;
      case 'milestone': return <Target className="w-4 h-4" />;
      case 'streak': return <Flame className="w-4 h-4" />;
      case 'xp': return <Award className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor2 = (type: string): string => {
    switch (type) {
      case 'learn': return 'text-blue-500';
      case 'quiz': return 'text-green-500';
      case 'milestone': return 'text-purple-500';
      case 'streak': return 'text-orange-500';
      case 'xp': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {showCalendar && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-53 gap-1">
                {Array.from({ length: 365 }).map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
                ))}
              </div>
            </div>
          </div>
        )}
        {showFeed && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {showCalendar && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Learning Activity
              </h3>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{totalContributions} contributions in the last year</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>{currentStreak} day streak</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Calendar */}
          <div className="overflow-x-auto">
            <div className="grid grid-cols-53 gap-1 mb-3" style={{ minWidth: '700px' }}>
              {activityData.map((day, index) => (
                <motion.div
                  key={day.date}
                  whileHover={{ scale: 1.2 }}
                  className={`w-3 h-3 rounded-sm cursor-pointer transition-all ${getActivityColor(day.level)}`}
                  title={`${day.count} contributions on ${day.date}`}
                  onClick={() => setSelectedDay(day)}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                <span>Less</span>
                <div className="flex items-center space-x-1">
                  {[0, 1, 2, 3, 4].map(level => (
                    <div
                      key={level}
                      className={`w-3 h-3 rounded-sm ${getActivityColor(level)}`}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Selected Day Details */}
          {selectedDay && selectedDay.activities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {selectedDay.date} ({selectedDay.count} activities)
              </h4>
              <div className="space-y-2">
                {selectedDay.activities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div className={getActivityColor2(activity.type)}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{activity.title}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {showFeed && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Activity className="w-4 h-4" />
              <span>{recentActivities.length} recent activities</span>
            </div>
          </div>

          {recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Start learning to see your activity here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className={`flex-shrink-0 ${getActivityColor2(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {activity.description}
                    </p>
                    {activity.metadata?.xp_earned && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Award className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                          +{activity.metadata.xp_earned} XP
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(activity.timestamp)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;