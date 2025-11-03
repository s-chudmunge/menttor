import React, { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  description: string;
  free_trial: boolean;
}

interface Props {
  onSelectModel: (model: string) => void;
  onClose: () => void;
  title: string;
}

const ModelSelectModal: React.FC<Props> = ({ onSelectModel, onClose, title }) => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>('');

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/models/`);
        const data = await response.json();
        setModels(data);
        
        // Set default selection to first available model
        if (data.length > 0) {
          setSelectedModel(data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
        // Fallback to default models
        const fallbackModels = [
          {
            id: 'openrouter:meta-llama/llama-3.3-8b-instruct:free',
            name: 'Meta Llama 3.3 8B (free)',
            description: 'Fast and efficient free model for content generation',
            free_trial: true
          },
          {
            id: 'openrouter:meta-llama/llama-3.2-3b-instruct:free',
            name: 'Meta Llama 3.2 3B (free)',
            description: 'Lightweight free model for quick tasks',
            free_trial: true
          },
          {
            id: 'vertexai:gemini-2.5-pro',
            name: 'Gemini 2.5 Pro',
            description: 'Highest quality output for complex content',
            free_trial: true
          }
        ];
        setModels(fallbackModels);
        setSelectedModel(fallbackModels[0].id);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleGenerate = () => {
    if (selectedModel) {
      onSelectModel(selectedModel);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Choose an AI model to regenerate the content. Different models have different strengths.
            </p>
          </div>

          {/* Content */}
          <div className="bg-white px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-gray-600">Loading models...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {models.map((model) => (
                  <div 
                    key={model.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedModel === model.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedModel(model.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="model"
                            value={model.id}
                            checked={selectedModel === model.id}
                            onChange={() => setSelectedModel(model.id)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <h4 className="font-medium text-gray-900">{model.name}</h4>
                          {model.free_trial && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <Zap className="w-3 h-3 mr-1" />
                              Free
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!selectedModel || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSelectModal;