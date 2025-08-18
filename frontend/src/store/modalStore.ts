
import { create } from 'zustand';
import { QuizResult } from '../lib/api';

interface ModalState {
  isOpen: boolean;
  result: QuizResult | null;
  title: string | null;
  open: (result: QuizResult, title: string) => void;
  close: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  result: null,
  title: null,
  open: (result, title) => set({ isOpen: true, result, title }),
  close: () => set({ isOpen: false, result: null, title: null }),
}));
