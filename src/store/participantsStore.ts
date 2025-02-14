import { create } from 'zustand';
import type { Participant } from '../types';

interface ParticipantsStore {
  participants: Participant[];
  sectorSizes: number[];
  hasUnsavedChanges: boolean;
  addParticipant: () => void;
  removeParticipant: (id: number) => void;
  updateParticipant: (id: number, updates: Partial<Participant>) => void;
  setSectorSizes: (sizes: number[]) => void;
  setHasUnsavedChanges: (value: boolean) => void;
  clearParticipants: () => void;
  setParticipants: (participants: Participant[]) => void;
}

export const useParticipantsStore = create<ParticipantsStore>((set) => ({
  participants: [{ id: 1, name: '' }],
  sectorSizes: [10],
  hasUnsavedChanges: false,
  
  addParticipant: () => set((state) => ({
    participants: [
      ...state.participants,
      { id: state.participants.length + 1, name: '' }
    ],
    hasUnsavedChanges: true
  })),
  
  removeParticipant: (id) => set((state) => {
    if (state.participants.length <= 1) return state;
    
    const newParticipants = state.participants
      .filter(p => p.id !== id)
      .map((p, index) => ({ ...p, id: index + 1 }));
    
    return { participants: newParticipants, hasUnsavedChanges: true };
  }),
  
  updateParticipant: (id, updates) => set((state) => ({
    participants: state.participants.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ),
    hasUnsavedChanges: true
  })),

  setSectorSizes: (sizes) => set({ sectorSizes: sizes, hasUnsavedChanges: true }),
  setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),
  clearParticipants: () => set({ 
    participants: [{ id: 1, name: '' }],
    sectorSizes: [10],
    hasUnsavedChanges: false 
  }),
  setParticipants: (participants) => set({ participants, hasUnsavedChanges: false })
}));