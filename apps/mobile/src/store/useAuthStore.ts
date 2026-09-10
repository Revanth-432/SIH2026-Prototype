import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthState {
  session: Session | null;
  user: User | null;
  role: string;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setRole: (role: string) => void;
  setOnboarded: (completed: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  role: '',
  hasCompletedOnboarding: false,
  isLoading: true,

  setSession: (session: Session | null) => {
    const user = session?.user ?? null;
    const role = user
      ? (user?.user_metadata?.role as string) ||
        (user?.app_metadata?.roles as string[])?.[0] ||
        'ARTISAN'
      : '';
    const hasCompletedOnboarding = !!user?.user_metadata?.onboarded;

    set({
      session,
      user,
      role,
      hasCompletedOnboarding,
      isLoading: false,
    });
  },

  setRole: (role: string) => set({ role }),

  setOnboarded: (hasCompletedOnboarding: boolean) =>
    set({ hasCompletedOnboarding }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  signOut: async () => {
    try {
      set({ isLoading: true });
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during signOut:', error);
    } finally {
      set({
        session: null,
        user: null,
        role: '',
        hasCompletedOnboarding: false,
        isLoading: false,
      });
    }
  },
}));

