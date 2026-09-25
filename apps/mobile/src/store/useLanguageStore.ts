import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'en' | 'hi' | 'te';

export const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'hi', 'te'];

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as string[]).includes(value);
}

interface LanguageState {
  language: AppLanguage;
  hasHydrated: boolean;
  setLanguage: (language: AppLanguage) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      hasHydrated: false,
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'kalasangam-language',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ language: state.language }),
      onRehydrateStorage: () => () => {
        useLanguageStore.setState({ hasHydrated: true });
      },
    },
  ),
);
