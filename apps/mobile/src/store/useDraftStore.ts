import { create } from 'zustand';

export interface ProductCatalogData {
  title: string;
  category: string;
  shortDescription: string;
  materials: string[];
  craftType: string;
  suggestedPriceRange: string;
}

export interface DraftState {
  imageUri: string | null;
  audioUri: string | null;
  aiGeneratedData: ProductCatalogData | null;
  setImageUri: (uri: string | null) => void;
  setAudioUri: (uri: string | null) => void;
  setAiGeneratedData: (data: ProductCatalogData | null) => void;
  resetDraft: () => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  imageUri: null,
  audioUri: null,
  aiGeneratedData: null,

  setImageUri: (imageUri: string | null) => set({ imageUri }),
  setAudioUri: (audioUri: string | null) => set({ audioUri }),
  setAiGeneratedData: (aiGeneratedData: ProductCatalogData | null) =>
    set({ aiGeneratedData }),

  resetDraft: () =>
    set({
      imageUri: null,
      audioUri: null,
      aiGeneratedData: null,
    }),
}));
