import React, { useRef, useState, useEffect } from 'react';
import { Maximize, Minimize, X } from 'lucide-react';

interface ThreeDVisualizationCardProps {
  htmlContent: string;
  onClose: () => void;
}

const ThreeDVisualizationCard: React.FC<ThreeDVisualizationCardProps> = ({ htmlContent, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    if (!cardRef.current) return;

    if (!document.fullscreenElement) {
      cardRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div ref={cardRef} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-3/4 h-3/4 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">3D Visualization</h2>
          <div className="flex items-center space-x-2">
            <button onClick={handleFullscreen} className="text-gray-500 hover:text-gray-700">
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="flex-grow p-4">
          <iframe
            srcDoc={htmlContent}
            title="3D Visualization"
            className="w-full h-full border-0"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

export default ThreeDVisualizationCard;
