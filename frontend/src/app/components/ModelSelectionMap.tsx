// @ts-nocheck
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Info, Zap, DollarSign, Brain, RotateCcw, Search, Filter, Cpu, TrendingUp, HandCoins, Star, List, ChevronLeft, ChevronRight } from 'lucide-react';
import ModelGridDisplay from '../../../components/ModelGridDisplay';
import ModelComparisonModal from '../../../components/ModelComparisonModal';

const transformModelData = (models: any) => {
  if (!models || models.length === 0) return [];

  // Removed the explicit limit to allow all fetched models to be processed
  // const limitedModels = models.slice(0, 50);

  if (models.length === 0) return [];

  const costs = models.map((m: any) => m.per_token_cost).filter((c: any) => c > 0);
  const contextWindows = models.map((m: any) => m.context_window).filter(Boolean);

  const minCost = costs.length > 0 ? Math.min(...costs) : 0;
  const maxCost = costs.length > 0 ? Math.max(...costs) : 0;
  const minContext = contextWindows.length > 0 ? Math.min(...contextWindows) : 0;
  const maxContext = contextWindows.length > 0 ? Math.max(...contextWindows) : 1;

  const logMinCost = minCost > 0 ? Math.log(minCost) : 0;
  const logMaxCost = maxCost > 0 ? Math.log(maxCost) : 0;
  const logCostRange = (logMaxCost - logMinCost) > 0 ? (logMaxCost - logMinCost) : 1;
  const contextRange = (maxContext - minContext) > 0 ? (maxContext - minContext) : 1;

  const getRadius = (contextWindow: any) => {
    if (contextWindow <= 8000) return 20; // Small
    if (contextWindow <= 128000) return 40; // Medium
    return 80; // Large
  };

  const getCategoryColor = (category: any) => {
    switch (category) {
      case 'premium': return '#8A2BE2'; // Premium (BlueViolet)
      case 'balanced': return '#20B2AA'; // Balanced (LightSeaGreen)
      case 'free': return '#708090'; // Free (SlateGray)
      default: return '#708090';
    }
  };

  const developerDomainMap = {
    'google': 'google.com',
    'meta': 'meta.com',
    'microsoft': 'microsoft.com',
    'anthropic': 'anthropic.com',
    'openai': 'openai.com',
    'mistral': 'mistral.ai',
    'bytedance': 'bytedance.com',
    'deepseek': 'deepseek.com',
    'qwen': 'qwen.ai',
    'huggingface': 'huggingface.co',
    // Add more mappings as needed
  };

  return models.map((model: any) => {
    let cost = 0;
    if (model.per_token_cost > 0 && minCost > 0) {
      const logCost = Math.log(model.per_token_cost);
      cost = Math.max(0, Math.min(100, Math.round(((logCost - logMinCost) / logCostRange) * 100)));
    }

    let capability = 0;
    if (model.context_window && minContext >= 0) {
      capability = Math.max(0, Math.min(100, Math.round(((model.context_window - minContext) / contextRange) * 100)));
    }

    let speed = 50;
    if (model.max_tokens) {
      const maxTokensList = models.map(m => m.max_tokens).filter(Boolean);
      const maxOverallTokens = maxTokensList.length > 0 ? Math.max(...maxTokensList) : 1;
      speed = Math.round((model.max_tokens / maxOverallTokens) * 100);
    }

    let category = 'balanced';
    if (cost > 65) category = 'premium';
    else if (cost < 5) category = 'free';

    let color = getCategoryColor(category);
    let size = getRadius(model.context_window);
    const provider = model.id.split(':')[0] || 'Unknown';
    
    let developerName = 'Unknown';
    if (model.id.includes('/')) {
      developerName = model.id.split('/')[0].split(':')[1] || 'Unknown';
    } else {
      const nameParts = model.name.split(':');
      if (nameParts.length > 1) {
        developerName = nameParts[0];
      } else {
        developerName = model.provider;
      }
    }
    developerName = developerName ? String(developerName) : 'Unknown';

    const developerKey = Object.keys(developerDomainMap).find(key => developerName.toLowerCase().includes(key));
    const domain = developerKey ? developerDomainMap[developerKey] : 'default.com';
    const logoUrl = `https://logo.clearbit.com/${domain}`;

    return {
      ...model,
      cost,
      capability,
      speed,
      category,
      color,
      size,
      provider,
      developer: developerName,
      logoUrl,
    };
  });
};

