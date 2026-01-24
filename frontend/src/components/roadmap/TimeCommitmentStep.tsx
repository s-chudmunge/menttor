// @ts-nocheck
import React from 'react';

interface TimeCommitmentStepProps {
  formData: {
    time_value: number;
    time_unit: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  startDate: string | null;
  endDate: string | null;
  handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TimeCommitmentStep: React.FC<TimeCommitmentStepProps> = ({
  formData,
  handleInputChange,
  startDate,
  endDate,
  handleDateChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="time_value" className="block text-sm font-medium text-gray-700 mb-1">
          How much dedicated time can you realistically commit?
          <span className="text-xs text-gray-500 block">
            (Be realistic about your availability. This affects the scope and pace of your roadmap.)
          </span>
        </label>
        <div className="flex space-x-2">
          <input
            type="number"
            id="time_value"
            name="time_value"
            value={formData.time_value}
            onChange={handleInputChange}
            min="1"
            placeholder="e.g., 4"
            className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
          <select
            name="time_unit"
            value={formData.time_unit}
            onChange={handleInputChange}
            className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
          Start Date (Optional)
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          value={startDate || ''}
          onChange={handleDateChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
          End Date (Optional)
        </label>
        <input
          type="date"
          id="endDate"
          name="endDate"
          value={endDate || ''}
          onChange={handleDateChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
    </div>
  );
};

export default TimeCommitmentStep;
