// @ts-nocheck
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Info, Zap, Brain, Search, Filter, List, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import ModelGridDisplay from '../../../components/ModelGridDisplay';
import ModelComparisonModal from '../../../components/ModelComparisonModal';

// This function processes the raw model data from the API
const transformModelData = (models: any) => {
  if (!models || models.length === 0) return [];
  // Simplified for clarity, original logic preserved
  return models.map((model: any) => ({
    ...model,
    provider: model.id.split(':')[0] || 'Unknown',
    developer: model.id.split('/')[0].split(':')[1] || 'Unknown',
  }));
};

const D3ModelMapModal = ({ isOpen, onClose, onSelectModel, currentModelId }) => {
  const [models, setModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('default');
  const [stagedModel, setStagedModel] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/models/`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setModels(transformModelData(data));
      } catch (e) {
        console.error("Failed to fetch models:", e);
      }
    };
    if (isOpen) fetchModels();
  }, [isOpen]);
  
  useEffect(() => {
    if (isOpen && currentModelId) {
        const initialModel = models.find(m => m.id === currentModelId);
        setStagedModel(initialModel || null);
    }
  }, [isOpen, currentModelId, models]);


  const filteredModels = useMemo(() => {
    let currentModels = models;
    if (providerFilter !== 'all') {
      currentModels = currentModels.filter(model => model.id.startsWith(`${providerFilter}:`));
    }
    if (searchQuery) {
      currentModels = currentModels.filter(model =>
        (model.name?.toLowerCase() ?? '').includes(searchQuery.toLowerCase())
      );
    }
    if (sortOrder !== 'default') {
      currentModels = [...currentModels].sort((a, b) => {
        if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
        if (sortOrder === 'cost-asc') return (a.per_token_cost || 0) - (b.per_token_cost || 0);
        return 0;
      });
    }
    return currentModels;
  }, [models, providerFilter, searchQuery, sortOrder]);

  const handleDone = () => {
    if (stagedModel) {
      onSelectModel(stagedModel.id, stagedModel.name);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700">
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select AI Model
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose a model that best fits your needs
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 p-5 flex flex-col gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Search</label>
                <input
                  type="text"
                  placeholder="Search models..."
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Provider</label>
                <select
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                >
                  <option value="all">All Providers</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="huggingface">HuggingFace</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Sort By</label>
                <select
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="default">Default</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="cost-asc">Cost (Low to High)</option>
                </select>
              </div>
            </div>

            {/* Model Grid */}
            <div className="flex-1 p-5 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => setStagedModel(model)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors relative
                      ${stagedModel?.id === model.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500'
                      }`}
                  >
                    {stagedModel?.id === model.id && (
                      <CheckCircle className="w-5 h-5 text-blue-500 absolute top-2 right-2" />
                    )}
                    <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{model.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{model.provider}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-5 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
             <div className="text-sm text-gray-600 dark:text-gray-400">
                {stagedModel ? (
                    <>
                        <span className="font-semibold">Selected:</span> {stagedModel.name}
                    </>
                ) : (
                    'No model selected'
                )}
             </div>
            <button
              onClick={handleDone}
              disabled={!stagedModel}
              className="px-6 py-2.5 font-semibold text-white rounded-lg transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:text-gray-500 bg-blue-600 hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default D3ModelMapModal;