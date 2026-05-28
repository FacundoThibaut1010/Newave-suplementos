import { create } from 'zustand';
import apiClient from '../api/apiClient';

interface ProductStore {
  products: any[];
  categories: { value: string; label: string }[];
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
  fetchProducts: () => Promise<void>;
  getProductById: (id: string) => any | undefined;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  categories: [{ value: 'Todas', label: 'Todos' }],
  loading: false,
  error: null,
  hasFetched: false,

  fetchProducts: async () => {
    const { hasFetched, loading } = get();
    // Prevent fetching if already fetched or currently loading
    if (hasFetched || loading) return;

    set({ loading: true, error: null });
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/products/active-categories')
      ]);

      const products = productsRes.data.products || [];
      const dynamicOptions = categoriesRes.data.map((c: any) => ({ value: c.slug, label: c.name }));
      const categories = [{ value: 'Todas', label: 'Todos' }, ...dynamicOptions];

      set({ products, categories, loading: false, hasFetched: true });
    } catch (error: any) {
      set({ error: error.response?.data?.friendlyMessage || 'Error al cargar los productos.', loading: false });
    }
  },

  getProductById: (id: string) => {
    return get().products.find((p) => p._id === id);
  }
}));
