import React from 'react';
import { motion } from 'framer-motion';
import Tooltip from './Tooltip';
import { Brain, Zap, HandCoins, Cpu } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  provider: string;
  category: string;
  context_window: number;
  per_token_cost: number;
  color: string;
  size: number; // Calculated size based on context_window
  description: string;
  cost: number;
  capability: number;
  speed: number;
  top_provider: string;
  developer: string;
  logoUrl: string;
}

interface ModelGridDisplayProps {
  models: Model[];
  onSelectModel: (id: string, name: string) => void;
  currentModelId: string;
  setHoveredModel: (model: Model | null) => void;
}

const ModelGridDisplay: React.FC<ModelGridDisplayProps> = ({
  models,
  onSelectModel,
  currentModelId,
  setHoveredModel,
}) => {
  const getRadius = (contextWindow: number) => {
    if (contextWindow <= 8000) return 20; // Small
    if (contextWindow <= 128000) return 40; // Medium
    return 80; // Large
  };

  return (
    <div className="grid grid-cols-4 gap-4 p-4 overflow-y-auto h-full w-full">
      {models.map((model) => {
        const radius = getRadius(model.context_window);

        return (
          <Tooltip
            key={model.id}
            content={
              <div className="text-xs">
                <p className="font-bold">{model.name}</p>
                <p>Provider: {model.provider}</p>
                <p>Context: {model.context_window}k</p>
                <p>Cost: ${model.per_token_cost}</p>
              </div>
            }
          >
            <motion.div
              className={`relative flex flex-col items-center justify-center rounded-full cursor-pointer shadow-lg text-white text-center overflow-visible border-4 ${
                currentModelId === model.id 
                  ? 'border-indigo-400 ring-4 ring-indigo-200' 
                  : 'border-white/50 hover:border-white/80'
              }`}
              style={{
                width: radius * 2,
                height: radius * 2,
                backgroundColor: model.color,
              }}
              whileHover={{ scale: 1.1, boxShadow: "0px 0px 20px rgba(0,0,0,0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectModel(model.id, model.name)}
              onMouseEnter={() => setHoveredModel(model)}
              onMouseLeave={() => setHoveredModel(null)}
            >
              {/* Model logo */}
              <img 
                src={model.logoUrl} 
                alt={`${model.developer} logo`} 
                className="w-3/5 h-3/5 object-contain" 
                onError={(e) => { 
                  e.currentTarget.style.display = 'none'; 
                  const nextElement = e.currentTarget.nextSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = 'block';
                  }
                }}
              />
              <div className="w-3/5 h-3/5 flex items-center justify-center" style={{ display: 'none' }}>
                <Cpu className="w-full h-full text-white/80" />
              </div>
              
              {/* FREE badge for zero-cost models */}
              {model.per_token_cost === 0 && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold w-5 h-5 rounded-full shadow-lg border-2 border-white z-10 flex items-center justify-center">
                  F
                </div>
              )}
              
              {/* Selected indicator */}
              {currentModelId === model.id && (
                <div className="absolute -top-3 -left-3 w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white">
                  <motion.div
                    className="w-3 h-3 bg-white rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              )}
            </motion.div>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default ModelGridDisplay;
