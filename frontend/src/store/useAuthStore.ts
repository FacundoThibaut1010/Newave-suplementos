import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  _id: string;
  name: string;
  email: string;
  token: string;
  role: string;
  favorites?: any[];
}

interface AuthState {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  setFavorites: (favorites: any[]) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (userData) => set({ user: userData }),
      logout: () => set({ user: null }),
      setFavorites: (favorites) => set((state) => ({
        user: state.user ? { ...state.user, favorites } : null
      })),
    }),
    {
      name: 'newave-auth',
    }
  )
);
