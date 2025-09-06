import React, { useRef, useState, useEffect } from 'react';
import { Maximize, Minimize, X, RotateCcw, Play, Pause, Settings } from 'lucide-react';

interface RealisticSimViewerProps {
  htmlContent: string;
  onClose: () => void;
  category?: string;
  librariesUsed?: string[];
  componentAnalysis?: any;
}

const RealisticSimViewer: React.FC<RealisticSimViewerProps> = ({ 
  htmlContent, 
  onClose, 
  category = 'general',
  librariesUsed = [],
  componentAnalysis 
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const handleFullscreen = () => {
    if (!viewerRef.current) return;

    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleReset = () => {
    if (iframeRef.current) {
      // Send reset message to iframe
      iframeRef.current.contentWindow?.postMessage({ action: 'reset' }, '*');
    }
  };

  const handlePlayPause = () => {
    if (iframeRef.current) {
      // Send play/pause message to iframe
      iframeRef.current.contentWindow?.postMessage({ action: 'togglePhysics' }, '*');
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleIframeLoad = () => {
      setIsLoading(false);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const getCategoryIcon = (cat: string) => {
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

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'physics': return 'from-blue-600 to-indigo-600';
      case 'molecular': return 'from-green-600 to-emerald-600';
      case 'fluid': return 'from-cyan-600 to-blue-600';
      case 'biology': return 'from-pink-600 to-rose-600';
      case 'astronomy': return 'from-purple-600 to-violet-600';
      case 'engineering': return 'from-orange-600 to-amber-600';
      case 'quantum': return 'from-yellow-600 to-orange-600';
      case 'electrical': return 'from-red-600 to-pink-600';
      default: return 'from-gray-600 to-slate-600';
    }
  };

  return (
    <div ref={viewerRef} className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95vw] h-[95vh] flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${getCategoryColor(category)} flex items-center justify-center text-white text-xl`}>
              {getCategoryIcon(category)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Realistic 3D Simulation
              </h2>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${getCategoryColor(category)} text-white`}>
                  {category.toUpperCase()}
                </span>
                {librariesUsed.length > 0 && (
                  <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                    {librariesUsed.length} Libraries
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Control buttons */}
            <button 
              onClick={handleReset}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Reset Simulation"
            >
              <RotateCcw size={20} />
            </button>
            
            <button 
              onClick={handlePlayPause}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Play/Pause Physics"
            >
              <Play size={20} />
            </button>
            
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Show Details"
            >
              <Settings size={20} />
            </button>
            
            <button 
              onClick={handleFullscreen} 
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
            
            <button 
              onClick={onClose} 
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Details Panel */}
        {showDetails && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Libraries Used</h4>
                <div className="space-y-1">
                  {librariesUsed.map((lib, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        {lib.replace('cannon-es', 'Physics Engine')
                            .replace('3dmol-js', 'Molecular Viewer')
                            .replace('liquidfun-js', 'Fluid Dynamics')
                            .replace('three-js', '3D Graphics')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {componentAnalysis && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Components</h4>
                  <div className="space-y-1">
                    {componentAnalysis.primary_components?.map((comp: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-gray-700 dark:text-gray-300 capitalize">
                          {comp.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Features</h4>
                <div className="space-y-1">
                  {componentAnalysis?.physics_required && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">Real Physics</span>
                    </div>
                  )}
                  {componentAnalysis?.molecular_structures && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">Molecular Rendering</span>
                    </div>
                  )}
                  {componentAnalysis?.fluid_dynamics && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">Fluid Simulation</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">Interactive Controls</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Simulation Content */}
        <div className="flex-grow relative bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${getCategoryColor(category)} mb-4`}>
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-white font-medium">Loading Realistic Simulation...</p>
                <p className="text-gray-400 text-sm mt-1">
                  Initializing {librariesUsed.join(', ').replace('cannon-es', 'physics engine')}
                </p>
              </div>
            </div>
          )}
          
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            title="Realistic 3D Simulation"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
        </div>
        
        {/* Footer with simulation info */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Category: {category}</span>
              <span>•</span>
              <span>{librariesUsed.length} Libraries</span>
              <span>•</span>
              <span>Real-time Physics</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Live Simulation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealisticSimViewer;