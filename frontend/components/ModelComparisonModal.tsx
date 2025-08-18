import React, { useState } from 'react';
import { X, Brain, Zap, HandCoins, Cpu, Star } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  provider: string;
  category: string;
  context_window: number;
  per_token_cost: number;
  color: string;
  size: number;
  description: string;
  cost: number;
  capability: number;
  speed: number;
  top_provider: string;
}

interface ModelComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: Model[];
}

const ModelComparisonModal: React.FC<ModelComparisonModalProps> = ({
  isOpen,
  onClose,
  models,
}) => {
  const [selectedModels, setSelectedModels] = useState<Model[]>([]);

  if (!isOpen) return null;

  const toggleModelSelection = (model: Model) => {
    setSelectedModels((prevSelected) =>
      prevSelected.some((m) => m.id === model.id)
        ? prevSelected.filter((m) => m.id !== model.id)
        : [...prevSelected, model].slice(0, 3) // Limit to 3 models
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-700 text-white sticky top-0 z-10 rounded-t-2xl">
          <div>
            <h2 className="text-3xl font-extrabold flex items-center gap-3">
              <Brain className="w-8 h-8" />
              Compare AI Models
            </h2>
            <p className="text-blue-200 mt-1 text-sm">Select up to 3 models to compare their key metrics</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200 text-white"
            aria-label="Close modal"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Model Selection Area */}
        <div className="p-6 overflow-y-auto flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Available Models</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {models.map((model) => (
              <div
                key={model.id}
                onClick={() => toggleModelSelection(model)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                  ${selectedModels.some((m) => m.id === model.id)
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <div className="flex items-center mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: model.color }}
                  >
                    <Cpu className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-bold text-gray-900">{model.name}</p>
                </div>
                <p className="text-sm text-gray-600">{model.provider}</p>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          {selectedModels.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Comparison</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">Metric</th>
                      {selectedModels.map((model) => (
                        <th key={model.id} className="py-3 px-6 text-center">{model.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 text-sm">
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left font-medium">Provider</td>
                      {selectedModels.map((model) => (
                        <td key={model.id} className="py-3 px-6 text-center">{model.provider}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left font-medium">Category</td>
                      {selectedModels.map((model) => (
                        <td key={model.id} className="py-3 px-6 text-center capitalize">{model.category}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left font-medium">Context Window</td>
                      {selectedModels.map((model) => (
                        <td key={model.id} className="py-3 px-6 text-center">{model.context_window}k</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left font-medium flex items-center gap-2"><Brain className="w-4 h-4 text-purple-500" /> Capability</td>
                      {selectedModels.map((model) => (
                        <td key={model.id} className="py-3 px-6 text-center">{model.capability}%</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left font-medium flex items-center gap-2"><Zap className="w-4 h-4 text-green-500" /> Speed</td>
                      {selectedModels.map((model) => (
                        <td key={model.id} className="py-3 px-6 text-center">{model.speed}%</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left font-medium flex items-center gap-2"><HandCoins className="w-4 h-4 text-red-500" /> Cost Level</td>
                      {selectedModels.map((model) => (
                        <td key={model.id} className="py-3 px-6 text-center">{model.cost}%</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelComparisonModal;