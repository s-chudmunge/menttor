'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../src/app/context/AuthContext';
import { 
  X, 
  Sparkles, 
  Loader2,
  User,
  LogIn,
  Brain,
  Atom,
  Waves,
  Dna,
  Globe,
  Cog,
  Zap,
  Cpu,
  ArrowRight,
  ChevronDown,
  Info
} from 'lucide-react';

interface CategoryOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  examples: string[];
  color: string;
}

const categories: CategoryOption[] = [
  {
    id: 'physics',
    name: 'Physics & Mechanics',
    icon: <Atom className="w-6 h-6" />,
    description: 'Realistic physics simulations with collision detection, gravity, forces, and constraints',
    examples: ["Newton's cradle", "pendulum systems", "collision dynamics", "spring oscillations"],
    color: 'from-blue-600 to-indigo-600'
  },
  {
    id: 'molecular',
    name: 'Molecular & Chemistry',
    icon: <Dna className="w-6 h-6" />,
    description: 'Professional molecular visualization with accurate chemical structures',
    examples: ["DNA double helix", "protein structures", "chemical reactions", "molecular bonds"],
    color: 'from-green-600 to-emerald-600'
  },
  {
    id: 'fluid',
    name: 'Fluid Dynamics',
    icon: <Waves className="w-6 h-6" />,
    description: 'Particle-based fluid simulations for liquids and gases',
    examples: ["water flow", "gas diffusion", "turbulence", "aerodynamics"],
    color: 'from-cyan-600 to-blue-600'
  },
  {
    id: 'biology',
    name: 'Biology & Anatomy',
    icon: <Brain className="w-6 h-6" />,
    description: 'Biological systems and anatomical structures',
    examples: ["cell division", "neural networks", "circulatory system", "ecosystem interactions"],
    color: 'from-pink-600 to-rose-600'
  },
  {
    id: 'astronomy',
    name: 'Astronomy & Space',
    icon: <Globe className="w-6 h-6" />,
    description: 'Celestial mechanics and space phenomena',
    examples: ["planetary orbits", "galaxy formation", "star lifecycle", "gravitational waves"],
    color: 'from-purple-600 to-violet-600'
  },
  {
    id: 'engineering',
    name: 'Engineering Systems',
    icon: <Cog className="w-6 h-6" />,
    description: 'Complex engineering structures and systems',
    examples: ["bridge mechanics", "circuit analysis", "mechanical systems", "structural dynamics"],
    color: 'from-orange-600 to-amber-600'
  },
  {
    id: 'quantum',
    name: 'Quantum Physics',
    icon: <Zap className="w-6 h-6" />,
    description: 'Quantum phenomena and atomic-scale physics',
    examples: ["electron orbitals", "wave functions", "quantum tunneling", "particle interactions"],
    color: 'from-yellow-600 to-orange-600'
  },
  {
    id: 'electrical',
    name: 'Electrical Systems',
    icon: <Cpu className="w-6 h-6" />,
    description: 'Electrical circuits and electromagnetic phenomena',
    examples: ["circuit simulation", "electromagnetic fields", "power systems", "electronic components"],
    color: 'from-red-600 to-pink-600'
  }
];

const complexityLevels = [
  { id: 'basic', name: 'Basic', description: 'Simple, educational demonstrations' },
  { id: 'intermediate', name: 'Intermediate', description: 'Balanced complexity with realistic physics' },
  { id: 'advanced', name: 'Advanced', description: 'Complex simulations with detailed physics' },
  { id: 'research', name: 'Research', description: 'Scientific-grade simulations with cutting-edge accuracy' }
];

const realismLevels = [
  { id: 'educational', name: 'Educational', description: 'Clear, simplified for learning' },
  { id: 'realistic', name: 'Realistic', description: 'Balanced realism and performance' },
  { id: 'photorealistic', name: 'Photorealistic', description: 'Maximum visual fidelity' }
];

interface RealisticSimGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  selectedModelName: string;
  onModelSelect: () => void;
}

