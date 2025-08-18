import { create } from 'zustand';

interface AIState {
  isGenerating: boolean;
  progress: number;
  currentModel: string | null;
  startGeneration: (model: string) => void;
  endGeneration: () => void;
  setProgress: (progress: number) => void;
}

export const useAIState = create<AIState>((set) => ({
  isGenerating: false,
  progress: 0,
  currentModel: null,
  startGeneration: (model) => set({ isGenerating: true, currentModel: model, progress: 0 }),
  endGeneration: () => set({ isGenerating: false, progress: 100 }),
  setProgress: (progress) => set({ progress }),
}));