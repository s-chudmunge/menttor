'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Target, Clock, Brain, BookOpen, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from './Button';

interface OnboardingData {
  interests: string[];
  goal: string;
  timeline: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  learningStyle: string;
}

interface VisitorOnboardingFormProps {
  onClose: () => void;
  onComplete: (data: OnboardingData) => void;
  onLogin: () => void;
}

const VisitorOnboardingForm: React.FC<VisitorOnboardingFormProps> = ({
  onClose,
  onComplete,
  onLogin
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({
    interests: [],
    goal: '',
    timeline: { value: 1, unit: 'months' },
    learningStyle: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  // Interest options
  const interestOptions = [
    'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
    'Cloud Computing', 'Cybersecurity', 'UI/UX Design', 'DevOps',
    'Game Development', 'Blockchain', 'AI/ML', 'Database Management',
    'Software Engineering', 'Product Management', 'Digital Marketing', 'Other'
  ];

  // Learning style options
  const learningStyleOptions = [
    { id: 'visual', label: 'Visual Learner', description: 'Learn best through diagrams, charts, and visual aids' },
    { id: 'auditory', label: 'Auditory Learner', description: 'Prefer listening to explanations and discussions' },
    { id: 'kinesthetic', label: 'Hands-on Learner', description: 'Learn by doing and practicing' },
    { id: 'reading', label: 'Reading/Writing', description: 'Prefer text-based learning and note-taking' }
  ];

  const totalSteps = 4;

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsGenerating(true);
    
    // Simulate roadmap generation
    setTimeout(() => {
      onComplete(formData);
      setIsGenerating(false);
    }, 2000);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.interests.length > 0;
      case 1: return formData.goal.trim().length > 0;
      case 2: return formData.timeline.value > 0;
      case 3: return formData.learningStyle.length > 0;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                What interests you?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select topics you'd like to learn about
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`p-3 text-sm rounded-lg border-2 transition-all ${
                    formData.interests.includes(interest)
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>

            {formData.interests.length > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Selected: {formData.interests.join(', ')}
              </div>
            )}
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-4 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                What's your goal?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Describe what you want to achieve
              </p>
            </div>

            <textarea
              value={formData.goal}
              onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
              placeholder="e.g., Learn Python for data analysis, become a full-stack developer, master React..."
              className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm"
              rows={4}
            />
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-4 text-orange-600" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                What's your timeline?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                How much time do you want to dedicate?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration
                </label>
                <input
                  type="number"
                  value={formData.timeline.value}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    timeline: { ...prev.timeline, value: parseInt(e.target.value) || 1 }
                  }))}
                  min="1"
                  max="365"
                  className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Unit
                </label>
                <select
                  value={formData.timeline.unit}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    timeline: { ...prev.timeline, unit: e.target.value as 'days' | 'weeks' | 'months' }
                  }))}
                  className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm"
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Brain className="w-8 h-8 mx-auto mb-4 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                How do you learn best?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose your preferred learning style
              </p>
            </div>

            <div className="space-y-3">
              {learningStyleOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFormData(prev => ({ ...prev, learningStyle: option.id }))}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    formData.learningStyle === option.id
                      ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg aspect-square max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Setup
            </h2>
            <div className="flex space-x-1 mt-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full ${
                    i <= currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          {currentStep === totalSteps - 1 ? (
            <div className="space-y-3">
              <Button
                onClick={handleComplete}
                disabled={!canProceed() || isGenerating}
                loading={isGenerating}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isGenerating ? 'Generating Roadmap...' : 'Create My Roadmap'}
              </Button>
              <button
                onClick={onLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>Login to Save Progress</span>
              </button>
            </div>
          ) : (
            <div className="flex space-x-3">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-all ${
                  canProceed()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VisitorOnboardingForm;