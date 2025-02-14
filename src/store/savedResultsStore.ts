import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { SavedCompetition, CompetitionType, CriteriumFolder } from '../types';

interface SavedResultsStore {
  competitions: SavedCompetition[];
  criteriumFolders: CriteriumFolder[];
  isLoading: boolean;
  addCompetition: (competition: SavedCompetition) => Promise<boolean>;
  removeCompetition: (id: string) => Promise<void>;
  updateCompetition: (id: string, updates: Partial<SavedCompetition>) => Promise<void>;
  getCompetitionsByType: (type: CompetitionType) => SavedCompetition[];
  getCompetitionsByFolder: (folderId: string) => SavedCompetition[];
  addCriteriumFolder: (name: string, type: 'individual-criterium' | 'pair-criterium') => Promise<void>;
  removeCriteriumFolder: (id: string) => Promise<void>;
  updateCriteriumFolder: (id: string, name: string) => Promise<void>;
  getCriteriumFoldersByType: (type: 'individual-criterium' | 'pair-criterium') => CriteriumFolder[];
  getNextCompetitionNumber: (folderId: string) => number;
  loadData: () => Promise<void>;
  findExistingCompetition: (name: string, date: string, location: string) => SavedCompetition | undefined;
}

export const useSavedResultsStore = create<SavedResultsStore>((set, get) => ({
  competitions: [],
  criteriumFolders: [],
  isLoading: true,

  loadData: async () => {
    try {
      set({ isLoading: true });

      // Load competitions
      const { data: competitions, error: competitionsError } = await supabase
        .from('saved_competitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (competitionsError) throw competitionsError;

      // Load criterium folders
      const { data: folders, error: foldersError } = await supabase
        .from('criterium_folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (foldersError) throw foldersError;

      // Transform the data to match our frontend model
      const transformedCompetitions = competitions?.map(comp => ({
        ...comp,
        criteriumFolderId: comp.criterium_folder_id,
        sectorSizes: comp.sector_sizes,
        participants: typeof comp.participants === 'string' 
          ? JSON.parse(comp.participants)
          : comp.participants
      })) || [];

      set({
        competitions: transformedCompetitions as SavedCompetition[],
        criteriumFolders: folders as CriteriumFolder[],
        isLoading: false
      });
    } catch (error) {
      console.error('Error loading data:', error);
      set({ isLoading: false });
    }
  },

  findExistingCompetition: (name, date, location) => {
    const { competitions } = get();
    return competitions.find(c => 
      c.name === name && 
      c.date === date && 
      c.location === location
    );
  },
  
  addCompetition: async (competition) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Check for existing competition
      const existing = get().findExistingCompetition(
        competition.name,
        competition.date,
        competition.location
      );

      // If there's an existing competition, delete it first
      if (existing) {
        const { error: deleteError } = await supabase
          .from('saved_competitions')
          .delete()
          .eq('id', existing.id);

        if (deleteError) throw deleteError;

        // Update local state
        set(state => ({
          competitions: state.competitions.filter(c => c.id !== existing.id)
        }));
      }

      // Transform the data to match our database schema
      const dbCompetition = {
        user_id: user.id,
        name: competition.name,
        date: competition.date,
        location: competition.location,
        type: competition.type,
        criterium_folder_id: competition.criteriumFolderId,
        participants: competition.participants,
        sector_sizes: competition.sectorSizes
      };

      const { data, error } = await supabase
        .from('saved_competitions')
        .insert([dbCompetition])
        .select()
        .single();

      if (error) throw error;

      // Transform the response back to our frontend model
      const savedCompetition = {
        ...data,
        criteriumFolderId: data.criterium_folder_id,
        sectorSizes: data.sector_sizes,
        participants: typeof data.participants === 'string'
          ? JSON.parse(data.participants)
          : data.participants
      } as SavedCompetition;

      set((state) => ({
        competitions: [...state.competitions, savedCompetition]
      }));

      return true;
    } catch (error) {
      console.error('Error adding competition:', error);
      return false;
    }
  },
  
  removeCompetition: async (id) => {
    try {
      const { error } = await supabase
        .from('saved_competitions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        competitions: state.competitions.filter(c => c.id !== id)
      }));
    } catch (error) {
      console.error('Error removing competition:', error);
    }
  },

  updateCompetition: async (id, updates) => {
    try {
      // Transform updates to match database schema
      const dbUpdates = {
        ...updates,
        criterium_folder_id: updates.criteriumFolderId,
        sector_sizes: updates.sectorSizes
      };

      const { error } = await supabase
        .from('saved_competitions')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        competitions: state.competitions.map(c =>
          c.id === id ? { ...c, ...updates } : c
        )
      }));
    } catch (error) {
      console.error('Error updating competition:', error);
    }
  },
  
  getCompetitionsByType: (type) => {
    const { competitions } = get();
    if (type === 'individual-criterium' || type === 'pair-criterium') {
      return competitions.filter(c => c.type === type && !c.criteriumFolderId);
    }
    return competitions.filter(c => c.type === type);
  },

  getCompetitionsByFolder: (folderId) => {
    const { competitions } = get();
    return competitions
      .filter(c => c.criteriumFolderId === folderId)
      .sort((a, b) => {
        const aNum = parseInt(a.name.replace('W', ''));
        const bNum = parseInt(b.name.replace('W', ''));
        return aNum - bNum;
      });
  },

  addCriteriumFolder: async (name, type) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('criterium_folders')
        .insert([{ 
          name, 
          type,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        criteriumFolders: [...state.criteriumFolders, data as CriteriumFolder]
      }));
    } catch (error) {
      console.error('Error adding criterium folder:', error);
    }
  },

  removeCriteriumFolder: async (id) => {
    try {
      const { error } = await supabase
        .from('criterium_folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        criteriumFolders: state.criteriumFolders.filter(f => f.id !== id),
        competitions: state.competitions.map(c => 
          c.criteriumFolderId === id ? { ...c, criteriumFolderId: undefined } : c
        )
      }));
    } catch (error) {
      console.error('Error removing criterium folder:', error);
    }
  },

  updateCriteriumFolder: async (id, name) => {
    try {
      const { error } = await supabase
        .from('criterium_folders')
        .update({ name })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        criteriumFolders: state.criteriumFolders.map(f =>
          f.id === id ? { ...f, name } : f
        )
      }));
    } catch (error) {
      console.error('Error updating criterium folder:', error);
    }
  },

  getCriteriumFoldersByType: (type) => {
    return get().criteriumFolders.filter(f => f.type === type);
  },

  getNextCompetitionNumber: (folderId) => {
    const { competitions } = get();
    const folderCompetitions = competitions.filter(c => c.criteriumFolderId === folderId);
    return folderCompetitions.length + 1;
  }
}));