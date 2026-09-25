import { create } from 'zustand';

/** Most photos one item can have (the backend accepts the same number) */
export const MAX_PHOTOS = 5;

export interface ProductCatalogData {
  title: string;
  category: string;
  shortDescription: string;
  materials: string[];
  craftType: string;
  suggestedPriceRange: string;
}

export interface DraftState {
  /** All item photos in order; the first one is the main photo */
  imageUris: string[];
  /** The main photo (same as imageUris[0]) — used for the AI details */
  imageUri: string | null;
  audioUri: string | null;
  aiGeneratedData: ProductCatalogData | null;
  setImageUris: (uris: string[]) => void;
  setAudioUri: (uri: string | null) => void;
  setAiGeneratedData: (data: ProductCatalogData | null) => void;
  resetDraft: () => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  imageUris: [],
  imageUri: null,
  audioUri: null,
  aiGeneratedData: null,

  setImageUris: (uris: string[]) => {
    const imageUris = uris.slice(0, MAX_PHOTOS);
    set({ imageUris, imageUri: imageUris[0] ?? null });
  },
  setAudioUri: (audioUri: string | null) => set({ audioUri }),
  setAiGeneratedData: (aiGeneratedData: ProductCatalogData | null) =>
    set({ aiGeneratedData }),

  resetDraft: () =>
    set({
      imageUris: [],
      imageUri: null,
      audioUri: null,
      aiGeneratedData: null,
    }),
}));
