import { create } from 'zustand';
import apiClient from '../api/apiClient';

export const DEFAULT_HERO_CONFIG = {
  title: 'ENERGÍA. FUERZA. RESULTADOS.',
  subtitle: 'Dominá tu rendimiento con suplementación de élite diseñada para superar cada límite.',
  buttonText: 'Comprar ahora',
  image: '',
};

interface StoreConfigStore {
  hero: typeof DEFAULT_HERO_CONFIG;
  bestSellers: any[];
  loading: boolean;
  hasFetched: boolean;
  fetchConfig: () => Promise<void>;
}

export const useStoreConfigStore = create<StoreConfigStore>((set, get) => ({
  hero: DEFAULT_HERO_CONFIG,
  bestSellers: [],
  loading: false,
  hasFetched: false,

  fetchConfig: async () => {
    const { hasFetched, loading } = get();
    if (hasFetched || loading) return;

    set({ loading: true });
    try {
      const { data } = await apiClient.get('/admin/config');
      set({
        hero: data?.hero || DEFAULT_HERO_CONFIG,
        bestSellers: data?.bestSellers || [],
        loading: false,
        hasFetched: true,
      });
    } catch {
      set({ loading: false, hasFetched: true });
    }
  },
}));
