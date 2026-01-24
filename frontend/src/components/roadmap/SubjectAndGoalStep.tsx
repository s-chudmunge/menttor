// @ts-nocheck
import React from 'react';

interface SubjectAndGoalStepProps {
  formData: {
    subject: string;
    goal: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const SubjectAndGoalStep: React.FC<SubjectAndGoalStepProps> = ({ formData, handleInputChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          What specific subject or skill do you want to learn?
          <span className="text-xs text-gray-500 block">
            (e.g., "Advanced TypeScript" instead of "Programming", or "Deep Learning with PyTorch" instead of "AI")
          </span>
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleInputChange}
          placeholder="e.g., Quantum Computing, React Native, or Product Management"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
          required
        />
      </div>
      <div>
        <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-1">
          What is your specific, measurable goal for learning this?
          <span className="text-xs text-gray-500 block">
            (Define what success looks like. E.g., "Build a full-stack e-commerce application" or "Pass the AWS Certified Developer exam")
          </span>
        </label>
        <textarea
          id="goal"
          name="goal"
          value={formData.goal}
          onChange={handleInputChange}
          rows={5}
          placeholder="e.g., 'Build a mobile app', 'Prepare for a job interview', 'Understand the basics'"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
          required
        />
      </div>
    </div>
  );
};

export default SubjectAndGoalStep;
