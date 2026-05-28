import { create } from 'zustand';
import apiClient from '../api/apiClient';

interface AdminStore {
  products: any[];
  config: any;
  loadingProducts: boolean;
  loadingConfig: boolean;
  hasFetchedProducts: boolean;
  hasFetchedConfig: boolean;
  fetchProducts: (force?: boolean) => Promise<void>;
  fetchConfig: (force?: boolean) => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  products: [],
  config: null,
  loadingProducts: false,
  loadingConfig: false,
  hasFetchedProducts: false,
  hasFetchedConfig: false,

  fetchProducts: async (force = false) => {
    const { hasFetchedProducts, loadingProducts } = get();
    if (!force && (hasFetchedProducts || loadingProducts)) return;

    set({ loadingProducts: true });
    try {
      const { data } = await apiClient.get('/admin/products');
      set({ products: data, loadingProducts: false, hasFetchedProducts: true });
    } catch (error) {
      set({ loadingProducts: false });
    }
  },

  fetchConfig: async (force = false) => {
    const { hasFetchedConfig, loadingConfig } = get();
    if (!force && (hasFetchedConfig || loadingConfig)) return;

    set({ loadingConfig: true });
    try {
      const { data } = await apiClient.get('/admin/config');
      set({ config: data, loadingConfig: false, hasFetchedConfig: true });
    } catch (error) {
      set({ loadingConfig: false });
    }
  }
}));
