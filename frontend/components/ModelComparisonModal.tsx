import React, { useState } from 'react';
import { X, Brain, CheckCircle } from 'lucide-react';

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

interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: Model[];
  // onModelSelect: (model: Model) => void; // Optional: Callback for when a model is selected
}

const ModelSelectionModal: React.FC<ModelSelectionModalProps> = ({
  isOpen,
  onClose,
  models,
}) => {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  if (!isOpen) return null;

  const handleModelSelect = (model: Model) => {
    setSelectedModel(model);
  };

  const handleDone = () => {
    // if (selectedModel) {
    //   onModelSelect(selectedModel);
    // }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <Brain className="w-7 h-7 text-gray-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Select a Model
              </h2>
              <p className="text-sm text-gray-500">Choose an AI model to power your task</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Model Selection Area */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <div
                key={model.id}
                onClick={() => handleModelSelect(model)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 relative
                  ${selectedModel?.id === model.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              >
                {selectedModel?.id === model.id && (
                  <CheckCircle className="w-5 h-5 text-blue-500 absolute top-2 right-2" />
                )}
                <p className="font-bold text-gray-900 text-base truncate">{model.name}</p>
                <p className="text-sm text-gray-600 truncate">{model.top_provider}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer with Done button */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {selectedModel && (
            <button
              onClick={handleDone}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Done
            </button>
          )}
          {!selectedModel && (
             <button
              className="w-full bg-gray-300 text-gray-500 font-bold py-3 px-4 rounded-lg cursor-not-allowed"
              disabled
            >
              Select a model to continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelSelectionModal;