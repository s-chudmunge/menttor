'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Eye, Clock, TrendingUp, Activity, MousePointer, Smartphone } from 'lucide-react';

interface AnalyticsEvent {
  timestamp: string;
  event: string;
  properties: Record<string, any>;
}

export default function AnalyticsPage() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);

  useEffect(() => {
    // Listen for custom analytics events in the browser console
    const handleAnalyticsEvent = (event: CustomEvent) => {
      const newEvent: AnalyticsEvent = {
        timestamp: new Date().toISOString(),
        event: event.detail.event,
        properties: event.detail.properties || {},
      };
      setEvents(prev => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events
    };

    // Create a custom event listener for analytics
    window.addEventListener('analytics-event', handleAnalyticsEvent as EventListener);

    // Override console.log to capture analytics events
    const originalLog = console.log;
    console.log = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('📊 Analytics Event:')) {
        const event = args[1];
        const properties = args[2];
        const newEvent: AnalyticsEvent = {
          timestamp: new Date().toISOString(),
          event: event,
          properties: properties || {},
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 100));
      }
      originalLog.apply(console, args);
    };

    return () => {
      window.removeEventListener('analytics-event', handleAnalyticsEvent as EventListener);
      console.log = originalLog;
    };
  }, []);

  const getEventIcon = (eventName: string) => {
    if (eventName.includes('page_viewed')) return <Eye className="w-4 h-4 text-blue-500" />;
    if (eventName.includes('theme_changed')) return <MousePointer className="w-4 h-4 text-purple-500" />;
    if (eventName.includes('roadmap_generated')) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (eventName.includes('learn_')) return <Activity className="w-4 h-4 text-orange-500" />;
    if (eventName.includes('quiz_')) return <BarChart3 className="w-4 h-4 text-red-500" />;
    if (eventName.includes('session_')) return <Clock className="w-4 h-4 text-gray-500" />;
    return <Activity className="w-4 h-4 text-gray-400" />;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getEventStats = () => {
    const last24Hours = events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
      return eventTime > dayAgo;
    });

    const pageViews = last24Hours.filter(e => e.event === 'page_viewed').length;
    const completedLearns = last24Hours.filter(e => e.event === 'learn_completed').length;
    const roadmapsGenerated = last24Hours.filter(e => e.event === 'roadmap_generated').length;
    const themeChanges = last24Hours.filter(e => e.event === 'theme_changed').length;

    return { pageViews, completedLearns, roadmapsGenerated, themeChanges };
  };

  const stats = getEventStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Real-Time User Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor user behavior and platform usage in real-time
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Page Views (24h)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pageViews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed Learns (24h)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedLearns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Roadmaps Generated (24h)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.roadmapsGenerated}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <MousePointer className="w-8 h-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Theme Changes (24h)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.themeChanges}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Events */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Live User Events
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Real-time stream of user interactions and behaviors
            </p>
          </div>

          <div className="p-6">
            {events.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No events yet. Start using the platform to see real-time analytics!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    {getEventIcon(event.event)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {event.event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      {Object.keys(event.properties).length > 0 && (
                        <div className="mt-1">
                          <details className="text-xs text-gray-600 dark:text-gray-300">
                            <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-white">
                              View details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-600 rounded text-xs overflow-x-auto">
                              {JSON.stringify(event.properties, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
            How to Use This Analytics Dashboard
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <p>• <strong>Real-time tracking:</strong> Events appear here immediately as users interact with your platform</p>
            <p>• <strong>Vercel Analytics:</strong> Visit your Vercel dashboard → Analytics tab for comprehensive reports</p>
            <p>• <strong>Custom events:</strong> All user interactions are tracked including roadmap generation, learning completion, theme changes, and more</p>
            <p>• <strong>Session data:</strong> Track user engagement, time spent, and activity patterns</p>
          </div>
        </div>
      </div>
    </div>
  );
}