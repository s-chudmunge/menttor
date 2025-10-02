'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Metadata } from 'next';
import { 
  ArrowLeft,
  Search,
  BookOpen,
  MessageCircle,
  Mail,
  Phone,
  HelpCircle,
  ChevronRight,
  Star
} from 'lucide-react';

export default function HelpPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const faqItems = [
    {
      question: 'How do I generate a new roadmap?',
      answer: 'Navigate to the home page and click on "Generate" in the navigation. Fill out the form with your learning subject, goals, and timeline preferences.'
    },
    {
      question: 'Can I customize my learning path?',
      answer: 'Yes! You can modify your roadmap by accessing your dashboard and selecting any roadmap to edit or create new branches.'
    },
    {
      question: 'How do I track my progress?',
      answer: 'Your progress is automatically tracked as you complete lessons and quizzes. Visit your dashboard to see detailed analytics.'
    },
    {
      question: 'What smart learning models are available?',
      answer: 'We offer various smart learning models including GPT-4, Claude, and Gemini. You can select your preferred model when generating roadmaps.'
    },
    {
      question: 'How do I change my account settings?',
      answer: 'Click on your profile dropdown and select "Profile & Settings" to manage your account preferences.'
    }
  ];

  const supportOptions = [
    {
      title: 'Email Support',
      description: 'Contact Sankalp Chudmunge directly for assistance',
      icon: <Mail className="w-6 h-6" />,
      action: 'csankalp21@gmail.com',
      color: 'blue',
      onClick: () => window.open('mailto:csankalp21@gmail.com', '_blank')
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team now',
      icon: <MessageCircle className="w-6 h-6" />,
      action: 'Start Chat',
      color: 'green',
      onClick: () => {
        // Placeholder for chat integration
        alert('Live chat feature coming soon! Please use email support for now.');
      }
    },
    {
      title: 'Phone Support',
      description: 'Call us during business hours',
      icon: <Phone className="w-6 h-6" />,
      action: '+1 (555) 123-4567',
      color: 'green',
      onClick: () => window.open('tel:+15551234567', '_blank')
    }
  ];

  const quickLinks = [
    { title: 'Getting Started Guide', icon: <BookOpen className="w-5 h-5" /> },
    { title: 'Video Tutorials', icon: <BookOpen className="w-5 h-5" /> },
    { title: 'API Documentation', icon: <BookOpen className="w-5 h-5" /> },
    { title: 'Community Forum', icon: <MessageCircle className="w-5 h-5" /> },
    { title: 'Feature Requests', icon: <Star className="w-5 h-5" /> }
  ];

  const filteredFAQ = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
              <p className="text-gray-600 dark:text-gray-400">Find answers and get assistance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {quickLinks.map((link, index) => (
              <button
                key={index}
                className="flex items-center space-x-3 p-3 lg:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 text-left group"
              >
                <div className="text-blue-600 dark:text-blue-400">
                  {link.icon}
                </div>
                <span className="font-medium text-sm lg:text-base text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {link.title}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
              </button>
            ))}
          </div>
        </div>

        {/* Support Options */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Support</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {supportOptions.map((option, index) => {
              const colorClasses = {
                blue: {
                  bg: 'bg-blue-100 dark:bg-blue-900/20',
                  text: 'text-blue-600 dark:text-blue-400',
                  button: 'bg-blue-600 hover:bg-blue-700'
                },
                green: {
                  bg: 'bg-green-100 dark:bg-green-900/20',
                  text: 'text-green-600 dark:text-green-400',
                  button: 'bg-green-600 hover:bg-green-700'
                },
                green: {
                  bg: 'bg-green-100 dark:bg-green-900/20',
                  text: 'text-green-600 dark:text-green-400',
                  button: 'bg-green-600 hover:bg-green-700'
                }
              };
              
              const colors = colorClasses[option.color as keyof typeof colorClasses];
              
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6 border border-gray-200 dark:border-gray-700 text-center"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${colors.bg}`}>
                    <div className={colors.text}>
                      {option.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm lg:text-base text-gray-900 dark:text-white mb-2">{option.title}</h3>
                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mb-4">{option.description}</p>
                  <button 
                    onClick={option.onClick}
                    className={`w-full ${colors.button} text-white py-2 px-4 rounded-lg transition-colors font-medium text-sm lg:text-base`}
                  >
                    {option.action}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {filteredFAQ.length > 0 ? (
              filteredFAQ.map((item, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start space-x-3">
                    <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {item.question}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No results found for "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Still need help?{' '}
            <button 
              onClick={() => window.open('mailto:csankalp21@gmail.com?subject=Help Request&body=Please describe your issue here:', '_blank')}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Contact Sankalp Chudmunge
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}