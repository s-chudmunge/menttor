
'use client';

import React from 'react';
import { BookOpen, Calendar } from 'lucide-react';
import Link from 'next/link';
import { RecommendedReview } from '../../../lib/api';

interface RecommendedReviewsProps {
  recommendedReviews: RecommendedReview[];
}

const RecommendedReviews: React.FC<RecommendedReviewsProps> = ({ recommendedReviews }) => {
  if (!recommendedReviews || recommendedReviews.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-indigo-600" />
          <span>Recommended Reviews</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedReviews.map((review, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:shadow-md transition-all">
              <h3 className="font-semibold text-gray-900 mb-2">{review.sub_topic_title}</h3>
              <p className="text-sm text-gray-600 mb-3">Review by: {new Date(review.next_review_date).toLocaleDateString()}</p>
              <Link href={`/learn?subtopic=${encodeURIComponent(review.sub_topic_title)}`} className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                <BookOpen className="w-4 h-4" />
                <span>Go to Learn Page</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecommendedReviews;