const D3ModelMapModal = ({ isOpen, onClose, onSelectModel, currentModelId }) => {
  const [hoveredModel, setHoveredModel] = useState(null);
  const [mapView, setMapView] = useState('grid'); // Default to grid view
  const [providerFilter, setProviderFilter] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [models, setModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [costFilter, setCostFilter] = useState('all'); // 'all', 'free', 'low', 'medium', 'high'
  const [capabilityFilter, setCapabilityFilter] = useState('all'); // 'all', 'small', 'medium', 'large'
  const [speedFilter, setSpeedFilter] = useState('all'); // 'all', 'slow', 'medium', 'fast'
  const [sortOrder, setSortOrder] = useState('default'); // 'default', 'name-asc', 'cost-asc', 'capability-desc', 'speed-desc'
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);

  const filteredModels = useMemo(() => {
    let currentModels = models;

    // Provider Filter
    if (providerFilter !== 'all') {
      currentModels = currentModels.filter(model => model.id.startsWith(`${providerFilter}:`));
    }

    // Search Filter
    if (searchQuery) {
      currentModels = currentModels.filter(model =>
        (model.name?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()) ||
        (model.provider?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()) ||
        (model.description?.toLowerCase() ?? '').includes(searchQuery.toLowerCase())
      );
    }

    // Cost Filter
    if (costFilter !== 'all') {
      currentModels = currentModels.filter(model => {
        if (costFilter === 'free') return model.cost < 5;
        if (costFilter === 'low') return model.cost >= 5 && model.cost < 30;
        if (costFilter === 'medium') return model.cost >= 30 && model.cost < 70;
        if (costFilter === 'high') return model.cost >= 70;
        return true;
      });
    }

    // Capability Filter
    if (capabilityFilter !== 'all') {
      currentModels = currentModels.filter(model => {
        if (capabilityFilter === 'small') return model.context_window <= 8000;
        if (capabilityFilter === 'medium') return model.context_window > 8000 && model.context_window <= 128000;
        if (capabilityFilter === 'large') return model.context_window > 128000;
        return true;
      });
    }

    // Speed Filter
    if (speedFilter !== 'all') {
      currentModels = currentModels.filter(model => {
        if (speedFilter === 'slow') return model.speed < 30;
        if (speedFilter === 'medium') return model.speed >= 30 && model.speed < 70;
        if (speedFilter === 'fast') return model.speed >= 70;
        return true;
      });
    }

    // Sorting
    if (sortOrder !== 'default') {
      currentModels = [...currentModels].sort((a, b) => {
        if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
        if (sortOrder === 'cost-asc') return a.cost - b.cost;
        if (sortOrder === 'capability-desc') return b.capability - a.capability;
        if (sortOrder === 'speed-desc') return b.speed - a.speed;
        return 0;
      });
    }

    return currentModels;
  }, [models, providerFilter, searchQuery, costFilter, capabilityFilter, speedFilter, sortOrder]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/models/`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setModels(transformModelData(data));
      } catch (e) {
        console.error(e);
      }
    };

    if (isOpen) {
      fetchModels();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentModel = filteredModels.find(m => m.id === currentModelId);

  // Reset expanded description when switching models
  useEffect(() => {
    setExpandedDescription(false);
  }, [hoveredModel?.id, currentModel?.id]);

  const formatContextWindow = (window) => {
    if (!window) return 'N/A';
    return `${window / 1000}k`;
  };

  const formatCost = (cost) => {
    if (cost === 0) return 'Free';
    if (!cost) return 'N/A';
    return `$${cost.toExponential(1)}`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans">
        <div className="bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden relative border border-gray-200/50 dark:border-gray-700/50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-700 dark:from-indigo-800 dark:via-blue-800 dark:to-purple-800 text-white sticky top-0 z-10 rounded-t-3xl">
            <h2 className="text-sm font-semibold">Choose Model</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mx-6 mt-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-700/50 rounded-2xl text-amber-800 dark:text-amber-300 shadow-sm">
            <p className="font-semibold flex items-center gap-3">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-white" />
              </div>
              <span>Currently, only models marked as 'Free Tier' are fully functional. We are actively working to enable paid model access as we secure further funding.</span>
            </p>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className={`transition-all duration-300 ease-in-out bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col ${
              isSidebarOpen ? 'w-96' : 'w-0'
            }`}>
              <div className="flex-1 p-6 overflow-y-auto min-h-0">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Filters & Controls</h3>
                </div>
                <div className="flex flex-col gap-8">
                  <div>
                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 block">View Mode</label>
                    <div className="flex gap-2">
                      {[
                        { key: 'grid', label: 'Grid' },
                        { key: 'list', label: 'List' },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setMapView(key)}
                          className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm border
                          ${
                            mapView === key
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-300 shadow-lg scale-105'
                              : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 hover:bg-white hover:scale-102 border-gray-300 dark:border-gray-600 backdrop-blur-sm'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 block">Provider</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-gray-200 font-medium transition-all duration-300"
                      value={providerFilter}
                      onChange={(e) => setProviderFilter(e.target.value)}
                    >
                      <option value="all">All Providers</option>
                      <option value="openrouter">OpenRouter</option>
                      <option value="huggingface">HuggingFace</option>
                      <option value="vertexai">Vertex AI</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 block">Search Models</label>
                    <input
                      type="text"
                      placeholder="Search by name, provider..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-gray-200 font-medium placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 block">Cost Range</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-gray-200 font-medium transition-all duration-300"
                      value={costFilter}
                      onChange={(e) => setCostFilter(e.target.value)}
                    >
                      <option value="all">All Costs</option>
                      <option value="free">Free</option>
                      <option value="low">Low Cost</option>
                      <option value="medium">Medium Cost</option>
                      <option value="high">High Cost</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 block">Capability</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-gray-200 font-medium transition-all duration-300"
                      value={capabilityFilter}
                      onChange={(e) => setCapabilityFilter(e.target.value)}
                    >
                      <option value="all">All Capabilities</option>
                      <option value="small">Small Context</option>
                      <option value="medium">Medium Context</option>
                      <option value="large">Large Context</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 block">Performance</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-gray-200 font-medium transition-all duration-300"
                      value={speedFilter}
                      onChange={(e) => setSpeedFilter(e.target.value)}
                    >
                      <option value="all">All Speeds</option>
                      <option value="slow">Slower</option>
                      <option value="medium">Balanced</option>
                      <option value="fast">Fastest</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 block">Sort By</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-gray-200 font-medium transition-all duration-300"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    >
                      <option value="default">Default Order</option>
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="cost-asc">Cost (Low to High)</option>
                      <option value="capability-desc">Capability (High to Low)</option>
                      <option value="speed-desc">Speed (High to Low)</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setShowComparisonModal(true)}
                    className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <List className="w-5 h-5" /> Compare Models
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 flex flex-col items-center justify-center bg-gradient-to-br from-white/40 to-blue-50/60 dark:from-gray-800/40 dark:to-blue-900/20 backdrop-blur-sm relative">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute top-1/2 -left-5 -translate-y-1/2 p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-20 border-2 border-white/20"
                aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>

              {mapView === 'grid' ? (
                <ModelGridDisplay
                  models={filteredModels}
                  onSelectModel={onSelectModel}
                  currentModelId={currentModelId}
                  setHoveredModel={setHoveredModel}
                />
              ) : (
                <div className="w-full h-full overflow-y-auto pr-4">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">All Models</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Browse all available models in list format</p>
                  </div>
                  <div className="space-y-2">
                    {filteredModels.map(model => (
                      <div 
                        key={model.id}
                        onMouseEnter={() => setHoveredModel(model)}
                        onMouseLeave={() => setHoveredModel(null)}
                        className={`group relative bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                          currentModelId === model.id 
                            ? 'ring-2 ring-indigo-400 dark:ring-indigo-500 shadow-md bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20' 
                            : 'hover:bg-white/80 dark:hover:bg-gray-700/80'
                        }`}>
                        
                        {/* Selected indicator */}
                        {currentModelId === model.id && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <Star className="w-2.5 h-2.5 text-white fill-white" />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Model icon/logo - smaller */}
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 border border-white/50"
                              style={{ backgroundColor: model.color }}
                            >
                              <img 
                                src={model.logoUrl} 
                                alt={`${model.developer} logo`} 
                                className="w-5 h-5 object-contain" 
                                onError={(e) => { 
                                  e.currentTarget.style.display = 'none'; 
                                  e.currentTarget.nextSibling.style.display = 'block'; 
                                }}
                              />
                              <Brain className="w-4 h-4 text-white opacity-90" style={{ display: 'none' }} />
                            </div>
                            
                            {/* Model info - more compact */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {model.name}
                                </h4>
                                <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                                  model.category === 'premium' 
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                                    : model.category === 'balanced' 
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}>
                                  {model.category === 'premium' ? 'Premium' : model.category === 'balanced' ? 'Balanced' : 'Free'}
                                </div>
                              </div>
                              
                              {/* Provider and quick stats */}
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                  {model.provider}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Brain className="w-3 h-3" />
                                  {formatContextWindow(model.context_window)}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <HandCoins className="w-3 h-3" />
                                  {formatCost(model.per_token_cost)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action button - compact */}
                          <button 
                            onClick={() => { onSelectModel(model.id, model.name); onClose(); }}
                            className={`ml-3 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                              currentModelId === model.id
                                ? 'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:scale-105'
                            }`}
                            disabled={currentModelId === model.id}
                          >
                            {currentModelId === model.id ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Model Details Panel */}
            <div className="w-96 flex-shrink-0 border-l border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-white/60 to-blue-50/40 dark:from-gray-800/60 dark:to-blue-900/20 backdrop-blur-sm p-8 overflow-y-auto">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">Model Details</h3>
              {hoveredModel || currentModel ? (
                <div className="space-y-4">
                  {/* Compact header */}
                  <div className="text-center pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border-2 border-white/50"
                        style={{ backgroundColor: (hoveredModel || currentModel).color }}
                      >
                        <img 
                          src={(hoveredModel || currentModel).logoUrl} 
                          alt={`${(hoveredModel || currentModel).developer} logo`} 
                          className="w-8 h-8 object-contain" 
                          onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block'; }}
                        />
                        <Cpu className="w-6 h-6 text-white opacity-90" style={{ display: 'none' }}/>
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
                          {(hoveredModel || currentModel).name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {(hoveredModel || currentModel).provider}
                        </p>
                      </div>
                    </div>
                    {currentModel?.id === (hoveredModel || currentModel).id && (
                      <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-800 dark:text-amber-300 shadow-md border border-amber-200 dark:border-amber-700/50">
                        <Star className="w-3 h-3 mr-1.5 fill-amber-500 text-amber-500" /> Selected
                      </span>
                    )}
                  </div>

                  {/* Compact description with read more */}
                  <div className="bg-white/40 dark:bg-gray-700/40 backdrop-blur-sm rounded-xl p-3 border border-gray-200/30 dark:border-gray-600/30">
                    <p className={`text-xs text-gray-800 dark:text-gray-200 leading-relaxed ${expandedDescription ? '' : 'line-clamp-3'}`}>
                      {(hoveredModel || currentModel).description}
                    </p>
                    {(hoveredModel || currentModel).description && (hoveredModel || currentModel).description.length > 150 && (
                      <button
                        onClick={() => setExpandedDescription(!expandedDescription)}
                        className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                      >
                        {expandedDescription ? 'Read less' : 'Read more'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {[
                      { 
                        label: 'Context Window', 
                        value: formatContextWindow((hoveredModel || currentModel).context_window), 
                        rawValue: (hoveredModel || currentModel).context_window,
                        icon: Brain, 
                        unit: '', 
                        gradient: 'from-blue-400 via-blue-500 to-blue-600'
                      },
                      { 
                        label: 'Cost Per Token', 
                        value: formatCost((hoveredModel || currentModel).per_token_cost), 
                        rawValue: (hoveredModel || currentModel).per_token_cost,
                        icon: HandCoins, 
                        unit: '', 
                        gradient: 'from-emerald-400 via-emerald-500 to-emerald-600'
                      },
                      { 
                        label: 'Capability', 
                        value: (hoveredModel || currentModel).capability, 
                        rawValue: (hoveredModel || currentModel).capability,
                        icon: Brain, 
                        unit: '%', 
                        gradient: 'from-purple-400 via-purple-500 to-purple-600'
                      },
                      { 
                        label: 'Speed', 
                        value: (hoveredModel || currentModel).speed, 
                        rawValue: (hoveredModel || currentModel).speed,
                        icon: Zap, 
                        unit: '%', 
                        gradient: 'from-orange-400 via-orange-500 to-orange-600'
                      },
                    ].map(({ label, value, rawValue, icon: Icon, unit, gradient }) => (
                      <div key={label} className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-gray-600/50 shadow-sm">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center shadow-sm`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{label}</span>
                          </div>
                          <span className={`text-sm font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                            {value}{unit}
                          </span>
                        </div>
                        
                        {/* Simple badge for cost */}
                        {label === 'Cost Per Token' && rawValue === 0 && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                              FREE
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Compact category */}
                  <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-center">
                      <div className={`inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold shadow-sm border ${
                        (hoveredModel || currentModel).category === 'premium' 
                          ? 'bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700/50' 
                          : (hoveredModel || currentModel).category === 'balanced' 
                          ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700/50'
                          : 'bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800/60 dark:to-slate-800/60 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          (hoveredModel || currentModel).category === 'premium' 
                            ? 'bg-gradient-to-r from-purple-500 to-violet-600' 
                            : (hoveredModel || currentModel).category === 'balanced' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                            : 'bg-gradient-to-r from-gray-500 to-slate-600'
                        }`}></div>
                        {(hoveredModel || currentModel).category.replace(/\b\w/g, char => char.toUpperCase())} Tier
                      </div>
                    </div>
                  </div>

                  {hoveredModel && hoveredModel.id !== currentModel?.id && (
                    <button
                      onClick={() => onSelectModel(hoveredModel.id, hoveredModel.name)}
                      className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      Select This Model
                    </button>
                  )}
                   {currentModel && hoveredModel && hoveredModel.id === currentModel.id && (
                    <button
                      disabled
                      className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 text-gray-600 dark:text-gray-400 rounded-xl cursor-not-allowed font-bold text-sm shadow-inner"
                    >
                      Already Selected
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 pt-16">
                  <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6 shadow-md">
                    <Info className="w-10 h-10 text-blue-400" />
                  </div>
                  <h4 className="font-bold text-lg text-gray-700 mb-3">Discover Models</h4>
                  <p className="text-sm leading-relaxed max-w-xs mx-auto">
                    Click on any model bubble on the map to view its detailed profile and select it for your application.
                  </p>
                  <p className="text-sm leading-relaxed max-w-xs mx-auto mt-2">
                    Use the view toggles above to change the map's focus.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ModelComparisonModal
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        models={models}
      />
    </>
  );
};

export default D3ModelMapModal;