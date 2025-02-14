import { create } from 'zustand';
import type { CompetitionDetails, CompetitionType } from '../types';

interface CompetitionStore {
  details: CompetitionDetails | null;
  setDetails: (details: CompetitionDetails) => void;
  clearDetails: () => void;
}

export const useCompetitionStore = create<CompetitionStore>((set) => ({
  details: null,
  setDetails: (details) => set({ details }),
  clearDetails: () => set({ details: null })
}));