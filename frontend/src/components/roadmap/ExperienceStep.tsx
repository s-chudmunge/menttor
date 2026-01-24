// @ts-nocheck
import React from 'react';

interface ExperienceStepProps {
  formData: {
    prior_experience: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const ExperienceStep: React.FC<ExperienceStepProps> = ({ formData, handleInputChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="prior_experience" className="block text-sm font-medium text-gray-700 mb-1">
          Do you have any prior experience in this subject or related fields?
          <span className="text-xs text-gray-500 block">
            (Optional, but helpful. Mention relevant skills, projects, or concepts you already know.)
          </span>
        </label>
        <textarea
          id="prior_experience"
          name="prior_experience"
          value={formData.prior_experience}
          onChange={handleInputChange}
          rows={5}
          placeholder="e.g., 'I know basic Python and understand object-oriented programming concepts', or 'I've built simple web pages with HTML/CSS'."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
    </div>
  );
};

export default ExperienceStep;
