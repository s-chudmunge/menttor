
'use client';

import React from 'react';
import { BookOpen, Calendar, Brain, Clock, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { RecommendedReview } from '../../../lib/api';

interface RecommendedReviewsProps {
  recommendedReviews: RecommendedReview[];
}

const RecommendedReviews: React.FC<RecommendedReviewsProps> = ({ recommendedReviews }) => {
  if (!recommendedReviews || recommendedReviews.length === 0) {
    return null;
  }

  const getDaysSinceReview = (reviewDate: string) => {
    const today = new Date();
    const review = new Date(reviewDate);
    const diffTime = today.getTime() - review.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (reviewDate: string) => {
    const days = getDaysSinceReview(reviewDate);
    if (days > 0) return 'border-red-200 bg-red-50'; // Overdue
    if (days === 0) return 'border-orange-200 bg-orange-50'; // Due today
    return 'border-blue-200 bg-blue-50'; // Due soon
  };

  const getUrgencyText = (reviewDate: string) => {
    const days = getDaysSinceReview(reviewDate);
    if (days > 0) return `${days} days overdue`;
    if (days === 0) return 'Due today';
    return `Due in ${Math.abs(days)} days`;
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
            <RotateCcw className="w-6 h-6 text-indigo-600" />
            <span>Spaced Repetition Reviews</span>
          </h2>
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {recommendedReviews.length} topics to review
          </div>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          <p>Review these topics to strengthen your long-term retention and prevent forgetting.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedReviews.map((review, index) => (
            <div key={index} className={`rounded-xl p-5 border-2 hover:shadow-md transition-all ${getUrgencyColor(review.next_review_date)}`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 mb-1 flex-1">{review.sub_topic_title}</h3>
                <div className="text-xs font-medium text-gray-500 ml-2">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {getUrgencyText(review.next_review_date)}
                </div>
              </div>
              
              <div className="text-xs text-gray-600 mb-3">
                <span className="font-medium">{review.module_title}</span> • {review.topic_title}
              </div>
              
              <div className="text-xs text-gray-500 mb-4">
                Subject: {review.subject}
              </div>

              <div className="flex space-x-2">
                <Link 
                  href={`/learn?subtopic=${encodeURIComponent(review.sub_topic_title)}&subtopic_id=${review.sub_topic_id}&roadmap_id=1`} 
                  className="flex-1 text-center py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md font-medium transition-colors flex items-center justify-center space-x-1"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Review Content</span>
                </Link>
                
                <Link 
                  href={`/quiz?subtopic_id=${review.sub_topic_id}&subtopic=${encodeURIComponent(review.sub_topic_title)}&subject=${encodeURIComponent(review.subject)}&goal=Review%20and%20Reinforce&module_title=${encodeURIComponent(review.module_title)}&topic_title=${encodeURIComponent(review.topic_title)}&roadmap_id=1`}
                  className="flex-1 text-center py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md font-medium transition-colors flex items-center justify-center space-x-1"
                >
                  <Brain className="w-3 h-3" />
                  <span>Quiz Review</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <div className="text-xs text-gray-500">
            Based on spaced repetition algorithm for optimal learning retention
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecommendedReviews;