const RealisticSimGeneratorModal: React.FC<RealisticSimGeneratorModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedModel, 
  selectedModelName, 
  onModelSelect 
}) => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [complexity, setComplexity] = useState('intermediate');
  const [realismLevel, setRealismLevel] = useState('realistic');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) return;
    
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    setIsGenerating(true);
    
    // Build the realistic simulation URL
    const params = new URLSearchParams({
      description: description.trim(),
      model: selectedModel,
      complexity,
      realism_level: realismLevel,
      interactivity: 'interactive'
    });
    
    if (selectedCategory) {
      params.set('category', selectedCategory);
    }
    
    const realisticSimUrl = `/realistic-simulation?${params.toString()}`;
    window.open(realisticSimUrl, '_blank', 'noopener,noreferrer');
    
    // Reset form and close modal after a short delay
    setTimeout(() => {
      setDescription('');
      setSelectedCategory('');
      setIsGenerating(false);
      onClose();
    }, 1000);
  };

  const isFormValid = description.trim().length >= 5;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl relative max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-violet-600 to-purple-600">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Create Realistic 3D Simulation
            </h2>
            <p className="text-white/90">
              Generate advanced physics-based 3D simulations with professional-grade libraries
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Description Input */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe what you want to simulate
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., DNA double helix with realistic molecular dynamics, Newton's cradle with accurate physics, quantum wave function visualization..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none transition-colors"
                rows={3}
                maxLength={500}
                disabled={loading || isGenerating}
              />
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {description.length}/500 characters
                </span>
                <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                  <Info className="w-3 h-3" />
                  <span>Be specific for better results</span>
                </div>
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Choose simulation category (optional - AI will auto-detect)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(selectedCategory === category.id ? '' : category.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedCategory === category.id
                        ? `border-violet-500 bg-gradient-to-r ${category.color} text-white shadow-lg scale-105`
                        : 'border-gray-200 dark:border-gray-600 hover:border-violet-300 dark:hover:border-violet-500 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-lg ${selectedCategory === category.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-600'}`}>
                        {React.cloneElement(category.icon as React.ReactElement, {
                          className: `w-5 h-5 ${selectedCategory === category.id ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`
                        })}
                      </div>
                      <h3 className={`font-medium text-sm ${selectedCategory === category.id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {category.name}
                      </h3>
                    </div>
                    <p className={`text-xs ${selectedCategory === category.id ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                      {category.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              <span className="text-sm font-medium">Advanced Settings</span>
            </button>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Complexity Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Complexity Level
                    </label>
                    <select
                      value={complexity}
                      onChange={(e) => setComplexity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {complexityLevels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name} - {level.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Realism Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Realism Level
                    </label>
                    <select
                      value={realismLevel}
                      onChange={(e) => setRealismLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {realismLevels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name} - {level.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* AI Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Brain className="w-4 h-4 inline mr-2" />
                    AI Model Selection
                  </label>
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{selectedModelName}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Advanced AI for realistic 3D generation</div>
                    </div>
                    <button
                      type="button"
                      onClick={onModelSelect}
                      className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 text-sm font-medium transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || loading || isGenerating}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-3 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Opening Realistic Simulation...</span>
                </>
              ) : !user ? (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In to Generate</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Generate Realistic Simulation</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Sign-in prompt */}
            {!user && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Sign in required:</strong> Create an account to generate advanced realistic 3D simulations with professional physics engines.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

// Simple card component for triggering the modal
interface RealisticSimGeneratorCardProps {
  onClick: () => void;
  className?: string;
}

const RealisticSimGeneratorCard: React.FC<RealisticSimGeneratorCardProps> = ({ onClick, className = '' }) => {
  return (
    <div 
      onClick={onClick}
      className={`cursor-pointer bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900 dark:to-purple-900 rounded-xl p-4 border border-violet-200 dark:border-violet-700 hover:from-violet-200 hover:to-purple-200 dark:hover:from-violet-800 dark:hover:to-purple-800 transition-all duration-200 transform hover:scale-105 ${className}`}
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Realistic 3D Simulation
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Advanced physics-based simulations
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-violet-600 dark:text-violet-400" />
      </div>
    </div>
  );
};

export { RealisticSimGeneratorModal, RealisticSimGeneratorCard };
export default RealisticSimGeneratorCard;