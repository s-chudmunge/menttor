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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl w-full h-full sm:max-w-4xl sm:w-full sm:max-h-[95vh] flex flex-col overflow-hidden relative">
        {/* Mobile-Optimized Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-700 text-white sticky top-0 z-10 rounded-t-lg sm:rounded-t-2xl">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-3xl font-extrabold flex items-center gap-2 sm:gap-3">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8" />
              <span className="truncate">Compare AI Models</span>
            </h2>
            <p className="text-blue-200 mt-1 text-xs sm:text-sm hidden sm:block">Select up to 3 models to compare their key metrics</p>
            <p className="text-blue-200 mt-1 text-xs sm:hidden">Select up to 3 models</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200 text-white ml-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 sm:w-7 sm:h-7" />
          </button>
        </div>

        {/* Model Selection Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Available Models</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {models.map((model) => (
              <div
                key={model.id}
                onClick={() => toggleModelSelection(model)}
                className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                  ${selectedModels.some((m) => m.id === model.id)
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <div className="flex items-center mb-2">
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-2 sm:mr-3"
                    style={{ backgroundColor: model.color }}
                  >
                    <Cpu className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{model.name}</p>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{model.provider}</p>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          {selectedModels.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Comparison</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm text-sm sm:text-base">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-xs sm:text-sm leading-normal">
                      <th className="py-2 px-3 sm:py-3 sm:px-6 text-left">Metric</th>
                      {selectedModels.map((model) => (
                        <th key={model.id} className="py-2 px-3 sm:py-3 sm:px-6 text-center">
                          <span className="truncate block" title={model.name}>
                            {model.name.length > 15 ? `${model.name.substring(0, 15)}...` : model.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 text-xs sm:text-sm">
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-3 sm:py-3 sm:px-6 text-left font-medium">Provider</td>
                      {selectedModels.map((model) => (
                        <td key={model.id} className="py-2 px-3 sm:py-3 sm:px-6 text-center">
                          <span className="truncate block" title={model.provider}>
                            {model.provider.length > 12 ? `${model.provider.substring(0, 12)}...` : model.provider}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-3 sm:py-3 sm:px-6 text-left font-medium">Category</td>
                      {selectedModels.map((model) => (
                        <td key={model.id} className="py-2 px-3 sm:py-3 sm:px-6 text-center capitalize">{model.category}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-3 sm:py-3 sm:px-6 text-left font-medium">Context Window</td>
                      {selectedModels.map((model) => (
                        <td key={model.id} className="py-2 px-3 sm:py-3 sm:px-6 text-center">{model.context_window}k</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-3 sm:py-3 sm:px-6 text-left font-medium">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" /> 
                          <span className="hidden sm:inline">Capability</span>
                          <span className="sm:hidden">Cap.</span>
                        </div>
                      </td>
                      {selectedModels.map((model) => (
                        <td key={model.id} className="py-2 px-3 sm:py-3 sm:px-6 text-center">{model.capability}%</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-3 sm:py-3 sm:px-6 text-left font-medium">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" /> 
                          <span>Speed</span>
                        </div>
                      </td>
                      {selectedModels.map((model) => (
                        <td key={model.id} className="py-2 px-3 sm:py-3 sm:px-6 text-center">{model.speed}%</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-3 sm:py-3 sm:px-6 text-left font-medium">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <HandCoins className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" /> 
                          <span className="hidden sm:inline">Cost Level</span>
                          <span className="sm:hidden">Cost</span>
                        </div>
                      </td>
                      {selectedModels.map((model) => (
                        <td key={model.id} className="py-2 px-3 sm:py-3 sm:px-6 text-center">{model.cost}%</td>
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