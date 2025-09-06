'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import RealisticSimViewer from '../../../components/RealisticSimViewer';
import { 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  Sparkles,
  Clock,
  Cpu,
  Zap,
  RefreshCw
} from 'lucide-react';

interface RealisticSimulationData {
  html_content: string;
  category: string;
  libraries_used: string[];
  component_analysis: any;
  cached: boolean;
}

function RealisticSimulationPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [simulationData, setSimulationData] = useState<RealisticSimulationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const description = searchParams.get('description') || '';
  const category = searchParams.get('category') || undefined;
  const complexity = searchParams.get('complexity') || 'intermediate';
  const realismLevel = searchParams.get('realism_level') || 'realistic';
  const interactivity = searchParams.get('interactivity') || 'interactive';
  const model = searchParams.get('model') || 'gemini-2.5-flash-lite';

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/signin');
      return;
    }

    if (!description) {
      setError('No simulation description provided');
      setIsLoading(false);
      return;
    }

    fetchRealisticSimulation();
  }, [user, authLoading, description, category, complexity, realismLevel, model]);

  const fetchRealisticSimulation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setStartTime(Date.now());

      const params = new URLSearchParams({
        description,
        complexity,
        realism_level: realismLevel,
        interactivity,
        model
      });

      if (category) {
        params.set('category', category);
      }

      const response = await fetch(`/api/realistic-simulation?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate realistic simulation');
      }

      const data = await response.json();
      setSimulationData(data);
    } catch (error) {
      console.error('Error fetching realistic simulation:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const handleRetry = () => {
    fetchRealisticSimulation();
  };

  const getLoadingStage = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed < 3000) return "Analyzing simulation requirements...";
    if (elapsed < 8000) return "Loading physics engines and specialized libraries...";
    if (elapsed < 15000) return "Generating realistic 3D simulation with AI...";
    if (elapsed < 25000) return "Optimizing physics calculations and rendering...";
    return "Finalizing advanced simulation features...";
  };

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'physics': return '⚛️';
      case 'molecular': return '🧬';
      case 'fluid': return '🌊';
      case 'biology': return '🧠';
      case 'astronomy': return '🪐';
      case 'engineering': return '🔧';
      case 'quantum': return '⚡';
      case 'electrical': return '🔌';
      default: return '🔬';
    }
  };

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'physics': return 'from-blue-600 to-indigo-600';
      case 'molecular': return 'from-green-600 to-emerald-600';
      case 'fluid': return 'from-cyan-600 to-blue-600';
      case 'biology': return 'from-pink-600 to-rose-600';
      case 'astronomy': return 'from-purple-600 to-violet-600';
      case 'engineering': return 'from-orange-600 to-amber-600';
      case 'quantum': return 'from-yellow-600 to-orange-600';
      case 'electrical': return 'from-red-600 to-pink-600';
      default: return 'from-violet-600 to-purple-600';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl border border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Generation Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={handleRetry}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    const elapsed = Date.now() - startTime;
    const progress = Math.min((elapsed / 30000) * 100, 95); // Max 95% until complete

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-gray-900 rounded-2xl border border-gray-700 p-8 text-center">
          {/* Header */}
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${getCategoryColor(category)} flex items-center justify-center mx-auto mb-6`}>
            <div className="text-3xl">{getCategoryIcon(category)}</div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Generating Realistic Simulation
          </h2>
          <p className="text-gray-400 mb-6 text-sm leading-relaxed">
            {description.length > 60 ? `${description.substring(0, 60)}...` : description}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${getCategoryColor(category)} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-right text-sm text-gray-500 mb-6">
            {Math.round(progress)}%
          </div>

          {/* Loading Stage */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            <span className="text-gray-300 text-sm">{getLoadingStage()}</span>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mb-8 text-xs">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-gray-400">Real Physics</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-gray-400">AI Generated</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-gray-400">{complexity.charAt(0).toUpperCase() + complexity.slice(1)}</span>
            </div>
          </div>

          {/* Settings Info */}
          <div className="text-left bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Category:</span>
              <span className="text-white capitalize">{category || 'Auto-detect'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Complexity:</span>
              <span className="text-white capitalize">{complexity}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Realism:</span>
              <span className="text-white capitalize">{realismLevel}</span>
            </div>
          </div>

          {/* Estimated time */}
          {elapsed > 10000 && (
            <div className="flex items-center justify-center space-x-2 mt-4 text-xs text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Complex simulations may take up to 45 seconds</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (simulationData) {
    return (
      <RealisticSimViewer
        htmlContent={simulationData.html_content}
        onClose={handleClose}
        category={simulationData.category}
        librariesUsed={simulationData.libraries_used}
        componentAnalysis={simulationData.component_analysis}
      />
    );
  }

  return null;
}

export default function RealisticSimulationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading simulation...</p>
        </div>
      </div>
    }>
      <RealisticSimulationPageContent />
    </Suspense>
  );
}